import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caja } from '../entities';
import { CajasService } from './cajas.service';
import { CajasController } from './cajas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Caja])],
  providers: [CajasService],
  controllers: [CajasController],
  exports: [CajasService],
})
export class CajasModule {}
