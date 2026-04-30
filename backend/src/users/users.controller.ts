import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateUsuarioDto) {
    return this.usersService.updateUsuario(id, body);
  }

  // ── Roles ─────────────────────────────────────────────────────────────────

  @Get('roles')
  @Roles('SUPERADMIN', 'ADMIN')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Post('roles')
  @Roles('SUPERADMIN')
  createRol(@Body() body: CreateRolDto) {
    return this.usersService.createRol(body);
  }

  @Put('roles/:id')
  @Roles('SUPERADMIN')
  updateRol(@Param('id') id: string, @Body() body: UpdateRolDto) {
    return this.usersService.updateRol(id, body);
  }

  @Delete('roles/:id')
  @Roles('SUPERADMIN')
  deleteRol(@Param('id') id: string) {
    return this.usersService.deleteRol(id);
  }
}
