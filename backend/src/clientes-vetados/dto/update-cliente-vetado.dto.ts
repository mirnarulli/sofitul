import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateClienteVetadoDto {
  @IsOptional() @IsString()
  tipoDoc?: string;

  @IsOptional() @IsString()
  numeroDoc?: string;

  @IsOptional() @IsString()
  nombre?: string;

  @IsOptional() @IsString()
  motivo?: string;

  @IsOptional() @IsDateString()
  fechaVeto?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsString()
  observaciones?: string;
}
