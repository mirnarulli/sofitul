import { Module } from '@nestjs/common';
import { TesoreriaService } from './tesoreria.service';
import { TesoreriaController } from './tesoreria.controller';
import { OperacionesModule } from '../operaciones/operaciones.module';

@Module({
  imports: [OperacionesModule],
  providers: [TesoreriaService],
  controllers: [TesoreriaController],
  exports: [TesoreriaService],
})
export class TesoreriaModule {}
