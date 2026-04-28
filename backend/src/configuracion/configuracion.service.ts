import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
