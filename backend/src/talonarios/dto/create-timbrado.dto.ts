import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTimbradoDto {
  @IsOptional() @IsString()
  tipoComprobante?: string;

  @IsString()
  nroTimbrado: string;

  @IsOptional() @IsString()
  establecimiento?: string;

  @IsOptional() @IsString()
  puntoExpedicion?: string;

  @IsNumber()
  @Min(1)
  nroDesde: number;

  @IsNumber()
  @Min(1)
  nroHasta: number;

  @IsDateString()
  fechaVigenciaDesde: string;

  @IsDateString()
  fechaVigenciaHasta: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
