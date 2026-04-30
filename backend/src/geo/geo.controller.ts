import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GeoService } from './geo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('geo')
@UseGuards(JwtAuthGuard)
export class GeoController {
  constructor(private svc: GeoService) {}

  @Get('departamentos')
  getDepartamentos() { return this.svc.getDepartamentos(); }

  @Get('ciudades')
  getCiudades(@Query('departamentoId') dId?: string) {
    return this.svc.getCiudades(dId ? parseInt(dId) : undefined);
  }
}
