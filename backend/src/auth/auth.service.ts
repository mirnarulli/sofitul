import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { BitacoraService } from '../bitacora/bitacora.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private bitacora: BitacoraService,
  ) {}

  // ── Token helpers ─────────────────────────────────────────────────────────
  private generateTokens(payload: { sub: string; email: string; rolId: string | null; rolCodigo: string | null }) {
    const access_token  = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any },
    );
    return { access_token, refresh_token };
  }

  async login(email: string, password: string, ip?: string) {
    const usuario = await this.usersService.findByEmail(email);

    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');
    if (!usuario.activo) throw new UnauthorizedException('Usuario inactivo');
    if (usuario.bloqueado) throw new UnauthorizedException('Usuario bloqueado');
    if (!usuario.activadoAt) throw new UnauthorizedException('Cuenta no activada. Revisá tu email.');

    const isValid = await this.usersService.validarPassword(usuario, password);

    if (!isValid) {
      await this.bitacora.log({ accion: 'LOGIN_FALLIDO', modulo: 'AUTH', usuarioNombre: email, detalle: { email }, ip });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usersService.actualizarUltimoLogin(usuario.id);

    const rol = await this.usersService.getRolById(usuario.rolId);
    const rolCodigo = rol?.codigo ?? null;

    await this.bitacora.log({
      usuarioId: usuario.id,
      usuarioNombre: `${usuario.primerNombre} ${usuario.primerApellido}`,
      accion: 'LOGIN',
      modulo: 'AUTH',
      detalle: { rolCodigo },
      ip,
    });

    const payload = { sub: usuario.id, email: usuario.email, rolId: usuario.rolId, rolCodigo };
    const tokens  = this.generateTokens(payload);

    return {
      ...tokens,
      usuario: {
        id:             usuario.id,
        email:          usuario.email,
        primerNombre:   usuario.primerNombre,
        primerApellido: usuario.primerApellido,
        avatarUrl:      usuario.avatarUrl,
        rolId:          usuario.rolId,
        rolCodigo,
        permisos:       rol?.permisos ?? {},
      },
    };
  }

  async invitarUsuario(data: {
    email: string;
    primerNombre: string;
    primerApellido: string;
    rolId: string;
    invitadoPor: string;
    enviarEmail?: boolean;
  }) {
    const existente = await this.usersService.findByEmail(data.email);
    if (existente) throw new BadRequestException('El email ya está registrado');

    const usuario = await this.usersService.createUsuario(data);

    if (data.enviarEmail !== false) {
      await this.mailService.enviarInvitacion(usuario);
    }

    return {
      mensaje: data.enviarEmail !== false ? 'Invitación enviada' : 'Usuario creado sin email',
      email: usuario.email,
    };
  }

  async activarCuenta(token: string, password: string) {
    const usuario = await this.usersService.activarCuenta(token, password);
    const rol = await this.usersService.getRolById(usuario.rolId);
    const rolCodigo = rol?.codigo ?? null;
    const payload = { sub: usuario.id, email: usuario.email, rolId: usuario.rolId, rolCodigo };
    const tokens  = this.generateTokens(payload);
    return {
      ...tokens,
      usuario: { id: usuario.id, email: usuario.email, primerNombre: usuario.primerNombre, primerApellido: usuario.primerApellido, rolCodigo },
    };
  }

  async validarToken(token: string) {
    const usuario = await this.usersService.findByToken(token);
    if (!usuario) throw new BadRequestException('Token inválido');
    if (usuario.tokenInvitacionExpira < new Date()) throw new BadRequestException('Token expirado');
    return { valid: true, email: usuario.email, primerNombre: usuario.primerNombre };
  }

  async olvideMiPassword(email: string): Promise<{ mensaje: string }> {
    const usuario = await this.usersService.solicitarResetPassword(email);
    await this.mailService.enviarResetPassword(usuario);
    return { mensaje: 'Si el email existe recibirás un enlace para recuperar tu contraseña' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ mensaje: string }> {
    return this.usersService.resetPassword(token, newPassword);
  }

  async getMiPerfil(userId: string) {
    const usuario = await this.usersService.findById(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const rol = usuario.rolId ? await this.usersService.getRolById(usuario.rolId) : null;
    return {
      id:              usuario.id,
      email:           usuario.email,
      primerNombre:    usuario.primerNombre,
      segundoNombre:   usuario.segundoNombre,
      primerApellido:  usuario.primerApellido,
      segundoApellido: usuario.segundoApellido,
      telefono:        usuario.telefono,
      avatarUrl:       usuario.avatarUrl,
      fechaNacimiento: usuario.fechaNacimiento,
      ultimoLogin:     usuario.ultimoLogin,
      rolId:           usuario.rolId,
      rolCodigo:       rol?.codigo ?? null,
      rolNombre:       rol?.nombre ?? null,
      permisos:        rol?.permisos ?? {},
    };
  }

  async cambiarPassword(userId: string, passwordActual: string, passwordNuevo: string): Promise<{ mensaje: string }> {
    const usuario = await this.usersService.findById(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const esValido = await this.usersService.validarPassword(usuario, passwordActual);
    if (!esValido) throw new UnauthorizedException('Contraseña actual incorrecta');
    const hashed = await bcrypt.hash(passwordNuevo, 10);
    await this.usersService.actualizarPasswordHash(userId, hashed);
    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  // ── Refresh Token ─────────────────────────────────────────────────────────
  async refresh(refreshToken: string) {
    let decoded: Record<string, unknown>;
    try {
      decoded = this.jwtService.verify(refreshToken) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (decoded['type'] !== 'refresh') {
      throw new UnauthorizedException('Token no es de tipo refresh');
    }

    const userId = decoded['sub'] as string;
    const usuario = await this.usersService.findById(userId);
    if (!usuario || !usuario.activo || usuario.bloqueado) {
      throw new UnauthorizedException('Usuario inactivo o bloqueado');
    }

    const rol      = await this.usersService.getRolById(usuario.rolId);
    const rolCodigo = rol?.codigo ?? null;
    const payload  = { sub: usuario.id, email: usuario.email, rolId: usuario.rolId, rolCodigo };

    this.logger.log(`Token renovado para ${usuario.email}`);
    return this.generateTokens(payload);
  }
}
