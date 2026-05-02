import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TiposCargoService } from './tipos-cargo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTipoCargoDto } from './dto/create-tipo-cargo.dto';
import { UpdateTipoCargoDto } from './dto/update-tipo-cargo.dto';

@Controller('tipos-cargo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiposCargoController {
  constructor(private svc: TiposCargoService) {}

  @Get()          findAll()    { return this.svc.findAll(); }
  @Get('activos') findActivos(){ return this.svc.findActivos(); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: CreateTipoCargoDto) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: UpdateTipoCargoDto) { return this.svc.update(id, b); }
}
