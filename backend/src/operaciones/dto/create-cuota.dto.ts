import { IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCuotaDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  nroCuota: number;

  @IsDateString()
  fechaVencimiento: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  capital: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interes: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pagado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  saldo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cargoMora?: number;

  @IsOptional()
  observaciones?: string;
}
