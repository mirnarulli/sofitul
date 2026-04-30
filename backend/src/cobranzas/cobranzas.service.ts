import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OperacionesService } from '../operaciones/operaciones.service';
import { MailService } from '../mail/mail.service';
import { ESTADO_OP } from '../common/constants/estado-operacion.constants';

@Injectable()
export class CobranzasService {
  constructor(
    @InjectDataSource() private ds: DataSource,
    private operSvc: OperacionesService,
    private mailSvc: MailService,
  ) {}

  async getCartera(filtros: { estado?: string; cobradorId?: string; tipo?: string } = {}) {
    let where = `WHERE o.estado NOT IN ('CERRADO', 'RECHAZADO')`;
    const params: any[] = [];
    let i = 1;

    if (filtros.estado)     { where += ` AND o.estado = $${i++}`;           params.push(filtros.estado); }
    if (filtros.cobradorId) { where += ` AND o.cobrador_id = $${i++}`;      params.push(filtros.cobradorId); }
    if (filtros.tipo)       { where += ` AND o.tipo_operacion = $${i++}`;   params.push(filtros.tipo); }

    return this.ds.query(`
      SELECT o.*,
        CURRENT_DATE - o.fecha_vencimiento::date AS dias_vencida
      FROM operaciones o
      ${where}
      ORDER BY o.fecha_vencimiento ASC
    `, params);
  }

  async getVencimientosPorPeriodo() {
    return this.ds.query(`
      SELECT
        CASE
          WHEN fecha_vencimiento::date < CURRENT_DATE THEN 'VENCIDO'
          WHEN fecha_vencimiento::date <= CURRENT_DATE + 30 THEN '30_DIAS'
          WHEN fecha_vencimiento::date <= CURRENT_DATE + 60 THEN '60_DIAS'
          ELSE '90_DIAS'
        END AS periodo,
        COUNT(*) AS cantidad,
        SUM(monto_total) AS total,
        SUM(capital_invertido) AS capital,
        SUM(ganancia_neta) AS ganancia
      FROM operaciones
      WHERE estado NOT IN ('CERRADO','RECHAZADO','COBRADO')
      GROUP BY 1
      ORDER BY 1
    `);
  }

  async asignarCobrador(operacionId: string, cobradorId: string) {
    await this.ds.query(
      `UPDATE operaciones SET cobrador_id = $1 WHERE id = $2`,
      [cobradorId, operacionId],
    );
    return { mensaje: 'Cobrador asignado' };
  }

  async registrarPago(operacionId: string, data: {
    monto: number;
    fechaPago: string;
    recibo?: string;
    nota?: string;
    emailDestino?: string;
  }) {
    const result = await this.operSvc.cambiarEstado(operacionId, ESTADO_OP.COBRADO, data.nota);

    if (data.emailDestino) {
      await this.mailSvc.enviarRecibo(data.emailDestino, 'Recibo de pago — SOFITUL', `
        <h2>Recibo de pago</h2>
        <p>Operación: ${operacionId}</p>
        <p>Monto: Gs. ${data.monto.toLocaleString('es-PY')}</p>
        <p>Fecha: ${data.fechaPago}</p>
        ${data.nota ? `<p>Nota: ${data.nota}</p>` : ''}
      `);
    }

    return result;
  }

  async getResumenCartera() {
    return this.ds.query(`
      SELECT
        COUNT(*) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO')) AS activas,
        SUM(monto_total) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO','COBRADO')) AS pendiente,
        SUM(monto_total) FILTER (WHERE estado = 'COBRADO') AS recuperado,
        SUM(monto_total) FILTER (WHERE estado = 'MORA') AS en_mora,
        SUM(monto_total) FILTER (WHERE estado = 'PRORROGADO') AS prorrogado,
        SUM(capital_invertido) FILTER (WHERE estado NOT IN ('CERRADO','RECHAZADO')) AS capital_colocado,
        SUM(ganancia_neta) FILTER (WHERE estado = 'COBRADO') AS ganancia_real
      FROM operaciones
    `);
  }
}
