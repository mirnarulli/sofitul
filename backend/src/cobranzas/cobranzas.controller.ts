import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CobranzasService } from './cobranzas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cobranzas')
@UseGuards(JwtAuthGuard)
export class CobranzasController {
  constructor(private svc: CobranzasService) {}

  @Get()
  getCartera(@Query() q: any) { return this.svc.getCartera({ estado: q.estado, cobradorId: q.cobradorId, tipo: q.tipo }); }

  @Get('resumen')
  getResumen() { return this.svc.getResumenCartera(); }

  @Get('vencimientos')
  getVencimientos() { return this.svc.getVencimientosPorPeriodo(); }

  @Put(':id/cobrador')
  asignarCobrador(@Param('id') id: string, @Body() b: { cobradorId: string }) {
    return this.svc.asignarCobrador(id, b.cobradorId);
  }

  @Post(':id/pago')
  registrarPago(@Param('id') id: string, @Body() b: any) {
    return this.svc.registrarPago(id, b);
  }
}
