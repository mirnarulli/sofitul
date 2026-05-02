import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CerrarConciliacionDto {
  @IsNumber()
  montoDeclarado: number;

  @IsNumber()
  montoRecibido: number;

  @IsOptional() @IsString()
  observaciones?: string;
}
