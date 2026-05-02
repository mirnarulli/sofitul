import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegistrarCobroDto {
  @IsString()
  @IsNotEmpty()
  fechaCobro: string;

  @IsOptional()
  @IsString()
  nroReferencia?: string;

  @IsOptional()
  @IsString()
  notaCobro?: string;
}
