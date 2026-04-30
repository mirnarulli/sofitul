import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

/** Update — todos los campos opcionales. esSistema NO se puede modificar. */
export class UpdateRolDto {
  @IsOptional() @IsString()
  codigo?: string;

  @IsOptional() @IsString()
  nombre?: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsObject()
  permisos?: any;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
