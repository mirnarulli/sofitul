import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Departamento, Ciudad } from '../entities';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([Departamento, Ciudad])],
  providers:   [GeoService],
  controllers: [GeoController],
  exports:     [GeoService],
})
export class GeoModule {}
