-- ═══════════════════════════════════════════════════════════════════════════
-- 011_ciclo_aprobacion.sql
-- Ciclo completo de aprobación de operaciones SOFITUL
-- Estados nuevos: PREVENTA, EN_REFERENCIAS, EXCEPCION_COMERCIAL, RECHAZADO_CLIENTE
-- Transiciones del pipeline: PREVENTA → EN_REFERENCIAS → EN_ANALISIS → ... → DESEMBOLSADO
-- ON CONFLICT DO NOTHING = no sobrescribe si ya existen
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Nuevos estados ─────────────────────────────────────────────────────
INSERT INTO estados_operacion (codigo, nombre, color, orden, descripcion) VALUES
  ('PREVENTA',            'Pre-venta (simulación)',          '#F59E0B',  0,  'Operación guardada desde el simulador, pendiente de confirmación'),
  ('EN_REFERENCIAS',      'En carga de referencias',         '#3B82F6',  2,  'Cargando InfoCheck, datos de verificación y firmantes'),
  ('EXCEPCION_COMERCIAL', 'Excepción comercial',             '#F97316',  5,  'Requiere firmas adicionales para aprobación'),
  ('RECHAZADO_CLIENTE',   'Rechazado por el cliente',        '#6B7280',  99, 'El cliente desistió de la operación')
ON CONFLICT (codigo) DO NOTHING;

-- Asegurar que estados clave existen (pueden faltar VIGENTE/VENCIDO de migration anterior)
INSERT INTO estados_operacion (codigo, nombre, color, orden) VALUES
  ('VIGENTE',  'Vigente',  '#10B981', 20),
  ('VENCIDO',  'Vencido',  '#EF4444', 21)
ON CONFLICT (codigo) DO NOTHING;

-- ── 2. Transiciones del pipeline de aprobación ────────────────────────────
-- Crear tabla de transiciones si no existe (por si acaso)
CREATE TABLE IF NOT EXISTS estado_transiciones (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  desde      VARCHAR     NOT NULL,
  hasta      VARCHAR     NOT NULL,
  nombre     VARCHAR(200),
  requiere_nota BOOLEAN  NOT NULL DEFAULT false,
  activo     BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE(desde, hasta)
);

INSERT INTO estado_transiciones (desde, hasta, nombre, requiere_nota) VALUES
  -- PREVENTA
  ('PREVENTA',            'EN_REFERENCIAS',      'Confirmar → iniciar referencias',        false),
  ('PREVENTA',            'RECHAZADO_CLIENTE',   'Cancelar (cliente desistió)',             true),

  -- EN_REFERENCIAS
  ('EN_REFERENCIAS',      'EN_ANALISIS',         'Referencias completas → enviar análisis', false),
  ('EN_REFERENCIAS',      'DATOS_PENDIENTES',    'Datos incompletos',                       true),
  ('EN_REFERENCIAS',      'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- DATOS_PENDIENTES
  ('DATOS_PENDIENTES',    'EN_REFERENCIAS',      'Retomar carga de datos',                  false),
  ('DATOS_PENDIENTES',    'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- EN_ANALISIS
  ('EN_ANALISIS',         'APROBADO',            'Aprobar operación',                       false),
  ('EN_ANALISIS',         'RECHAZADO',           'Rechazar operación',                      true),
  ('EN_ANALISIS',         'EXCEPCION_COMERCIAL', 'Derivar a excepción comercial',           true),
  ('EN_ANALISIS',         'OBSERVADO',           'Observar (solicitar más info)',            true),
  ('EN_ANALISIS',         'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- EXCEPCION_COMERCIAL (requiere firmas adicionales)
  ('EXCEPCION_COMERCIAL', 'APROBADO',            'Aprobar con excepción',                   true),
  ('EXCEPCION_COMERCIAL', 'RECHAZADO',           'Rechazar tras revisión',                  true),
  ('EXCEPCION_COMERCIAL', 'EN_ANALISIS',         'Devolver a análisis',                     true),

  -- OBSERVADO
  ('OBSERVADO',           'EN_ANALISIS',         'Retomar análisis',                        false),
  ('OBSERVADO',           'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- APROBADO → Tesorería
  ('APROBADO',            'EN_TESORERIA',        'Enviar a Tesorería',                      false),
  ('APROBADO',            'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- EN_TESORERIA (puede editar cheques, confirmar, o cliente desiste)
  ('EN_TESORERIA',        'DESEMBOLSO_PENDIENTE','Reconfirmar → generar documentación',     false),
  ('EN_TESORERIA',        'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- DESEMBOLSO_PENDIENTE (documentación generada, esperando firma pagaré)
  ('DESEMBOLSO_PENDIENTE','PENDIENTE_PAGARE',    'Documentación generada → pendiente pagaré', false),
  ('DESEMBOLSO_PENDIENTE','RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- PENDIENTE_PAGARE → Desembolso
  ('PENDIENTE_PAGARE',    'DESEMBOLSADO',        'Pagaré firmado → desembolsar',            false),
  ('PENDIENTE_PAGARE',    'RECHAZADO_CLIENTE',   'Cliente desistió',                        true),

  -- DESEMBOLSADO → Cobranza
  ('DESEMBOLSADO',        'EN_COBRANZA',         'Iniciar cobranza',                        false),

  -- EN_COBRANZA
  ('EN_COBRANZA',         'COBRADO',             'Cobrado íntegramente',                    false),
  ('EN_COBRANZA',         'MORA',                'Pasar a mora',                            false),
  ('EN_COBRANZA',         'PRORROGADO',          'Prorrogar',                               true),
  ('EN_COBRANZA',         'RENOVADO',            'Renovar operación',                       true),

  -- MORA
  ('MORA',                'EN_COBRANZA',         'Regularizó pago',                         false),
  ('MORA',                'COBRADO',             'Cobrado con mora',                        false),
  ('MORA',                'CERRADO',             'Cerrar en mora',                          true),

  -- PRORROGADO / RENOVADO
  ('PRORROGADO',          'EN_COBRANZA',         'Retomar cobranza',                        false),
  ('RENOVADO',            'EN_COBRANZA',         'Retomar cobranza',                        false),

  -- COBRADO → cierre
  ('COBRADO',             'CERRADO',             'Cerrar operación',                        false)

ON CONFLICT (desde, hasta) DO NOTHING;
