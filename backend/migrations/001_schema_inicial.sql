-- ═══════════════════════════════════════════════════════════════════════
-- SOFITUL — Esquema inicial (idempotente)
-- Aplicar con: psql -U sofitul_admin -d sofitul_onetrade -f 001_schema_inicial.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PANEL GLOBAL ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo      VARCHAR(50) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  permisos    JSONB DEFAULT '{}',
  es_sistema  BOOLEAN DEFAULT false,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                    VARCHAR(255) UNIQUE NOT NULL,
  password_hash            VARCHAR(255) NOT NULL,
  primer_nombre            VARCHAR(100) NOT NULL,
  segundo_nombre           VARCHAR(100),
  primer_apellido          VARCHAR(100) NOT NULL,
  segundo_apellido         VARCHAR(100),
  telefono                 VARCHAR(50),
  avatar_url               TEXT,
  rol_id                   UUID REFERENCES roles(id),
  activo                   BOOLEAN DEFAULT true,
  email_verificado         BOOLEAN DEFAULT false,
  debe_cambiar_password    BOOLEAN DEFAULT true,
  bloqueado                BOOLEAN DEFAULT false,
  intentos_fallidos        INT DEFAULT 0,
  ultimo_login             TIMESTAMPTZ,
  token_invitacion         VARCHAR(255),
  token_invitacion_expira  TIMESTAMPTZ,
  invitado_por             UUID,
  activado_at              TIMESTAMPTZ,
  fecha_nacimiento         DATE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monedas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo     VARCHAR(10) UNIQUE NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  simbolo    VARCHAR(10),
  activa     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cajas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  banco        VARCHAR(100),
  numero_cuenta VARCHAR(100),
  tipo_cuenta  VARCHAR(50),
  moneda_id    UUID REFERENCES monedas(id),
  saldo        DECIMAL(20,2) DEFAULT 0,
  activa       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paises (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     VARCHAR(100) NOT NULL,
  codigo_iso VARCHAR(5),
  bandera    VARCHAR(10),
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_documento (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  abreviatura VARCHAR(20),
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave       VARCHAR(100) UNIQUE NOT NULL,
  valor       TEXT,
  descripcion TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frases (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  texto      TEXT NOT NULL,
  autor      VARCHAR(200),
  activa     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bitacora (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id     UUID,
  usuario_nombre VARCHAR(200),
  accion         VARCHAR(100) NOT NULL,
  modulo         VARCHAR(100) NOT NULL,
  entidad        VARCHAR(100),
  entidad_id     UUID,
  detalle        JSONB,
  ip             VARCHAR(50),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACTOS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contactos_pf (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_doc                 VARCHAR(50) UNIQUE NOT NULL,
  tipo_doc_id                UUID REFERENCES tipos_documento(id),
  primer_nombre              VARCHAR(100) NOT NULL,
  segundo_nombre             VARCHAR(100),
  primer_apellido            VARCHAR(100) NOT NULL,
  segundo_apellido           VARCHAR(100),
  fecha_nacimiento           DATE,
  nacionalidad               VARCHAR(100),
  pais_id                    UUID REFERENCES paises(id),
  estado_civil               VARCHAR(50),
  conyuge_nombre             VARCHAR(200),
  conyuge_doc                VARCHAR(50),
  telefono                   VARCHAR(50),
  email                      VARCHAR(255),
  domicilio                  TEXT,
  ciudad                     VARCHAR(100),
  situacion_laboral          VARCHAR(100),
  empleador                  VARCHAR(200),
  cargo                      VARCHAR(100),
  actividad_economica        VARCHAR(200),
  antiguedad_cargo           VARCHAR(50),
  nivel_instruccion          VARCHAR(100),
  profesion                  VARCHAR(100),
  ingresos                   JSONB,
  egresos                    JSONB,
  total_ingresos             DECIMAL(20,0) DEFAULT 0,
  total_egresos              DECIMAL(20,0) DEFAULT 0,
  capacidad_pago             DECIMAL(20,0) DEFAULT 0,
  activos                    JSONB,
  pasivos                    JSONB,
  patrimonio_neto            DECIMAL(20,0) DEFAULT 0,
  referencias                JSONB,
  es_pep                     BOOLEAN DEFAULT false,
  es_fatca                   BOOLEAN DEFAULT false,
  declaracion_firmada        BOOLEAN DEFAULT false,
  banco_acreditacion         VARCHAR(100),
  nro_cuenta_acreditacion    VARCHAR(100),
  titular_cuenta_acreditacion VARCHAR(200),
  alias_acreditacion         VARCHAR(100),
  activo                     BOOLEAN DEFAULT true,
  observaciones              TEXT,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contactos_pj (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruc                        VARCHAR(50) UNIQUE NOT NULL,
  razon_social               VARCHAR(200) NOT NULL,
  nombre_fantasia            VARCHAR(200),
  actividad_principal        VARCHAR(200),
  fecha_constitucion         DATE,
  pais                       VARCHAR(100),
  telefono                   VARCHAR(50),
  email                      VARCHAR(255),
  domicilio                  TEXT,
  ciudad                     VARCHAR(100),
  web                        VARCHAR(200),
  rep_legal_nombre           VARCHAR(200),
  rep_legal_doc              VARCHAR(50),
  rep_legal_cargo            VARCHAR(100),
  beneficiarios_finales      JSONB,
  es_pep                     BOOLEAN DEFAULT false,
  es_fatca                   BOOLEAN DEFAULT false,
  banco_acreditacion         VARCHAR(100),
  nro_cuenta_acreditacion    VARCHAR(100),
  titular_cuenta_acreditacion VARCHAR(200),
  alias_acreditacion         VARCHAR(100),
  activo                     BOOLEAN DEFAULT true,
  observaciones              TEXT,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ── OPERACIONES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS estados_operacion (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo      VARCHAR(50) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color       VARCHAR(30),
  orden       INT DEFAULT 0,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operaciones (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nro_operacion               VARCHAR(50) UNIQUE NOT NULL,
  tipo_operacion              VARCHAR(50) NOT NULL CHECK (tipo_operacion IN ('DESCUENTO_CHEQUE','PRESTAMO_CONSUMO')),
  contacto_tipo               VARCHAR(5) NOT NULL CHECK (contacto_tipo IN ('pf','pj')),
  contacto_id                 UUID NOT NULL,
  contacto_nombre             VARCHAR(300) NOT NULL,
  contacto_doc                VARCHAR(50) NOT NULL,
  estado                      VARCHAR(50) DEFAULT 'FORMULARIO_CARGADO',
  monto_total                 DECIMAL(20,0) DEFAULT 0,
  tasa_mensual                DECIMAL(8,4),
  interes_total               DECIMAL(20,0) DEFAULT 0,
  neto_desembolsar            DECIMAL(20,0) DEFAULT 0,
  capital_invertido           DECIMAL(20,0) DEFAULT 0,
  ganancia_neta               DECIMAL(20,0) DEFAULT 0,
  fecha_operacion             DATE NOT NULL,
  fecha_vencimiento           DATE,
  dias_plazo                  INT,
  canal                       VARCHAR(100),
  sucursal                    VARCHAR(100),
  banco_acreditacion          VARCHAR(100),
  nro_cuenta_acreditacion     VARCHAR(100),
  titular_cuenta_acreditacion VARCHAR(200),
  alias_acreditacion          VARCHAR(100),
  caja_id                     UUID REFERENCES cajas(id),
  fecha_desembolso            DATE,
  comprobante_url             TEXT,
  pagare_recibido             BOOLEAN DEFAULT false,
  fecha_pagare                DATE,
  analista_id                 UUID REFERENCES usuarios(id),
  cobrador_id                 UUID REFERENCES usuarios(id),
  prorrogas                   INT DEFAULT 0,
  renovaciones                INT DEFAULT 0,
  scoring                     DECIMAL(5,2),
  observaciones               TEXT,
  bitacora                    JSONB DEFAULT '[]',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cheques_detalle (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operacion_id     UUID NOT NULL REFERENCES operaciones(id) ON DELETE CASCADE,
  nro_cheque       VARCHAR(50) NOT NULL,
  banco            VARCHAR(100) NOT NULL,
  librador         VARCHAR(200) NOT NULL,
  ruc_librador     VARCHAR(50),
  fecha_emision    DATE,
  fecha_vencimiento DATE NOT NULL,
  monto            DECIMAL(20,0) NOT NULL,
  tasa_mensual     DECIMAL(8,4) NOT NULL,
  interes          DECIMAL(20,0) NOT NULL,
  capital_invertido DECIMAL(20,0) NOT NULL,
  comision         DECIMAL(20,0),
  dias             INT,
  estado           VARCHAR(50) DEFAULT 'VIGENTE',
  observaciones    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuotas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operacion_id     UUID NOT NULL REFERENCES operaciones(id) ON DELETE CASCADE,
  nro_cuota        INT NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  capital          DECIMAL(20,0) NOT NULL,
  interes          DECIMAL(20,0) NOT NULL,
  total            DECIMAL(20,0) NOT NULL,
  pagado           DECIMAL(20,0) DEFAULT 0,
  saldo            DECIMAL(20,0) NOT NULL,
  estado           VARCHAR(50) DEFAULT 'PENDIENTE',
  fecha_pago       DATE,
  dias_mora        INT DEFAULT 0,
  cargo_mora       DECIMAL(20,0) DEFAULT 0,
  observaciones    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_operaciones_estado          ON operaciones(estado);
CREATE INDEX IF NOT EXISTS idx_operaciones_contacto        ON operaciones(contacto_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_tipo            ON operaciones(tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_operaciones_fecha           ON operaciones(fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_cheques_operacion           ON cheques_detalle(operacion_id);
CREATE INDEX IF NOT EXISTS idx_cheques_vencimiento         ON cheques_detalle(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cuotas_operacion            ON cuotas(operacion_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_vencimiento          ON cuotas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_bitacora_created            ON bitacora(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contactos_pf_doc            ON contactos_pf(numero_doc);
CREATE INDEX IF NOT EXISTS idx_contactos_pj_ruc            ON contactos_pj(ruc);

-- ── DATOS INICIALES ────────────────────────────────────────────────────────────

-- Roles de sistema
INSERT INTO roles (codigo, nombre, descripcion, permisos, es_sistema) VALUES
  ('SUPER_ADMIN', 'Super Administrador', 'Acceso total al sistema', '{"admin":true,"panel_global":true,"operaciones":true,"cobranzas":true,"tesoreria":true,"dashboards":true,"contactos":true}', true),
  ('ADMIN',       'Administrador',       'Administrador del sistema', '{"admin":true,"panel_global":true,"operaciones":true,"cobranzas":true,"tesoreria":true,"dashboards":true,"contactos":true}', true),
  ('ANALISTA',    'Analista de Crédito', 'Analiza operaciones', '{"operaciones":true,"contactos":true,"dashboards":true}', true),
  ('COBRADOR',    'Cobrador',            'Gestión de cobranzas', '{"cobranzas":true,"operaciones_read":true}', true),
  ('TESORERIA',   'Tesorería',           'Gestión de desembolsos', '{"tesoreria":true,"operaciones_read":true}', true)
ON CONFLICT (codigo) DO NOTHING;

-- Monedas
INSERT INTO monedas (codigo, nombre, simbolo) VALUES
  ('PYG', 'Guaraní Paraguayo', 'Gs.'),
  ('USD', 'Dólar Estadounidense', '$'),
  ('BRL', 'Real Brasileño', 'R$')
ON CONFLICT (codigo) DO NOTHING;

-- Tipos de documento
INSERT INTO tipos_documento (nombre, abreviatura) VALUES
  ('Cédula de Identidad', 'CI'),
  ('RUC', 'RUC'),
  ('Pasaporte', 'PAS'),
  ('Cédula Extranjera', 'CE')
ON CONFLICT DO NOTHING;

-- Pais: Paraguay por defecto
INSERT INTO paises (nombre, codigo_iso) VALUES
  ('Paraguay', 'PY'),
  ('Argentina', 'AR'),
  ('Brasil', 'BR'),
  ('Uruguay', 'UY')
ON CONFLICT DO NOTHING;

-- Estados de operación
INSERT INTO estados_operacion (codigo, nombre, color, orden) VALUES
  ('FORMULARIO_CARGADO',         'Formulario cargado',          '#6B7280', 1),
  ('DATOS_PENDIENTES',           'Datos pendientes',             '#F59E0B', 2),
  ('REFERENCIAS_PENDIENTES',     'Referencias pendientes',       '#F59E0B', 3),
  ('EN_ANALISIS',                'En análisis de crédito',       '#3B82F6', 4),
  ('OBSERVADO',                  'Observado',                    '#EF4444', 5),
  ('APROBADO',                   'Aprobado',                     '#10B981', 6),
  ('RECHAZADO',                  'Rechazado',                    '#EF4444', 7),
  ('EN_LEGAJO',                  'En legajo',                    '#8B5CF6', 8),
  ('DOCUMENTOS_GENERADOS',       'Documentos generados',         '#8B5CF6', 9),
  ('PENDIENTE_PAGARE',           'Pendiente de pagaré firmado',  '#F59E0B', 10),
  ('EN_TESORERIA',               'En tesorería',                 '#6366F1', 11),
  ('DESEMBOLSO_PENDIENTE',       'Desembolso pendiente',         '#F59E0B', 12),
  ('DESEMBOLSADO',               'Desembolsado',                 '#10B981', 13),
  ('EN_COBRANZA',                'En cobranza',                  '#3B82F6', 14),
  ('COBRADO',                    'Cobrado',                      '#10B981', 15),
  ('MORA',                       'Mora',                         '#EF4444', 16),
  ('PRORROGADO',                 'Prorrogado',                   '#F59E0B', 17),
  ('RENOVADO',                   'Renovado',                     '#3B82F6', 18),
  ('CERRADO',                    'Cerrado',                      '#6B7280', 19)
ON CONFLICT (codigo) DO NOTHING;

-- Frases motivacionales iniciales
INSERT INTO frases (texto, autor) VALUES
  ('El éxito no es la clave de la felicidad. La felicidad es la clave del éxito.', 'Albert Schweitzer'),
  ('El único modo de hacer un gran trabajo es amar lo que haces.', 'Steve Jobs'),
  ('Los riesgos son necesarios en cualquier negocio de crédito. La gestión es la diferencia.', null),
  ('Un análisis correcto hoy evita una mora mañana.', null)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'SOFITUL: esquema inicial aplicado correctamente.';
