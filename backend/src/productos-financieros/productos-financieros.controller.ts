import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductosFinancierosService } from './productos-financieros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('productos-financieros')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductosFinancierosController {
  constructor(private svc: ProductosFinancierosService) {}

  @Get()           findAll()                              { return this.svc.findAll(); }
  @Get('activos')  findActivos()                          { return this.svc.findActivos(); }
  @Get(':id')      findById(@Param('id') id: string)      { return this.svc.findById(id); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: any) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }

  @Post(':id/formularios')
  @Roles('SUPERADMIN', 'ADMIN')
  addFormulario(@Param('id') id: string, @Body() b: any) {
    return this.svc.addFormulario(id, b);
  }

  @Delete(':id/formularios/:formularioId')
  @Roles('SUPERADMIN', 'ADMIN')
  removeFormulario(@Param('id') id: string, @Param('formularioId') fid: string) {
    return this.svc.removeFormulario(id, fid);
  }
}
