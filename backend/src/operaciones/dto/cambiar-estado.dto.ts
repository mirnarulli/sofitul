import { IsOptional, IsString, MinLength } from 'class-validator';

export class CambiarEstadoDto {
  @IsString()
  @MinLength(1)
  estado: string;

  @IsOptional() @IsString()
  nota?: string;
}
