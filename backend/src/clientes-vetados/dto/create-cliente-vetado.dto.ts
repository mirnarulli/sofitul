import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClienteVetadoDto {
  @IsString()
  @MinLength(1)
  tipoDoc: string;

  @IsString()
  @MinLength(1)
  numeroDoc: string;

  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional() @IsString()
  motivo?: string;

  @IsOptional() @IsDateString()
  fechaVeto?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsOptional() @IsString()
  agregadoPor?: string;
}
