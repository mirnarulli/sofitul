import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bitacora')
@UseGuards(JwtAuthGuard)
export class BitacoraController {
  constructor(private bitacoraService: BitacoraService) {}

  @Get()
  getAll(@Query() q: any) {
    return this.bitacoraService.getAll({
      modulo:    q.modulo,
      usuarioId: q.usuarioId,
      desde:     q.desde,
      hasta:     q.hasta,
      page:      q.page ? parseInt(q.page) : 1,
      limit:     q.limit ? parseInt(q.limit) : 50,
    });
  }
}
