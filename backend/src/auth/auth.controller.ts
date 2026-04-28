import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }, @Req() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    return this.authService.login(body.email, body.password, ip);
  }

  @Post('invitar')
  @UseGuards(JwtAuthGuard)
  invitar(@Body() body: any, @Req() req: any) {
    return this.authService.invitarUsuario({ ...body, invitadoPor: req.user.id });
  }

  @Post('activar')
  activar(@Body() body: { token: string; password: string }) {
    return this.authService.activarCuenta(body.token, body.password);
  }

  @Get('validar-token')
  validarToken(@Req() req: any) {
    const token = req.query.token;
    return this.authService.validarToken(token);
  }

  @Post('olvide-password')
  olvideMiPassword(@Body() body: { email: string }) {
    return this.authService.olvideMiPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return this.authService.getMiPerfil(req.user.id);
  }

  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  cambiarPassword(@Body() body: { passwordActual: string; passwordNuevo: string }, @Req() req: any) {
    return this.authService.cambiarPassword(req.user.id, body.passwordActual, body.passwordNuevo);
  }

  @Get('health')
  health() {
    return { status: 'ok', sistema: 'SOFITUL', timestamp: new Date().toISOString() };
  }
}
