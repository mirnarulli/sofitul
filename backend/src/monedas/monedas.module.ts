import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moneda } from '../entities';
import { MonedasService } from './monedas.service';
import { MonedasController } from './monedas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Moneda])],
  providers: [MonedasService],
  controllers: [MonedasController],
  exports: [MonedasService],
})
export class MonedasModule {}
