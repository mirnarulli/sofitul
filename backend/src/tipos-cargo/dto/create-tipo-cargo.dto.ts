import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTipoCargoDto {
  @IsString()
  @MinLength(1)
  codigo: string;

  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsString()
  categoria: string;

  @IsString()
  aplicaEn: string;

  @IsString()
  baseCalculo: string;

  @IsOptional() @IsNumber()
  montoFijo?: number;

  @IsOptional() @IsNumber()
  porcentaje?: number;

  @IsOptional() @IsBoolean()
  esObligatorio?: boolean;

  @IsOptional() @IsString()
  permisoExonerar?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsInt()
  orden?: number;
}
