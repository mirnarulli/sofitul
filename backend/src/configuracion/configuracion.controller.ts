import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private svc: ConfiguracionService) {}

  @Get('logos')
  getLogos() { return this.svc.getLogos(); }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.svc.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  set(@Body() body: { clave: string; valor: string; descripcion?: string }) {
    return this.svc.set(body.clave, body.valor, body.descripcion);
  }
}
