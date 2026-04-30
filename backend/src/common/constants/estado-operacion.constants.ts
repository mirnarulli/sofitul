/**
 * Constantes de estado para operaciones.
 * Usar estas en lugar de strings hardcodeados en servicios.
 * Los estados dinámicos se gestionan desde la tabla estados_operacion (Panel Global).
 */
export const ESTADO_OP = {
  // Ingreso
  EN_ANALISIS:            'EN_ANALISIS',
  FORMULARIO_CARGADO:     'FORMULARIO_CARGADO',
  DATOS_PENDIENTES:       'DATOS_PENDIENTES',
  REFERENCIAS_PENDIENTES: 'REFERENCIAS_PENDIENTES',
  OBSERVADO:              'OBSERVADO',
  // Aprobación
  APROBADO:               'APROBADO',
  RECHAZADO:              'RECHAZADO',
  EN_LEGAJO:              'EN_LEGAJO',
  DOCUMENTOS_GENERADOS:   'DOCUMENTOS_GENERADOS',
  PENDIENTE_PAGARE:       'PENDIENTE_PAGARE',
  // Desembolso
  EN_TESORERIA:           'EN_TESORERIA',
  DESEMBOLSO_PENDIENTE:   'DESEMBOLSO_PENDIENTE',
  DESEMBOLSADO:           'DESEMBOLSADO',
  // Cobranza
  EN_COBRANZA:            'EN_COBRANZA',
  MORA:                   'MORA',
  PRORROGADO:             'PRORROGADO',
  RENOVADO:               'RENOVADO',
  COBRADO:                'COBRADO',
  // Terminal
  CERRADO:                'CERRADO',
  VIGENTE:                'VIGENTE',
  VENCIDO:                'VENCIDO',
} as const;

export type EstadoOperacionValue = typeof ESTADO_OP[keyof typeof ESTADO_OP];

/** Estados que indican que la operación sigue en curso */
export const ESTADOS_VIGENTES_SET = new Set<string>([
  ESTADO_OP.FORMULARIO_CARGADO,
  ESTADO_OP.DATOS_PENDIENTES,
  ESTADO_OP.REFERENCIAS_PENDIENTES,
  ESTADO_OP.EN_ANALISIS,
  ESTADO_OP.OBSERVADO,
  ESTADO_OP.APROBADO,
  ESTADO_OP.EN_LEGAJO,
  ESTADO_OP.DOCUMENTOS_GENERADOS,
  ESTADO_OP.PENDIENTE_PAGARE,
  ESTADO_OP.EN_TESORERIA,
  ESTADO_OP.DESEMBOLSO_PENDIENTE,
  ESTADO_OP.DESEMBOLSADO,
  ESTADO_OP.EN_COBRANZA,
  ESTADO_OP.VIGENTE,
  ESTADO_OP.MORA,
  ESTADO_OP.PRORROGADO,
]);

/** Cuotas */
export const ESTADO_CUOTA = {
  PENDIENTE: 'PENDIENTE',
  PAGADO:    'PAGADO',
} as const;
