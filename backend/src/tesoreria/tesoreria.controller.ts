import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TesoreriaService } from './tesoreria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegistrarDesembolsoDto } from './dto/registrar-desembolso.dto';
import { RegistrarPagareDto } from './dto/registrar-pagare.dto';

@Controller('tesoreria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
export class TesoreriaController {
  constructor(private svc: TesoreriaService) {}

  @Get('pendientes')
  getPendientes() { return this.svc.getPendientesDesembolso(); }

  @Get('alertas-pagare')
  getAlertasPagare() { return this.svc.getAlertasPagare(); }

  @Post(':id/desembolso')
  registrarDesembolso(@Param('id') id: string, @Body() b: RegistrarDesembolsoDto) {
    return this.svc.registrarDesembolso(id, b);
  }

  @Put(':id/pagare')
  registrarPagare(@Param('id') id: string, @Body() b: RegistrarPagareDto) {
    return this.svc.registrarRecepcionPagare(id, b.fecha);
  }
}
