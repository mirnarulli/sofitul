import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SetConfiguracionDto } from './dto/set-configuracion.dto';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private svc: ConfiguracionService) {}

  /** Logos — público (se necesita en la pantalla de login) */
  @Get('logos')
  getLogos() { return this.svc.getLogos(); }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  findAll() { return this.svc.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  set(@Body() body: SetConfiguracionDto) {
    return this.svc.set(body.clave, body.valor, body.descripcion);
  }

  @Put(':clave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  update(@Param('clave') clave: string, @Body() body: SetConfiguracionDto) {
    return this.svc.set(clave, body.valor, body.descripcion);
  }
}
