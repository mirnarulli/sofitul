import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaccion } from './entities/transaccion.entity';
import { TransaccionCuotaAplicacion } from './entities/transaccion-cuota-aplicacion.entity';
import { Cuota } from '../operaciones/entities/cuota.entity';
import { TalonarioInterno } from '../talonarios/entities/talonario-interno.entity';
import { TimbradoSet } from '../talonarios/entities/timbrado-set.entity';
import { TransaccionesService } from './transacciones.service';
import { TransaccionesController } from './transacciones.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaccion,
      TransaccionCuotaAplicacion,
      Cuota,
      TalonarioInterno,
      TimbradoSet,
    ]),
  ],
  providers:   [TransaccionesService],
  controllers: [TransaccionesController],
  exports:     [TransaccionesService],
})
export class TransaccionesModule {}
