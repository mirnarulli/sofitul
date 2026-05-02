import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedioPago } from '../entities';
import { MediosPagoService } from './medios-pago.service';
import { MediosPagoController } from './medios-pago.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([MedioPago])],
  providers:   [MediosPagoService],
  controllers: [MediosPagoController],
  exports:     [MediosPagoService],
})
export class MediosPagoModule {}
