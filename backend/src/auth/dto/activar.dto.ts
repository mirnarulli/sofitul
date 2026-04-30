import { IsString, MinLength } from 'class-validator';

export class ActivarDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
