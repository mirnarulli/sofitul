import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductosFinancierosService } from './productos-financieros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('productos-financieros')
@UseGuards(JwtAuthGuard)
export class ProductosFinancierosController {
  constructor(private svc: ProductosFinancierosService) {}

  @Get()           findAll()                                                          { return this.svc.findAll(); }
  @Get('activos')  findActivos()                                                      { return this.svc.findActivos(); }
  @Get(':id')      findById(@Param('id') id: string)                                  { return this.svc.findById(id); }
  @Post()          create(@Body() b: any)                                             { return this.svc.create(b); }
  @Put(':id')      update(@Param('id') id: string, @Body() b: any)                   { return this.svc.update(id, b); }

  // Gestión de formularios del producto
  @Post(':id/formularios')
  addFormulario(@Param('id') id: string, @Body() b: any) {
    return this.svc.addFormulario(id, b);
  }

  @Delete(':id/formularios/:formularioId')
  removeFormulario(@Param('id') id: string, @Param('formularioId') fid: string) {
    return this.svc.removeFormulario(id, fid);
  }
}
