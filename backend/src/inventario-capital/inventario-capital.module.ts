import { Module } from '@nestjs/common';
import { InventarioCapitalService } from './inventario-capital.service';
import { InventarioCapitalController } from './inventario-capital.controller';

@Module({
  providers: [InventarioCapitalService],
  controllers: [InventarioCapitalController],
  exports: [InventarioCapitalService],
})
export class InventarioCapitalModule {}
