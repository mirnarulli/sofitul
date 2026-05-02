import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, StreamableFile } from '@nestjs/common';
import { CobranzasService } from './cobranzas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard }   from '../auth/roles.guard';
import { Roles }        from '../auth/roles.decorator';

@Controller('cobranzas')
@UseGuards(JwtAuthGuard)
export class CobranzasController {
  constructor(private svc: CobranzasService) {}

  @Get('export')
  async exportExcel(
    @Query('estado')     estado?: string,
    @Query('cobradorId') cobradorId?: string,
    @Query('tipo')       tipo?: string,
  ) {
    const buf   = await this.svc.exportToExcel({ estado, cobradorId, tipo });
    const fecha = new Date().toISOString().split('T')[0];
    return new StreamableFile(buf, {
      type:        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="cobranzas-${fecha}.xlsx"`,
    });
  }

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
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  asignarCobrador(@Param('id') id: string, @Body() b: { cobradorId: string }) {
    return this.svc.asignarCobrador(id, b.cobradorId);
  }

  @Post(':id/pago')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN', 'COBRADOR')
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
