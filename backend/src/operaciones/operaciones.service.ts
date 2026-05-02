import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { utils as xlsxUtils, write as xlsxWrite } from 'xlsx';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { ESTADO_OP, ESTADO_CUOTA } from '../common/constants/estado-operacion.constants';
import { Operacion } from './entities/operacion.entity';
import { ChequeDetalle } from './entities/cheque-detalle.entity';
import { Cuota } from './entities/cuota.entity';
import { EstadoOperacion } from './entities/estado-operacion.entity';
import { EstadoTransicion } from './entities/estado-transicion.entity';
import { FeriadosService } from '../feriados/feriados.service';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { UpdateOperacionDto } from './dto/update-operacion.dto';
import { UpdateChequeDto } from './dto/update-cheque.dto';
import { CreateEstadoOperacionDto } from './dto/create-estado-operacion.dto';
import { UpdateEstadoOperacionDto } from './dto/update-estado-operacion.dto';
import { RegistrarProrrogaDto } from './dto/registrar-prorroga.dto';
import { RegistrarPagoCuotaDto } from './dto/registrar-pago-cuota.dto';
import { CreateChequeDetalleDto } from './dto/create-cheque-detalle.dto';
import { CreateCuotaDto } from './dto/create-cuota.dto';
import { calcularNuevoEstadoOp, type EstadoCheque } from './utils/auto-cierre.utils';

@Injectable()
export class OperacionesService {
  constructor(
    @InjectRepository(Operacion)         private operRepo: Repository<Operacion>,
    @InjectRepository(ChequeDetalle)     private chequeRepo: Repository<ChequeDetalle>,
    @InjectRepository(Cuota)             private cuotaRepo: Repository<Cuota>,
    @InjectRepository(EstadoOperacion)   private estadoRepo: Repository<EstadoOperacion>,
    @InjectRepository(EstadoTransicion)  private transRepo: Repository<EstadoTransicion>,
    @InjectDataSource()                  private ds: DataSource,
    private feriadosSvc: FeriadosService,
  ) {}

  // ── Número de operación ───────────────────────────────────────────────────
  private async generarNro(): Promise<string> {
    const count = await this.operRepo.count();
    const year  = new Date().getFullYear().toString().slice(-2);
    return `OP-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // ── Cálculo de interés ────────────────────────────────────────────────────
  static calcularInteres(monto: number, tasaMensual: number, dias: number): number {
    return Math.round(monto * (tasaMensual / 100) * (dias / 30));
  }

  // ── Listar ────────────────────────────────────────────────────────────────
  async findAll(filtros: { estado?: string; tipo?: string; contactoId?: string; page?: number; limit?: number } = {}) {
    const page   = Math.max(1, filtros.page  ?? 1);
    const limit  = Math.min(100, filtros.limit ?? 50);
    const offset = (page - 1) * limit;

    const qb = this.operRepo.createQueryBuilder('o')
      .orderBy('o.createdAt', 'DESC')
      .skip(offset).take(limit);

    if (filtros.estado)     qb.andWhere('o.estado = :estado',         { estado: filtros.estado });
    if (filtros.tipo)       qb.andWhere('o.tipoOperacion = :tipo',     { tipo: filtros.tipo });
    if (filtros.contactoId) qb.andWhere('o.contactoId = :cid',        { cid: filtros.contactoId });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Detalle ───────────────────────────────────────────────────────────────
  async findById(id: string) {
    const operacion = await this.operRepo.findOne({ where: { id } });
    if (!operacion) throw new NotFoundException('Operación no encontrada');
    const cheques = await this.chequeRepo.find({ where: { operacionId: id }, order: { createdAt: 'ASC' } });
    const cuotas  = await this.cuotaRepo.find({ where: { operacionId: id }, order: { nroCuota: 'ASC' } });
    return { ...operacion, cheques, cuotas };
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
  async create(
    data: CreateOperacionDto,
    cheques?: CreateChequeDetalleDto[],
    cuotas?: CreateCuotaDto[],
  ) {
    const nroOperacion = await this.generarNro();

    // Calcular gananciaNeta y fechaVencimiento desde los cheques si es DESCUENTO_CHEQUE
    let gananciaNeta   = Number(data.interesTotal ?? 0);
    let fechaVencimiento = data.fechaVencimiento ?? null;

    if (data.tipoOperacion === 'DESCUENTO_CHEQUE' && cheques?.length) {
      // fechaVencimiento = fecha máxima entre los cheques
      const fechas = cheques.map(c => c.fechaVencimiento).filter(Boolean);
      if (fechas.length) fechaVencimiento = fechas.sort().at(-1);
    }

    const { cheques: _c, cuotas: _q, ...operData } = data;

    const operacion = await this.operRepo.save(
      this.operRepo.create({
        ...operData,
        nroOperacion,
        gananciaNeta,
        fechaVencimiento,
        estado: data.estado ?? ESTADO_OP.EN_ANALISIS,
        bitacora: [],
      }),
    );

    // ── Ajustar cheques que vencen en fin de semana o feriado ────────────────
    // Si la fecha de vencimiento no es hábil, se corre al próximo día hábil
    // y se recalcula el interés por los días adicionales.
    let savedCheques: ChequeDetalle[] = [];
    if (cheques?.length) {
      const chequesAjustados = await Promise.all(
        cheques.map(async (c) => {
          if (!c.fechaVencimiento) return c;
          const fechaOrig = new Date(c.fechaVencimiento + 'T00:00:00');
          const { fecha: fechaAjustada, diasExtra } = await this.feriadosSvc.ajustarFecha(fechaOrig);
          if (diasExtra === 0) return c;

          const tasa       = Number(c.tasaMensual    ?? 0);
          const capital    = Number(c.capitalInvertido ?? 0);
          const diasOrig   = Number(c.dias            ?? 30);
          const diasNuevos = diasOrig + diasExtra;

          const interesOrig  = Math.round(capital * (tasa / 100) * (diasOrig   / 30));
          const interesNuevo = Math.round(capital * (tasa / 100) * (diasNuevos / 30));
          const comision     = Number(c.comision ?? 0);

          return {
            ...c,
            fechaVencimiento: fechaAjustada.toISOString().split('T')[0],
            dias:    diasNuevos,
            interes: interesNuevo,
            monto:   capital + interesNuevo + comision,
            // anotamos el ajuste en observaciones para trazabilidad
            observaciones: [
              c.observaciones,
              `Vencimiento ajustado +${diasExtra}d por feriado/fin de semana (interés recalculado)`,
            ].filter(Boolean).join(' | '),
          };
        }),
      );

      // Recalcular totales de la operación con los cheques ajustados
      const totalInteres = chequesAjustados.reduce((s, c) => s + Number(c.interes ?? 0), 0);
      const totalMonto   = chequesAjustados.reduce((s, c) => s + Number(c.monto ?? 0), 0);
      const totalCapital = chequesAjustados.reduce((s, c) => s + Number(c.capitalInvertido ?? 0), 0);
      await this.operRepo.update(operacion.id, {
        interesTotal:     totalInteres,
        montoTotal:       totalMonto,
        capitalInvertido: totalCapital,
        gananciaNeta:     totalInteres,
        netoDesembolsar:  totalCapital,
      });

      const items = chequesAjustados.map(c => this.chequeRepo.create({ ...c, operacionId: operacion.id }));
      savedCheques = await this.chequeRepo.save(items);
    }

    // Auto-generar cuotas desde cheques cuando es DESCUENTO_CHEQUE y no vienen cuotas explícitas
    let cuotasToSave: Partial<Cuota>[] = cuotas ?? [];
    if (!cuotasToSave.length && data.tipoOperacion === 'DESCUENTO_CHEQUE' && savedCheques.length) {
      cuotasToSave = savedCheques.map((c, i) => ({
        nroCuota:         i + 1,
        fechaVencimiento: c.fechaVencimiento,
        capital:          Number(c.capitalInvertido),
        interes:          Number(c.interes),
        total:            Number(c.monto),
        saldo:            Number(c.monto),
        estado:           ESTADO_CUOTA.PENDIENTE,
      }));
    }

    if (cuotasToSave.length) {
      const items = cuotasToSave.map(c => this.cuotaRepo.create({ ...c, operacionId: operacion.id }));
      await this.cuotaRepo.save(items);
    }

    return this.findById(operacion.id);
  }

  // ── Actualizar ────────────────────────────────────────────────────────────
  async update(id: string, data: UpdateOperacionDto) {
    await this.operRepo.update(id, data);
    return this.findById(id);
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────
  async cambiarEstado(id: string, estado: string, nota?: string, usuarioEmail?: string) {
    const op = await this.operRepo.findOne({ where: { id } });
    if (!op) throw new NotFoundException('Operación no encontrada');

    // Validar transición si existe la matriz configurada
    if (op.estado && op.estado !== estado) {
      const desde = await this.estadoRepo.findOne({ where: { codigo: op.estado } });
      const hasta = await this.estadoRepo.findOne({ where: { codigo: estado } });

      if (desde && hasta) {
        const totalTransDesde = await this.transRepo.count({ where: { desdeId: desde.id } });
        if (totalTransDesde > 0) {
          const permitida = await this.transRepo.findOne({
            where: { desdeId: desde.id, hastaId: hasta.id },
          });
          if (!permitida) {
            throw new BadRequestException(
              `Transición de "${desde.nombre}" → "${hasta.nombre}" no está permitida por la matriz de flujo.`,
            );
          }
        }
      }
    }

    const bitacora = [...(op.bitacora ?? []), {
      fecha:   new Date().toISOString(),
      de:      op.estado,
      a:       estado,
      nota:    nota ?? null,
      usuario: usuarioEmail ?? null,
    }];

    await this.operRepo.update(id, { estado, bitacora });
    return this.findById(id);
  }

  // ── Prórroga ──────────────────────────────────────────────────────────────
  async registrarProrroga(id: string, data: RegistrarProrrogaDto) {
    const op = await this.operRepo.findOne({ where: { id } });
    if (!op) throw new NotFoundException('Operación no encontrada');

    const bitacora = [...(op.bitacora ?? []), {
      fecha:         new Date().toISOString(),
      tipo:          'PRORROGA',
      fechaAnterior: op.fechaVencimiento,
      nuevaFecha:    data.nuevaFecha,
      nota:          data.nota ?? null,
    }];

    await this.operRepo.update(id, {
      fechaVencimiento: data.nuevaFecha,
      tasaMensual:      data.nuevaTasa ?? op.tasaMensual,
      prorrogas:        (op.prorrogas ?? 0) + 1,
      estado:           ESTADO_OP.PRORROGADO,
      bitacora,
    });

    return this.findById(id);
  }

  // ── Cheques ───────────────────────────────────────────────────────────────
  async updateCheque(id: string, data: UpdateChequeDto) {
    const cheque = await this.chequeRepo.findOne({ where: { id } });
    if (!cheque) throw new NotFoundException('Cheque no encontrado');

    await this.chequeRepo.update(id, data);

    // Auto-cierre: si todos los cheques de la operación ya no están VIGENTES
    // → calcularNuevoEstadoOp determina COBRADO / EN_COBRANZA / null (sin cambio)
    if (data.estado) {
      const todos = await this.chequeRepo.find({ where: { operacionId: cheque.operacionId } });
      const nuevoEstadoOp = calcularNuevoEstadoOp(
        todos.map(c => ({ id: c.id, estado: c.estado as EstadoCheque })),
        id,
        data.estado as EstadoCheque,
      );

      if (nuevoEstadoOp) {
        const op = await this.operRepo.findOne({ where: { id: cheque.operacionId } });
        if (op && op.estado !== ESTADO_OP.COBRADO && op.estado !== ESTADO_OP.CERRADO) {
          const nota = nuevoEstadoOp === ESTADO_OP.COBRADO
            ? 'Todos los cheques cobrados — operación cerrada automáticamente'
            : 'Cheques con resultado mixto (devueltos/protestados)';
          const bitacora = [...(op.bitacora ?? []), {
            fecha: new Date().toISOString(),
            de:    op.estado,
            a:     nuevoEstadoOp,
            nota,
            tipo:  'ESTADO',
          }];
          await this.operRepo.update(cheque.operacionId, { estado: nuevoEstadoOp, bitacora });
        }
      }
    }

    return this.chequeRepo.findOne({ where: { id } });
  }

  // ── Cuotas ────────────────────────────────────────────────────────────────
  async registrarPagoCuota(cuotaId: string, data: RegistrarPagoCuotaDto) {
    const cuota = await this.cuotaRepo.findOne({ where: { id: cuotaId } });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');

    const pagado = Number(cuota.pagado) + Number(data.montoPagado);
    const saldo  = Math.max(0, Number(cuota.total) + Number(cuota.cargoMora ?? 0) - pagado);
    const estado = saldo <= 0 ? ESTADO_CUOTA.PAGADO : ESTADO_CUOTA.PENDIENTE;

    await this.cuotaRepo.update(cuotaId, { pagado, saldo, estado, fechaPago: data.fechaPago });
    return this.cuotaRepo.findOne({ where: { id: cuotaId } });
  }

  // ── Contrato TeDescuento ──────────────────────────────────────────────────
  async actualizarContrato(id: string, data: {
    nroContratoTeDescuento?: string;
    contratoTeDescuentoUrl?: string;
    fichaInformconfUrl?: string;
    fichaInfocheckUrl?: string;
  }) {
    const op = await this.operRepo.findOne({ where: { id } });
    if (!op) throw new NotFoundException('Operación no encontrada');
    const update: Partial<Operacion> = {};
    if (data.nroContratoTeDescuento !== undefined) update.nroContratoTeDescuento = data.nroContratoTeDescuento;
    if (data.contratoTeDescuentoUrl  !== undefined) update.contratoTeDescuentoUrl  = data.contratoTeDescuentoUrl;
    if (data.fichaInformconfUrl      !== undefined) update.fichaInformconfUrl      = data.fichaInformconfUrl;
    if (data.fichaInfocheckUrl       !== undefined) update.fichaInfocheckUrl       = data.fichaInfocheckUrl;
    await this.operRepo.update(id, update);
    return this.findById(id);
  }

  // ── Estados configurables ─────────────────────────────────────────────────
  findEstados() { return this.estadoRepo.find({ order: { orden: 'ASC' } }); }

  createEstado(d: CreateEstadoOperacionDto) { return this.estadoRepo.save(this.estadoRepo.create(d)); }

  async updateEstado(id: string, d: UpdateEstadoOperacionDto) {
    await this.estadoRepo.update(id, d);
    return this.estadoRepo.findOne({ where: { id } });
  }

  // ── Matriz de transiciones ────────────────────────────────────────────────

  async getTransicionesMatriz() {
    const estados     = await this.estadoRepo.find({ order: { orden: 'ASC' } });
    const transiciones = await this.transRepo.find();
    return { estados, transiciones };
  }

  async saveMatriz(batch: { desdeId: string; hastaId: string }[]) {
    // Reemplazar todo el conjunto de transiciones
    await this.transRepo.delete({});
    if (batch.length) {
      const items = batch.map(t => this.transRepo.create(t));
      await this.transRepo.save(items);
    }
    return this.getTransicionesMatriz();
  }

  async getSiguientesEstados(codigoActual: string): Promise<EstadoOperacion[]> {
    const desde = await this.estadoRepo.findOne({ where: { codigo: codigoActual } });
    if (!desde) return this.estadoRepo.find({ order: { orden: 'ASC' } });

    const transiciones = await this.transRepo.find({ where: { desdeId: desde.id } });

    // Si no hay transiciones definidas para este estado → retornar todos (modo libre)
    if (!transiciones.length) return this.estadoRepo.find({ order: { orden: 'ASC' } });

    const hastaIds = transiciones.map(t => t.hastaId);
    return this.estadoRepo.find({
      where: { id: In(hastaIds) },
      order: { orden: 'ASC' },
    });
  }

  // ── Exportación Excel ─────────────────────────────────────────────────────
  async exportToExcel(filtros: { estado?: string; tipo?: string; contactoId?: string } = {}): Promise<Buffer> {
    const qb = this.operRepo.createQueryBuilder('o').orderBy('o.fechaOperacion', 'DESC');
    if (filtros.estado)     qb.andWhere('o.estado = :estado',     { estado: filtros.estado });
    if (filtros.tipo)       qb.andWhere('o.tipoOperacion = :tipo', { tipo: filtros.tipo });
    if (filtros.contactoId) qb.andWhere('o.contactoId = :cid',    { cid: filtros.contactoId });

    const ops = await qb.getMany();

    const filas = ops.map(o => ({
      'N° Operación':     o.nroOperacion,
      'Tipo':             o.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Descuento Cheque' : 'Préstamo Consumo',
      'Estado':           o.estado,
      'Cliente':          o.contactoNombre,
      'Documento':        o.contactoDoc,
      'Fecha Op.':        o.fechaOperacion ?? '',
      'Vencimiento':      o.fechaVencimiento ?? '',
      'Capital (Gs.)':    Number(o.capitalInvertido ?? 0),
      'Interés (Gs.)':    Number(o.interesTotal ?? 0),
      'Monto Total (Gs.)': Number(o.montoTotal ?? 0),
      'Neto Desembolso':  Number(o.netoDesembolsar ?? 0),
      'Ganancia Neta':    Number(o.gananciaNeta ?? 0),
      'Tasa Mensual %':   Number(o.tasaMensual ?? 0),
      'Días Plazo':       Number(o.diasPlazo ?? 0),
      'Canal':            o.canal ?? '',
    }));

    const ws = xlsxUtils.json_to_sheet(filas);
    ws['!cols'] = [
      { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 32 }, { wch: 16 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    ];

    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, 'Operaciones');
    return xlsxWrite(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
