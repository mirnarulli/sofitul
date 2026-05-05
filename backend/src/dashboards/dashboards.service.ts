import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardsService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async getDashboardRecupero() {
    const [resumen, porCobrador, porTipo, mensual] = await Promise.all([
      this.ds.query(`
        SELECT
          COALESCE(SUM(monto_total) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO','COBRADO')), 0) AS total_pendiente,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'COBRADO'), 0)      AS total_recuperado,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'MORA'), 0)         AS total_mora,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'PRORROGADO'), 0)   AS total_prorrogado,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'RENOVADO'), 0)     AS total_renovado,
          COUNT(*) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO'))::int    AS operaciones_activas
        FROM operaciones
      `),
      this.ds.query(`
        SELECT cobrador_id, COUNT(*) AS operaciones, SUM(monto_total) AS total_cartera
        FROM operaciones
        WHERE cobrador_id IS NOT NULL AND estado NOT IN ('CERRADO','RECHAZADO')
        GROUP BY cobrador_id ORDER BY total_cartera DESC
      `),
      this.ds.query(`
        SELECT tipo_operacion, COUNT(*) AS operaciones, SUM(monto_total) AS total
        FROM operaciones
        WHERE estado NOT IN ('CERRADO','RECHAZADO')
        GROUP BY tipo_operacion
      `),
      this.ds.query(`
        SELECT DATE_TRUNC('month', fecha_operacion::date) AS mes,
               COUNT(*) AS operaciones,
               SUM(monto_total) AS total,
               SUM(monto_total) FILTER (WHERE estado = 'COBRADO') AS cobrado
        FROM operaciones
        WHERE fecha_operacion >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY 1 ORDER BY 1 DESC
      `),
    ]);

    return { resumen: resumen[0], porCobrador, porTipo, mensual };
  }

  async getDashboardOperaciones() {
    const ACTIVOS = `('EN_COBRANZA','DESEMBOLSADO','MORA','PRORROGADO','RENOVADO','COBRADO')`;
    const CARTERA = `('EN_COBRANZA','DESEMBOLSADO','MORA','PRORROGADO','RENOVADO')`;
    const TESORERIA_ESTADOS = `('EN_TESORERIA','DESEMBOLSO_PENDIENTE','PENDIENTE_PAGARE')`;
    const ANALISIS_ESTADOS  = `('EN_ANALISIS','EXCEPCION_COMERCIAL','EN_REFERENCIAS','OBSERVADO')`;

    const [
      kpis, porEstado, porCliente, porBanco, porCanal, proyeccionSemanal, vencimientosInmediatos,
      pipeline, cobrar15d, timeline15d, cumpleanios,
    ] = await Promise.all([

      // ── KPIs principales ──────────────────────────────────────────────
      this.ds.query(`
        SELECT
          COUNT(*) FILTER (WHERE estado IN ${CARTERA})::int                       AS ops_activas,
          COALESCE(SUM(capital_invertido) FILTER (WHERE estado IN ${CARTERA}), 0) AS capital_cartera,
          COALESCE(SUM(monto_total)       FILTER (WHERE estado IN ${CARTERA}), 0) AS valor_nominal,
          COALESCE(SUM(ganancia_neta)     FILTER (WHERE estado IN ${CARTERA}), 0) AS ganancia_esperada,
          COALESCE(SUM(ganancia_neta)     FILTER (WHERE estado = 'COBRADO'),   0) AS ganancia_realizada,
          COALESCE(SUM(capital_invertido) FILTER (WHERE estado = 'COBRADO'),   0) AS capital_recuperado,
          COUNT(*) FILTER (WHERE estado = 'MORA')::int                            AS ops_mora,
          COUNT(*) FILTER (WHERE estado = 'COBRADO'
            AND fecha_vencimiento::date >= DATE_TRUNC('month', CURRENT_DATE)
            AND fecha_vencimiento::date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::int AS cobrados_mes
        FROM operaciones
      `),

      // ── Por estado ───────────────────────────────────────────────────
      this.ds.query(`
        SELECT estado,
               COUNT(*)::int        AS cantidad,
               SUM(capital_invertido) AS capital,
               SUM(monto_total)       AS valor
        FROM operaciones
        WHERE estado IN ${ACTIVOS}
        GROUP BY estado
        ORDER BY capital DESC NULLS LAST
      `),

      // ── Top clientes ─────────────────────────────────────────────────
      this.ds.query(`
        SELECT contacto_nombre,
               contacto_tipo,
               contacto_doc,
               COUNT(*)::int           AS ops,
               SUM(capital_invertido)  AS capital,
               SUM(monto_total)        AS valor,
               SUM(ganancia_neta)      AS ganancia
        FROM operaciones
        WHERE estado IN ${CARTERA}
        GROUP BY contacto_nombre, contacto_tipo, contacto_doc
        ORDER BY capital DESC NULLS LAST
        LIMIT 10
      `),

      // ── Por banco (de los cheques) ────────────────────────────────────
      this.ds.query(`
        SELECT cd.banco,
               COUNT(DISTINCT o.id)::int AS ops,
               SUM(cd.monto)             AS valor,
               SUM(cd.capital_invertido) AS capital,
               SUM(cd.interes)           AS interes
        FROM cheques_detalle cd
        JOIN operaciones o ON o.id::text = cd.operacion_id
        WHERE o.estado IN ${CARTERA}
          AND cd.estado NOT IN ('COBRADO','PROTESTADO')
        GROUP BY cd.banco
        ORDER BY capital DESC NULLS LAST
      `),

      // ── Por canal ────────────────────────────────────────────────────
      this.ds.query(`
        SELECT COALESCE(canal, 'Sin canal') AS canal,
               COUNT(*)::int    AS ops,
               SUM(capital_invertido) AS capital,
               SUM(ganancia_neta)     AS ganancia
        FROM operaciones
        WHERE estado IN ${CARTERA}
        GROUP BY canal
        ORDER BY capital DESC
      `),

      // ── Proyección semanal (próximas 16 semanas) ─────────────────────
      this.ds.query(`
        SELECT
          DATE_TRUNC('week', cd.fecha_vencimiento::date) AS semana_inicio,
          TO_CHAR(DATE_TRUNC('week', cd.fecha_vencimiento::date), 'DD Mon') AS desde,
          TO_CHAR(DATE_TRUNC('week', cd.fecha_vencimiento::date) + INTERVAL '6 days', 'DD Mon') AS hasta,
          COUNT(DISTINCT o.id)::int  AS cantidad,
          SUM(cd.monto)::bigint      AS valor_cheques,
          SUM(cd.capital_invertido)::bigint AS capital,
          SUM(cd.interes)::bigint    AS interes
        FROM cheques_detalle cd
        JOIN operaciones o ON o.id::text = cd.operacion_id
        WHERE o.estado IN ${CARTERA}
          AND cd.estado NOT IN ('COBRADO','PROTESTADO')
          AND cd.fecha_vencimiento::date >= DATE_TRUNC('week', CURRENT_DATE)
          AND cd.fecha_vencimiento::date < CURRENT_DATE + INTERVAL '112 days'
        GROUP BY 1, 2, 3
        ORDER BY 1 ASC
      `),

      // ── Vencimientos próximos 10 días ─────────────────────────────────
      this.ds.query(`
        SELECT o.id AS operacion_id, o.nro_operacion, o.contacto_nombre, o.canal,
               o.fecha_operacion,
               cd.nro_cheque, cd.banco, cd.fecha_vencimiento,
               cd.monto::bigint,
               cd.capital_invertido::bigint,
               cd.interes::bigint,
               (cd.fecha_vencimiento::date - CURRENT_DATE)                               AS dias_restantes,
               (cd.fecha_vencimiento::date - o.fecha_operacion::date)                    AS plazo_dias,
               CASE WHEN cd.capital_invertido > 0
                    THEN ROUND((cd.interes / cd.capital_invertido * 100)::numeric, 2)
                    ELSE NULL
               END                                                                        AS tasa_efectiva
        FROM cheques_detalle cd
        JOIN operaciones o ON o.id::text = cd.operacion_id
        WHERE o.estado IN ${CARTERA}
          AND cd.estado NOT IN ('COBRADO','PROTESTADO')
          AND cd.fecha_vencimiento::date <= CURRENT_DATE + INTERVAL '10 days'
        ORDER BY cd.fecha_vencimiento ASC
        LIMIT 20
      `),

      // ── Pipeline por etapa ────────────────────────────────────────────
      this.ds.query(`
        SELECT
          COUNT(*) FILTER (WHERE estado = 'PREVENTA')::int                                                  AS preventa_qty,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'PREVENTA'), 0)::bigint                          AS preventa_monto,
          COUNT(*) FILTER (WHERE estado IN ${ANALISIS_ESTADOS})::int                                        AS analisis_qty,
          COALESCE(SUM(monto_total) FILTER (WHERE estado IN ${ANALISIS_ESTADOS}), 0)::bigint               AS analisis_monto,
          COUNT(*) FILTER (WHERE estado IN ${TESORERIA_ESTADOS})::int                                       AS tesoreria_qty,
          COALESCE(SUM(neto_desembolsar) FILTER (WHERE estado IN ${TESORERIA_ESTADOS}), 0)::bigint          AS tesoreria_desembolsar,
          COUNT(*) FILTER (WHERE estado = 'EN_TESORERIA')::int                                              AS desembolsar_hoy_qty,
          COALESCE(SUM(neto_desembolsar) FILTER (WHERE estado = 'EN_TESORERIA'), 0)::bigint                 AS desembolsar_hoy_monto,
          COUNT(*) FILTER (WHERE estado = 'MORA')::int                                                      AS mora_qty,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'MORA'), 0)::bigint                             AS mora_monto,
          COUNT(*) FILTER (WHERE estado = 'PRORROGADO')::int                                                AS prorrogado_qty,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'PRORROGADO'), 0)::bigint                       AS prorrogado_monto
        FROM operaciones
      `),

      // ── Cobrar: HOY + próximos 15 días + cobrado últimos 15 días ─────
      this.ds.query(`
        SELECT
          COALESCE(SUM(cd.monto) FILTER (WHERE cd.fecha_vencimiento::date = CURRENT_DATE), 0)::bigint                                                                                          AS cobrar_hoy_monto,
          COUNT(*)              FILTER (WHERE cd.fecha_vencimiento::date = CURRENT_DATE)::int                                                                                                   AS cobrar_hoy_qty,
          COALESCE(SUM(cd.monto) FILTER (WHERE cd.fecha_vencimiento::date > CURRENT_DATE
                                            AND cd.fecha_vencimiento::date <= CURRENT_DATE + INTERVAL '15 days'), 0)::bigint                                                                   AS cobrar_15d_monto,
          COUNT(*)               FILTER (WHERE cd.fecha_vencimiento::date > CURRENT_DATE
                                            AND cd.fecha_vencimiento::date <= CURRENT_DATE + INTERVAL '15 days')::int                                                                          AS cobrar_15d_qty,
          COALESCE(SUM(cd.monto) FILTER (WHERE cd.estado = 'COBRADO'
                                            AND cd.fecha_vencimiento::date >= CURRENT_DATE - INTERVAL '15 days'
                                            AND cd.fecha_vencimiento::date < CURRENT_DATE), 0)::bigint                                                                                         AS cobrado_15d_monto,
          COUNT(*)               FILTER (WHERE cd.estado = 'COBRADO'
                                            AND cd.fecha_vencimiento::date >= CURRENT_DATE - INTERVAL '15 days'
                                            AND cd.fecha_vencimiento::date < CURRENT_DATE)::int                                                                                                AS cobrado_15d_qty
        FROM cheques_detalle cd
        JOIN operaciones o ON o.id::text = cd.operacion_id
        WHERE o.estado IN ${CARTERA}
           OR cd.estado = 'COBRADO'
      `),

      // ── Timeline 30 días (±15 desde hoy) ─────────────────────────────
      this.ds.query(`
        WITH dias AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '14 days',
            CURRENT_DATE + INTERVAL '15 days',
            INTERVAL '1 day'
          )::date AS dia
        ),
        cargas AS (
          SELECT fecha_operacion::date AS dia,
                 COUNT(*)::int         AS qty,
                 COALESCE(SUM(monto_total), 0)::bigint AS monto
          FROM operaciones
          WHERE fecha_operacion::date >= CURRENT_DATE - INTERVAL '14 days'
          GROUP BY 1
        ),
        vencer AS (
          SELECT cd.fecha_vencimiento::date AS dia,
                 COUNT(*)::int              AS qty,
                 COALESCE(SUM(cd.monto), 0)::bigint AS monto
          FROM cheques_detalle cd
          JOIN operaciones o ON o.id::text = cd.operacion_id
          WHERE o.estado IN ${CARTERA}
            AND cd.estado NOT IN ('COBRADO','PROTESTADO')
            AND cd.fecha_vencimiento::date >= CURRENT_DATE - INTERVAL '14 days'
            AND cd.fecha_vencimiento::date <= CURRENT_DATE + INTERVAL '15 days'
          GROUP BY 1
        ),
        cobrados AS (
          SELECT cd.fecha_vencimiento::date AS dia,
                 COUNT(*)::int              AS qty,
                 COALESCE(SUM(cd.monto), 0)::bigint AS monto
          FROM cheques_detalle cd
          JOIN operaciones o ON o.id::text = cd.operacion_id
          WHERE cd.estado = 'COBRADO'
            AND cd.fecha_vencimiento::date >= CURRENT_DATE - INTERVAL '14 days'
            AND cd.fecha_vencimiento::date <= CURRENT_DATE
          GROUP BY 1
        )
        SELECT
          d.dia,
          TO_CHAR(d.dia, 'DD/MM') AS label,
          COALESCE(ca.qty,  0) AS cargas_qty,
          COALESCE(ca.monto,0) AS cargas_monto,
          COALESCE(v.qty,   0) AS vencer_qty,
          COALESCE(v.monto, 0) AS vencer_monto,
          COALESCE(co.qty,  0) AS cobrado_qty,
          COALESCE(co.monto,0) AS cobrado_monto
        FROM dias d
        LEFT JOIN cargas   ca ON ca.dia = d.dia
        LEFT JOIN vencer   v  ON v.dia  = d.dia
        LEFT JOIN cobrados co ON co.dia = d.dia
        ORDER BY d.dia ASC
      `),

      // ── Cumpleaños próximos 7 días (contactos PF) ─────────────────────
      this.ds.query(`
        WITH rango AS (SELECT CURRENT_DATE AS hoy, CURRENT_DATE + INTERVAL '7 days' AS hasta)
        SELECT
          cpf.id,
          cpf.primer_nombre || ' ' || cpf.primer_apellido AS nombre,
          cpf.fecha_nacimiento,
          cpf.celular,
          cpf.email,
          TO_CHAR(cpf.fecha_nacimiento::date, 'DD/MM') AS dia_mes
        FROM contactos_pf cpf, rango
        WHERE cpf.fecha_nacimiento IS NOT NULL
          AND (
            CASE
              WHEN TO_CHAR(rango.hoy,   'MMDD') <= TO_CHAR(rango.hasta, 'MMDD') THEN
                TO_CHAR(cpf.fecha_nacimiento::date, 'MMDD')
                  BETWEEN TO_CHAR(rango.hoy, 'MMDD') AND TO_CHAR(rango.hasta, 'MMDD')
              ELSE
                TO_CHAR(cpf.fecha_nacimiento::date, 'MMDD') >= TO_CHAR(rango.hoy,   'MMDD')
                OR TO_CHAR(cpf.fecha_nacimiento::date, 'MMDD') <= TO_CHAR(rango.hasta, 'MMDD')
            END
          )
        ORDER BY TO_CHAR(cpf.fecha_nacimiento::date, 'MMDD') ASC
        LIMIT 20
      `),
    ]);

    return {
      kpis: kpis[0],
      porEstado,
      porCliente,
      porBanco,
      porCanal,
      proyeccionSemanal,
      vencimientosInmediatos,
      pipeline:   pipeline[0],
      cobrar15d:  cobrar15d[0],
      timeline15d,
      cumpleanios,
    };
  }

  async getDashboardDesembolsos() {
    const [resumen, porCaja, pendientes] = await Promise.all([
      this.ds.query(`
        SELECT
          COALESCE(SUM(monto_total), 0)                                         AS total_solicitado,
          COALESCE(SUM(monto_total) FILTER (WHERE estado NOT IN ('FORMULARIO_CARGADO','RECHAZADO','DATOS_PENDIENTES')), 0) AS total_aprobado,
          COALESCE(SUM(neto_desembolsar) FILTER (WHERE estado IN ('DESEMBOLSADO','EN_COBRANZA','COBRADO','MORA')), 0) AS total_desembolsado,
          COALESCE(SUM(neto_desembolsar) FILTER (WHERE estado = 'EN_TESORERIA'), 0) AS pendiente_desembolso,
          COALESCE(SUM(ganancia_neta) FILTER (WHERE estado NOT IN ('RECHAZADO','FORMULARIO_CARGADO')), 0) AS ganancia_esperada,
          COALESCE(SUM(ganancia_neta) FILTER (WHERE estado = 'COBRADO'), 0)     AS ganancia_real,
          COUNT(*) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO'))::int    AS operaciones_activas
        FROM operaciones
      `),
      this.ds.query(`
        SELECT c.nombre AS caja, c.saldo, c.tipo_cuenta,
               COALESCE(SUM(o.neto_desembolsar) FILTER (WHERE o.estado NOT IN ('CERRADO','COBRADO','RECHAZADO')), 0) AS capital_colocado
        FROM cajas c
        LEFT JOIN operaciones o ON o.caja_id = c.id
        WHERE c.activa = true
        GROUP BY c.id, c.nombre, c.saldo, c.tipo_cuenta
      `),
      this.ds.query(`
        SELECT id, nro_operacion, contacto_nombre, neto_desembolsar, fecha_operacion, estado
        FROM operaciones
        WHERE estado = 'EN_TESORERIA'
        ORDER BY created_at ASC
      `),
    ]);

    return { resumen: resumen[0], porCaja, pendientes };
  }
}
