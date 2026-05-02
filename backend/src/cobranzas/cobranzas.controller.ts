import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CobranzasService } from './cobranzas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cobranzas')
@UseGuards(JwtAuthGuard)
export class CobranzasController {
  constructor(private svc: CobranzasService) {}

  @Get()
  getCartera(
    @Query('estado')      estado?: string,
    @Query('cobradorId')  cobradorId?: string,
    @Query('tipo')        tipo?: string,
  ) { return this.svc.getCartera({ estado, cobradorId, tipo }); }

  @Get('resumen')
  getResumen() { return this.svc.getResumenCartera(); }

  @Get('vencimientos')
  getVencimientos() { return this.svc.getVencimientosPorPeriodo(); }

  @Put(':id/cobrador')
  asignarCobrador(@Param('id') id: string, @Body() b: { cobradorId: string }) {
    return this.svc.asignarCobrador(id, b.cobradorId);
  }

  @Post(':id/pago')
  registrarPago(@Param('id') id: string, @Body() b: {
    monto: number;
    fechaPago: string;
    recibo?: string;
    nota?: string;
    emailDestino?: string;
  }) {
    return this.svc.registrarPago(id, b);
  }
}
