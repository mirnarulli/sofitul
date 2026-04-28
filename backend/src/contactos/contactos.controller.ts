import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContactosService } from './contactos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contactos')
@UseGuards(JwtAuthGuard)
export class ContactosController {
  constructor(private svc: ContactosService) {}

  @Get('buscar-doc')
  buscarPorDoc(@Query('doc') doc: string) { return this.svc.buscarPorDoc(doc); }

  // ── PF ────────────────────────────────────────────────────────────────────
  @Get('pf')
  findAllPF(@Query('q') q?: string) { return this.svc.findAllPF(q); }

  @Get('pf/:id/operaciones')
  getPFOperaciones(@Param('id') id: string) { return this.svc.getOperacionesByContacto('pf', id); }

  @Get('pf/:id')
  findPFById(@Param('id') id: string) { return this.svc.findPFById(id); }

  @Post('pf')
  createPF(@Body() b: any) { return this.svc.createPF(b); }

  @Put('pf/:id')
  updatePF(@Param('id') id: string, @Body() b: any) { return this.svc.updatePF(id, b); }

  // ── PJ ────────────────────────────────────────────────────────────────────
  @Get('pj')
  findAllPJ(@Query('q') q?: string) { return this.svc.findAllPJ(q); }

  @Get('pj/:id/operaciones')
  getPJOperaciones(@Param('id') id: string) { return this.svc.getOperacionesByContacto('pj', id); }

  @Get('pj/:id')
  findPJById(@Param('id') id: string) { return this.svc.findPJById(id); }

  @Post('pj')
  createPJ(@Body() b: any) { return this.svc.createPJ(b); }

  @Put('pj/:id')
  updatePJ(@Param('id') id: string, @Body() b: any) { return this.svc.updatePJ(id, b); }
}
