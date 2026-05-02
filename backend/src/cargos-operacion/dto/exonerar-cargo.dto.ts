import { IsString, MinLength } from 'class-validator';

export class ExonerarCargoDto {
  @IsString()
  @MinLength(1)
  motivo: string;
}
