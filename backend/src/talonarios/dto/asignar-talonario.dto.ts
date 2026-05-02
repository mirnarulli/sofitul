import { IsOptional, IsString, MinLength } from 'class-validator';

export class AsignarTalonarioDto {
  @IsString()
  @MinLength(1)
  empleadoId: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
