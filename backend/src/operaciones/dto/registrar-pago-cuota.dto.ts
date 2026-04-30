import { IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarPagoCuotaDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  montoPagado: number;

  @IsDateString()
  fechaPago: string;
}
