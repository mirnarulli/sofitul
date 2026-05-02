import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bitacora')
@UseGuards(JwtAuthGuard)
export class BitacoraController {
  constructor(private bitacoraService: BitacoraService) {}

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
