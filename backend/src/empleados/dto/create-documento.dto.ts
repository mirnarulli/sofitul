import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDocumentoDto {
  @IsString()
  @MinLength(1)
  tipo: string;

  @IsOptional() @IsString()
  nombreDocumento?: string;

  @IsOptional() @IsString()
  urlArchivo?: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
