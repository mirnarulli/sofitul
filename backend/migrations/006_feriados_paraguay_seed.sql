-- ────────────────────────────────────────────────────────────────────────────
-- Feriados nacionales de Paraguay — seed completo + correcciones
--
-- FIJO  : misma fecha cada año (año 2000 como referencia, app compara mes/día)
-- MOVIL : fecha específica por año (Semana Santa, etc.)
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. Corregir tipo 'FLEXIBLE' → 'MOVIL' (valor incorrecto en datos anteriores)
UPDATE feriados SET tipo = 'MOVIL' WHERE tipo = 'FLEXIBLE';

-- ── 2. Corregir Boquerón: era FLEXIBLE/MOVIL pero es FIJO (siempre 29-sep) ──
UPDATE feriados
SET tipo = 'FIJO', fecha = '2000-09-29'
WHERE descripcion ILIKE '%Boquer%';

-- ── 3. Normalizar fechas de FIJO: algunos tienen año 2026 en vez de 2000 ─────
UPDATE feriados
SET fecha = ('2000' || SUBSTRING(fecha::text FROM 5))::date
WHERE tipo = 'FIJO'
  AND EXTRACT(YEAR FROM fecha) <> 2000;

-- ── 4. Insertar feriados FIJOS que falten ────────────────────────────────────
INSERT INTO feriados (fecha, tipo, descripcion, activo)
SELECT v.fecha::date, v.tipo, v.descripcion, true
FROM (VALUES
  ('2000-01-01', 'FIJO', 'Año Nuevo'),
  ('2000-02-03', 'FIJO', 'San Blas — Patrón del Paraguay'),
  ('2000-03-01', 'FIJO', 'Día de los Héroes'),
  ('2000-05-01', 'FIJO', 'Día del Trabajador'),
  ('2000-05-14', 'FIJO', 'Víspera de la Independencia'),
  ('2000-05-15', 'FIJO', 'Día de la Independencia Nacional'),
  ('2000-06-12', 'FIJO', 'Paz del Chaco'),
  ('2000-08-15', 'FIJO', 'Fundación de Asunción'),
  ('2000-09-29', 'FIJO', 'Batalla de Boquerón'),
  ('2000-12-08', 'FIJO', 'Virgen de Caacupé'),
  ('2000-12-25', 'FIJO', 'Navidad')
) AS v(fecha, tipo, descripcion)
WHERE NOT EXISTS (
  SELECT 1 FROM feriados f
  WHERE f.tipo = 'FIJO'
    AND EXTRACT(MONTH FROM f.fecha) = EXTRACT(MONTH FROM v.fecha::date)
    AND EXTRACT(DAY   FROM f.fecha) = EXTRACT(DAY   FROM v.fecha::date)
    AND f.descripcion = v.descripcion
);

-- ── 5. Insertar Semana Santa 2026–2032 (idempotente) ─────────────────────────
INSERT INTO feriados (fecha, tipo, descripcion, activo)
SELECT v.fecha::date, 'MOVIL', v.descripcion, true
FROM (VALUES
  ('2026-04-02', 'Jueves Santo 2026'),
  ('2026-04-03', 'Viernes Santo 2026'),
  ('2027-03-25', 'Jueves Santo 2027'),
  ('2027-03-26', 'Viernes Santo 2027'),
  ('2028-04-13', 'Jueves Santo 2028'),
  ('2028-04-14', 'Viernes Santo 2028'),
  ('2029-03-29', 'Jueves Santo 2029'),
  ('2029-03-30', 'Viernes Santo 2029'),
  ('2030-04-18', 'Jueves Santo 2030'),
  ('2030-04-19', 'Viernes Santo 2030'),
  ('2031-04-10', 'Jueves Santo 2031'),
  ('2031-04-11', 'Viernes Santo 2031'),
  ('2032-03-25', 'Jueves Santo 2032'),
  ('2032-03-26', 'Viernes Santo 2032')
) AS v(fecha, descripcion)
WHERE NOT EXISTS (
  SELECT 1 FROM feriados f WHERE f.descripcion = v.descripcion
);

-- ── 6. Resultado ─────────────────────────────────────────────────────────────
SELECT tipo, COUNT(*) AS cantidad FROM feriados WHERE activo GROUP BY tipo ORDER BY tipo;
