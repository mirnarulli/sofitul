import {
  IsString, IsOptional, IsEmail, IsBoolean, IsDateString, IsIn,
} from 'class-validator';

export class CreateContactoPJDto {
  // Identificación (requerido)
  @IsString()
  ruc: string;

  @IsString()
  razonSocial: string;

  @IsOptional() @IsString()
  nombreFantasia?: string;

  @IsOptional() @IsString()
  actividadPrincipal?: string;

  @IsOptional() @IsDateString()
  fechaConstitucion?: string;

  @IsOptional() @IsString()
  pais?: string;

  @IsOptional() @IsString()
  paisConstitucion?: string;

  // Contacto
  @IsOptional() @IsString()
  telefono?: string;

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

  @IsOptional() @IsString()
  web?: string;

  @IsOptional() @IsString()
  sitioWeb?: string;

  // Representante legal
  @IsOptional() @IsString()
  repLegalNombre?: string;

  @IsOptional() @IsString()
  repLegalDoc?: string;

  @IsOptional() @IsString()
  repLegalCargo?: string;

  // Beneficiarios finales (JSONB)
  @IsOptional()
  beneficiariosFinales?: unknown;

  // Due diligence
  @IsOptional() @IsBoolean()
  esPep?: boolean;

  @IsOptional() @IsBoolean()
  esFatca?: boolean;

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
