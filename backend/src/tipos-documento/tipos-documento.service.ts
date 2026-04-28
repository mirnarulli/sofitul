import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoDocumento } from '../entities';

@Injectable()
export class TiposDocumentoService {
  constructor(@InjectRepository(TipoDocumento) private repo: Repository<TipoDocumento>) {}
  findAll()    { return this.repo.find({ order: { nombre: 'ASC' } }); }
  findActivos(){ return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } }); }
  create(data: Partial<TipoDocumento>)  { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<TipoDocumento>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async delete(id: string) { await this.repo.delete(id); return { mensaje: 'Eliminado' }; }
}
