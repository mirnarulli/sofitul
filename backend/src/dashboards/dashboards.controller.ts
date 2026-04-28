import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private svc: DashboardsService) {}

  @Get('recupero')     getDashboardRecupero()     { return this.svc.getDashboardRecupero(); }
  @Get('desembolsos')  getDashboardDesembolsos()  { return this.svc.getDashboardDesembolsos(); }
}
