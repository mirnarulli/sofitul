import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { BancosService } from './bancos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';

@Controller('bancos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BancosController {
  constructor(private svc: BancosService) {}

  @Get()          findAll()                                                     { return this.svc.findAll(); }
  @Get('activos') findActivos()                                                 { return this.svc.findActivos(); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: CreateBancoDto) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: UpdateBancoDto) { return this.svc.update(id, b); }
}
