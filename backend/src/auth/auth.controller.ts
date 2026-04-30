import { Controller, Post, Get, Body, Req, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { LoginDto } from './dto/login.dto';
import { ActivarDto } from './dto/activar.dto';
import { OlvidePasswordDto } from './dto/olvide-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { InvitarDto } from './dto/invitar.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto, @Req() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    return this.authService.login(body.email, body.password, ip);
  }

  @Post('invitar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  invitar(@Body() body: InvitarDto, @Req() req: any) {
    return this.authService.invitarUsuario({ ...body, invitadoPor: req.user.id });
  }

  @Post('activar')
  activar(@Body() body: ActivarDto) {
    return this.authService.activarCuenta(body.token, body.password);
  }

  @Get('validar-token')
  validarToken(@Query('token') token: string) {
    return this.authService.validarToken(token);
  }

  @Post('olvide-password')
  olvideMiPassword(@Body() body: OlvidePasswordDto) {
    return this.authService.olvideMiPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return this.authService.getMiPerfil(req.user.id);
  }

  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  cambiarPassword(@Body() body: CambiarPasswordDto, @Req() req: any) {
    return this.authService.cambiarPassword(req.user.id, body.passwordActual, body.passwordNuevo);
  }

  @Get('health')
  health() {
    return { status: 'ok', sistema: 'SOFITUL', timestamp: new Date().toISOString() };
  }
}
