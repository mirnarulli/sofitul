import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'primer_nombre' })
  primerNombre: string;

  @Column({ name: 'segundo_nombre', nullable: true })
  segundoNombre: string;

  @Column({ name: 'primer_apellido' })
  primerApellido: string;

  @Column({ name: 'segundo_apellido', nullable: true })
  segundoApellido: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'rol_id', nullable: true })
  rolId: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'email_verificado', default: false })
  emailVerificado: boolean;

  @Column({ name: 'debe_cambiar_password', default: true })
  debeCambiarPassword: boolean;

  @Column({ default: false })
  bloqueado: boolean;

  @Column({ name: 'intentos_fallidos', default: 0 })
  intentosFallidos: number;

  @Column({ name: 'ultimo_login', type: 'timestamptz', nullable: true })
  ultimoLogin: Date;

  @Column({ name: 'token_invitacion', nullable: true })
  tokenInvitacion: string;

  @Column({ name: 'token_invitacion_expira', type: 'timestamptz', nullable: true })
  tokenInvitacionExpira: Date;

  @Column({ name: 'invitado_por', nullable: true })
  invitadoPor: string;

  @Column({ name: 'activado_at', type: 'timestamptz', nullable: true })
  activadoAt: Date;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
