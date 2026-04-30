import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banco } from '../entities';
import { BancosService } from './bancos.service';
import { BancosController } from './bancos.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([Banco])],
  providers:   [BancosService],
  controllers: [BancosController],
  exports:     [BancosService],
})
export class BancosModule {}
