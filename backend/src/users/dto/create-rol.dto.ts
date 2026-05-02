import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @MinLength(1)
  codigo: string;

  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsObject()
  permisos?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
