import { IsOptional, IsString } from 'class-validator';

export class ActualizarContratoDto {
  @IsOptional() @IsString()
  nroContratoTeDescuento?: string;
}
