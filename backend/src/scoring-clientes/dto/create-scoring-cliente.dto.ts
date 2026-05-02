import { IsDateString, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateScoringClienteDto {
  @IsString()
  @MinLength(1)
  ci: string;

  @IsOptional() @IsString()
  nombreCliente?: string;

  @IsOptional() @IsInt() @Min(1) @Max(10)
  calificacion?: number;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsString()
  urlDocumento?: string;

  @IsOptional() @IsString()
  observacion?: string;

  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional() @IsString()
  verificadorId?: string;

  @IsOptional() @IsString()
  verificadorNombre?: string;
}
