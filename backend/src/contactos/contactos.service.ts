import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactoPF } from './entities/contacto-pf.entity';
import { ContactoPJ } from './entities/contacto-pj.entity';
import { Operacion } from '../operaciones/entities/operacion.entity';

@Injectable()
export class ContactosService {
  constructor(
    @InjectRepository(ContactoPF) private pfRepo: Repository<ContactoPF>,
    @InjectRepository(ContactoPJ) private pjRepo: Repository<ContactoPJ>,
    @InjectRepository(Operacion)  private operRepo: Repository<Operacion>,
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

  createPF(data: Partial<ContactoPF>) { return this.pfRepo.save(this.pfRepo.create(data)); }

  async updatePF(id: string, data: Partial<ContactoPF>) {
    await this.pfRepo.update(id, data);
    return this.pfRepo.findOne({ where: { id } });
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

  createPJ(data: Partial<ContactoPJ>) { return this.pjRepo.save(this.pjRepo.create(data)); }

  async updatePJ(id: string, data: Partial<ContactoPJ>) {
    await this.pjRepo.update(id, data);
    return this.pjRepo.findOne({ where: { id } });
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
