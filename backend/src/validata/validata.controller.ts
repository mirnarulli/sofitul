import { Controller, Post, Get, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard }   from '../auth/roles.guard';
import { Roles }        from '../auth/roles.decorator';
import { ValidataService } from './validata.service';
import { ConsultarValidataDto } from './dto/consultar-validata.dto';

@UseGuards(JwtAuthGuard)
@Controller('validata')
export class ValidataController {
  constructor(private svc: ValidataService) {}

  /** POST /validata/consultar
   *  Cualquier usuario autenticado puede consultar.
   *  Guarda automáticamente en bitácora. */
  @Post('consultar')
  consultar(@Body() dto: ConsultarValidataDto, @Req() req: any) {
    const email  = req.user?.email  ?? undefined;
    const origen = dto.origen       ?? undefined;
    return this.svc.consultar(dto.cedula, email, origen);
  }

  /** GET /validata/consultas?cedula=&page=&limit=
   *  Historial de consultas — solo ADMIN / SUPERADMIN */
  @Get('consultas')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  getHistorial(@Query() q: any) {
    return this.svc.getHistorial({
      cedula: q.cedula || undefined,
      page:  q.page  ? +q.page  : 1,
      limit: q.limit ? +q.limit : 50,
    });
  }

  /** GET /validata/consultas/:id
   *  Detalle completo de una consulta (incluye JSON crudo) */
  @Get('consultas/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  getConsulta(@Param('id') id: string) {
    return this.svc.getConsulta(id);
  }
}
