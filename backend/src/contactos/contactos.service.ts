import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactoPF } from './entities/contacto-pf.entity';
import { ContactoPJ } from './entities/contacto-pj.entity';
import { Operacion } from '../operaciones/entities/operacion.entity';
import { BitacoraService } from '../bitacora/bitacora.service';

// Campos JSONB que no se deben comparar campo a campo (se registran como bloque)
const JSONB_FIELDS = ['ingresos', 'egresos', 'activos', 'pasivos', 'referencias', 'beneficiariosFinales'];

function diffObjects(before: any, after: any): { campo: string; anterior: any; nuevo: any }[] {
  const cambios: { campo: string; anterior: any; nuevo: any }[] = [];
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
    const pf = await this.pfRepo.save(this.pfRepo.create(data));
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

    await this.pfRepo.update(id, data);
    const after = await this.pfRepo.findOne({ where: { id } });

    const cambios = diffObjects(before, data);
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
    const pj = await this.pjRepo.save(this.pjRepo.create(data));
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

    await this.pjRepo.update(id, data);
    const after = await this.pjRepo.findOne({ where: { id } });

    const cambios = diffObjects(before, data);
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

  // ── Búsqueda unificada por documento ─────────────────────────────────────
  async buscarPorDoc(doc: string): Promise<{ tipo: 'pf' | 'pj'; data: any } | null> {
    const pf = await this.findPFByDoc(doc);
    if (pf) return { tipo: 'pf', data: pf };
    const pj = await this.findPJByRuc(doc);
    if (pj) return { tipo: 'pj', data: pj };
    return null;
  }

  // ── Operaciones por contacto ──────────────────────────────────────────────
  async getOperacionesByContacto(tipo: string, id: string) {
    return this.operRepo.find({
      where: { contactoTipo: tipo as any, contactoId: id },
      order: { createdAt: 'DESC' },
    });
  }
}
