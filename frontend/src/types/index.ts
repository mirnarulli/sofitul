export interface Usuario {
  id: string;
  email: string;
  primerNombre: string;
  primerApellido: string;
  rolId?: string;
  rolCodigo?: string;
  rolNombre?: string;
  permisos?: Record<string, any>;
  activo: boolean;
}

export interface Operacion {
  id: string;
  nroOperacion: string;
  tipoOperacion: 'DESCUENTO_CHEQUE' | 'PRESTAMO_CONSUMO';
  contactoTipo: 'pf' | 'pj';
  contactoId: string;
  contactoNombre: string;
  contactoDoc: string;
  estado: string;
  montoTotal: number;
  tasaMensual: number;
  interesTotal: number;
  netoDesembolsar: number;
  capitalInvertido: number;
  gananciaNeta: number;
  fechaOperacion: string;
  fechaVencimiento?: string;
  diasPlazo?: number;
  cheques?: ChequeDetalle[];
  cuotas?: Cuota[];
  bitacora?: any[];
  createdAt: string;
}

export interface ChequeDetalle {
  id: string;
  operacionId: string;
  nroCheque: string;
  banco: string;
  librador: string;
  rucLibrador?: string;
  fechaVencimiento: string;
  monto: number;
  tasaMensual: number;
  interes: number;
  capitalInvertido: number;
  comision?: number;
  dias?: number;
  estado: string;
}

export interface Cuota {
  id: string;
  operacionId: string;
  nroCuota: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  total: number;
  pagado: number;
  saldo: number;
  estado: string;
  fechaPago?: string;
  diasMora: number;
  cargoMora: number;
}

export interface ContactoPF {
  id: string;
  numeroDoc: string;
  primerNombre: string;
  primerApellido: string;
  email?: string;
  telefono?: string;
  domicilio?: string;
  ciudad?: string;
  totalIngresos?: number;
  capacidadPago?: number;
  esPep?: boolean;
  esFatca?: boolean;
}

export interface ContactoPJ {
  id: string;
  ruc: string;
  razonSocial: string;
  email?: string;
  telefono?: string;
}

export type Modulo = 'admin' | 'panel_global' | 'operaciones' | 'cobranzas' | 'tesoreria' | 'dashboards' | 'contactos' | 'operaciones_read';
