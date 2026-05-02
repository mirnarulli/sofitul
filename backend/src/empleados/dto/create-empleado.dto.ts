import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @MinLength(1)
  apellido: string;

  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional() @IsString()
  tipoDoc?: string;

  @IsOptional() @IsString()
  nroDoc?: string;

  @IsOptional() @IsDateString()
  fechaNacimiento?: string;

  @IsOptional() @IsString()
  sexo?: string;

  @IsOptional() @IsString()
  emailPersonal?: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsString()
  departamento?: string;

  @IsOptional() @IsDateString()
  fechaIngreso?: string;

  @IsOptional() @IsDateString()
  fechaEgreso?: string;

  @IsOptional() @IsString()
  estado?: string;

  @IsOptional() @IsString()
  usuarioId?: string;

  @IsOptional() @IsBoolean()
  esCobrador?: boolean;

  @IsOptional() @IsBoolean()
  esVendedor?: boolean;

  @IsOptional() @IsBoolean()
  esAnalista?: boolean;

  @IsOptional() @IsString()
  observaciones?: string;
}
