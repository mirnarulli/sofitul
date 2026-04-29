import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Operacion } from './entities/operacion.entity';
import { ChequeDetalle } from './entities/cheque-detalle.entity';
import { Cuota } from './entities/cuota.entity';
import { EstadoOperacion } from './entities/estado-operacion.entity';

@Injectable()
export class OperacionesService {
  constructor(
    @InjectRepository(Operacion)       private operRepo: Repository<Operacion>,
    @InjectRepository(ChequeDetalle)   private chequeRepo: Repository<ChequeDetalle>,
    @InjectRepository(Cuota)           private cuotaRepo: Repository<Cuota>,
    @InjectRepository(EstadoOperacion) private estadoRepo: Repository<EstadoOperacion>,
    @InjectDataSource()                private ds: DataSource,
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
    data: Record<string, any>,
    cheques?: Partial<ChequeDetalle>[],
    cuotas?: Partial<Cuota>[],
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
        estado: data.estado ?? 'EN_ANALISIS',
        bitacora: [],
      }),
    );

    let savedCheques: ChequeDetalle[] = [];
    if (cheques?.length) {
      const items = cheques.map(c => this.chequeRepo.create({ ...c, operacionId: operacion.id }));
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
        estado:           'PENDIENTE',
      }));
    }

    if (cuotasToSave.length) {
      const items = cuotasToSave.map(c => this.cuotaRepo.create({ ...c, operacionId: operacion.id }));
      await this.cuotaRepo.save(items);
    }

    return this.findById(operacion.id);
  }

  // ── Actualizar ────────────────────────────────────────────────────────────
  async update(id: string, data: Partial<Operacion>) {
    await this.operRepo.update(id, data);
    return this.findById(id);
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────
  async cambiarEstado(id: string, estado: string, nota?: string, usuarioEmail?: string) {
    const op = await this.operRepo.findOne({ where: { id } });
    if (!op) throw new NotFoundException('Operación no encontrada');

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
  async registrarProrroga(id: string, data: { nuevaFecha: string; nuevaTasa?: number; nota?: string }) {
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
      estado:           'PRORROGADO',
      bitacora,
    });

    return this.findById(id);
  }

  // ── Cheques ───────────────────────────────────────────────────────────────
  async updateCheque(id: string, data: Partial<ChequeDetalle>) {
    await this.chequeRepo.update(id, data);
    return this.chequeRepo.findOne({ where: { id } });
  }

  // ── Cuotas ────────────────────────────────────────────────────────────────
  async registrarPagoCuota(cuotaId: string, data: { montoPagado: number; fechaPago: string }) {
    const cuota = await this.cuotaRepo.findOne({ where: { id: cuotaId } });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');

    const pagado = Number(cuota.pagado) + Number(data.montoPagado);
    const saldo  = Math.max(0, Number(cuota.total) + Number(cuota.cargoMora ?? 0) - pagado);
    const estado = saldo <= 0 ? 'PAGADO' : 'PENDIENTE';

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

  createEstado(d: Partial<EstadoOperacion>) { return this.estadoRepo.save(this.estadoRepo.create(d)); }

  async updateEstado(id: string, d: Partial<EstadoOperacion>) {
    await this.estadoRepo.update(id, d);
    return this.estadoRepo.findOne({ where: { id } });
  }
}
