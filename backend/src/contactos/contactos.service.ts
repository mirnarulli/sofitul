import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { utils as xlsxUtils, write as xlsxWrite } from 'xlsx';
import { ContactoPF } from './entities/contacto-pf.entity';
import { ContactoPJ } from './entities/contacto-pj.entity';
import { Operacion } from '../operaciones/entities/operacion.entity';
import { BitacoraService } from '../bitacora/bitacora.service';

// Campos JSONB que no se deben comparar campo a campo (se registran como bloque)
const JSONB_FIELDS = ['ingresos', 'egresos', 'activos', 'pasivos', 'referencias', 'beneficiariosFinales'];

// ── Normalización de nombres ──────────────────────────────────────────────────

/** Primera letra de cada palabra en mayúscula, resto en minúscula. */
function toTitleCase(s?: string | null): string | null {
  if (!s) return s ?? null;
  return s.trim().toLowerCase().replace(/\b\S/g, c => c.toUpperCase());
}

/** Todo en mayúsculas. */
function toUpper(s?: string | null): string | null {
  if (!s) return s ?? null;
  return s.trim().toUpperCase();
}

/** Aplica Title Case a los campos de nombre de una PF. */
function normalizarPF(data: Partial<ContactoPF>): Partial<ContactoPF> {
  const str = toTitleCase;
  return {
    ...data,
    ...(data.primerNombre       !== undefined && { primerNombre:       str(data.primerNombre) ?? undefined }),
    ...(data.segundoNombre      !== undefined && { segundoNombre:      str(data.segundoNombre) }),
    ...(data.primerApellido     !== undefined && { primerApellido:     str(data.primerApellido) ?? undefined }),
    ...(data.segundoApellido    !== undefined && { segundoApellido:    str(data.segundoApellido) }),
    ...(data.conyugeNombre      !== undefined && { conyugeNombre:      str(data.conyugeNombre) }),
    ...(data.profesion          !== undefined && { profesion:          str(data.profesion) }),
    ...(data.empleador          !== undefined && { empleador:          str(data.empleador) }),
    ...(data.cargo              !== undefined && { cargo:              str(data.cargo) }),
    ...(data.domicilio          !== undefined && { domicilio:          str(data.domicilio) }),
    ...(data.barrio             !== undefined && { barrio:             str(data.barrio) }),
    ...(data.ciudad             !== undefined && { ciudad:             str(data.ciudad) }),
    ...(data.departamento       !== undefined && { departamento:       str(data.departamento) }),
  };
}

/** Aplica UPPERCASE a los campos de nombre de una PJ. */
function normalizarPJ(data: Partial<ContactoPJ>): Partial<ContactoPJ> {
  const up = toUpper;
  return {
    ...data,
    ...(data.razonSocial        !== undefined && { razonSocial:        up(data.razonSocial) ?? undefined }),
    ...(data.nombreFantasia     !== undefined && { nombreFantasia:     up(data.nombreFantasia) }),
    ...(data.actividadPrincipal !== undefined && { actividadPrincipal: up(data.actividadPrincipal) }),
    ...(data.repLegalNombre     !== undefined && { repLegalNombre:     up(data.repLegalNombre) }),
    ...(data.repLegalCargo      !== undefined && { repLegalCargo:      up(data.repLegalCargo) }),
  };
}

type AnyRecord = Record<string, unknown>;

function diffObjects(
  before: AnyRecord | null | undefined,
  after: AnyRecord,
): { campo: string; anterior: unknown; nuevo: unknown }[] {
  const cambios: { campo: string; anterior: unknown; nuevo: unknown }[] = [];
  for (const key of Object.keys(after)) {
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
    const prev = before?.[key];
    const next = after[key];
    if (JSONB_FIELDS.includes(key)) {
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        cambios.push({ campo: key, anterior: prev, nuevo: next });
      }
    } else {
      const prevStr = prev === null || prev === undefined ? '' : String(prev);
      const nextStr = next === null || next === undefined ? '' : String(next);
      if (prevStr !== nextStr) {
        cambios.push({ campo: key, anterior: prev ?? null, nuevo: next ?? null });
      }
    }
  }
  return cambios;
}

@Injectable()
export class ContactosService {
  constructor(
    @InjectRepository(ContactoPF) private pfRepo: Repository<ContactoPF>,
    @InjectRepository(ContactoPJ) private pjRepo: Repository<ContactoPJ>,
    @InjectRepository(Operacion)  private operRepo: Repository<Operacion>,
    private readonly bitacora: BitacoraService,
  ) {}

  // ── Persona Física ────────────────────────────────────────────────────────

  async findAllPF(q?: string) {
    if (q) {
      return this.pfRepo.createQueryBuilder('p')
        .where('p.numeroDoc ILIKE :q OR CONCAT(p.primerNombre, \' \', p.primerApellido) ILIKE :q', { q: `%${q}%` })
        .orderBy('p.primerApellido', 'ASC')
        .getMany();
    }
    return this.pfRepo.find({ order: { primerApellido: 'ASC' } });
  }

  async findPFByDoc(doc: string) {
    return this.pfRepo.findOne({ where: { numeroDoc: doc } });
  }

  findPFById(id: string) { return this.pfRepo.findOne({ where: { id } }); }

  async createPF(data: Partial<ContactoPF>, userId?: string, userNombre?: string) {
    const pf = await this.pfRepo.save(this.pfRepo.create(normalizarPF(data)));
    await this.bitacora.log({
      usuarioId: userId, usuarioNombre: userNombre,
      accion: 'CREAR', modulo: 'contactos',
      entidad: 'ContactoPF', entidadId: pf.id,
      detalle: { nombre: `${pf.primerNombre} ${pf.primerApellido}`, doc: pf.numeroDoc },
    });
    return pf;
  }

  async updatePF(id: string, data: Partial<ContactoPF>, userId?: string, userNombre?: string) {
    const before = await this.pfRepo.findOne({ where: { id } });
    if (!before) throw new NotFoundException('Contacto PF no encontrado');

    data = normalizarPF(data);
    await this.pfRepo.update(id, data);
    const after = await this.pfRepo.findOne({ where: { id } });

    const cambios = diffObjects(before as unknown as AnyRecord, data as unknown as AnyRecord);
    if (cambios.length > 0) {
      await this.bitacora.log({
        usuarioId: userId, usuarioNombre: userNombre,
        accion: 'ACTUALIZAR', modulo: 'contactos',
        entidad: 'ContactoPF', entidadId: id,
        detalle: { cambios },
      });
    }
    return after;
  }

  // ── Persona Jurídica ──────────────────────────────────────────────────────

  async findAllPJ(q?: string) {
    if (q) {
      return this.pjRepo.createQueryBuilder('p')
        .where('p.ruc ILIKE :q OR p.razonSocial ILIKE :q', { q: `%${q}%` })
        .orderBy('p.razonSocial', 'ASC')
        .getMany();
    }
    return this.pjRepo.find({ order: { razonSocial: 'ASC' } });
  }

  async findPJByRuc(ruc: string) {
    return this.pjRepo.findOne({ where: { ruc } });
  }

  findPJById(id: string) { return this.pjRepo.findOne({ where: { id } }); }

  async createPJ(data: Partial<ContactoPJ>, userId?: string, userNombre?: string) {
    const pj = await this.pjRepo.save(this.pjRepo.create(normalizarPJ(data)));
    await this.bitacora.log({
      usuarioId: userId, usuarioNombre: userNombre,
      accion: 'CREAR', modulo: 'contactos',
      entidad: 'ContactoPJ', entidadId: pj.id,
      detalle: { razonSocial: pj.razonSocial, ruc: pj.ruc },
    });
    return pj;
  }

  async updatePJ(id: string, data: Partial<ContactoPJ>, userId?: string, userNombre?: string) {
    const before = await this.pjRepo.findOne({ where: { id } });
    if (!before) throw new NotFoundException('Contacto PJ no encontrado');

    data = normalizarPJ(data);
    await this.pjRepo.update(id, data);
    const after = await this.pjRepo.findOne({ where: { id } });

    const cambios = diffObjects(before as unknown as AnyRecord, data as unknown as AnyRecord);
    if (cambios.length > 0) {
      await this.bitacora.log({
        usuarioId: userId, usuarioNombre: userNombre,
        accion: 'ACTUALIZAR', modulo: 'contactos',
        entidad: 'ContactoPJ', entidadId: id,
        detalle: { cambios },
      });
    }
    return after;
  }

  // ── Empresas vinculadas a una PF (por rep_legal_doc) ─────────────────────
  async findEmpresasVinculadas(pfId: string) {
    const pf = await this.pfRepo.findOne({ where: { id: pfId } });
    if (!pf) throw new NotFoundException('Contacto PF no encontrado');
    return this.pjRepo.find({
      where: { repLegalDoc: pf.numeroDoc },
      order: { razonSocial: 'ASC' },
    });
  }

  // ── Búsqueda unificada por documento ─────────────────────────────────────
  async buscarPorDoc(doc: string): Promise<
    | { tipo: 'pf'; data: ContactoPF }
    | { tipo: 'pj'; data: ContactoPJ }
    | null
  > {
    const pf = await this.findPFByDoc(doc);
    if (pf) return { tipo: 'pf', data: pf };
    const pj = await this.findPJByRuc(doc);
    if (pj) return { tipo: 'pj', data: pj };
    return null;
  }

  // ── Operaciones por contacto ──────────────────────────────────────────────
  async getOperacionesByContacto(tipo: string, id: string) {
    return this.operRepo.find({
      where: { contactoTipo: tipo as 'pf' | 'pj', contactoId: id },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Exportación Excel ────────────────────────────────────────────────────
  async exportToExcel(): Promise<Buffer> {
    const [personas, empresas] = await Promise.all([
      this.pfRepo.find({ order: { createdAt: 'DESC' } }),
      this.pjRepo.find({ order: { createdAt: 'DESC' } }),
    ]);

    const wsPF = xlsxUtils.json_to_sheet(personas.map(p => ({
      'Primer Nombre':    p.primerNombre,
      'Segundo Nombre':   p.segundoNombre ?? '',
      'Primer Apellido':  p.primerApellido,
      'Segundo Apellido': p.segundoApellido ?? '',
      'Documento':        p.numeroDoc,
      'Fecha Nacimiento': p.fechaNacimiento ?? '',
      'Teléfono':         p.telefono ?? '',
      'Email':            p.email ?? '',
      'Domicilio':        p.domicilio ?? '',
      'Ciudad':           p.ciudad ?? '',
      'Departamento':     p.departamento ?? '',
      'Activo':           p.activo ? 'Sí' : 'No',
    })));
    wsPF['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 8 },
    ];

    const wsPJ = xlsxUtils.json_to_sheet(empresas.map(e => ({
      'Razón Social':    e.razonSocial,
      'Nombre Fantasía': e.nombreFantasia ?? '',
      'RUC':             e.ruc,
      'Teléfono':        e.telefono ?? '',
      'Email':           e.email ?? '',
      'Domicilio':       e.domicilio ?? '',
      'Ciudad':          e.ciudad ?? '',
      'Rep. Legal':      e.repLegalNombre ?? '',
      'Cargo Rep.':      e.repLegalCargo ?? '',
      'Actividad':       e.actividadPrincipal ?? '',
      'Activo':          e.activo ? 'Sí' : 'No',
    })));
    wsPJ['!cols'] = [
      { wch: 32 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 28 },
      { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 20 }, { wch: 30 }, { wch: 8 },
    ];

    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, wsPF, 'Personas Físicas');
    xlsxUtils.book_append_sheet(wb, wsPJ, 'Empresas');
    return xlsxWrite(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
