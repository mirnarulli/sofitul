import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moneda } from '../entities';

@Injectable()
export class MonedasService {
  constructor(@InjectRepository(Moneda) private repo: Repository<Moneda>) {}
  findAll()                      { return this.repo.find({ order: { nombre: 'ASC' } }); }
  findActivas()                  { return this.repo.find({ where: { activa: true }, order: { nombre: 'ASC' } }); }
  create(data: Partial<Moneda>)  { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Moneda>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async delete(id: string)       { await this.repo.delete(id); return { mensaje: 'Eliminado' }; }
}
