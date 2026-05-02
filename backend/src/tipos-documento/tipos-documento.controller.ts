import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { TiposDocumentoService } from './tipos-documento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TipoDocumento } from '../entities';

@Controller('tipos-documento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiposDocumentoController implements OnModuleInit {
  constructor(private svc: TiposDocumentoService) {}

  async onModuleInit() { await this.svc.seedDueDiligencia(); }

  @Get()                 findAll()     { return this.svc.findAll(); }
  @Get('activos')        findActivos() { return this.svc.findActivos(); }
  @Get('due-diligencia') findDD()      { return this.svc.findDueDiligencia(); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: Partial<TipoDocumento>) { return this.svc.create(b); }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() b: Partial<TipoDocumento>) { return this.svc.update(id, b); }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
