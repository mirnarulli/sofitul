import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PaisesService } from './paises.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Pais } from '../entities';

@Controller('paises')
@UseGuards(JwtAuthGuard)
export class PaisesController {
  constructor(private svc: PaisesService) {}
  @Get()           findAll()                        { return this.svc.findAll(); }
  @Get('activos')  findActivos()                    { return this.svc.findActivos(); }
  @Post()          create(@Body() b: Partial<Pais>)           { return this.svc.create(b); }
  @Put(':id')      update(@Param('id') id: string, @Body() b: Partial<Pais>) { return this.svc.update(id, b); }
  @Delete(':id')   delete(@Param('id') id: string) { return this.svc.delete(id); }
}
