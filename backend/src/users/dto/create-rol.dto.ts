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
  permisos?: any;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
