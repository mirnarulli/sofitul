import { IsString, IsOptional, IsBoolean, IsNumber, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEstadoOperacionDto {
  @IsString()
  @Matches(/^[A-Z0-9_]+$/, { message: 'codigo debe ser mayúsculas, números y guiones bajos' })
  codigo: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color debe ser un hex válido (#RRGGBB)' })
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  esInicial?: boolean;

  @IsOptional()
  @IsBoolean()
  esTerminal?: boolean;
}
