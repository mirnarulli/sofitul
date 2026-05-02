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
  consultar(@Body() dto: ConsultarValidataDto, @Req() req: { user?: { email?: string } }) {
    const email  = req.user?.email  ?? undefined;
    const origen = dto.origen       ?? undefined;
    return this.svc.consultar(dto.cedula, email, origen);
  }

  /** GET /validata/consultas?cedula=&page=&limit=
   *  Historial de consultas — solo ADMIN / SUPERADMIN */
  @Get('consultas')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  getHistorial(
    @Query('cedula') cedula?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.svc.getHistorial({
      cedula: cedula || undefined,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 50,
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

  /** POST /validata/test-conexion
   *  Verifica credenciales y devuelve resultado — solo SUPERADMIN */
  @Post('test-conexion')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  testConexion() {
    return this.svc.testConexion();
  }

  /** POST /validata/credenciales
   *  Guarda credenciales en configuracion table — solo SUPERADMIN */
  @Post('credenciales')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  setCredenciales(@Body() body: { validata_url?: string; validata_user?: string; validata_pass?: string }) {
    return this.svc.setCredenciales(body);
  }

  /** GET /validata/credenciales
   *  Lee credenciales actuales (pass censurado) — solo SUPERADMIN */
  @Get('credenciales')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  getCredencialesPublic() {
    return this.svc.getCredencialesPublic();
  }
}
