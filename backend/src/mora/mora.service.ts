import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Cuota } from '../operaciones/entities/cuota.entity';
import { CargoOperacion } from '../cargos-operacion/entities/cargo-operacion.entity';
import { TipoCargo } from '../entities';

@Injectable()
export class MoraService {
  private readonly logger = new Logger('MoraService');

  constructor(
    @InjectRepository(Cuota) private cuotaRepo: Repository<Cuota>,
    @InjectRepository(CargoOperacion) private cargoRepo: Repository<CargoOperacion>,
    @InjectRepository(TipoCargo) private tipoCargoRepo: Repository<TipoCargo>,
  ) {}

  @Cron('0 1 * * *')
  async calcularMoraNocturna() {
    this.logger.log('Iniciando cálculo nocturno de mora...');

    // 1. Actualizar estado de cuotas vencidas no pagadas
    await this.cuotaRepo.query(`
      UPDATE cuotas
      SET estado = 'MORA',
          dias_mora = CURRENT_DATE - fecha_vencimiento::date
      WHERE fecha_vencimiento < CURRENT_DATE
        AND estado NOT IN ('PAGADO', 'MORA', 'PRORROGADO', 'CONDONADO')
        AND saldo > 0
    `);

    // 2. Recalcular dias_mora en cuotas ya en MORA
    await this.cuotaRepo.query(`
      UPDATE cuotas
      SET dias_mora = CURRENT_DATE - fecha_vencimiento::date
      WHERE estado = 'MORA' AND saldo > 0
    `);

    // 3. Obtener tipo cargo MORA activo
    const tipoCargo = await this.tipoCargoRepo.findOne({ where: { codigo: 'INT_MORA', activo: true } });
    if (!tipoCargo) {
      this.logger.warn('No hay tipo cargo INT_MORA activo, se omite cálculo de mora');
    }

    // 4. Verificar vencimiento de timbrados
    await this.cuotaRepo.query(`
      UPDATE timbrados_set
      SET estado = 'VENCIDO'
      WHERE estado = 'ACTIVO' AND fecha_vigencia_hasta < CURRENT_DATE
    `);

    this.logger.log('Cálculo de mora completado');
  }
}
