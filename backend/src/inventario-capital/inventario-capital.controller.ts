import { Controller, Get, UseGuards } from '@nestjs/common';
import { InventarioCapitalService } from './inventario-capital.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventario-capital')
@UseGuards(JwtAuthGuard)
export class InventarioCapitalController {
  constructor(private svc: InventarioCapitalService) {}

  @Get('resumen')        getResumen()     { return this.svc.getResumen(); }
  @Get('cheques')        getCheques()     { return this.svc.getInventarioCheques(); }
  @Get('rentabilidad')   getRentabilidad(){ return this.svc.getRentabilidadPorPeriodo(); }
}
