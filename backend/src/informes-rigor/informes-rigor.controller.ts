import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, OnModuleInit } from '@nestjs/common';
import { InformesRigorService } from './informes-rigor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InformeRigor } from '../entities';

@Controller('informes-rigor')
@UseGuards(JwtAuthGuard)
export class InformesRigorController implements OnModuleInit {
  constructor(private svc: InformesRigorService) {}

  /** Seed automático al arrancar */
  async onModuleInit() { await this.svc.seedDefaults(); }

  @Get()          findAll()                                              { return this.svc.findAll(); }
  @Get('activos') findActivos(@Query('tipoInforme') tipo?: string)       {
    return tipo ? this.svc.findByTipo(tipo) : this.svc.findActivos();
  }
  @Post()         create(@Body() b: Partial<InformeRigor>)                                { return this.svc.create(b); }
  @Put(':id')     update(@Param('id') id: string, @Body() b: Partial<InformeRigor>)       { return this.svc.update(id, b); }
}
