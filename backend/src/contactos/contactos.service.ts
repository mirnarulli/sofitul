import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactoPF } from './entities/contacto-pf.entity';
import { ContactoPJ } from './entities/contacto-pj.entity';

@Injectable()
export class ContactosService {
  constructor(
    @InjectRepository(ContactoPF) private pfRepo: Repository<ContactoPF>,
    @InjectRepository(ContactoPJ) private pjRepo: Repository<ContactoPJ>,
  ) {}

  // ── Persona Física ────────────────────────────────────────────────────────

  async buscarPF(q: string) {
    return this.pfRepo
      .createQueryBuilder('p')
      .where('p.numero_doc ILIKE :q OR CONCAT(p.primer_nombre, \' \', p.primer_apellido) ILIKE :q', { q: `%${q}%` })
      .orderBy('p.primer_apellido', 'ASC')
      .limit(20)
      .getMany();
  }

  async findPFByDoc(doc: string) {
    return this.pfRepo.findOne({ where: { numeroDoc: doc } });
  }

  findAllPF() { return this.pfRepo.find({ order: { primerApellido: 'ASC' } }); }
  findPFById(id: string) { return this.pfRepo.findOne({ where: { id } }); }
  createPF(data: Partial<ContactoPF>) { return this.pfRepo.save(this.pfRepo.create(data)); }
  async updatePF(id: string, data: Partial<ContactoPF>) {
    await this.pfRepo.update(id, data);
    return this.pfRepo.findOne({ where: { id } });
  }

  // ── Persona Jurídica ──────────────────────────────────────────────────────

  async buscarPJ(q: string) {
    return this.pjRepo
      .createQueryBuilder('p')
      .where('p.ruc ILIKE :q OR p.razon_social ILIKE :q', { q: `%${q}%` })
      .orderBy('p.razon_social', 'ASC')
      .limit(20)
      .getMany();
  }

  async findPJByRuc(ruc: string) {
    return this.pjRepo.findOne({ where: { ruc } });
  }

  findAllPJ() { return this.pjRepo.find({ order: { razonSocial: 'ASC' } }); }
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
}
