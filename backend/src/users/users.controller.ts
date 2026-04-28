import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUsuario(id, body);
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  @Get('roles')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Post('roles')
  createRol(@Body() body: any) {
    return this.usersService.createRol(body);
  }

  @Put('roles/:id')
  updateRol(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateRol(id, body);
  }

  @Delete('roles/:id')
  deleteRol(@Param('id') id: string) {
    return this.usersService.deleteRol(id);
  }
}
