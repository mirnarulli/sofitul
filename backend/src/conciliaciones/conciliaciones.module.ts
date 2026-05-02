import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conciliacion } from './entities/conciliacion.entity';
import { ConciliacionesService } from './conciliaciones.service';
import { ConciliacionesController } from './conciliaciones.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([Conciliacion])],
  providers:   [ConciliacionesService],
  controllers: [ConciliacionesController],
  exports:     [ConciliacionesService],
})
export class ConciliacionesModule {}
