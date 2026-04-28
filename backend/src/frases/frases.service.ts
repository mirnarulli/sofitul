import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frase } from '../entities';

@Injectable()
export class FrasesService {
  constructor(@InjectRepository(Frase) private repo: Repository<Frase>) {}
  findAll()   { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  create(d: Partial<Frase>) { return this.repo.save(this.repo.create(d)); }
  async update(id: string, d: Partial<Frase>) { await this.repo.update(id, d); return this.repo.findOne({ where: { id } }); }
  async delete(id: string)  { await this.repo.delete(id); return { mensaje: 'Eliminado' }; }
  async getFraseDelDia(): Promise<{ texto: string } | null> {
    const rows = await this.repo.find({ where: { activa: true } });
    if (!rows.length) return null;
    const idx = new Date().getDate() % rows.length;
    return { texto: rows[idx].texto };
  }
}
