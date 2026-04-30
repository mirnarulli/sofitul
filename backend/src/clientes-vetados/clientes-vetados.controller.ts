import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClientesVetadosService } from './clientes-vetados.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateClienteVetadoDto } from './dto/create-cliente-vetado.dto';
import { UpdateClienteVetadoDto } from './dto/update-cliente-vetado.dto';

@Controller('clientes-vetados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesVetadosController {
  constructor(private svc: ClientesVetadosService) {}

  @Get()
  findAll(@Query('q') q?: string) { return this.svc.findAll(q); }

  @Get('verificar/:doc')
  verificar(@Param('doc') doc: string) { return this.svc.verificar(doc); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: CreateClienteVetadoDto) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: UpdateClienteVetadoDto) { return this.svc.update(id, b); }
}
