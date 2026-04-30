import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBancoDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional() @IsString()
  codigo?: string;

  @IsOptional() @IsString()
  abreviatura?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsInt()
  orden?: number;
}
