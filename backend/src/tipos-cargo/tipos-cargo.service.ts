import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoCargo } from '../entities';

const TIPOS_CARGO_SEED = [
  // ── Intereses ──────────────────────────────────────────────────────────────
  { codigo: 'INT_MENSUAL',         nombre: 'Interés mensual',           categoria: 'INTERES',     aplicaEn: 'POR_CUOTA',        baseCalculo: 'CAPITAL_OPERACION', porcentaje: null, montoFijo: null,  esObligatorio: true,  permisoExonerar: null,                   orden: 1 },
  { codigo: 'INT_MORA',            nombre: 'Interés por mora',          categoria: 'MORA',        aplicaEn: 'POR_CUOTA',        baseCalculo: 'SALDO_VENCIDO',     porcentaje: null, montoFijo: null,  esObligatorio: true,  permisoExonerar: 'cargos:exonerar_mora', orden: 2 },
  // ── Gastos administrativos ─────────────────────────────────────────────────
  { codigo: 'GASTO_APERTURA',      nombre: 'Gasto apertura',            categoria: 'GASTO_ADMIN', aplicaEn: 'INICIO_OPERACION', baseCalculo: 'CAPITAL_OPERACION', porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 3 },
  { codigo: 'GASTO_NOTIF',         nombre: 'Gasto de notificación',     categoria: 'GASTO_ADMIN', aplicaEn: 'POR_CUOTA',        baseCalculo: 'FIJO',              montoFijo: 15000, porcentaje: null, esObligatorio: false, permisoExonerar: null,                   orden: 4 },
  { codigo: 'GASTO_LLAMADA',       nombre: 'Gestión de llamado',        categoria: 'GASTO_ADMIN', aplicaEn: 'POR_CUOTA',        baseCalculo: 'FIJO',              montoFijo: 10000, porcentaje: null, esObligatorio: false, permisoExonerar: null,                   orden: 5 },
  { codigo: 'GASTO_COBRANZA_JUD',  nombre: 'Gastos de cobranza judicial', categoria: 'GASTO_ADMIN', aplicaEn: 'POR_CUOTA',      baseCalculo: 'FIJO',              porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 6 },
  { codigo: 'GASTO_NOTARIAL',      nombre: 'Gastos notariales',         categoria: 'GASTO_ADMIN', aplicaEn: 'POR_CUOTA',        baseCalculo: 'FIJO',              porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 7 },
  { codigo: 'COMISION_COBRADOR',   nombre: 'Comisión cobrador externo', categoria: 'GASTO_ADMIN', aplicaEn: 'POR_CUOTA',        baseCalculo: 'FIJO',              porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 8 },
  // ── Prórroga ───────────────────────────────────────────────────────────────
  { codigo: 'CARGO_PRORROGA',      nombre: 'Cargo por prórroga',        categoria: 'PRORROGA',    aplicaEn: 'POR_CUOTA',        baseCalculo: 'MONTO_CUOTA',       porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 9 },
  // ── Seguros ────────────────────────────────────────────────────────────────
  { codigo: 'SEGURO_VIDA',         nombre: 'Seguro de vida',            categoria: 'SEGURO',      aplicaEn: 'INICIO_OPERACION', baseCalculo: 'CAPITAL_OPERACION', porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 10 },
  { codigo: 'SEGURO_BIEN',         nombre: 'Seguro del bien',           categoria: 'SEGURO',      aplicaEn: 'INICIO_OPERACION', baseCalculo: 'CAPITAL_OPERACION', porcentaje: null, montoFijo: null,  esObligatorio: false, permisoExonerar: null,                   orden: 11 },
];

@Injectable()
export class TiposCargoService implements OnModuleInit {
  constructor(@InjectRepository(TipoCargo) private repo: Repository<TipoCargo>) {}

  async onModuleInit() {
    for (const t of TIPOS_CARGO_SEED) {
      const exists = await this.repo.findOne({ where: { codigo: t.codigo } });
      if (!exists) await this.repo.save(this.repo.create({ ...t, activo: true }));
    }
  }

  findAll()     { return this.repo.find({ order: { orden: 'ASC', nombre: 'ASC' } }); }
  findActivos() { return this.repo.find({ where: { activo: true }, order: { orden: 'ASC', nombre: 'ASC' } }); }

  create(data: Partial<TipoCargo>) { return this.repo.save(this.repo.create(data)); }

  async update(id: string, data: Partial<TipoCargo>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
