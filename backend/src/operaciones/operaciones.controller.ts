import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OperacionesService } from './operaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('operaciones')
@UseGuards(JwtAuthGuard)
export class OperacionesController {
  constructor(private svc: OperacionesService) {}

  @Get()
  findAll(@Query() q: any) {
    return this.svc.findAll({ estado: q.estado, tipo: q.tipo, contactoId: q.contactoId, page: q.page ? +q.page : 1, limit: q.limit ? +q.limit : 50 });
  }

  @Get('estados')          findEstados()                                                 { return this.svc.findEstados(); }
  @Get(':id')              findById(@Param('id') id: string)                             { return this.svc.findById(id); }
  @Post()                  create(@Body() b: any)                                        { return this.svc.create(b, b.cheques, b.cuotas); }
  @Put(':id')              update(@Param('id') id: string, @Body() b: any)               { return this.svc.update(id, b); }

  @Put(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() b: { estado: string; nota?: string }, @Req() req: any) {
    return this.svc.cambiarEstado(id, b.estado, b.nota, `${req.user?.primerNombre ?? ''}`);
  }

  @Put(':id/prorroga')
  registrarProrroga(@Param('id') id: string, @Body() b: any) { return this.svc.registrarProrroga(id, b); }

  @Put('cheques/:id')
  updateCheque(@Param('id') id: string, @Body() b: any)      { return this.svc.updateCheque(id, b); }

  @Put('cuotas/:id/pagar')
  pagarCuota(@Param('id') id: string, @Body() b: any)        { return this.svc.registrarPagoCuota(id, b); }

  @Post('estados')         createEstado(@Body() b: any)       { return this.svc.createEstado(b); }
  @Put('estados/:id')      updateEstado(@Param('id') id: string, @Body() b: any) { return this.svc.updateEstado(id, b); }

  // Endpoint de cálculo de interés
  @Post('calcular-interes')
  calcularInteres(@Body() b: { monto: number; tasaMensual: number; dias: number }) {
    return { interes: OperacionesService.calcularInteres(b.monto, b.tasaMensual, b.dias) };
  }
}
