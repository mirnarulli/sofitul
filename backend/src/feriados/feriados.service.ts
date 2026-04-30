import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Feriado } from './feriado.entity';

@Injectable()
export class FeriadosService {
  constructor(
    @InjectRepository(Feriado) private repo: Repository<Feriado>,
    @InjectDataSource()        private ds: DataSource,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  findAll(año?: number) {
    if (año) {
      // Devuelve FIJO (todos los años) + MOVIL/EVENTUAL del año solicitado
      return this.ds.query(
        `SELECT * FROM feriados
         WHERE activo = true
           AND (tipo = 'FIJO' OR EXTRACT(YEAR FROM fecha) = $1)
         ORDER BY fecha ASC`,
        [año],
      );
    }
    return this.repo.find({ order: { fecha: 'ASC' } });
  }

  create(dto: Partial<Feriado>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: Partial<Feriado>) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  // ── Helpers de días hábiles ───────────────────────────────────────────────

  /** true si la fecha cae sábado (6) o domingo (0) */
  private esFinDeSemana(d: Date): boolean {
    return d.getDay() === 0 || d.getDay() === 6;
  }

  /** true si la fecha está en la tabla feriados (activo = true).
   *  Los FIJO se comparan por MM-DD (aplican todos los años). */
  async esFeriado(fecha: Date): Promise<boolean> {
    const iso  = this.toISO(fecha);   // 'YYYY-MM-DD'
    const mmdd = iso.slice(5);        // 'MM-DD'

    // Coincidencia exacta (MOVIL / EVENTUAL / FIJO con año específico)
    const exacto = await this.repo.findOne({ where: { fecha: iso, activo: true } });
    if (exacto) return true;

    // FIJO: mismo mes-día sin importar el año
    const [row] = await this.ds.query(
      `SELECT id FROM feriados
       WHERE tipo = 'FIJO' AND activo = true
         AND TO_CHAR(fecha, 'MM-DD') = $1
       LIMIT 1`,
      [mmdd],
    );
    return !!row;
  }

  /** true si es día hábil (no fin de semana y no feriado) */
  async esHabil(fecha: Date): Promise<boolean> {
    if (this.esFinDeSemana(fecha)) return false;
    return !(await this.esFeriado(fecha));
  }

  /**
   * Si la fecha no es hábil, la corre hacia adelante hasta el próximo día hábil.
   * Devuelve la fecha ajustada y los días extra que se agregaron.
   * Si ya era hábil, diasExtra = 0.
   */
  async ajustarFecha(fecha: Date): Promise<{ fecha: Date; diasExtra: number }> {
    const d = new Date(fecha);
    let extra = 0;
    while (!(await this.esHabil(d))) {
      d.setDate(d.getDate() + 1);
      extra++;
    }
    return { fecha: d, diasExtra: extra };
  }

  /** Cantidad de días hábiles entre dos fechas (incluye 'desde', excluye 'hasta') */
  async diasHabiles(desde: Date, hasta: Date): Promise<number> {
    let count = 0;
    const d = new Date(desde);
    while (d < hasta) {
      if (await this.esHabil(d)) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  // ── Utilidad privada ──────────────────────────────────────────────────────

  private toISO(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
