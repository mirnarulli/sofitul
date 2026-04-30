import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as https from 'https';
import * as http from 'http';
import { ContactoPF } from '../contactos/entities/contacto-pf.entity';
import { ValidataConsulta } from './entities/validata-consulta.entity';

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class ValidataService {
  private readonly logger = new Logger(ValidataService.name);
  private tokenCache: CachedToken | null = null;

  constructor(
    @InjectRepository(ContactoPF)        private pfRepo:       Repository<ContactoPF>,
    @InjectRepository(ValidataConsulta)  private bitacoraRepo: Repository<ValidataConsulta>,
  ) {}

  // ── Helpers HTTP nativos (sin dependencias externas) ────────────────────────

  private get baseUrl(): string {
    return (process.env.VALIDATA_URL ?? 'https://api-ws.validpy.com').replace(/\/$/, '');
  }

  private httpPost<T>(url: string, body: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const payload = JSON.stringify(body);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        {
          hostname: parsed.hostname,
          port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path:     parsed.pathname + parsed.search,
          method:   'POST',
          headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          rejectUnauthorized: false, // algunos entornos de testing tienen cert auto-firmado
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              reject(new Error(`VALIDATA: respuesta no-JSON — ${data.slice(0, 200)}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  private httpGet<T>(url: string, token: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        {
          hostname: parsed.hostname,
          port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path:     parsed.pathname + parsed.search,
          method:   'GET',
          headers:  { Authorization: `Bearer ${token}` },
          rejectUnauthorized: false,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              reject(new Error(`VALIDATA: respuesta no-JSON — ${data.slice(0, 200)}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.end();
    });
  }

  // ── Token con caché 12h ─────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && now < this.tokenCache.expiresAt - 60_000) {
      return this.tokenCache.token;
    }

    const user = process.env.VALIDATA_USER;
    const pass = process.env.VALIDATA_PASS;

    if (!user || !pass) {
      throw new HttpException(
        'Servicio VALIDATA no configurado. Contacte al administrador.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const resp = await this.httpPost<{ token?: string; access_token?: string; expiresIn?: number }>(
        `${this.baseUrl}/auth/login`,
        { username: user, password: pass },
      );

      const token = resp.token ?? resp.access_token;
      if (!token) throw new Error('VALIDATA: respuesta de login sin token');

      const ttl = (resp.expiresIn ?? 43200) * 1000; // 12h por defecto
      this.tokenCache = { token, expiresAt: now + ttl };
      this.logger.log('Token VALIDATA renovado correctamente');
      return token;
    } catch (err: any) {
      this.logger.error(`Error al autenticar con VALIDATA: ${err.message}`);
      throw new HttpException(
        'No se pudo autenticar con el servicio VALIDATA. Intente más tarde.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── Consulta principal ──────────────────────────────────────────────────────

  async consultar(
    cedula: string,
    usuarioEmail?: string,
    origen?: string,
  ): Promise<{
    consultaId: string;
    ficha: any;
    nomina: any;
    familiares: any[];
    error?: string;
  }> {
    const token = await this.getToken();

    const [fichaResult, nominaResult] = await Promise.allSettled([
      this.httpGet<any>(`${this.baseUrl}/consultar-persona-ficha-completa?cedula=${cedula}`, token),
      this.httpGet<any>(`${this.baseUrl}/consultar-nomina-fp?cedula=${cedula}`, token),
    ]);

    const ficha  = fichaResult.status  === 'fulfilled' ? fichaResult.value  : null;
    const nomina = nominaResult.status === 'fulfilled' ? nominaResult.value : null;

    const errores: string[] = [];
    if (fichaResult.status  === 'rejected') {
      const msg = `ficha-completa: ${fichaResult.reason}`;
      this.logger.warn(`VALIDATA cedula=${cedula} ${msg}`);
      errores.push(msg);
    }
    if (nominaResult.status === 'rejected') {
      const msg = `nomina-fp: ${nominaResult.reason}`;
      this.logger.warn(`VALIDATA cedula=${cedula} ${msg}`);
      errores.push(msg);
    }

    // ── Cross-reference familiares con clientes locales ─────────────────────
    const raw: any[] =
      ficha?.familiares        ??
      ficha?.vinculosFamiliares ??
      ficha?.vinculaciones     ??
      [];

    const familiares = await Promise.all(
      raw.map(async (f: any) => {
        const cedFam: string | undefined =
          f.cedula ?? f.nroDocumento ?? f.documento ?? f.ci;
        if (!cedFam) return { ...f, esCliente: false, contactoId: null };

        try {
          const contacto = await this.pfRepo.findOne({ where: { numeroDoc: cedFam } });
          return { ...f, esCliente: !!contacto, contactoId: contacto?.id ?? null };
        } catch {
          return { ...f, esCliente: false, contactoId: null };
        }
      }),
    );

    // ── Guardar bitácora ────────────────────────────────────────────────────
    const estado =
      ficha && nomina ? 'ok' :
      ficha || nomina ? 'parcial' : 'error';

    const registro = this.bitacoraRepo.create({
      cedula,
      usuarioEmail: usuarioEmail ?? null,
      origen:       origen       ?? null,
      respuestaRaw: { ficha, nomina, familiares } as any,
      errorMsg:     errores.length ? errores.join(' | ') : null,
      estado,
    });
    const saved = await this.bitacoraRepo.save(registro);

    return { consultaId: saved.id, ficha, nomina, familiares };
  }

  // ── Historial de consultas ────────────────────────────────────────────────

  async getHistorial(opts: {
    cedula?: string;
    page: number;
    limit: number;
  }): Promise<{ data: ValidataConsulta[]; total: number }> {
    const qb = this.bitacoraRepo
      .createQueryBuilder('c')
      .orderBy('c.created_at', 'DESC')
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit);

    if (opts.cedula) qb.andWhere('c.cedula = :cedula', { cedula: opts.cedula });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /** Devuelve el detalle de una consulta guardada (incluye raw JSON completo) */
  async getConsulta(id: string): Promise<ValidataConsulta> {
    const c = await this.bitacoraRepo.findOne({ where: { id } });
    if (!c) throw new HttpException('Consulta no encontrada', HttpStatus.NOT_FOUND);
    return c;
  }
}
