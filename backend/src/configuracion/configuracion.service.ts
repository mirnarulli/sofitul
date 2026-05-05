import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Configuracion } from '../entities';

@Injectable()
export class ConfiguracionService {
  constructor(@InjectRepository(Configuracion) private repo: Repository<Configuracion>) {}

  findAll() { return this.repo.find(); }

  async get(clave: string): Promise<string | null> {
    const conf = await this.repo.findOne({ where: { clave } });
    return conf?.valor ?? null;
  }

  async set(clave: string, valor: string, descripcion?: string): Promise<Configuracion> {
    let conf = await this.repo.findOne({ where: { clave } });
    if (conf) {
      conf.valor = valor;
      if (descripcion) conf.descripcion = descripcion;
    } else {
      conf = this.repo.create({ clave, valor, descripcion });
    }
    return this.repo.save(conf);
  }

  async getLogos() {
    const keys = ['logo_barra_menu_claro', 'logo_barra_menu_oscuro', 'logo_iso', 'logo_reporte'];
    const rows = await this.repo.find({ where: keys.map(k => ({ clave: k })) as any });
    return Object.fromEntries(rows.map(r => [r.clave, r.valor]));
  }

  async getEmpresa(): Promise<{ empresa_nombre: string; empresa_ruc: string; empresa_direccion: string; empresa_ciudad: string }> {
    const keys = ['empresa_nombre', 'empresa_ruc', 'empresa_direccion', 'empresa_ciudad'];
    const rows = await this.repo.find({ where: keys.map(k => ({ clave: k })) as any });
    const m = Object.fromEntries(rows.map(r => [r.clave, r.valor]));
    return {
      empresa_nombre:     m['empresa_nombre']     ?? 'SOFITUL',
      empresa_ruc:        m['empresa_ruc']        ?? '',
      empresa_direccion:  m['empresa_direccion']  ?? '',
      empresa_ciudad:     m['empresa_ciudad']      ?? 'Asunción, Paraguay',
    };
  }

  // ── Seguridad / Sesiones ──────────────────────────────────────────────────

  async getSeguridad(): Promise<{ session_duracion_horas: number; sesion_inactividad_minutos: number }> {
    const rows = await this.repo.findBy({ clave: In(['session_duracion_horas', 'sesion_inactividad_minutos']) });
    const map  = Object.fromEntries(rows.map(r => [r.clave, r.valor]));
    return {
      session_duracion_horas:     Number(map['session_duracion_horas']     ?? 8),
      sesion_inactividad_minutos: Number(map['sesion_inactividad_minutos'] ?? 120),
    };
  }

  async setSeguridad(data: { session_duracion_horas?: number; sesion_inactividad_minutos?: number }): Promise<void> {
    const entries: { clave: string; valor: string }[] = [];
    if (data.session_duracion_horas !== undefined)
      entries.push({ clave: 'session_duracion_horas',     valor: String(data.session_duracion_horas) });
    if (data.sesion_inactividad_minutos !== undefined)
      entries.push({ clave: 'sesion_inactividad_minutos', valor: String(data.sesion_inactividad_minutos) });
    for (const e of entries) await this.repo.upsert(e, ['clave']);
  }

  /** Shortcut para auth.service — duración del JWT en horas */
  async getSessionDuracionHoras(): Promise<number> {
    const row = await this.repo.findOneBy({ clave: 'session_duracion_horas' });
    return Number(row?.valor ?? 8);
  }
}
