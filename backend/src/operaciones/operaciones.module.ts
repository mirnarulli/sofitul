import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operacion } from './entities/operacion.entity';
import { ChequeDetalle } from './entities/cheque-detalle.entity';
import { Cuota } from './entities/cuota.entity';
import { EstadoOperacion } from './entities/estado-operacion.entity';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Operacion, ChequeDetalle, Cuota, EstadoOperacion])],
  providers: [OperacionesService],
  controllers: [OperacionesController],
  exports: [OperacionesService],
})
export class OperacionesModule {}
