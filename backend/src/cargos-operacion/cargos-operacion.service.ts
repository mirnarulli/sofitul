import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOperacion } from './entities/cargo-operacion.entity';
import { CreateCargoOperacionDto } from './dto/create-cargo-operacion.dto';

@Injectable()
export class CargosOperacionService {
  constructor(
    @InjectRepository(CargoOperacion) private repo: Repository<CargoOperacion>,
  ) {}

  findByOperacion(operacionId: string) {
    return this.repo.find({ where: { operacionId }, order: { fechaCargo: 'ASC', createdAt: 'ASC' } });
  }

  findPendientesByOperacion(operacionId: string) {
    return this.repo.find({ where: { operacionId, estado: 'PENDIENTE' }, order: { fechaCargo: 'ASC' } });
  }

  create(body: CreateCargoOperacionDto) {
    return this.repo.save(this.repo.create(body));
  }

  async exonerar(id: string, motivo: string, userId: string) {
    const cargo = await this.repo.findOne({ where: { id } });
    if (!cargo) throw new NotFoundException(`Cargo ${id} no encontrado`);
    const hoy = new Date().toISOString().split('T')[0];
    await this.repo.update(id, {
      estado: 'EXONERADO',
      montoExonerado: cargo.montoCalculado,
      exoneradoPorId: userId,
      motivoExoneracion: motivo,
      fechaExoneracion: hoy,
    });
    return this.repo.findOne({ where: { id } });
  }

  async marcarCobrado(id: string, transaccionId: string) {
    const cargo = await this.repo.findOne({ where: { id } });
    if (!cargo) throw new NotFoundException(`Cargo ${id} no encontrado`);
    await this.repo.update(id, {
      estado: 'COBRADO',
      montoCobrado: cargo.montoCalculado,
      cobradoEnTransaccionId: transaccionId,
    });
    return this.repo.findOne({ where: { id } });
  }
}
