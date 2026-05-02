import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MonedasService } from './monedas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Moneda } from '../entities';

@Controller('monedas')
@UseGuards(JwtAuthGuard)
export class MonedasController {
  constructor(private svc: MonedasService) {}
  @Get()           findAll()                         { return this.svc.findAll(); }
  @Get('activas')  findActivas()                     { return this.svc.findActivas(); }
  @Post()          create(@Body() b: Partial<Moneda>)            { return this.svc.create(b); }
  @Put(':id')      update(@Param('id') id: string, @Body() b: Partial<Moneda>) { return this.svc.update(id, b); }
  @Delete(':id')   delete(@Param('id') id: string)  { return this.svc.delete(id); }
}
