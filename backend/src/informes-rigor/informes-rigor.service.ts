import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformeRigor } from '../entities';

@Injectable()
export class InformesRigorService {
  constructor(
    @InjectRepository(InformeRigor)
    private repo: Repository<InformeRigor>,
  ) {}

  findAll()     { return this.repo.find({ order: { servicio: 'ASC', tipoInforme: 'ASC' } }); }
  findActivos() { return this.repo.find({ where: { activo: true }, order: { servicio: 'ASC', tipoInforme: 'ASC' } }); }

  /** Devuelve activos que aplican a PF ('persona') o PJ ('empresa') + los de servicio puro */
  findByTipo(tipoInforme: string) {
    return this.repo.find({ where: { activo: true, tipoInforme }, order: { servicio: 'ASC' } });
  }

  async create(data: Partial<InformeRigor>) {
    // Auto-generar codigo = servicio_tipoInforme si no viene
    if (!data.codigo) {
      data.codigo = `${data.servicio}_${data.tipoInforme}`.toLowerCase().replace(/\s+/g, '_');
    }
    // Nombre por defecto
    if (!data.nombre) {
      const s = (data.servicio ?? '').toUpperCase();
      const t = data.tipoInforme === 'empresa' ? 'Empresa' : 'Persona';
      data.nombre = `${s} — ${t}`;
    }
    const existing = await this.repo.findOne({ where: { codigo: data.codigo } });
    if (existing) throw new ConflictException(`Ya existe un informe con código "${data.codigo}"`);
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<InformeRigor>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  /** Seed inicial de los 6 informes estándar (solo si la tabla está vacía) */
  async seedDefaults() {
    const count = await this.repo.count();
    if (count > 0) return;
    const defaults = [
      { servicio: 'informconf', tipoInforme: 'persona', codigo: 'informconf_persona', nombre: 'INFORMCONF — Persona', descripcion: 'Informe crediticio de persona física', requerido: true },
      { servicio: 'informconf', tipoInforme: 'empresa',  codigo: 'informconf_empresa',  nombre: 'INFORMCONF — Empresa',  descripcion: 'Informe crediticio de persona jurídica', requerido: true },
      { servicio: 'infocheck',  tipoInforme: 'persona', codigo: 'infocheck_persona',  nombre: 'INFOCHECK — Persona',  descripcion: 'Verificación de cheques emitidos por persona', requerido: true },
      { servicio: 'infocheck',  tipoInforme: 'empresa',  codigo: 'infocheck_empresa',   nombre: 'INFOCHECK — Empresa',   descripcion: 'Verificación de cheques emitidos por empresa', requerido: true },
      { servicio: 'criterion',  tipoInforme: 'persona', codigo: 'criterion_persona',  nombre: 'CRITERION — Persona',  descripcion: 'Análisis de riesgo de persona física', requerido: false },
      { servicio: 'criterion',  tipoInforme: 'empresa',  codigo: 'criterion_empresa',   nombre: 'CRITERION — Empresa',   descripcion: 'Análisis de riesgo de persona jurídica', requerido: false },
    ];
    for (const d of defaults) {
      await this.repo.save(this.repo.create({ ...d, activo: true }));
    }
  }
}
