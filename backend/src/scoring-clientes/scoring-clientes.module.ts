import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoringCliente } from './entities/scoring-cliente.entity';
import { ScoringClientesService } from './scoring-clientes.service';
import { ScoringClientesController } from './scoring-clientes.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([ScoringCliente])],
  providers:   [ScoringClientesService],
  controllers: [ScoringClientesController],
  exports:     [ScoringClientesService],
})
export class ScoringClientesModule {}
