import {
  IsString, IsOptional, IsEmail, IsBoolean,
  IsDateString, IsNumber, IsIn,
} from 'class-validator';

export class CreateContactoPFDto {
  // Documento (requerido)
  @IsString()
  numeroDoc: string;

  @IsOptional() @IsString()
  tipoDocId?: string;

  @IsOptional() @IsString()
  tipoDocumento?: string;

  // Nombres (requeridos)
  @IsString()
  primerNombre: string;

  @IsOptional() @IsString()
  segundoNombre?: string;

  @IsString()
  primerApellido: string;

  @IsOptional() @IsString()
  segundoApellido?: string;

  // Datos personales
  @IsOptional() @IsDateString()
  fechaNacimiento?: string;

  @IsOptional() @IsIn(['M', 'F', 'O'])
  sexo?: string;

  @IsOptional() @IsString()
  nacionalidad?: string;

  @IsOptional() @IsString()
  paisId?: string;

  @IsOptional() @IsString()
  paisNacionalidad?: string;

  @IsOptional() @IsString()
  paisResidencia?: string;

  @IsOptional() @IsString()
  estadoCivil?: string;

  @IsOptional() @IsString()
  conyugeNombre?: string;

  @IsOptional() @IsString()
  conyugeDoc?: string;

  // Contacto
  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsString()
  celular?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  domicilio?: string;

  @IsOptional() @IsString()
  barrio?: string;

  @IsOptional() @IsString()
  ciudad?: string;

  @IsOptional() @IsString()
  departamento?: string;

  // Actividad económica
  @IsOptional() @IsString()
  situacionLaboral?: string;

  @IsOptional() @IsString()
  empleador?: string;

  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsString()
  actividadEconomica?: string;

  @IsOptional() @IsString()
  antiguedadCargo?: string;

  @IsOptional() @IsString()
  nivelInstruccion?: string;

  @IsOptional() @IsString()
  profesion?: string;

  // Ingresos/egresos (calculados en el frontend, JSONB + totales)
  @IsOptional()
  ingresos?: unknown;

  @IsOptional()
  egresos?: unknown;

  @IsOptional() @IsNumber()
  totalIngresos?: number;

  @IsOptional() @IsNumber()
  totalEgresos?: number;

  @IsOptional() @IsNumber()
  capacidadPago?: number;

  // Patrimonio
  @IsOptional()
  activos?: unknown;

  @IsOptional()
  pasivos?: unknown;

  @IsOptional() @IsNumber()
  patrimonioNeto?: number;

  // Referencias
  @IsOptional()
  referencias?: unknown;

  // Due diligence
  @IsOptional() @IsBoolean()
  esPep?: boolean;

  @IsOptional() @IsBoolean()
  esFatca?: boolean;

  @IsOptional() @IsBoolean()
  declaracionFirmada?: boolean;

  // Cuenta bancaria
  @IsOptional() @IsString()
  bancoAcreditacion?: string;

  @IsOptional() @IsString()
  nroCuentaAcreditacion?: string;

  @IsOptional() @IsString()
  titularCuentaAcreditacion?: string;

  @IsOptional() @IsString()
  aliasAcreditacion?: string;

  // Calificación interna
  @IsOptional() @IsIn(['A', 'B', 'C', 'D'])
  calificacionInterna?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsString()
  observaciones?: string;
}
