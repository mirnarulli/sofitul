import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCuentaTransferenciaDto {
  @IsOptional() @IsIn(['pf', 'pj'])
  contactoTipo?: string;

  @IsOptional() @IsString()
  contactoId?: string;

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
