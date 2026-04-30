import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFeriadoDto {
  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional() @IsIn(['FIJO', 'MOVIL', 'EVENTUAL'])
  tipo?: string;

  @IsOptional() @IsString() @MaxLength(150)
  descripcion?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
