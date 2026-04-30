import { IsDateString, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarProrrogaDto {
  @IsDateString()
  nuevaFecha: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  nuevaTasa?: number;

  @IsOptional()
  @IsString()
  nota?: string;
}
