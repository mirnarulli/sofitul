import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CanalesService } from './canales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Canal } from '../entities';

@Controller('canales')
@UseGuards(JwtAuthGuard)
export class CanalesController {
  constructor(private svc: CanalesService) {}

  @Get()           findAll()                                                    { return this.svc.findAll(); }
  @Get('activos')  findActivos()                                                { return this.svc.findActivos(); }
  @Post()          create(@Body() b: Partial<Canal>)                                       { return this.svc.create(b); }
  @Put(':id')      update(@Param('id') id: string, @Body() b: Partial<Canal>)             { return this.svc.update(id, b); }
  @Delete(':id')   delete(@Param('id') id: string)                             { return this.svc.delete(id); }
}
