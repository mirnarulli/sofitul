import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operacion } from './entities/operacion.entity';
import { ChequeDetalle } from './entities/cheque-detalle.entity';
import { Cuota } from './entities/cuota.entity';
import { EstadoOperacion } from './entities/estado-operacion.entity';
import { EstadoTransicion } from './entities/estado-transicion.entity';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';
import { FeriadosModule } from '../feriados/feriados.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operacion, ChequeDetalle, Cuota, EstadoOperacion, EstadoTransicion]),
    FeriadosModule,
  ],
  providers: [OperacionesService],
  controllers: [OperacionesController],
  exports: [OperacionesService],
})
export class OperacionesModule {}
