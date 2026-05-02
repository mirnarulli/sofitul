import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMedioPagoDto {
  @IsString()
  @MinLength(1)
  codigo: string;

  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsBoolean()
  requiereReferencia?: boolean;

  @IsOptional() @IsBoolean()
  requiereBanco?: boolean;

  @IsOptional() @IsBoolean()
  esDigital?: boolean;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsInt()
  orden?: number;
}
