import { Injectable } from '@nestjs/common';
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
}
