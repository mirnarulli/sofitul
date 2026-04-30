import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService }  from './users.service';
import { JwtAuthGuard }  from '../auth/jwt-auth.guard';
import { RolesGuard }    from '../auth/roles.guard';
import { Roles }         from '../auth/roles.decorator';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateRolDto }     from './dto/create-rol.dto';
import { UpdateRolDto }     from './dto/update-rol.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ── Listado ───────────────────────────────────────────────────────────────
  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  findAll() { return this.usersService.findAll(); }

  // ── Actualizar datos generales ────────────────────────────────────────────
  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateUsuarioDto) {
    return this.usersService.updateUsuario(id, body);
  }

  // ── Bloquear / Desbloquear ────────────────────────────────────────────────
  @Put(':id/bloqueo')
  @Roles('SUPERADMIN', 'ADMIN')
  toggleBloqueo(@Param('id') id: string, @Body() body: { bloqueado: boolean }) {
    return this.usersService.updateUsuario(id, { bloqueado: body.bloqueado } as any);
  }

  // ── Cambiar rol ───────────────────────────────────────────────────────────
  @Put(':id/rol')
  @Roles('SUPERADMIN')
  cambiarRol(@Param('id') id: string, @Body() body: { rolId: string }) {
    return this.usersService.updateUsuario(id, { rolId: body.rolId } as any);
  }

  // ── Reenviar invitación ───────────────────────────────────────────────────
  @Post(':id/reenviar-invitacion')
  @Roles('SUPERADMIN', 'ADMIN')
  async reenviarInvitacion(@Param('id') id: string) {
    return this.usersService.reenviarInvitacion(id);
  }

  // ── Admin fuerza reset de contraseña ─────────────────────────────────────
  @Post(':id/reset-password')
  @Roles('SUPERADMIN', 'ADMIN')
  async resetPasswordAdmin(@Param('id') id: string) {
    return this.usersService.resetPasswordAdmin(id);
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  @Get('roles')
  @Roles('SUPERADMIN', 'ADMIN')
  findAllRoles() { return this.usersService.findAllRoles(); }

  @Post('roles')
  @Roles('SUPERADMIN')
  createRol(@Body() body: CreateRolDto) { return this.usersService.createRol(body); }

  @Put('roles/:id')
  @Roles('SUPERADMIN')
  updateRol(@Param('id') id: string, @Body() body: UpdateRolDto) { return this.usersService.updateRol(id, body); }

  @Delete('roles/:id')
  @Roles('SUPERADMIN')
  deleteRol(@Param('id') id: string) { return this.usersService.deleteRol(id); }
}
