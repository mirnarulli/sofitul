import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CuentasTransferenciaService } from './cuentas-transferencia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCuentaTransferenciaDto } from './dto/create-cuenta-transferencia.dto';
import { UpdateCuentaTransferenciaDto } from './dto/update-cuenta-transferencia.dto';

@Controller('cuentas-transferencia')
@UseGuards(JwtAuthGuard)
export class CuentasTransferenciaController {
  constructor(private svc: CuentasTransferenciaService) {}

  @Get()
  findByContacto(
    @Query('contactoTipo') contactoTipo: string,
    @Query('contactoId')   contactoId: string,
  ) {
    return this.svc.findByContacto(contactoTipo, contactoId);
  }

  @Post()
  create(@Body() b: CreateCuentaTransferenciaDto) { return this.svc.create(b); }

  @Put(':id')
  update(@Param('id') id: string, @Body() b: UpdateCuentaTransferenciaDto) { return this.svc.update(id, b); }
}
