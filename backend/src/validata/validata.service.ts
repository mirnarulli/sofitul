import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as https from 'https';
import * as http from 'http';
import { ContactoPF }       from '../contactos/entities/contacto-pf.entity';
import { ValidataConsulta } from './entities/validata-consulta.entity';
import { ConfiguracionService } from '../configuracion/configuracion.service';

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
    private confSvc: ConfiguracionService,
  ) {}

  // ── Credenciales: DB primero, .env como fallback ────────────────────────────

  private async getCredenciales(): Promise<{ url: string; user: string; pass: string }> {
    const [urlDb, userDb, passDb] = await Promise.all([
      this.confSvc.get('validata_url'),
      this.confSvc.get('validata_user'),
      this.confSvc.get('validata_pass'),
    ]);
    return {
      url:  (urlDb  ?? process.env.VALIDATA_URL  ?? 'https://api-ws.validpy.com').replace(/\/$/, ''),
      user: userDb  ?? process.env.VALIDATA_USER ?? '',
      pass: passDb  ?? process.env.VALIDATA_PASS ?? '',
    };
  }

  // ── Helpers HTTP nativos (sin dependencias externas) ────────────────────────

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
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`VALIDATA HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
              return;
            }
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

  private httpPostAuth<T>(url: string, body: object, token: string): Promise<T> {
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
            Authorization:    `Bearer ${token}`,
          },
          rejectUnauthorized: false,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`VALIDATA HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
              return;
            }
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

  // ── Token con caché 12h ─────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && now < this.tokenCache.expiresAt - 60_000) {
      return this.tokenCache.token;
    }

    // Invalidar caché si se cambiaron credenciales
    this.tokenCache = null;

    const { url, user, pass } = await this.getCredenciales();

    if (!user || !pass) {
      throw new HttpException(
        'Servicio VALIDATA no configurado. Configure las credenciales en Panel → Integraciones.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Intentar con distintos nombres de campo que usa VALIDATA
    const intentos = [
      { username: user, password: pass },
      { email: user, password: pass },
      { user: user, pass: pass },
      { correo: user, contrasena: pass },
    ];

    let lastError = '';
    for (const body of intentos) {
      try {
        const resp = await this.httpPost<any>(`${url}/auth/login`, body);
        const token = resp.token ?? resp.access_token ?? resp.accessToken ?? resp.jwt;
        if (token) {
          const ttl = (resp.expiresIn ?? resp.expires_in ?? 43200) * 1000;
          this.tokenCache = { token, expiresAt: now + ttl };
          this.logger.log(`Token VALIDATA renovado (campo: ${Object.keys(body)[0]})`);
          return token;
        }
        lastError = `Respuesta sin token: ${JSON.stringify(resp).slice(0, 200)}`;
      } catch (err: any) {
        lastError = err.message;
      }
    }

    this.logger.error(`Error al autenticar con VALIDATA: ${lastError}`);
    throw new HttpException(
      `No se pudo autenticar con VALIDATA: ${lastError}`,
      HttpStatus.BAD_GATEWAY,
    );
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
    const [token, { url }] = await Promise.all([this.getToken(), this.getCredenciales()]);

    const [fichaResult, nominaResult] = await Promise.allSettled([
      this.httpPostAuth<any>(
        `${url}/consultar-persona-ficha-completa`,
        { cedula, incluyePdf: false, incluyeImagenRostro: false },
        token,
      ),
      this.httpGet<any>(`${url}/consultar-nomina-fp?documento=${cedula}`, token),
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

  // ── Gestión de credenciales desde UI ────────────────────────────────────────

  /** Devuelve las credenciales actuales (contraseña censurada) */
  async getCredencialesPublic(): Promise<{ url: string; user: string; passSet: boolean }> {
    const { url, user, pass } = await this.getCredenciales();
    return { url, user, passSet: !!pass };
  }

  /** Guarda credenciales en la tabla configuracion */
  async setCredenciales(data: {
    validata_url?:  string;
    validata_user?: string;
    validata_pass?: string;
  }): Promise<{ ok: boolean }> {
    const tasks: Promise<any>[] = [];
    if (data.validata_url  !== undefined) tasks.push(this.confSvc.set('validata_url',  data.validata_url));
    if (data.validata_user !== undefined) tasks.push(this.confSvc.set('validata_user', data.validata_user));
    if (data.validata_pass !== undefined) tasks.push(this.confSvc.set('validata_pass', data.validata_pass));
    await Promise.all(tasks);
    // Invalidar caché de token para que se renueve con las nuevas credenciales
    this.tokenCache = null;
    return { ok: true };
  }

  /** Intenta autenticar con VALIDATA y devuelve resultado */
  async testConexion(): Promise<{ ok: boolean; mensaje: string; token?: string }> {
    try {
      const token = await this.getToken();
      return { ok: true, mensaje: 'Conexión exitosa con VALIDATA.', token: token.slice(0, 20) + '...' };
    } catch (err: any) {
      return { ok: false, mensaje: err.message ?? 'Error desconocido' };
    }
  }
}
