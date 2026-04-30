import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuentaTransferencia } from './cuenta-transferencia.entity';

@Injectable()
export class CuentasTransferenciaService {
  constructor(
    @InjectRepository(CuentaTransferencia)
    private repo: Repository<CuentaTransferencia>,
  ) {}

  findByContacto(contactoTipo: string, contactoId: string) {
    return this.repo.find({
      where: { contactoTipo, contactoId },
      order: { esPrincipal: 'DESC', createdAt: 'ASC' },
    });
  }

  async create(data: Partial<CuentaTransferencia>) {
    const cuenta = this.repo.create(data);
    // Si es la primera cuenta del contacto, marcarla como principal automáticamente
    if (!cuenta.esPrincipal) {
      const count = await this.repo.count({
        where: { contactoTipo: data.contactoTipo, contactoId: data.contactoId, activo: true },
      });
      if (count === 0) cuenta.esPrincipal = true;
    }
    if (cuenta.esPrincipal) {
      await this.repo.update(
        { contactoTipo: data.contactoTipo, contactoId: data.contactoId },
        { esPrincipal: false },
      );
    }
    return this.repo.save(cuenta);
  }

  async update(id: string, data: Partial<CuentaTransferencia>) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Cuenta de transferencia no encontrada');

    // Si se marca como principal, quitar el flag a las demás del mismo contacto
    if (data.esPrincipal) {
      await this.repo.update(
        { contactoTipo: existing.contactoTipo, contactoId: existing.contactoId },
        { esPrincipal: false },
      );
    }
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
