import { IsOptional, IsString, MinLength } from 'class-validator';

export class SetConfiguracionDto {
  @IsString()
  @MinLength(1)
  clave: string;

  @IsString()
  valor: string;

  @IsOptional() @IsString()
  descripcion?: string;
}
