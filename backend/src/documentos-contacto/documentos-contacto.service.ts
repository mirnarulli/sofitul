import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoDocumentoAdjunto } from '../entities';
import { DocumentoContacto } from './documento-contacto.entity';

@Injectable()
export class DocumentosContactoService {
  constructor(
    @InjectRepository(TipoDocumentoAdjunto) private tiposRepo: Repository<TipoDocumentoAdjunto>,
    @InjectRepository(DocumentoContacto)    private repo:      Repository<DocumentoContacto>,
  ) {}

  // ── Tipos documento adjunto (Panel Global) ──────────────────────────────────

  findAllTipos() {
    return this.tiposRepo.find({ order: { categoria: 'ASC', nombre: 'ASC' } });
  }

  findTiposActivos() {
    return this.tiposRepo.find({ where: { activo: true }, order: { categoria: 'ASC', nombre: 'ASC' } });
  }

  findTiposByCategoria(categoria: string) {
    return this.tiposRepo.find({ where: { activo: true, categoria }, order: { nombre: 'ASC' } });
  }

  createTipo(data: Partial<TipoDocumentoAdjunto>) {
    return this.tiposRepo.save(this.tiposRepo.create(data));
  }

  async updateTipo(id: string, data: Partial<TipoDocumentoAdjunto>) {
    await this.tiposRepo.update(id, data);
    return this.tiposRepo.findOne({ where: { id } });
  }

  // ── Documentos del contacto ─────────────────────────────────────────────────

  findByContacto(contactoTipo: string, contactoId: string) {
    return this.repo.find({
      where: { contactoTipo, contactoId },
      order: { tipoCategoria: 'ASC', tipoNombre: 'ASC', createdAt: 'DESC' },
    });
  }

  create(data: Partial<DocumentoContacto>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<DocumentoContacto>) {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string) {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    await this.repo.delete(id);
    return { success: true };
  }

  async setUrl(id: string, url: string) {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    await this.repo.update(id, { url });
    return this.repo.findOne({ where: { id } });
  }
}
