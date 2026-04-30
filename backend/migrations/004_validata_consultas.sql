-- ────────────────────────────────────────────────────────────────────────────
-- Bitácora de consultas VALIDATA
-- Permite reconciliación de consultas realizadas y auditoría de créditos.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS validata_consultas (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula         VARCHAR(30) NOT NULL,
  usuario_email  TEXT,
  origen         VARCHAR(50),
  respuesta_raw  JSONB,
  error_msg      TEXT,
  estado         VARCHAR(20) NOT NULL DEFAULT 'ok',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validata_consultas_cedula     ON validata_consultas (cedula);
CREATE INDEX IF NOT EXISTS idx_validata_consultas_usuario    ON validata_consultas (usuario_email);
CREATE INDEX IF NOT EXISTS idx_validata_consultas_created_at ON validata_consultas (created_at DESC);
