import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductoFinanciero } from '../entities';

@Injectable()
export class ProductosFinancierosService {
  constructor(
    @InjectRepository(ProductoFinanciero)
    private repo: Repository<ProductoFinanciero>,
  ) {}

  findAll()     { return this.repo.find({ order: { nombre: 'ASC' } }); }
  findActivos() { return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } }); }

  findById(id: string) { return this.repo.findOne({ where: { id } }); }
  findByCodigo(codigo: string) { return this.repo.findOne({ where: { codigo } }); }

  create(data: Partial<ProductoFinanciero>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<ProductoFinanciero>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async addFormulario(id: string, formulario: { id: string; nombre: string; requerido: boolean }) {
    const prod = await this.repo.findOne({ where: { id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    const formularios = [...(prod.formularios ?? [])];
    const idx = formularios.findIndex(f => f.id === formulario.id);
    if (idx >= 0) formularios[idx] = formulario;
    else formularios.push(formulario);
    await this.repo.update(id, { formularios });
    return this.repo.findOne({ where: { id } });
  }

  async removeFormulario(id: string, formularioId: string) {
    const prod = await this.repo.findOne({ where: { id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    const formularios = (prod.formularios ?? []).filter((f: any) => f.id !== formularioId);
    await this.repo.update(id, { formularios });
    return this.repo.findOne({ where: { id } });
  }
}
