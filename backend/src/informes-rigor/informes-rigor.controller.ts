import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InformesRigorService } from './informes-rigor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('informes-rigor')
@UseGuards(JwtAuthGuard)
export class InformesRigorController {
  constructor(private svc: InformesRigorService) {}

  @Get()          findAll()                                        { return this.svc.findAll(); }
  @Get('activos') findActivos(@Query('aplicaA') aplicaA?: string) {
    return aplicaA ? this.svc.findByAplica(aplicaA) : this.svc.findActivos();
  }
  @Post()         create(@Body() b: any)                          { return this.svc.create(b); }
  @Put(':id')     update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }
}
