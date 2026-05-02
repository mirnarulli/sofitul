import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CargosOperacionService } from './cargos-operacion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCargoOperacionDto } from './dto/create-cargo-operacion.dto';
import { ExonerarCargoDto } from './dto/exonerar-cargo.dto';

@Controller('cargos-operacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CargosOperacionController {
  constructor(private svc: CargosOperacionService) {}

  @Get('operacion/:operacionId')
  findByOperacion(@Param('operacionId') operacionId: string) {
    return this.svc.findByOperacion(operacionId);
  }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() b: CreateCargoOperacionDto) { return this.svc.create(b); }

  @Put(':id/exonerar')
  @Roles('SUPERADMIN', 'ADMIN')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exonerar(@Param('id') id: string, @Body() b: ExonerarCargoDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.svc.exonerar(id, b.motivo, userId);
  }
}
