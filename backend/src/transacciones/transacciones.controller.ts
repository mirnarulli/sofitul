import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TransaccionesService } from './transacciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { ReversarTransaccionDto } from './dto/reversar-transaccion.dto';

@Controller('transacciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransaccionesController {
  constructor(private svc: TransaccionesService) {}

  @Get('operacion/:operacionId')
  findByOperacion(@Param('operacionId') operacionId: string) {
    return this.svc.findByOperacion(operacionId);
  }

  @Get('resumen-ingresos')
  resumenIngresos(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.svc.resumenIngresos(desde, hasta);
  }

  @Post('pago')
  @Roles('SUPERADMIN', 'ADMIN', 'COBRADOR')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registrarPago(@Body() b: RegistrarPagoDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    const ip = req.ip ?? req.headers?.['x-forwarded-for'];
    return this.svc.registrarPago(b, userId, ip);
  }

  @Post(':id/reversar')
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reversar(@Param('id') id: string, @Body() b: ReversarTransaccionDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    const ip = req.ip ?? req.headers?.['x-forwarded-for'];
    return this.svc.reversar(id, b.motivo, userId, ip);
  }
}
