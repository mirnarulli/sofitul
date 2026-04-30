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

    const [kpis, porEstado, porCliente, porBanco, porCanal, proyeccionSemanal, vencimientosInmediatos] = await Promise.all([

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
        SELECT o.id, o.nro_operacion, o.contacto_nombre, o.canal,
               cd.nro_cheque, cd.banco, cd.fecha_vencimiento,
               cd.monto::bigint,
               cd.capital_invertido::bigint,
               cd.interes::bigint,
               (cd.fecha_vencimiento::date - CURRENT_DATE) AS dias_restantes
        FROM cheques_detalle cd
        JOIN operaciones o ON o.id::text = cd.operacion_id
        WHERE o.estado IN ${CARTERA}
          AND cd.estado NOT IN ('COBRADO','PROTESTADO')
          AND cd.fecha_vencimiento::date <= CURRENT_DATE + INTERVAL '10 days'
        ORDER BY cd.fecha_vencimiento ASC
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
