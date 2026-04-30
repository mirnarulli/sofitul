-- ============================================================
-- MIGRACIÓN ONETBANK → SOFITUL  v2
-- Corte: 24/04/2026 | 26 Operaciones Descuento de Cheques
-- Contactos PF y PJ ya existentes — solo falta Multifrut SA
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CONTACTO FALTANTE: Multifrut SA
-- ============================================================
INSERT INTO contactos_pj (ruc, razon_social, activo, created_at, updated_at)
VALUES ('80085231-1', 'Multifrut SA', true, NOW(), NOW())
ON CONFLICT (ruc) DO NOTHING;

-- ============================================================
-- 2. OPERACIONES — usando subqueries para IDs reales
-- ============================================================

-- ── OP 1 ── Norma Almiron | 476919 | Continental | RENOVADO ──────────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-001', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '3412413'),
    'Norma Beatriz Almiron', '3412413',
    'RENOVADO', 25000000, 20000000, 5000000, 20000000, 4000000, 2.0833,
    '2026-04-07', '2026-04-17', 21, 'TeDescuento', 1000000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='3412413'),'nombre','Norma Beatriz Almiron','documento','3412413','tipo','pf')),
    'Migrado de ONETBANK. Renovado 29/04/2026.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '476919','Continental','Norma Beatriz Almiron','3412413','2026-03-27','2026-04-17',25000000,2.0833,5000000,20000000,1000000,21,'RENOVADO',NOW() FROM op;

-- ── OP 2 ── Min Kyung Kim | 56183001 | GNB | COBRADO ─────────────────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-002', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '1635265'),
    'Min Kyung Kim', '1635265',
    'COBRADO', 10000000, 8000000, 2000000, 8000000, 1600000, 2.0833,
    '2026-04-07', '2026-04-18', 40, 'TeDescuento', 400000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='1635265'),'nombre','Min Kyung Kim','documento','1635265','tipo','pf')),
    'Migrado de ONETBANK. Depositado 28/04/2026.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '56183001','GNB','Min Kyung Kim','1635265','2026-03-09','2026-04-18',10000000,2.0833,2000000,8000000,400000,40,'COBRADO',NOW() FROM op;

-- ── OP 3 ── Norma Almiron | 476920 | Continental | RENOVADO ──────────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-003', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '3412413'),
    'Norma Beatriz Almiron', '3412413',
    'RENOVADO', 15000000, 13000000, 2000000, 13000000, 1600000, 2.5,
    '2026-04-07', '2026-04-18', 11, 'TeDescuento', 400000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='3412413'),'nombre','Norma Beatriz Almiron','documento','3412413','tipo','pf')),
    'Migrado de ONETBANK. Renovado 29/04/2026.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '476920','Continental','Norma Beatriz Almiron','3412413','2026-04-07','2026-04-18',15000000,2.5,2000000,13000000,400000,11,'RENOVADO',NOW() FROM op;

-- ── OP 4 ── Deltanet SRL | 323858 | Continental | EN_COBRANZA ─────────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-004', 'DESCUENTO_CHEQUE', 'pj',
    (SELECT id FROM contactos_pj WHERE ruc = '80083044-0'),
    'Deltanet SRL', '80083044-0',
    'EN_COBRANZA', 31000000, 28830000, 2170000, 28830000, 2170000, 0.5833,
    '2026-03-26', '2026-04-25', 30, 'Particular', 0,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    '[]', 'Migrado de ONETBANK.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '323858','Continental','Deltanet SRL','80083044-0','2026-03-26','2026-04-25',31000000,0.5833,2170000,28830000,0,30,'VIGENTE',NOW() FROM op;

-- ── OP 5 ── Jose Martinez Saldivar | 5034790 | Itau | EN_COBRANZA ─────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-005', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '4577923'),
    'Jose Martinez Saldivar', '4577923',
    'EN_COBRANZA', 16500000, 13300000, 3200000, 13300000, 2560000, 2.0833,
    '2026-03-30', '2026-04-28', 29, 'TeDescuento', 640000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='4577923'),'nombre','Jose Martinez Saldivar','documento','4577923','tipo','pf')),
    'Migrado de ONETBANK.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '5034790','Itau','Josue Martinez Saldivar','4577923','2026-03-30','2026-04-28',16500000,2.0833,3200000,13300000,640000,29,'VIGENTE',NOW() FROM op;

-- ── OP 6 ── Martha Mernes Bonnin | 47599407 | Sudameris | EN_COBRANZA ─
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-006', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '918074'),
    'Martha Beatriz Mernes Bonnin', '918074',
    'EN_COBRANZA', 12500000, 9300000, 3200000, 9300000, 2560000, 2.5,
    '2026-04-07', '2026-04-30', 36, 'TeDescuento', 640000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='918074'),'nombre','Martha Beatriz Mernes Bonnin','documento','918074','tipo','pf')),
    'Migrado de ONETBANK.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '47599407','Sudameris','Martha Beatriz Mernes Bonnin','918074','2026-03-25','2026-04-30',12500000,2.5,3200000,9300000,640000,36,'VIGENTE',NOW() FROM op;

-- ── OP 7 ── Nidia Silva Diaz | 47587927 | Sudameris | EN_COBRANZA ─────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-007', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '6741725'),
    'Nidia Ayelen Silva Diaz', '6741725',
    'EN_COBRANZA', 19000000, 15000000, 4000000, 15000000, 3200000, 2.5,
    '2026-04-07', '2026-04-30', 73, 'TeDescuento', 800000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='6741725'),'nombre','Nidia Ayelen Silva Diaz','documento','6741725','tipo','pf')),
    'Migrado de ONETBANK.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '47587927','Sudameris','Nidia Ayelen Silva Diaz','6741725','2026-02-16','2026-04-30',19000000,2.5,4000000,15000000,800000,73,'VIGENTE',NOW() FROM op;

-- ── OP 8 ── Emiliano Brizuela | 56207436 | GNB | EN_COBRANZA ──────────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-008', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '4953441'),
    'Emiliano Brizuela Martinez', '4953441',
    'EN_COBRANZA', 11000000, 8550000, 2450000, 8550000, 1960000, 2.0833,
    '2026-03-30', '2026-05-06', 37, 'TeDescuento', 490000,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='4953441'),'nombre','Emiliano Brizuela Martinez','documento','4953441','tipo','pf')),
    'Migrado de ONETBANK.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '56207436','GNB','Emiliano Brizuela Martinez','4953441','2026-03-30','2026-05-06',11000000,2.0833,2450000,8550000,490000,37,'VIGENTE',NOW() FROM op;

-- ── OP 9 ── IBL Ingenieria SRL | 542029 | Continental | EN_COBRANZA ───
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-009', 'DESCUENTO_CHEQUE', 'pj',
    (SELECT id FROM contactos_pj WHERE ruc = '80111254-0'),
    'IBL Ingenieria SRL', '80111254-0',
    'EN_COBRANZA', 34300000, 31556000, 2744000, 31556000, 2744000, 0.5833,
    '2026-04-09', '2026-05-09', 30, 'Particular', 0,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    '[]', 'Migrado de ONETBANK.', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '542029','Continental','IBL Ingenieria SRL','80111254-0','2026-04-09','2026-05-09',34300000,0.5833,2744000,31556000,0,30,'VIGENTE',NOW() FROM op;

-- ── OP 10 ── Marvin Fox / Multifrut SA | 47975404 | Sudameris ─────────
WITH op AS (
  INSERT INTO operaciones (
    id, nro_operacion, tipo_operacion,
    contacto_tipo, contacto_id, contacto_nombre, contacto_doc,
    estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual,
    fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto,
    producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'MIGR-010', 'DESCUENTO_CHEQUE', 'pf',
    (SELECT id FROM contactos_pf WHERE numero_doc = '7407634'),
    'Marvin Fox', '7407634',
    'EN_COBRANZA', 2478667, 2300203, 178464, 2300203, 178464, 0.5833,
    '2026-04-18', '2026-05-15', 30, 'Particular', 0,
    '5f6dc9ca-db90-4aa4-9983-8712ba3affa3', 'Descuento de Cheques',
    jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='7407634'),'nombre','Marvin Fox','documento','7407634','tipo','pf')),
    'Migrado de ONETBANK. Titular del cheque: Multifrut SA (RUC 80085231-1).', '[]', NOW(), NOW()
  ) RETURNING id
)
INSERT INTO cheques_detalle (id, operacion_id, nro_cheque, banco, librador, ruc_librador, fecha_emision, fecha_vencimiento, monto, tasa_mensual, interes, capital_invertido, comision, dias, estado, created_at)
SELECT gen_random_uuid(), id::text, '47975404','Sudameris','Multifrut SA','80085231-1','2026-04-15','2026-05-15',2478667,0.5833,178464,2300203,0,30,'VIGENTE',NOW() FROM op;

-- ── OP 11 ── Deltanet SRL | 13484019 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id, nro_operacion, tipo_operacion, contacto_tipo, contacto_id, contacto_nombre, contacto_doc, estado, monto_total, capital_invertido, interes_total, neto_desembolsar, ganancia_neta, tasa_mensual, fecha_operacion, fecha_vencimiento, dias_plazo, canal, comision_monto, producto_id, producto_nombre, firmantes, observaciones, bitacora, created_at, updated_at)
  VALUES (gen_random_uuid(),'MIGR-011','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',32500000,30005000,2495000,30005000,2495000,0.5833,'2026-04-15','2026-05-15',30,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13484019','Atlas','Deltanet SRL','80083044-0','2026-04-15','2026-05-15',32500000,0.5833,2495000,30005000,0,30,'VIGENTE',NOW() FROM op;

-- ── OP 12 ── Deltanet SRL | 13424670 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-012','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',38550000,32343450,6206550,32343450,6206550,0.5833,'2026-03-18','2026-05-26',69,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13424670','Atlas','Deltanet SRL','80083044-0','2026-03-18','2026-05-26',38550000,0.5833,6206550,32343450,0,69,'VIGENTE',NOW() FROM op;

-- ── OP 13 ── Deltanet SRL | 323859 | Continental ──────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-013','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',31500000,26869500,4630500,26869500,4630500,0.5833,'2026-03-26','2026-05-28',63,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'323859','Continental','Deltanet SRL','80083044-0','2026-03-26','2026-05-28',31500000,0.5833,4630500,26869500,0,63,'VIGENTE',NOW() FROM op;

-- ── OP 14 ── IBL Ingenieria SRL | 542030 | Continental ────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-014','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80111254-0'),'IBL Ingenieria SRL','80111254-0','EN_COBRANZA',34300000,28812000,5488000,28812000,5488000,0.5833,'2026-04-09','2026-06-08',60,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'542030','Continental','IBL Ingenieria SRL','80111254-0','2026-04-09','2026-06-08',34300000,0.5833,5488000,28812000,0,60,'VIGENTE',NOW() FROM op;

-- ── OP 15 ── Deltanet SRL | 13426471 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-015','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',38550000,30994200,7555800,30994200,7555800,0.5833,'2026-03-18','2026-06-10',84,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13426471','Atlas','Deltanet SRL','80083044-0','2026-03-18','2026-06-10',38550000,0.5833,7555800,30994200,0,84,'VIGENTE',NOW() FROM op;

-- ── OP 16 ── Carlos Gomez Zelada | 47931812 | Sudameris ──────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-016','DESCUENTO_CHEQUE','pf',(SELECT id FROM contactos_pf WHERE numero_doc='651544'),'Carlos Gomez Zelada','651544','EN_COBRANZA',119250000,100170000,19080000,100170000,19080000,0.5833,'2026-04-15','2026-06-14',60,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques',jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='651544'),'nombre','Carlos Gomez Zelada','documento','651544','tipo','pf')),'Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'47931812','Sudameris','Carlos Gomez Zelada','651544','2026-04-15','2026-06-14',119250000,0.5833,19080000,100170000,0,60,'VIGENTE',NOW() FROM op;

-- ── OP 17 ── Carlos Gomez Zelada | 47931811 | Sudameris ──────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-017','DESCUENTO_CHEQUE','pf',(SELECT id FROM contactos_pf WHERE numero_doc='651544'),'Carlos Gomez Zelada','651544','EN_COBRANZA',119250000,100170000,19080000,100170000,19080000,0.5833,'2026-04-15','2026-06-14',60,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques',jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='651544'),'nombre','Carlos Gomez Zelada','documento','651544','tipo','pf')),'Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'47931811','Sudameris','Carlos Gomez Zelada','651544','2026-04-15','2026-06-14',119250000,0.5833,19080000,100170000,0,60,'VIGENTE',NOW() FROM op;

-- ── OP 18 ── Marvin Fox / Multifrut SA | 47975405 | Sudameris ─────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-018','DESCUENTO_CHEQUE','pf',(SELECT id FROM contactos_pf WHERE numero_doc='7407634'),'Marvin Fox','7407634','EN_COBRANZA',2478667,2095300,383367,2095300,383367,0.5833,'2026-04-18','2026-06-15',61,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques',jsonb_build_array(jsonb_build_object('id',(SELECT id::text FROM contactos_pf WHERE numero_doc='7407634'),'nombre','Marvin Fox','documento','7407634','tipo','pf')),'Migrado de ONETBANK. Titular del cheque: Multifrut SA (RUC 80085231-1).','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'47975405','Sudameris','Multifrut SA','80085231-1','2026-04-15','2026-06-15',2478667,0.5833,383367,2095300,0,61,'VIGENTE',NOW() FROM op;

-- ── OP 19 ── Deltanet SRL | 13424672 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-019','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',38550000,30094700,8455300,30094700,8455300,0.5833,'2026-03-18','2026-06-20',94,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13424672','Atlas','Deltanet SRL','80083044-0','2026-03-18','2026-06-20',38550000,0.5833,8455300,30094700,0,94,'VIGENTE',NOW() FROM op;

-- ── OP 20 ── Deltanet SRL | 13424673 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-020','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',38550000,29465050,9084950,29465050,9084950,0.5833,'2026-03-18','2026-06-27',101,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13424673','Atlas','Deltanet SRL','80083044-0','2026-03-18','2026-06-27',38550000,0.5833,9084950,29465050,0,101,'VIGENTE',NOW() FROM op;

-- ── OP 21 ── Deltanet SRL | 13424674 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-021','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',38550000,28295700,10254300,28295700,10254300,0.5833,'2026-03-18','2026-07-10',114,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13424674','Atlas','Deltanet SRL','80083044-0','2026-03-18','2026-07-10',38550000,0.5833,10254300,28295700,0,114,'VIGENTE',NOW() FROM op;

-- ── OP 22 ── Deltanet SRL | 13484038 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-022','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',37700000,31982167,5717833,31982167,5717833,0.5833,'2026-04-24','2026-07-24',91,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13484038','Atlas','Deltanet SRL','80083044-0','2026-04-24','2026-07-24',37700000,0.5833,5717833,31982167,0,91,'VIGENTE',NOW() FROM op;

-- ── OP 23 ── Deltanet SRL | 13484036 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-023','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',37700000,34973033,2726967,34973033,2726967,0.5833,'2026-04-24','2026-05-25',31,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13484036','Atlas','Deltanet SRL','80083044-0','2026-04-24','2026-05-25',37700000,0.5833,2726967,34973033,0,31,'VIGENTE',NOW() FROM op;

-- ── OP 24 ── Deltanet SRL | 13484037 | Atlas ─────────────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-024','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80083044-0'),'Deltanet SRL','80083044-0','EN_COBRANZA',37700000,33100600,4599400,33100600,4599400,0.5833,'2026-04-24','2026-06-24',61,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'13484037','Atlas','Deltanet SRL','80083044-0','2026-04-24','2026-06-24',37700000,0.5833,4599400,33100600,0,61,'VIGENTE',NOW() FROM op;

-- ── OP 25 ── IBL Ingenieria SRL | 542047 | Continental ────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-025','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80111254-0'),'IBL Ingenieria SRL','80111254-0','EN_COBRANZA',33550000,30866000,2684000,30866000,2684000,0.5833,'2026-04-24','2026-06-08',45,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'542047','Continental','IBL Ingenieria SRL','80111254-0','2026-04-24','2026-06-08',33550000,0.5833,2684000,30866000,0,45,'VIGENTE',NOW() FROM op;

-- ── OP 26 ── IBL Ingenieria SRL | 542046 | Continental ────────────────
WITH op AS (
  INSERT INTO operaciones (id,nro_operacion,tipo_operacion,contacto_tipo,contacto_id,contacto_nombre,contacto_doc,estado,monto_total,capital_invertido,interes_total,neto_desembolsar,ganancia_neta,tasa_mensual,fecha_operacion,fecha_vencimiento,dias_plazo,canal,comision_monto,producto_id,producto_nombre,firmantes,observaciones,bitacora,created_at,updated_at)
  VALUES(gen_random_uuid(),'MIGR-026','DESCUENTO_CHEQUE','pj',(SELECT id FROM contactos_pj WHERE ruc='80111254-0'),'IBL Ingenieria SRL','80111254-0','EN_COBRANZA',33550000,29524000,4026000,29524000,4026000,0.5833,'2026-04-24','2026-05-24',30,'Particular',0,'5f6dc9ca-db90-4aa4-9983-8712ba3affa3','Descuento de Cheques','[]','Migrado de ONETBANK.','[]',NOW(),NOW()) RETURNING id
)
INSERT INTO cheques_detalle (id,operacion_id,nro_cheque,banco,librador,ruc_librador,fecha_emision,fecha_vencimiento,monto,tasa_mensual,interes,capital_invertido,comision,dias,estado,created_at)
SELECT gen_random_uuid(),id::text,'542046','Continental','IBL Ingenieria SRL','80111254-0','2026-04-24','2026-05-24',33550000,0.5833,4026000,29524000,0,30,'VIGENTE',NOW() FROM op;

-- ============================================================
COMMIT;
-- ============================================================

-- VERIFICACIÓN (fuera de la transacción)
SELECT
  'Contactos PJ (migrados)' AS descripcion,
  COUNT(*)::text AS resultado
FROM contactos_pj
WHERE ruc IN ('80083044-0','80111254-0','80085231-1')
UNION ALL
SELECT 'Contactos PF (migrados)', COUNT(*)::text
FROM contactos_pf
WHERE numero_doc IN ('3412413','1635265','4577923','918074','6741725','4953441','7407634','651544')
UNION ALL
SELECT 'Operaciones MIGR-xxx', COUNT(*)::text
FROM operaciones
WHERE nro_operacion LIKE 'MIGR-%'
UNION ALL
SELECT 'Cheques (de ops migradas)', COUNT(*)::text
FROM cheques_detalle cd
WHERE cd.operacion_id IN (
  SELECT id::text FROM operaciones WHERE nro_operacion LIKE 'MIGR-%'
)
UNION ALL
SELECT 'Capital total migrado (Gs.)',
  TO_CHAR(SUM(capital_invertido), 'FM999,999,999,999')
FROM operaciones WHERE nro_operacion LIKE 'MIGR-%';
