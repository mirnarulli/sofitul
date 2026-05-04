-- ══════════════════════════════════════════════════════════════════════════════
-- Migración 008 — Tablas medios_pago y tipos_cargo
-- ══════════════════════════════════════════════════════════════════════════════

-- ── medios_pago ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medios_pago (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo               VARCHAR NOT NULL UNIQUE,
  nombre               VARCHAR NOT NULL,
  descripcion          VARCHAR,
  requiere_referencia  BOOLEAN NOT NULL DEFAULT false,
  requiere_banco       BOOLEAN NOT NULL DEFAULT false,
  es_digital           BOOLEAN NOT NULL DEFAULT false,
  activo               BOOLEAN NOT NULL DEFAULT true,
  orden                INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── tipos_cargo ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_cargo (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo               VARCHAR NOT NULL UNIQUE,
  nombre               VARCHAR NOT NULL,
  descripcion          VARCHAR,
  categoria            VARCHAR NOT NULL,
  aplica_en            VARCHAR NOT NULL,
  base_calculo         VARCHAR NOT NULL,
  monto_fijo           NUMERIC(20,0),
  porcentaje           NUMERIC(8,4),
  es_obligatorio       BOOLEAN NOT NULL DEFAULT true,
  permiso_exonerar     VARCHAR,
  activo               BOOLEAN NOT NULL DEFAULT true,
  orden                INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
