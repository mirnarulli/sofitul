import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CajasService } from './cajas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cajas')
@UseGuards(JwtAuthGuard)
export class CajasController {
  constructor(private svc: CajasService) {}
  @Get()          findAll()                         { return this.svc.findAll(); }
  @Get('activas') findActivas()                     { return this.svc.findActivas(); }
  @Post()         create(@Body() b: any)            { return this.svc.create(b); }
  @Put(':id')     update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }
  @Delete(':id')  delete(@Param('id') id: string)  { return this.svc.delete(id); }
}
