import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoFinanciero } from '../entities';
import { ProductosFinancierosService } from './productos-financieros.service';
import { ProductosFinancierosController } from './productos-financieros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductoFinanciero])],
  providers: [ProductosFinancierosService],
  controllers: [ProductosFinancierosController],
  exports: [ProductosFinancierosService],
})
export class ProductosFinancierosModule {}
