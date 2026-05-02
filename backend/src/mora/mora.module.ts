import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuota } from '../operaciones/entities/cuota.entity';
import { CargoOperacion } from '../cargos-operacion/entities/cargo-operacion.entity';
import { TipoCargo } from '../entities';
import { MoraService } from './mora.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota, CargoOperacion, TipoCargo])],
  providers: [MoraService],
  exports: [MoraService],
})
export class MoraModule {}
