import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChequeDetalleDto {
  @IsString()
  nroCheque: string;

  @IsString()
  banco: string;

  @IsString()
  librador: string;

  @IsOptional()
  @IsString()
  rucLibrador?: string;

  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @IsDateString()
  fechaVencimiento: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  monto: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tasaMensual: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interes?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  capitalInvertido: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  comision?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  dias?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
