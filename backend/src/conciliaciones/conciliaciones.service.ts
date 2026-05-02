import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Conciliacion } from './entities/conciliacion.entity';
import { CreateConciliacionDto } from './dto/create-conciliacion.dto';
import { CerrarConciliacionDto } from './dto/cerrar-conciliacion.dto';

export interface FindConciliacionesParams {
  cobradorId?: string;
  cajaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}

@Injectable()
export class ConciliacionesService {
  constructor(
    @InjectRepository(Conciliacion) private repo: Repository<Conciliacion>,
    private ds: DataSource,
  ) {}

  async findAll(params: FindConciliacionesParams) {
    const conds: string[] = [];
    const vals: unknown[] = [];

    if (params.cobradorId) { vals.push(params.cobradorId); conds.push(`c.cobrador_id = $${vals.length}`); }
    if (params.cajaId)     { vals.push(params.cajaId);     conds.push(`c.caja_id = $${vals.length}`); }
    if (params.estado)     { vals.push(params.estado);     conds.push(`c.estado = $${vals.length}`); }
    if (params.fechaDesde) { vals.push(params.fechaDesde); conds.push(`c.fecha_periodo >= $${vals.length}`); }
    if (params.fechaHasta) { vals.push(params.fechaHasta); conds.push(`c.fecha_periodo <= $${vals.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return this.ds.query(`
      SELECT c.*,
        e.nombre   AS cobrador_nombre,
        e.apellido AS cobrador_apellido
      FROM conciliaciones c
      LEFT JOIN empleados e ON e.id = c.cobrador_id
      ${where}
      ORDER BY c.fecha_periodo DESC, c.created_at DESC
    `, vals);
  }

  async findById(id: string) {
    const conc = await this.repo.findOne({ where: { id } });
    if (!conc) throw new NotFoundException(`Conciliación ${id} no encontrada`);

    const transacciones = await this.ds.query(`
      SELECT
        id, tipo, estado,
        fecha_transaccion  AS fecha,
        monto_total        AS monto,
        nro_referencia     AS referencia,
        nro_recibo         AS "nroRecibo",
        cobrador_id        AS "cobradorId",
        operacion_id       AS "operacionId"
      FROM transacciones
      WHERE conciliacion_id = $1
      ORDER BY fecha_transaccion ASC
    `, [id]);
    return { ...conc, transacciones };
  }

  async create(body: CreateConciliacionDto, _userId: string) {
    // Calcular monto esperado
    const params: unknown[] = [];
    const conds: string[] = ['tipo = \'PAGO\'', 'estado = \'APLICADO\'', 'conciliacion_id IS NULL'];

    if (body.cobradorId) {
      params.push(body.cobradorId);
      conds.push(`cobrador_id = $${params.length}`);
    }
    if (body.cajaId) {
      params.push(body.cajaId);
      conds.push(`caja_id = $${params.length}`);
    }
    params.push(body.fechaPeriodo);
    conds.push(`fecha_valor = $${params.length}`);

    const [row] = await this.ds.query(
      `SELECT COALESCE(SUM(monto_total), 0)::bigint AS total FROM transacciones WHERE ${conds.join(' AND ')}`,
      params,
    );

    const conc = await this.repo.save(this.repo.create({
      ...body,
      estado: 'ABIERTA',
      montoEsperado: Number(row?.total ?? 0),
    }));

    // Asignar transacciones
    await this.asignarTransacciones(conc.id, body.cobradorId, body.cajaId, body.fechaPeriodo);
    return this.repo.findOne({ where: { id: conc.id } });
  }

  private async asignarTransacciones(
    conciliacionId: string,
    cobradorId?: string,
    cajaId?: string,
    fechaPeriodo?: string,
  ) {
    const conds: string[] = ['tipo = \'PAGO\'', 'estado = \'APLICADO\'', 'conciliacion_id IS NULL'];
    const params: unknown[] = [];

    if (cobradorId) {
      params.push(cobradorId);
      conds.push(`cobrador_id = $${params.length}`);
    }
    if (cajaId) {
      params.push(cajaId);
      conds.push(`caja_id = $${params.length}`);
    }
    if (fechaPeriodo) {
      params.push(fechaPeriodo);
      conds.push(`fecha_valor = $${params.length}`);
    }

    params.push(conciliacionId);
    await this.ds.query(
      `UPDATE transacciones SET conciliacion_id = $${params.length} WHERE ${conds.join(' AND ')}`,
      params,
    );
  }

  async cerrar(id: string, body: CerrarConciliacionDto, userId: string) {
    const conc = await this.repo.findOne({ where: { id } });
    if (!conc) throw new NotFoundException(`Conciliación ${id} no encontrada`);
    if (conc.estado === 'CONCILIADA') throw new ForbiddenException('No se puede modificar una conciliación ya conciliada');

    const hoy = new Date().toISOString().split('T')[0];
    const montoRec   = body.montoRecibido != null ? Number(body.montoRecibido) : 0;
    const diferencia = Number(body.montoDeclarado) - montoRec;

    await this.repo.update(id, {
      montoDeclarado: body.montoDeclarado,
      montoRecibido: montoRec,
      diferencia,
      estado: 'CERRADA',
      cerradoPorId: userId,
      fechaCierre: hoy,
      ...(body.observaciones ? { observaciones: body.observaciones } : {}),
    });
    return this.repo.findOne({ where: { id } });
  }

  async conciliar(id: string, _userId: string) {
    const conc = await this.repo.findOne({ where: { id } });
    if (!conc) throw new NotFoundException(`Conciliación ${id} no encontrada`);
    if (conc.estado !== 'CERRADA') throw new BadRequestException('Solo se puede conciliar una conciliación en estado CERRADA');

    await this.repo.update(id, { estado: 'CONCILIADA' });
    return this.repo.findOne({ where: { id } });
  }

  async reabrir(id: string, _userId: string) {
    const conc = await this.repo.findOne({ where: { id } });
    if (!conc) throw new NotFoundException(`Conciliación ${id} no encontrada`);
    if (conc.estado === 'CONCILIADA') throw new ForbiddenException('No se puede reabrir una conciliación ya conciliada');
    if (conc.estado !== 'CERRADA') throw new BadRequestException('Solo se puede reabrir una conciliación en estado CERRADA');

    await this.repo.update(id, { estado: 'ABIERTA' });
    return this.repo.findOne({ where: { id } });
  }

  async agregarTransaccion(conciliacionId: string, transaccionId: string) {
    const conc = await this.repo.findOne({ where: { id: conciliacionId } });
    if (!conc) throw new NotFoundException(`Conciliación ${conciliacionId} no encontrada`);
    if (conc.estado !== 'ABIERTA') throw new BadRequestException('Solo se pueden agregar transacciones a conciliaciones en estado ABIERTA');

    await this.ds.query(
      `UPDATE transacciones SET conciliacion_id = $1
       WHERE id = $2 AND (conciliacion_id IS NULL OR conciliacion_id = $1)`,
      [conciliacionId, transaccionId],
    );

    // Recalculate montoEsperado
    const [row] = await this.ds.query(
      `SELECT COALESCE(SUM(monto_total), 0)::bigint AS total
       FROM transacciones WHERE conciliacion_id = $1 AND tipo = 'PAGO' AND estado = 'APLICADO'`,
      [conciliacionId],
    );
    await this.repo.update(conciliacionId, { montoEsperado: Number(row?.total ?? 0) });
    return this.findById(conciliacionId);
  }
}
