import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScoringClientesService } from './scoring-clientes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateScoringClienteDto } from './dto/create-scoring-cliente.dto';
import { UpdateScoringClienteDto } from './dto/update-scoring-cliente.dto';

@Controller('scoring-clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScoringClientesController {
  constructor(private svc: ScoringClientesService) {}

  @Get()          findAll() { return this.svc.findAll(); }
  @Get('ci/:ci')  findByCi(@Param('ci') ci: string) { return this.svc.findByCi(ci); }
  @Get(':id')     findById(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: CreateScoringClienteDto) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: UpdateScoringClienteDto) { return this.svc.update(id, b); }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
