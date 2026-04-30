import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteVetado } from '../entities';
import { ClientesVetadosService } from './clientes-vetados.service';
import { ClientesVetadosController } from './clientes-vetados.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([ClienteVetado])],
  providers:   [ClientesVetadosService],
  controllers: [ClientesVetadosController],
  exports:     [ClientesVetadosService],
})
export class ClientesVetadosModule {}
