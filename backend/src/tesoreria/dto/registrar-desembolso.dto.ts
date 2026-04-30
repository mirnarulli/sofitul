import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegistrarDesembolsoDto {
  @IsUUID()
  cajaId: string;

  @IsDateString()
  fechaDesembolso: string;

  @IsOptional() @IsString()
  bancoAcreditacion?: string;

  @IsOptional() @IsString()
  nroCuentaAcreditacion?: string;

  @IsOptional() @IsString()
  titularCuentaAcreditacion?: string;

  @IsOptional() @IsString()
  aliasAcreditacion?: string;

  @IsOptional() @IsString()
  comprobanteUrl?: string;

  @IsOptional() @IsString()
  nota?: string;
}
