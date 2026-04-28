import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TesoreriaService } from './tesoreria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tesoreria')
@UseGuards(JwtAuthGuard)
export class TesoreriaController {
  constructor(private svc: TesoreriaService) {}

  @Get('pendientes')
  getPendientes() { return this.svc.getPendientesDesembolso(); }

  @Get('alertas-pagare')
  getAlertasPagare() { return this.svc.getAlertasPagare(); }

  @Post(':id/desembolso')
  registrarDesembolso(@Param('id') id: string, @Body() b: any) {
    return this.svc.registrarDesembolso(id, b);
  }

  @Put(':id/pagare')
  registrarPagare(@Param('id') id: string, @Body() b: { fecha: string }) {
    return this.svc.registrarRecepcionPagare(id, b.fecha);
  }
}
