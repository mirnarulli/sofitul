import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FrasesService } from './frases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Frase } from '../entities';

@Controller('frases')
export class FrasesController {
  constructor(private svc: FrasesService) {}

  @Get('del-dia')
  getFraseDelDia() { return this.svc.getFraseDelDia(); }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.svc.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() b: Partial<Frase>) { return this.svc.create(b); }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() b: Partial<Frase>) { return this.svc.update(id, b); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
