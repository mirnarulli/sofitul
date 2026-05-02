import {
  IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AplicacionCuotaDto {
  @IsString()
  cuotaId: string;

  @IsNumber()
  capitalAplicado: number;

  @IsNumber()
  interesAplicado: number;

  @IsNumber()
  moraAplicada: number;

  @IsNumber()
  gastosAplicados: number;

  @IsNumber()
  prorrogaAplicada: number;
}

export class RegistrarPagoDto {
  @IsString()
  operacionId: string;

  @IsDateString()
  fechaTransaccion: string;

  @IsOptional() @IsDateString()
  fechaValor?: string;

  @IsNumber()
  montoTotal: number;

  @IsNumber()
  montoCapital: number;

  @IsNumber()
  montoInteres: number;

  @IsNumber()
  montoMora: number;

  @IsNumber()
  montoGastosAdmin: number;

  @IsNumber()
  montoProrroga: number;

  @IsOptional() @IsString()
  medioPagoId?: string;

  @IsOptional() @IsString()
  nroReferencia?: string;

  @IsOptional() @IsBoolean()
  usarTalonario?: boolean;

  @IsOptional() @IsBoolean()
  usarTimbrado?: boolean;

  @IsOptional() @IsString()
  talonarioId?: string;

  @IsOptional() @IsString()
  cobradorId?: string;

  @IsOptional() @IsString()
  cajaId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AplicacionCuotaDto)
  aplicaciones: AplicacionCuotaDto[];
}
