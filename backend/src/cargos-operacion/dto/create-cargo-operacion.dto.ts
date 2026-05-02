import { IsDateString, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCargoOperacionDto {
  @IsString()
  operacionId: string;

  @IsOptional() @IsString()
  cuotaId?: string;

  @IsString()
  tipoCargoid: string;

  @IsString()
  @MinLength(1)
  descripcion: string;

  @IsOptional() @IsString()
  categoria?: string;

  @IsNumber()
  montoCalculado: number;

  @IsDateString()
  fechaCargo: string;
}
