import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, Rol } from '../entities';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolesRepo: Repository<Rol>,
  ) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    if (!email) return null;
    return this.usuariosRepo
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.usuariosRepo.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<Usuario | null> {
    return this.usuariosRepo.findOne({ where: { tokenInvitacion: token } });
  }

  async findAll() {
    const [usuarios, roles] = await Promise.all([
      this.usuariosRepo.find({ order: { createdAt: 'DESC' } }),
      this.rolesRepo.find(),
    ]);
    const rolesMap = new Map(roles.map(r => [r.id, r]));
    return usuarios.map(u => {
      const { passwordHash: _pw, tokenInvitacion: _ti, tokenInvitacionExpira: _tie, ...safe } = u;
      const rol = safe.rolId ? rolesMap.get(safe.rolId) : undefined;
      return { ...safe, rolNombre: rol?.nombre ?? null, rolCodigo: rol?.codigo ?? null };
    });
  }

  async getRolById(rolId: string): Promise<Rol | null> {
    if (!rolId) return null;
    return this.rolesRepo.findOne({ where: { id: rolId } });
  }

  async validarPassword(usuario: Usuario, password: string): Promise<boolean> {
    if (!usuario.passwordHash) return false;
    return bcrypt.compare(password, usuario.passwordHash);
  }

  async actualizarUltimoLogin(id: string): Promise<void> {
    await this.usuariosRepo.update(id, { ultimoLogin: new Date() });
  }

  async createUsuario(data: {
    email: string;
    primerNombre: string;
    primerApellido: string;
    rolId: string;
    invitadoPor?: string;
  }): Promise<Usuario> {
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    const usuario = this.usuariosRepo.create({
      email:               data.email.toLowerCase().trim(),
      primerNombre:        data.primerNombre,
      primerApellido:      data.primerApellido,
      rolId:               data.rolId,
      invitadoPor:         data.invitadoPor,
      tokenInvitacion:     token,
      tokenInvitacionExpira: expira,
      passwordHash,
      activo:              true,
      emailVerificado:     false,
      debeCambiarPassword: true,
    });

    return this.usuariosRepo.save(usuario);
  }

  async activarCuenta(token: string, password: string): Promise<Usuario> {
    const usuario = await this.findByToken(token);
    if (!usuario) throw new BadRequestException('Token inválido');
    if (usuario.tokenInvitacionExpira < new Date()) throw new BadRequestException('Token expirado');

    const passwordHash = await bcrypt.hash(password, 10);
    await this.usuariosRepo.update(usuario.id, {
      passwordHash,
      emailVerificado:     true,
      debeCambiarPassword: false,
      activadoAt:          new Date(),
      tokenInvitacion:     null,
      tokenInvitacionExpira: null,
    });

    return this.usuariosRepo.findOne({ where: { id: usuario.id } });
  }

  async solicitarResetPassword(email: string): Promise<Usuario> {
    const usuario = await this.findByEmail(email);
    if (!usuario) throw new NotFoundException('Email no encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await this.usuariosRepo.update(usuario.id, {
      tokenInvitacion: token,
      tokenInvitacionExpira: expira,
    });

    return this.usuariosRepo.findOne({ where: { id: usuario.id } });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ mensaje: string }> {
    const usuario = await this.findByToken(token);
    if (!usuario) throw new BadRequestException('Token inválido');
    if (usuario.tokenInvitacionExpira < new Date()) throw new BadRequestException('Token expirado');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usuariosRepo.update(usuario.id, {
      passwordHash,
      debeCambiarPassword: false,
      tokenInvitacion: null,
      tokenInvitacionExpira: null,
    });

    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  async actualizarPasswordHash(id: string, hash: string): Promise<void> {
    await this.usuariosRepo.update(id, { passwordHash: hash });
  }

  async updateUsuario(id: string, data: Partial<Usuario>): Promise<void> {
    await this.usuariosRepo.update(id, data);
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  async findAllRoles() {
    return this.rolesRepo.find({ order: { nombre: 'ASC' } });
  }

  async createRol(data: { codigo: string; nombre: string; descripcion?: string; permisos?: Record<string, unknown> }) {
    const rol = this.rolesRepo.create(data);
    return this.rolesRepo.save(rol);
  }

  async updateRol(id: string, data: Partial<Rol>) {
    await this.rolesRepo.update(id, data);
    return this.rolesRepo.findOne({ where: { id } });
  }

  async deleteRol(id: string) {
    const rol = await this.rolesRepo.findOne({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    if (rol.esSistema) throw new BadRequestException('No se puede eliminar un rol de sistema');
    await this.rolesRepo.delete(id);
    return { mensaje: 'Rol eliminado' };
  }

  // ── Gestión de acceso ──────────────────────────────────────────────────────

  /** Reenvía el link de invitación generando un nuevo token de 7 días */
  async reenviarInvitacion(id: string): Promise<{ mensaje: string; token: string }> {
    const usuario = await this.usuariosRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const token  = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.usuariosRepo.update(id, {
      tokenInvitacion:       token,
      tokenInvitacionExpira: expira,
      emailVerificado:       false,
    });

    return { mensaje: 'Invitación reenviada', token };
  }

  /** Admin fuerza reset de contraseña: genera token y marca debeCambiarPassword */
  async resetPasswordAdmin(id: string): Promise<{ mensaje: string; token: string }> {
    const usuario = await this.usuariosRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const token  = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await this.usuariosRepo.update(id, {
      tokenInvitacion:       token,
      tokenInvitacionExpira: expira,
      debeCambiarPassword:   true,
    });

    return { mensaje: 'Reset de contraseña generado', token };
  }
}
