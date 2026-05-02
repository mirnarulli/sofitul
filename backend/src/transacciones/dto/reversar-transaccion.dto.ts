import { IsString, MinLength } from 'class-validator';

export class ReversarTransaccionDto {
  @IsString()
  @MinLength(1)
  motivo: string;
}
