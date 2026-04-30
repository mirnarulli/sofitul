import {
  IsString, IsOptional, IsNumber, IsDateString,
  IsBoolean, IsArray, ValidateNested, Min, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FirmanteDto } from './create-operacion.dto';

/**
 * Campos actualizables de una operación.
 * NO se aceptan: nroOperacion, estado, bitacora, tipoOperacion,
 * contactoId, contactoTipo (inmutables o con endpoints dedicados).
 */
export class UpdateOperacionDto {
  // Datos del contacto (solo nombre/doc en caso de corrección)
  @IsOptional() @IsString()   contactoNombre?: string;
  @IsOptional() @IsString()   contactoDoc?: string;

  // Financiero
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  montoTotal?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  tasaMensual?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  interesTotal?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  netoDesembolsar?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  capitalInvertido?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  gananciaNeta?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  comisionMonto?: number;

  // Fechas
  @IsOptional() @IsDateString()  fechaOperacion?: string;
  @IsOptional() @IsDateString()  fechaVencimiento?: string;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)  diasPlazo?: number;

  // Canal / sucursal
  @IsOptional() @IsString()  canal?: string;
  @IsOptional() @IsString()  sucursal?: string;

  // Cuenta de acreditación
  @IsOptional() @IsString()  bancoAcreditacion?: string;
  @IsOptional() @IsString()  nroCuentaAcreditacion?: string;
  @IsOptional() @IsString()  titularCuentaAcreditacion?: string;
  @IsOptional() @IsString()  aliasAcreditacion?: string;

  // Tesorería (campos que puede actualizar el módulo tesorería también)
  @IsOptional() @IsString()   cajaId?: string;
  @IsOptional() @IsDateString() fechaDesembolso?: string;
  @IsOptional() @IsBoolean()  pagareRecibido?: boolean;
  @IsOptional() @IsDateString() fechaPagare?: string;

  // Producto
  @IsOptional() @IsString()  productoId?: string;
  @IsOptional() @IsString()  productoNombre?: string;

  // Personal
  @IsOptional() @IsString()  vendedorId?: string;
  @IsOptional() @IsString()  vendedorNombre?: string;
  @IsOptional() @IsString()  analistaId?: string;
  @IsOptional() @IsString()  cobradorId?: string;

  // Scoring / observaciones
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)  scoring?: number;
  @IsOptional() @IsString()  observaciones?: string;

  // Firmantes
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FirmanteDto)
  firmantes?: FirmanteDto[];
}
