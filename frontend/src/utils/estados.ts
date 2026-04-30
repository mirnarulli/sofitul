/**
 * Estados que indican que una operación sigue en curso (no finalizada).
 * Usados para separar "Vigentes" de "Historial" en la ficha de contacto.
 * Incluye tanto los estados actuales del sistema como legacy por compatibilidad.
 */
export const ESTADOS_VIGENTES: string[] = [
  // Estados activos del flujo actual
  'FORMULARIO_CARGADO',
  'DATOS_PENDIENTES',
  'REFERENCIAS_PENDIENTES',
  'EN_ANALISIS',
  'OBSERVADO',
  'APROBADO',
  'EN_LEGAJO',
  'DOCUMENTOS_GENERADOS',
  'PENDIENTE_PAGARE',
  'EN_TESORERIA',
  'DESEMBOLSO_PENDIENTE',
  'DESEMBOLSADO',
  'EN_COBRANZA',
  'VIGENTE',
  'MORA',
  'PRORROGADO',
  // Compatibilidad con estados legacy
  'DOCUMENTACION',
  'EN_PROCESO',
  'ACTIVA',
  'APROBADA',
  'DESEMBOLSADA',
];

/**
 * Estados terminales: operación finalizada, va al historial.
 */
export const ESTADOS_TERMINALES: string[] = [
  'COBRADO',
  'CERRADO',
  'RECHAZADO',
  'RENOVADO',
  'VENCIDO',
];
