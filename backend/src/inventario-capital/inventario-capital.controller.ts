import { Controller, Get, UseGuards, StreamableFile } from '@nestjs/common';
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
  @Get('export-cheques')
  async exportCheques() {
    const buf   = await this.svc.exportChequesToExcel();
    const fecha = new Date().toISOString().split('T')[0];
    return new StreamableFile(buf, {
      type:        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="cheques-${fecha}.xlsx"`,
    });
  }
  @Get('cheques')            getCheques()         { return this.svc.getInventarioCheques(); }
  @Get('rentabilidad')       getRentabilidad()    { return this.svc.getRentabilidadPorPeriodo(); }
}
