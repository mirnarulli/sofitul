import { Controller, Get, Query, UseGuards, StreamableFile } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles }      from '../auth/roles.decorator';
import { BitacoraService } from './bitacora.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bitacora')
@UseGuards(JwtAuthGuard)
export class BitacoraController {
  constructor(private bitacoraService: BitacoraService) {}

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  async exportExcel(
    @Query('modulo')    modulo?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('desde')     desde?: string,
    @Query('hasta')     hasta?: string,
  ) {
    const buf   = await this.bitacoraService.exportToExcel({ modulo, usuarioId, desde, hasta });
    const fecha = new Date().toISOString().split('T')[0];
    return new StreamableFile(buf, {
      type:        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="bitacora-${fecha}.xlsx"`,
    });
  }

  @Get()
  getAll(
    @Query('modulo')     modulo?: string,
    @Query('usuarioId')  usuarioId?: string,
    @Query('desde')      desde?: string,
    @Query('hasta')      hasta?: string,
    @Query('page')       page?: string,
    @Query('limit')      limit?: string,
  ) {
    return this.bitacoraService.getAll({
      modulo, usuarioId, desde, hasta,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
