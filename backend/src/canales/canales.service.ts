import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canal } from '../entities';

@Injectable()
export class CanalesService {
  constructor(@InjectRepository(Canal) private repo: Repository<Canal>) {}

  findAll()                     { return this.repo.find({ order: { nombre: 'ASC' } }); }
  findActivos()                 { return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } }); }
  create(data: Partial<Canal>)  { return this.repo.save(this.repo.create(data)); }

  async update(id: string, data: Partial<Canal>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string) {
    await this.repo.delete(id);
    return { mensaje: 'Canal eliminado' };
  }
}
