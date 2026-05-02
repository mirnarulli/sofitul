import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, StreamableFile } from '@nestjs/common';
import { ContactosService } from './contactos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contactos')
@UseGuards(JwtAuthGuard)
export class ContactosController {
  constructor(private svc: ContactosService) {}

  @Get('export')
  async exportExcel() {
    const buf   = await this.svc.exportToExcel();
    const fecha = new Date().toISOString().split('T')[0];
    return new StreamableFile(buf, {
      type:        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="contactos-${fecha}.xlsx"`,
    });
  }

  @Get('buscar-doc')
  buscarPorDoc(@Query('doc') doc: string) { return this.svc.buscarPorDoc(doc); }

  // ── PF ────────────────────────────────────────────────────────────────────
  @Get('pf')
  findAllPF(@Query('q') q?: string) { return this.svc.findAllPF(q); }

  @Get('pf/:id/operaciones')
  getPFOperaciones(@Param('id') id: string) { return this.svc.getOperacionesByContacto('pf', id); }

  @Get('pf/:id/vinculadas')
  getVinculadas(@Param('id') id: string) { return this.svc.findEmpresasVinculadas(id); }

  @Get('pf/:id')
  findPFById(@Param('id') id: string) { return this.svc.findPFById(id); }

  @Post('pf')
  createPF(@Body() b: any, @Request() req: any) {
    const u = req.user;
    return this.svc.createPF(b, u?.id, `${u?.primerNombre ?? ''} ${u?.primerApellido ?? ''}`.trim());
  }

  @Put('pf/:id')
  updatePF(@Param('id') id: string, @Body() b: any, @Request() req: any) {
    const u = req.user;
    return this.svc.updatePF(id, b, u?.id, `${u?.primerNombre ?? ''} ${u?.primerApellido ?? ''}`.trim());
  }

  // ── PJ ────────────────────────────────────────────────────────────────────
  @Get('pj')
  findAllPJ(@Query('q') q?: string) { return this.svc.findAllPJ(q); }

  @Get('pj/:id/operaciones')
  getPJOperaciones(@Param('id') id: string) { return this.svc.getOperacionesByContacto('pj', id); }

  @Get('pj/:id')
  findPJById(@Param('id') id: string) { return this.svc.findPJById(id); }

  @Post('pj')
  createPJ(@Body() b: any, @Request() req: any) {
    const u = req.user;
    return this.svc.createPJ(b, u?.id, `${u?.primerNombre ?? ''} ${u?.primerApellido ?? ''}`.trim());
  }

  @Put('pj/:id')
  updatePJ(@Param('id') id: string, @Body() b: any, @Request() req: any) {
    const u = req.user;
    return this.svc.updatePJ(id, b, u?.id, `${u?.primerNombre ?? ''} ${u?.primerApellido ?? ''}`.trim());
  }
}
