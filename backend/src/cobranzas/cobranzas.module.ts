import { Module } from '@nestjs/common';
import { CobranzasService } from './cobranzas.service';
import { CobranzasController } from './cobranzas.controller';
import { OperacionesModule } from '../operaciones/operaciones.module';

@Module({
  imports: [OperacionesModule],
  providers: [CobranzasService],
  controllers: [CobranzasController],
  exports: [CobranzasService],
})
export class CobranzasModule {}
