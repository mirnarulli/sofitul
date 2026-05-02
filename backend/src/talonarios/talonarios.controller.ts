import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TalonerosService } from './talonarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AsignarTalonarioDto } from './dto/asignar-talonario.dto';
import { CreateTimbradoDto } from './dto/create-timbrado.dto';
import { UpdateTimbradoDto } from './dto/update-timbrado.dto';

@Controller('talonarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TalonerosController {
  constructor(private svc: TalonerosService) {}

  // ── Talonarios internos ──────────────────────────────────────────────────

  @Get('internos/empleado/:empleadoId')
  findByEmpleado(@Param('empleadoId') empleadoId: string) {
    return this.svc.findTalonariosByEmpleado(empleadoId);
  }

  @Post('internos/asignar')
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asignar(@Body() b: AsignarTalonarioDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.asignarTalonario(b.empleadoId, userId, b.observaciones);
  }

  // ── Timbrados ────────────────────────────────────────────────────────────

  @Get('timbrados')
  findTimbrados() { return this.svc.findTimbrados(); }

  @Get('timbrados/activo')
  findTimbradoActivo() { return this.svc.findTimbradoActivo(); }

  @Post('timbrados')
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTimbrado(@Body() b: CreateTimbradoDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.createTimbrado(b, userId);
  }

  @Put('timbrados/:id')
  @Roles('SUPERADMIN', 'ADMIN')
  updateTimbrado(@Param('id') id: string, @Body() b: UpdateTimbradoDto) {
    return this.svc.updateTimbrado(id, b);
  }
}
