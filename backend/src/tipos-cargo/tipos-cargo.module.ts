import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoCargo } from '../entities';
import { TiposCargoService } from './tipos-cargo.service';
import { TiposCargoController } from './tipos-cargo.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([TipoCargo])],
  providers:   [TiposCargoService],
  controllers: [TiposCargoController],
  exports:     [TiposCargoService],
})
export class TiposCargoModule {}
