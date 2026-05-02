import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateConciliacionDto {
  @IsOptional() @IsString()
  cobradorId?: string;

  @IsOptional() @IsString()
  cajaId?: string;

  @IsDateString()
  fechaPeriodo: string;

  @IsOptional() @IsString()
  tipo?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
