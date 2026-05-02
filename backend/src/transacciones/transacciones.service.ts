import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaccion } from './entities/transaccion.entity';
import { TransaccionCuotaAplicacion } from './entities/transaccion-cuota-aplicacion.entity';
import { Cuota } from '../operaciones/entities/cuota.entity';
import { TalonarioInterno } from '../talonarios/entities/talonario-interno.entity';
import { TimbradoSet } from '../talonarios/entities/timbrado-set.entity';
import { BitacoraService } from '../bitacora/bitacora.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';

@Injectable()
export class TransaccionesService {
  constructor(
    @InjectRepository(Transaccion) private txRepo: Repository<Transaccion>,
    @InjectRepository(TransaccionCuotaAplicacion) private aplicRepo: Repository<TransaccionCuotaAplicacion>,
    @InjectRepository(Cuota) private cuotaRepo: Repository<Cuota>,
    @InjectRepository(TalonarioInterno) private talonRepo: Repository<TalonarioInterno>,
    @InjectRepository(TimbradoSet) private timbradoRepo: Repository<TimbradoSet>,
    private ds: DataSource,
    private bitacora: BitacoraService,
  ) {}

  // ── Consultas ──────────────────────────────────────────────────────────────

  async findByOperacion(operacionId: string) {
    const txs = await this.txRepo.find({ where: { operacionId }, order: { fechaTransaccion: 'DESC', createdAt: 'DESC' } });
    const aplicaciones = await this.aplicRepo.find({
      where: txs.map(t => ({ transaccionId: t.id })),
    });
    return txs.map(tx => ({
      ...tx,
      aplicaciones: aplicaciones.filter(a => a.transaccionId === tx.id),
    }));
  }

  findDisponibles(params: {
    cobradorId?: string;
    cajaId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const conds: string[] = [`tipo = 'PAGO'`, `estado = 'APLICADO'`, `conciliacion_id IS NULL`];
    const vals: unknown[] = [];

    if (params.cobradorId) { vals.push(params.cobradorId); conds.push(`cobrador_id = $${vals.length}`); }
    if (params.cajaId)     { vals.push(params.cajaId);     conds.push(`caja_id = $${vals.length}`); }
    if (params.fechaDesde) { vals.push(params.fechaDesde); conds.push(`fecha_valor >= $${vals.length}`); }
    if (params.fechaHasta) { vals.push(params.fechaHasta); conds.push(`fecha_valor <= $${vals.length}`); }

    return this.ds.query<{
      id: string; tipo: string; fecha: string; monto: number;
      referencia: string; nroRecibo: string; operacionId: string;
    }[]>(`
      SELECT
        id, tipo, estado,
        fecha_transaccion  AS fecha,
        monto_total        AS monto,
        nro_referencia     AS referencia,
        nro_recibo         AS "nroRecibo",
        operacion_id       AS "operacionId",
        cobrador_id        AS "cobradorId"
      FROM transacciones
      WHERE ${conds.join(' AND ')}
      ORDER BY fecha_transaccion DESC
      LIMIT 200
    `, vals);
  }

  async resumenIngresos(desde: string, hasta: string) {
    const rows = await this.ds.query<{
      total: string; capital: string; interes: string;
      mora: string; gastos_admin: string; prorroga: string; cantidad: number;
    }[]>(`
      SELECT
        SUM(monto_total)        AS total,
        SUM(monto_capital)      AS capital,
        SUM(monto_interes)      AS interes,
        SUM(monto_mora)         AS mora,
        SUM(monto_gastos_admin) AS gastos_admin,
        SUM(monto_prorroga)     AS prorroga,
        COUNT(*)::int           AS cantidad
      FROM transacciones
      WHERE tipo = 'PAGO'
        AND estado = 'APLICADO'
        AND fecha_transaccion BETWEEN $1 AND $2
    `, [desde, hasta]);

    const r = rows[0];
    return {
      montoCapital:     Number(r?.capital      ?? 0),
      montoInteres:     Number(r?.interes      ?? 0),
      montoMora:        Number(r?.mora         ?? 0),
      montoGastosAdmin: Number(r?.gastos_admin ?? 0),
      montoProrroga:    Number(r?.prorroga     ?? 0),
      totalCobrado:     Number(r?.total        ?? 0),
      cantidadPagos:    Number(r?.cantidad     ?? 0),
    };
  }

  private readonly LABELS_MES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  async resumenMensual(año: number) {
    const rows = await this.ds.query<{
      mes: number; interes: string; mora: string;
      gastos: string; capital: string; total: string;
    }[]>(`
      SELECT
        EXTRACT(MONTH FROM fecha_valor::date)::int AS mes,
        SUM(monto_interes)      AS interes,
        SUM(monto_mora)         AS mora,
        SUM(monto_gastos_admin) AS gastos,
        SUM(monto_capital)      AS capital,
        SUM(monto_total)        AS total
      FROM transacciones
      WHERE tipo = 'PAGO'
        AND estado = 'APLICADO'
        AND EXTRACT(YEAR FROM fecha_valor::date) = $1
      GROUP BY mes
      ORDER BY mes
    `, [año]);

    // Rellenar los 12 meses (los meses sin datos quedan en 0)
    const porMes = new Map(rows.map(r => [Number(r.mes), r]));
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const r   = porMes.get(mes);
      return {
        mes,
        label:   this.LABELS_MES[mes],
        interes: Number(r?.interes ?? 0),
        mora:    Number(r?.mora    ?? 0),
        gastos:  Number(r?.gastos  ?? 0),
        capital: Number(r?.capital ?? 0),
        total:   Number(r?.total   ?? 0),
      };
    });
  }

  // ── Registrar pago ─────────────────────────────────────────────────────────

  async registrarPago(data: RegistrarPagoDto, userId: string, ip?: string) {
    return this.ds.transaction(async (em) => {
      const txRepo     = em.getRepository(Transaccion);
      const aplicRepo  = em.getRepository(TransaccionCuotaAplicacion);
      const cuotaRepo  = em.getRepository(Cuota);
      const talonRepo  = em.getRepository(TalonarioInterno);
      const timbRepo   = em.getRepository(TimbradoSet);

      const fechaValor = data.fechaValor ?? data.fechaTransaccion;

      let nroRecibo: string | null = null;
      let talonarioId: string | null = data.talonarioId ?? null;
      let nroFiscal: string | null = null;
      let timbradoId: string | null = null;

      // 1. Generar número de recibo
      if (data.usarTalonario && data.cobradorId) {
        let talonario: TalonarioInterno | null = null;
        if (talonarioId) {
          talonario = await talonRepo.findOne({ where: { id: talonarioId } });
        } else {
          talonario = await talonRepo.findOne({ where: { empleadoId: data.cobradorId, activo: true } });
        }
        if (talonario) {
          talonarioId = talonario.id;
          const nro = talonario.nroSiguiente;
          await talonRepo.update(talonario.id, { nroSiguiente: nro + 1 });
          nroRecibo = `${talonario.prefijo}-${String(nro).padStart(6, '0')}`;
        }
      }

      // 2. Generar número fiscal
      if (data.usarTimbrado) {
        const hoy = data.fechaTransaccion;
        const timbrado = await timbRepo
          .createQueryBuilder('t')
          .where('t.estado = :estado', { estado: 'ACTIVO' })
          .andWhere('t.fechaVigenciaDesde <= :hoy', { hoy })
          .andWhere('t.fechaVigenciaHasta >= :hoy', { hoy })
          .orderBy('t.createdAt', 'DESC')
          .getOne();
        if (timbrado) {
          timbradoId = timbrado.id;
          const nro = Number(timbrado.nroSiguiente);
          if (nro <= Number(timbrado.nroHasta)) {
            await timbRepo.update(timbrado.id, { nroSiguiente: nro + 1 });
            nroFiscal = `${timbrado.establecimiento}-${timbrado.puntoExpedicion}-${String(nro).padStart(7, '0')}`;
          }
        }
      }

      // 3. Crear transacción
      const tx = await txRepo.save(txRepo.create({
        operacionId: data.operacionId,
        tipo: 'PAGO',
        fechaTransaccion: data.fechaTransaccion,
        fechaValor,
        montoTotal: data.montoTotal,
        montoCapital: data.montoCapital,
        montoInteres: data.montoInteres,
        montoMora: data.montoMora,
        montoGastosAdmin: data.montoGastosAdmin,
        montoProrroga: data.montoProrroga,
        medioPagoId: data.medioPagoId,
        nroReferencia: data.nroReferencia,
        talonarioId,
        nroRecibo,
        timbradoId,
        nroComprobanteFiscal: nroFiscal,
        cobradorId: data.cobradorId,
        cajaId: data.cajaId,
        estado: 'APLICADO',
        creadoPorId: userId,
        ip,
      }));

      // 4. Crear aplicaciones por cuota y actualizar cuotas
      for (const ap of data.aplicaciones) {
        await aplicRepo.save(aplicRepo.create({
          transaccionId: tx.id,
          cuotaId: ap.cuotaId,
          capitalAplicado: ap.capitalAplicado,
          interesAplicado: ap.interesAplicado,
          moraAplicada: ap.moraAplicada,
          gastosAplicados: ap.gastosAplicados,
          prorrogaAplicada: ap.prorrogaAplicada,
        }));

        // 5. Actualizar cuota
        const cuota = await cuotaRepo.findOne({ where: { id: ap.cuotaId } });
        if (cuota) {
          const nuevoPagado     = Number(cuota.pagado)           + Number(ap.capitalAplicado);
          const nuevoInteres    = Number(cuota.interesPagado ?? 0) + Number(ap.interesAplicado);
          const nuevaMoraPagada = Number(cuota.moraPagada ?? 0)   + Number(ap.moraAplicada);
          const nuevoGastos     = Number(cuota.gastosAdminPagado ?? 0) + Number(ap.gastosAplicados);
          const nuevoProrroga   = Number(cuota.cargoProrrogaPagado ?? 0) + Number(ap.prorrogaAplicada);
          const nuevoSaldo      = Math.max(0, Number(cuota.saldo) - Number(ap.capitalAplicado));

          const totalPagadoAhora = nuevoPagado + nuevoInteres + nuevaMoraPagada + nuevoGastos + nuevoProrroga;
          const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO' : cuota.estado;

          await cuotaRepo.update(ap.cuotaId, {
            pagado:             nuevoPagado,
            interesPagado:      nuevoInteres,
            moraPagada:         nuevaMoraPagada,
            gastosAdminPagado:  nuevoGastos,
            cargoProrrogaPagado: nuevoProrroga,
            saldo:              nuevoSaldo,
            estado:             nuevoEstado,
            ...(nuevoSaldo <= 0 ? { fechaPago: data.fechaTransaccion } : {}),
          });
        }
      }

      return { ...tx, nroRecibo, nroComprobanteFiscal: nroFiscal };
    }).then(async (tx) => {
      await this.bitacora.log({
        usuarioId: userId,
        accion: 'REGISTRAR_PAGO',
        modulo: 'transacciones',
        entidad: 'Transaccion',
        entidadId: tx.id,
        ip,
      });
      return tx;
    });
  }

  // ── Reversar transacción ───────────────────────────────────────────────────

  async reversar(transaccionId: string, motivo: string, userId: string, ip?: string) {
    return this.ds.transaction(async (em) => {
      const txRepo    = em.getRepository(Transaccion);
      const aplicRepo = em.getRepository(TransaccionCuotaAplicacion);
      const cuotaRepo = em.getRepository(Cuota);

      const original = await txRepo.findOne({ where: { id: transaccionId } });
      if (!original) throw new NotFoundException(`Transacción ${transaccionId} no encontrada`);
      if (original.estado === 'REVERSADO') throw new BadRequestException('La transacción ya fue reversada');

      if (original.conciliacionId) {
        // Buscar conciliación
        const [concRow] = await em.query(
          `SELECT estado FROM conciliaciones WHERE id = $1`,
          [original.conciliacionId],
        );
        if (concRow?.estado === 'CONCILIADA') {
          throw new ForbiddenException('La transacción está conciliada y no puede reversarse');
        }
      }

      const hoy = new Date().toISOString().split('T')[0];

      // Crear transacción reverso
      const reverso = await txRepo.save(txRepo.create({
        operacionId: original.operacionId,
        tipo: 'REVERSO',
        fechaTransaccion: hoy,
        fechaValor: hoy,
        montoTotal:        -Number(original.montoTotal),
        montoCapital:      -Number(original.montoCapital),
        montoInteres:      -Number(original.montoInteres),
        montoMora:         -Number(original.montoMora),
        montoGastosAdmin:  -Number(original.montoGastosAdmin),
        montoProrroga:     -Number(original.montoProrroga),
        medioPagoId: original.medioPagoId,
        cobradorId: original.cobradorId,
        cajaId: original.cajaId,
        estado: 'APLICADO',
        esReverso: true,
        transaccionOrigenId: original.id,
        motivoReverso: motivo,
        reversadoPorId: userId,
        fechaReverso: hoy,
        creadoPorId: userId,
        ip,
      }));

      // Marcar original como reversado
      await txRepo.update(transaccionId, {
        estado: 'REVERSADO',
        reversadoPorId: userId,
        fechaReverso: hoy,
        motivoReverso: motivo,
      });

      // Revertir aplicaciones
      const aplicaciones = await aplicRepo.find({ where: { transaccionId } });
      for (const ap of aplicaciones) {
        const cuota = await cuotaRepo.findOne({ where: { id: ap.cuotaId } });
        if (cuota) {
          const nuevoPagado     = Math.max(0, Number(cuota.pagado)           - Number(ap.capitalAplicado));
          const nuevoInteres    = Math.max(0, Number(cuota.interesPagado ?? 0) - Number(ap.interesAplicado));
          const nuevaMoraPagada = Math.max(0, Number(cuota.moraPagada ?? 0)   - Number(ap.moraAplicada));
          const nuevoGastos     = Math.max(0, Number(cuota.gastosAdminPagado ?? 0) - Number(ap.gastosAplicados));
          const nuevoProrroga   = Math.max(0, Number(cuota.cargoProrrogaPagado ?? 0) - Number(ap.prorrogaAplicada));
          const nuevoSaldo      = Number(cuota.capital) - nuevoPagado;

          await cuotaRepo.update(ap.cuotaId, {
            pagado:             nuevoPagado,
            interesPagado:      nuevoInteres,
            moraPagada:         nuevaMoraPagada,
            gastosAdminPagado:  nuevoGastos,
            cargoProrrogaPagado: nuevoProrroga,
            saldo:              nuevoSaldo,
            estado:             nuevoSaldo > 0 ? 'PENDIENTE' : cuota.estado,
            ...(nuevoSaldo > 0 ? { fechaPago: null } : {}),
          });
        }
      }

      return reverso;
    }).then(async (reverso) => {
      await this.bitacora.log({
        usuarioId: userId,
        accion: 'REVERSAR_TRANSACCION',
        modulo: 'transacciones',
        entidad: 'Transaccion',
        entidadId: transaccionId,
        detalle: { motivo, reversoId: reverso.id },
        ip,
      });
      return reverso;
    });
  }
}
