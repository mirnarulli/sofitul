-- ═══════════════════════════════════════════════════════════════════════════
-- 010_parametros_financieros.sql
-- Parámetros financieros configurables desde el Panel de Control
-- ON CONFLICT DO NOTHING = no sobrescribe valores ya personalizados
-- ═══════════════════════════════════════════════════════════════════════════

-- Crear tabla configuracion si no existe (puede ya existir desde 001)
CREATE TABLE IF NOT EXISTS configuracion (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clave       VARCHAR     NOT NULL UNIQUE,
  valor       TEXT,
  descripcion VARCHAR(300),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parámetros financieros por defecto
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('dias_gracia',            '0',    'Días de gracia antes de aplicar interés de mora'),
  ('tasa_mora_mensual',      '5',    'Tasa de mora mensual (% mensual)'),
  ('tasa_descuento_default', '7',    'Tasa de descuento de cheques por defecto (% mensual)'),
  ('comision_desembolso',    '0',    'Comisión de desembolso por defecto (Gs.)')
ON CONFLICT (clave) DO NOTHING;
