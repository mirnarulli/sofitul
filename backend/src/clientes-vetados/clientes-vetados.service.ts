import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ClienteVetado } from '../entities';

@Injectable()
export class ClientesVetadosService {
  constructor(@InjectRepository(ClienteVetado) private repo: Repository<ClienteVetado>) {}

  findAll(q?: string) {
    if (q) {
      return this.repo.find({
        where: [
          { numeroDoc: ILike(`%${q}%`) },
          { nombre: ILike(`%${q}%`) },
        ],
        order: { createdAt: 'DESC' },
      });
    }
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  /** Verificar si un documento está vetado (activo) */
  async verificar(numeroDoc: string) {
    const veto = await this.repo.findOne({
      where: { numeroDoc, activo: true },
    });
    return { vetado: !!veto, detalle: veto ?? null };
  }

  create(data: Partial<ClienteVetado>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<ClienteVetado>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
