import {
  IsString, IsOptional, IsNumber, IsDateString, IsIn,
  IsArray, ValidateNested, Min, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateChequeDetalleDto } from './create-cheque-detalle.dto';
import { CreateCuotaDto } from './create-cuota.dto';

export class FirmanteDto {
  @IsUUID()
  id: string;

  @IsString()
  nombre: string;

  @IsString()
  documento: string;

  @IsIn(['pf'])
  tipo: 'pf';
}

export class CreateOperacionDto {
  // Tipo y contacto — campos obligatorios
  @IsIn(['DESCUENTO_CHEQUE', 'PRESTAMO_CONSUMO'])
  tipoOperacion: 'DESCUENTO_CHEQUE' | 'PRESTAMO_CONSUMO';

  @IsIn(['pf', 'pj'])
  contactoTipo: 'pf' | 'pj';

  @IsUUID()
  contactoId: string;

  @IsString()
  contactoNombre: string;

  @IsString()
  contactoDoc: string;

  @IsDateString()
  fechaOperacion: string;

  // Datos financieros — el frontend los calcula; el backend puede recalcular desde cheques
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  montoTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tasaMensual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interesTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  netoDesembolsar?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  capitalInvertido?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  comisionMonto?: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  diasPlazo?: number;

  // Canal / sucursal
  @IsOptional()
  @IsString()
  canal?: string;

  @IsOptional()
  @IsString()
  sucursal?: string;

  // Cuenta de acreditación
  @IsOptional()
  @IsString()
  bancoAcreditacion?: string;

  @IsOptional()
  @IsString()
  nroCuentaAcreditacion?: string;

  @IsOptional()
  @IsString()
  titularCuentaAcreditacion?: string;

  @IsOptional()
  @IsString()
  aliasAcreditacion?: string;

  // Producto financiero
  @IsOptional()
  @IsString()
  productoId?: string;

  @IsOptional()
  @IsString()
  productoNombre?: string;

  // Personal asignado
  @IsOptional()
  @IsString()
  vendedorId?: string;

  @IsOptional()
  @IsString()
  vendedorNombre?: string;

  @IsOptional()
  @IsString()
  analistaId?: string;

  @IsOptional()
  @IsString()
  cobradorId?: string;

  // Estado inicial (opcional — por defecto el servicio asigna EN_ANALISIS)
  @IsOptional()
  @IsString()
  estado?: string;

  // Scoring / observaciones
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  scoring?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // Firmantes
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FirmanteDto)
  firmantes?: FirmanteDto[];

  // Cheques (DESCUENTO_CHEQUE)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChequeDetalleDto)
  cheques?: CreateChequeDetalleDto[];

  // Cuotas (PRESTAMO_CONSUMO — si se envían explícitamente)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCuotaDto)
  cuotas?: CreateCuotaDto[];
}
