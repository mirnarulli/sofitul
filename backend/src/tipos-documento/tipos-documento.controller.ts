import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TiposDocumentoService } from './tipos-documento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tipos-documento')
@UseGuards(JwtAuthGuard)
export class TiposDocumentoController {
  constructor(private svc: TiposDocumentoService) {}
  @Get()          findAll()                        { return this.svc.findAll(); }
  @Get('activos') findActivos()                    { return this.svc.findActivos(); }
  @Post()         create(@Body() b: any)           { return this.svc.create(b); }
  @Put(':id')     update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }
  @Delete(':id')  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
