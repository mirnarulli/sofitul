import { IsDateString } from 'class-validator';

export class RegistrarPagareDto {
  @IsDateString()
  fecha: string;
}
