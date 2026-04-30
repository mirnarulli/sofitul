import { IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  @MinLength(1)
  passwordActual: string;

  @IsString()
  @MinLength(8)
  passwordNuevo: string;
}
