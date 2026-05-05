import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfiguracionService } from './configuracion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SetConfiguracionDto } from './dto/set-configuracion.dto';

class UpdateSeguridadDto {
  @IsOptional() @IsNumber() @Min(1) @Max(72) @Type(() => Number)
  session_duracion_horas?: number;

  @IsOptional() @IsNumber() @Min(5) @Max(480) @Type(() => Number)
  sesion_inactividad_minutos?: number;
}

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private svc: ConfiguracionService) {}

  /** Logos — público (se necesita en la pantalla de login) */
  @Get('logos')
  getLogos() { return this.svc.getLogos(); }

  /** Datos empresa — público (se necesita en documentos imprimibles) */
  @Get('empresa')
  getEmpresa() { return this.svc.getEmpresa(); }

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

  // ── Seguridad / Sesiones ─────────────────────────────────────────────────

  @Get('seguridad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  getSeguridad() { return this.svc.getSeguridad(); }

  @Patch('seguridad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  setSeguridad(@Body() dto: UpdateSeguridadDto) { return this.svc.setSeguridad(dto); }
}
