import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OperacionesService } from '../operaciones/operaciones.service';
import { ESTADO_OP } from '../common/constants/estado-operacion.constants';

@Injectable()
export class TesoreriaService {
  constructor(
    @InjectDataSource() private ds: DataSource,
    private operSvc: OperacionesService,
  ) {}

  async getPendientesDesembolso() {
    return this.ds.query(`
      SELECT o.*, c.nombre AS caja_nombre
      FROM operaciones o
      LEFT JOIN cajas c ON c.id = o.caja_id
      WHERE o.estado = '${ESTADO_OP.EN_TESORERIA}'
      ORDER BY o.created_at ASC
    `);
  }

  async registrarDesembolso(operacionId: string, data: {
    cajaId: string;
    fechaDesembolso: string;
    bancoAcreditacion?: string;
    nroCuentaAcreditacion?: string;
    titularCuentaAcreditacion?: string;
    aliasAcreditacion?: string;
    comprobanteUrl?: string;
    nota?: string;
  }) {
    // Actualizar saldo de caja
    await this.ds.query(
      `UPDATE cajas SET saldo = saldo - (SELECT neto_desembolsar FROM operaciones WHERE id = $1) WHERE id = $2`,
      [operacionId, data.cajaId],
    );

    return this.operSvc.cambiarEstado(operacionId, ESTADO_OP.DESEMBOLSADO, data.nota);
  }

  async registrarRecepcionPagare(operacionId: string, fecha: string) {
    await this.ds.query(
      `UPDATE operaciones SET pagare_recibido = true, fecha_pagare = $1 WHERE id = $2`,
      [fecha, operacionId],
    );
    return { mensaje: 'Pagaré registrado como recibido' };
  }

  async getAlertasPagare() {
    return this.ds.query(`
      SELECT id, nro_operacion, contacto_nombre, fecha_desembolso
      FROM operaciones
      WHERE estado = '${ESTADO_OP.DESEMBOLSADO}' AND pagare_recibido = false
      ORDER BY fecha_desembolso ASC
    `);
  }

  // ── Cobranzas ──────────────────────────────────────────────────────────────

  /** Devuelve todos los cheques vigentes de operaciones activas, ordenados por vencimiento.
   *  Incluye vencidos (dias_restantes < 0), del día (0) y próximos. */
  async getChequesParaCobrar(): Promise<any[]> {
    const CARTERA = `('EN_COBRANZA','DESEMBOLSADO','MORA','PRORROGADO','RENOVADO')`;
    return this.ds.query(`
      SELECT
        cd.id            AS cheque_id,
        cd.nro_cheque,
        cd.banco,
        cd.librador,
        cd.fecha_vencimiento,
        cd.monto,
        cd.capital_invertido,
        cd.interes,
        cd.estado        AS estado_cheque,
        o.id             AS operacion_id,
        o.nro_operacion,
        o.contacto_nombre,
        o.contacto_doc,
        o.canal,
        o.estado         AS estado_operacion,
        (cd.fecha_vencimiento::date - CURRENT_DATE) AS dias_restantes
      FROM cheques_detalle cd
      JOIN operaciones o ON o.id::text = cd.operacion_id
      WHERE o.estado IN ${CARTERA}
        AND cd.estado = 'VIGENTE'
      ORDER BY cd.fecha_vencimiento ASC
    `);
  }

  /** Registra el cobro de un cheque individual.
   *  Si todos los cheques de la operación quedan COBRADO, cierra la operación. */
  async registrarCobro(
    chequeId: string,
    data: {
      fechaCobro: string;
      nroReferencia?: string;
      notaCobro?: string;
      usuarioEmail?: string;
    },
  ) {
    // 1. Marcar cheque como COBRADO
    const result = await this.ds.query(
      `UPDATE cheques_detalle
       SET estado = 'COBRADO',
           fecha_cobro    = $1,
           nro_referencia = $2,
           nota_cobro     = $3,
           cobrado_por    = $4
       WHERE id = $5
       RETURNING operacion_id`,
      [data.fechaCobro, data.nroReferencia ?? null, data.notaCobro ?? null, data.usuarioEmail ?? null, chequeId],
    );

    if (!result.length) throw new NotFoundException('Cheque no encontrado');
    const { operacion_id } = result[0];

    // 2. Verificar si TODOS los cheques de la operación están cobrados/fuera de juego
    const [{ pendientes }] = await this.ds.query<{ pendientes: string }[]>(
      `SELECT COUNT(*)::int AS pendientes
       FROM cheques_detalle
       WHERE operacion_id = $1
         AND estado NOT IN ('COBRADO','PROTESTADO','DEVUELTO','ENDOSADO')`,
      [operacion_id],
    );

    // 3. Si no quedan cheques pendientes → cerrar la operación
    if (Number(pendientes) === 0) {
      await this.operSvc.cambiarEstado(
        operacion_id,
        ESTADO_OP.COBRADO,
        `Cobro completado. ${data.notaCobro ?? ''}`.trim(),
        data.usuarioEmail,
      );
      return { mensaje: 'Cheque cobrado. Operación cerrada automáticamente.', operacionCerrada: true };
    }

    return { mensaje: 'Cheque registrado como cobrado.', operacionCerrada: false };
  }
}
