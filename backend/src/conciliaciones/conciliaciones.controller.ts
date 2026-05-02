import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ConciliacionesService } from './conciliaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateConciliacionDto } from './dto/create-conciliacion.dto';
import { CerrarConciliacionDto } from './dto/cerrar-conciliacion.dto';

@Controller('conciliaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConciliacionesController {
  constructor(private svc: ConciliacionesService) {}

  @Get()
  findAll(
    @Query('cobradorId') cobradorId?: string,
    @Query('cajaId')     cajaId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('estado')     estado?: string,
  ) {
    return this.svc.findAll({ cobradorId, cajaId, fechaDesde, fechaHasta, estado });
  }

  @Get(':id')
  findById(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() b: CreateConciliacionDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.create(b, userId);
  }

  @Put(':id/cerrar')
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cerrar(@Param('id') id: string, @Body() b: CerrarConciliacionDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.cerrar(id, b, userId);
  }

  @Put(':id/conciliar')
  @Roles('SUPERADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conciliar(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.conciliar(id, userId);
  }

  @Put(':id/reabrir')
  @Roles('SUPERADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reabrir(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.reabrir(id, userId);
  }
}
