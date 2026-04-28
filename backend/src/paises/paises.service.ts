import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pais } from '../entities';

@Injectable()
export class PaisesService {
  constructor(@InjectRepository(Pais) private repo: Repository<Pais>) {}
  findAll()                    { return this.repo.find({ order: { nombre: 'ASC' } }); }
  findActivos()                { return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } }); }
  create(data: Partial<Pais>)  { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Pais>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async delete(id: string)     { await this.repo.delete(id); return { mensaje: 'Eliminado' }; }
}
