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
  @Get('pf')           findAllPF()                          { return this.svc.findAllPF(); }
  @Get('pf/buscar')    buscarPF(@Query('q') q: string)      { return this.svc.buscarPF(q); }
  @Get('pf/:id')       findPFById(@Param('id') id: string)  { return this.svc.findPFById(id); }
  @Post('pf')          createPF(@Body() b: any)             { return this.svc.createPF(b); }
  @Put('pf/:id')       updatePF(@Param('id') id: string, @Body() b: any) { return this.svc.updatePF(id, b); }

  // ── PJ ────────────────────────────────────────────────────────────────────
  @Get('pj')           findAllPJ()                          { return this.svc.findAllPJ(); }
  @Get('pj/buscar')    buscarPJ(@Query('q') q: string)      { return this.svc.buscarPJ(q); }
  @Get('pj/:id')       findPJById(@Param('id') id: string)  { return this.svc.findPJById(id); }
  @Post('pj')          createPJ(@Body() b: any)             { return this.svc.createPJ(b); }
  @Put('pj/:id')       updatePJ(@Param('id') id: string, @Body() b: any) { return this.svc.updatePJ(id, b); }
}
