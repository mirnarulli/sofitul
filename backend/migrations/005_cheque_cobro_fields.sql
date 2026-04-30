-- ────────────────────────────────────────────────────────────────────────────
-- Campos de cobro en cheques_detalle
-- Permiten registrar cuándo y cómo se acreditó cada cheque
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE cheques_detalle
  ADD COLUMN IF NOT EXISTS fecha_cobro      DATE,
  ADD COLUMN IF NOT EXISTS nro_referencia   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cobrado_por      VARCHAR(150),
  ADD COLUMN IF NOT EXISTS nota_cobro       TEXT;
