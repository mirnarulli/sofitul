import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operacion } from './entities/operacion.entity';
import { ChequeDetalle } from './entities/cheque-detalle.entity';
import { Cuota } from './entities/cuota.entity';
import { EstadoOperacion } from './entities/estado-operacion.entity';
import { EstadoTransicion } from './entities/estado-transicion.entity';
import { TipoCargo } from '../entities/tipo-cargo.entity';
import { CargoOperacion } from '../cargos-operacion/entities/cargo-operacion.entity';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';
import { OperacionesCron } from './operaciones.cron';
import { FeriadosModule } from '../feriados/feriados.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operacion, ChequeDetalle, Cuota, EstadoOperacion, EstadoTransicion, TipoCargo, CargoOperacion]),
    FeriadosModule,
  ],
  providers: [OperacionesService, OperacionesCron],
  controllers: [OperacionesController],
  exports: [OperacionesService],
})
export class OperacionesModule {}
