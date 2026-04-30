import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FeriadosService } from './feriados.service';
import { CreateFeriadoDto } from './dto/create-feriado.dto';
import { UpdateFeriadoDto } from './dto/update-feriado.dto';

@Controller('feriados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeriadosController {
  constructor(private svc: FeriadosService) {}

  /** GET /feriados?año=2026 */
  @Get()
  findAll(@Query('año') año?: string) {
    return this.svc.findAll(año ? parseInt(año) : undefined);
  }

  /** GET /feriados/proximo-habil?fecha=2026-04-02 */
  @Get('proximo-habil')
  async proximoHabil(@Query('fecha') fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const { fecha: ajustada } = await this.svc.ajustarFecha(d);
    return { fecha: ajustada.toISOString().split('T')[0] };
  }

  /** GET /feriados/es-habil?fecha=2026-04-02 */
  @Get('es-habil')
  async esHabil(@Query('fecha') fecha: string) {
    const d = new Date(fecha + 'T00:00:00');
    const habil = await this.svc.esHabil(d);
    return { fecha, habil };
  }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() dto: CreateFeriadoDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFeriadoDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
