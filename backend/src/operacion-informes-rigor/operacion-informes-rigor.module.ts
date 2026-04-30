import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { OperacionInformeRigor } from '../entities';
import { OperacionInformesRigorService } from './operacion-informes-rigor.service';
import { OperacionInformesRigorController } from './operacion-informes-rigor.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OperacionInformeRigor]),
    MulterModule.register({}),
  ],
  controllers: [OperacionInformesRigorController],
  providers:   [OperacionInformesRigorService],
  exports:     [OperacionInformesRigorService],
})
export class OperacionInformesRigorModule {}
