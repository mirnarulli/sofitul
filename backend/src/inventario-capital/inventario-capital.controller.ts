import { Controller, Get, UseGuards } from '@nestjs/common';
import { InventarioCapitalService } from './inventario-capital.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('inventario-capital')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
export class InventarioCapitalController {
  constructor(private svc: InventarioCapitalService) {}

  @Get('resumen')            getResumen()         { return this.svc.getResumen(); }
  @Get('cheques-dashboard')  getChequesDashboard(){ return this.svc.getChequesDashboard(); }
  @Get('cheques')            getCheques()         { return this.svc.getInventarioCheques(); }
  @Get('rentabilidad')       getRentabilidad()    { return this.svc.getRentabilidadPorPeriodo(); }
}
