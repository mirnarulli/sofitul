-- ══════════════════════════════════════════════════════════════════════════════
-- Migración 009 — Tabla bancos (idempotente)
-- La tabla fue creada originalmente por synchronize:true; esta migración la
-- formaliza para que deploys en servidores nuevos funcionen sin synchronize.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bancos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       VARCHAR     NOT NULL,
  codigo       VARCHAR,
  abreviatura  VARCHAR,
  activo       BOOLEAN     NOT NULL DEFAULT true,
  orden        INTEGER     NOT NULL DEFAULT 0,
  contacto     VARCHAR(150),
  correo       VARCHAR(150),
  telefono     VARCHAR(50),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsquedas por nombre (dropdown simulador)
CREATE INDEX IF NOT EXISTS idx_bancos_nombre ON bancos (nombre);
CREATE INDEX IF NOT EXISTS idx_bancos_activo ON bancos (activo);
