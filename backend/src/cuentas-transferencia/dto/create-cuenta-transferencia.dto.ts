import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCuentaTransferenciaDto {
  @IsIn(['pf', 'pj'])
  contactoTipo: string;

  @IsString()
  @MinLength(1)
  contactoId: string;

  @IsOptional() @IsString()
  banco?: string;

  @IsOptional() @IsString()
  numeroCuenta?: string;

  @IsOptional() @IsString()
  titular?: string;

  @IsOptional() @IsString()
  alias?: string;

  @IsOptional() @IsIn(['CTA_CTE', 'CTA_AHO', 'ALIAS', 'OTRO'])
  tipoCuenta?: string;

  @IsOptional() @IsBoolean()
  esPrincipal?: boolean;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsString()
  observaciones?: string;
}
