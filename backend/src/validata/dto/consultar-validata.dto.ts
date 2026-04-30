import { IsString, IsOptional, Length, Matches, MaxLength } from 'class-validator';

export class ConsultarValidataDto {
  @IsString()
  @Length(1, 20)
  @Matches(/^[0-9]+$/, { message: 'cedula debe contener solo números' })
  cedula: string;

  /** Módulo desde donde se realiza la consulta (para bitácora) */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  origen?: string;
}
