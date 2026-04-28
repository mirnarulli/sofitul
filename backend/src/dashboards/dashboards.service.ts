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
