import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caja } from '../entities';

@Injectable()
export class CajasService {
  constructor(@InjectRepository(Caja) private repo: Repository<Caja>) {}
  findAll()                     { return this.repo.find({ order: { nombre: 'ASC' } }); }
  findActivas()                 { return this.repo.find({ where: { activa: true }, order: { nombre: 'ASC' } }); }
  create(data: Partial<Caja>)   { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Caja>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async delete(id: string)      { await this.repo.delete(id); return { mensaje: 'Eliminado' }; }
}
