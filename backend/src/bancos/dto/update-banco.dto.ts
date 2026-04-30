import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateBancoDto {
  @IsOptional() @IsString()
  nombre?: string;

  @IsOptional() @IsString()
  codigo?: string;

  @IsOptional() @IsString()
  abreviatura?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsInt()
  orden?: number;
}
