import { IsInt, IsNumber, Min } from 'class-validator';

export class CalcularInteresDto {
  @IsNumber()
  @Min(0)
  monto: number;

  @IsNumber()
  @Min(0)
  tasaMensual: number;

  @IsInt()
  @Min(0)
  dias: number;
}
