import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO para actualizar usuario por admin.
 * NO permite: passwordHash, tokenInvitacion, tokenInvitacionExpira, activadoAt,
 * emailVerificado, intentosFallidos, ultimoLogin, createdAt, updatedAt, invitadoPor.
 */
export class UpdateUsuarioDto {
  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  primerNombre?: string;

  @IsOptional() @IsString()
  segundoNombre?: string;

  @IsOptional() @IsString()
  primerApellido?: string;

  @IsOptional() @IsString()
  segundoApellido?: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsString()
  avatarUrl?: string;

  @IsOptional() @IsUUID()
  rolId?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsBoolean()
  bloqueado?: boolean;

  @IsOptional() @IsBoolean()
  debeCambiarPassword?: boolean;

  @IsOptional() @IsDateString()
  fechaNacimiento?: string;
}
