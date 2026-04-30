import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperacionInformeRigor } from '../entities';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OperacionInformesRigorService {
  constructor(
    @InjectRepository(OperacionInformeRigor)
    private repo: Repository<OperacionInformeRigor>,
  ) {}

  /** Todos los registros de una operación */
  findByOperacion(operacionId: string) {
    return this.repo.find({
      where: { operacionId },
      order: { sujetoTipo: 'ASC', tipoNombre: 'ASC' },
    });
  }

  /** Crear un registro individual */
  create(data: Partial<OperacionInformeRigor>) {
    return this.repo.save(this.repo.create(data));
  }

  /** Crear múltiples registros en batch (inicializar due diligence de la operación) */
  async initBatch(items: Partial<OperacionInformeRigor>[]) {
    const created = [];
    for (const item of items) {
      // Evitar duplicados
      const existing = await this.repo.findOne({
        where: { operacionId: item.operacionId, tipoDocumentoId: item.tipoDocumentoId, sujetoTipo: item.sujetoTipo },
      });
      if (!existing) created.push(await this.repo.save(this.repo.create(item)));
    }
    return created;
  }

  /** Actualizar estado, observación */
  async update(id: string, data: Partial<OperacionInformeRigor>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  /** Subir archivo a un registro */
  async upload(id: string, file: Express.Multer.File, operadorId: string, operadorNombre: string) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'due-diligencia');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${id}_${Date.now()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), file.buffer);

    await this.repo.update(id, {
      archivoUrl:     `/uploads/due-diligencia/${filename}`,
      archivoNombre:  file.originalname,
      estado:         'cargado',
      operadorId,
      operadorNombre,
      fechaCarga:     new Date(),
    });
    return this.repo.findOne({ where: { id } });
  }

  /** Eliminar registro */
  async delete(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
