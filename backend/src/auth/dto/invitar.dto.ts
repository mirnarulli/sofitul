import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class InvitarDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  primerNombre: string;

  @IsString()
  @MinLength(1)
  primerApellido: string;

  @IsUUID()
  rolId: string;

  @IsOptional()
  @IsBoolean()
  enviarEmail?: boolean;
}
