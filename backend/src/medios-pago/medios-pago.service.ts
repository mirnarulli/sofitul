import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedioPago } from '../entities';

const MEDIOS_PAGO_SEED = [
  { codigo: 'EFECTIVO',        nombre: 'Efectivo',         esDigital: false, requiereReferencia: false, requiereBanco: false, orden: 1 },
  { codigo: 'TRANSFERENCIA',   nombre: 'Transferencia',    esDigital: true,  requiereReferencia: true,  requiereBanco: true,  orden: 2 },
  { codigo: 'CHEQUE',          nombre: 'Cheque',           esDigital: true,  requiereReferencia: true,  requiereBanco: true,  orden: 3 },
  { codigo: 'QR_CODE',         nombre: 'QR Code',          esDigital: true,  requiereReferencia: true,  requiereBanco: false, orden: 4 },
  { codigo: 'TARJETA_DEBITO',  nombre: 'Tarjeta de Débito',esDigital: true,  requiereReferencia: true,  requiereBanco: false, orden: 5 },
  { codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta de Crédito',esDigital: true, requiereReferencia: true,  requiereBanco: false, orden: 6 },
];

@Injectable()
export class MediosPagoService implements OnModuleInit {
  constructor(@InjectRepository(MedioPago) private repo: Repository<MedioPago>) {}

  async onModuleInit() {
    for (const m of MEDIOS_PAGO_SEED) {
      const exists = await this.repo.findOne({ where: { codigo: m.codigo } });
      if (!exists) await this.repo.save(this.repo.create({ ...m, activo: true }));
    }
  }

  findAll()     { return this.repo.find({ order: { orden: 'ASC', nombre: 'ASC' } }); }
  findActivos() { return this.repo.find({ where: { activo: true }, order: { orden: 'ASC', nombre: 'ASC' } }); }

  create(data: Partial<MedioPago>) { return this.repo.save(this.repo.create(data)); }

  async update(id: string, data: Partial<MedioPago>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
