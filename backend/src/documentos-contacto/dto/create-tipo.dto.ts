import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTipoDocumentoAdjuntoDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsIn(['documentos', 'due_diligence'])
  categoria: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requerido?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activo?: boolean;
}
