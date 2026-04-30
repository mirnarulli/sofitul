import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN')
export class DashboardsController {
  constructor(private svc: DashboardsService) {}

  @Get('recupero')      getDashboardRecupero()      { return this.svc.getDashboardRecupero(); }
  @Get('desembolsos')   getDashboardDesembolsos()   { return this.svc.getDashboardDesembolsos(); }
  @Get('operaciones')   getDashboardOperaciones()   { return this.svc.getDashboardOperaciones(); }
}
