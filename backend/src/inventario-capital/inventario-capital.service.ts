import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class InventarioCapitalService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async getResumen() {
    const [capital, operaciones] = await Promise.all([
      this.ds.query(`SELECT nombre, saldo, banco, tipo_cuenta FROM cajas WHERE activa = true`),
      this.ds.query(`
        SELECT
          SUM(capital_invertido) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO','COBRADO')) AS capital_colocado,
          SUM(capital_invertido) FILTER (WHERE estado = 'COBRADO') AS capital_recuperado,
          SUM(ganancia_neta)     FILTER (WHERE estado = 'COBRADO') AS intereses_generados,
          SUM(ganancia_neta)     FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO')) AS ganancia_esperada,
          COUNT(*)               FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO')) AS operaciones_activas
        FROM operaciones
      `),
    ]);

    const totalCajas = capital.reduce((acc: number, c: any) => acc + Number(c.saldo), 0);

    return {
      cajas:            capital,
      total_disponible: totalCajas,
      ...operaciones[0],
    };
  }

  async getInventarioCheques() {
    return this.ds.query(`
      SELECT
        o.nro_operacion,
        o.contacto_nombre,
        o.contacto_doc,
        o.canal,
        cd.banco,
        cd.librador,
        cd.nro_cheque,
        cd.fecha_vencimiento,
        cd.monto,
        cd.capital_invertido,
        (cd.monto - cd.capital_invertido) AS descuento_bruto,
        cd.tasa_mensual,
        cd.comision,
        (cd.monto - cd.capital_invertido - COALESCE(cd.comision, 0)) AS ganancia_neta,
        cd.estado,
        CURRENT_DATE - cd.fecha_vencimiento::date AS dias_vencida,
        CASE
          WHEN cd.fecha_vencimiento::date < CURRENT_DATE THEN 'VENCIDO'
          WHEN cd.fecha_vencimiento::date <= CURRENT_DATE + 30 THEN 'PROXIMO'
          ELSE 'VIGENTE'
        END AS alerta
      FROM cheques_detalle cd
      JOIN operaciones o ON o.id = cd.operacion_id
      WHERE o.estado NOT IN ('CERRADO','RECHAZADO')
      ORDER BY cd.fecha_vencimiento ASC
    `);
  }

  async getRentabilidadPorPeriodo() {
    return this.ds.query(`
      SELECT
        DATE_TRUNC('month', fecha_desembolso::date) AS mes,
        COUNT(*) AS operaciones,
        SUM(capital_invertido) AS capital,
        SUM(ganancia_neta) AS ganancia,
        ROUND(SUM(ganancia_neta) / NULLIF(SUM(capital_invertido), 0) * 100, 2) AS tasa_rendimiento
      FROM operaciones
      WHERE fecha_desembolso IS NOT NULL
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `);
  }
}
