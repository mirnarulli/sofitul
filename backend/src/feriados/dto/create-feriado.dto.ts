import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFeriadoDto {
  @IsDateString()
  fecha: string;

  @IsIn(['FIJO', 'MOVIL', 'EVENTUAL'])
  tipo: string;

  @IsString()
  @MaxLength(150)
  descripcion: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
