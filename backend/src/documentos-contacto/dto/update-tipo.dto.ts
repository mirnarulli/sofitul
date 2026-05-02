import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTipoDocumentoAdjuntoDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['documentos', 'due_diligence'])
  categoria?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requerido?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activo?: boolean;
}
