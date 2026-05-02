import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MediosPagoService } from './medios-pago.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateMedioPagoDto } from './dto/create-medio-pago.dto';
import { UpdateMedioPagoDto } from './dto/update-medio-pago.dto';

@Controller('medios-pago')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediosPagoController {
  constructor(private svc: MediosPagoService) {}

  @Get()          findAll()    { return this.svc.findAll(); }
  @Get('activos') findActivos(){ return this.svc.findActivos(); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: CreateMedioPagoDto) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: UpdateMedioPagoDto) { return this.svc.update(id, b); }
}
