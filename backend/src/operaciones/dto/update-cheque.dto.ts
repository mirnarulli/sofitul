import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Campos actualizables de un cheque.
 * No se acepta: operacionId (inmutable), interes/monto (calculados por el servicio).
 */
export class UpdateChequeDto {
  @IsOptional() @IsString()   nroCheque?: string;
  @IsOptional() @IsString()   banco?: string;
  @IsOptional() @IsString()   librador?: string;
  @IsOptional() @IsString()   rucLibrador?: string;
  @IsOptional() @IsDateString() fechaEmision?: string;
  @IsOptional() @IsDateString() fechaVencimiento?: string;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)  monto?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  tasaMensual?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  interes?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)  capitalInvertido?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  comision?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)  dias?: number;

  @IsOptional()
  @IsIn(['VIGENTE', 'COBRADO', 'DEVUELTO', 'PROTESTADO', 'ENDOSADO'])
  estado?: string;

  @IsOptional() @IsString()  observaciones?: string;
}
