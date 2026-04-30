import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banco } from '../entities';

const BANCOS_PY = [
  { codigo: 'CONTINENTAL', nombre: 'Banco Continental S.A.E.C.A.', abreviatura: 'Continental', orden: 1 },
  { codigo: 'ITAU',        nombre: 'Banco Itaú Paraguay S.A.',      abreviatura: 'Itaú',        orden: 2 },
  { codigo: 'REGIONAL',    nombre: 'Banco Regional S.A.E.C.A.',     abreviatura: 'Regional',    orden: 3 },
  { codigo: 'SUDAMERIS',   nombre: 'Sudameris Bank S.A.E.C.A.',     abreviatura: 'Sudameris',   orden: 4 },
  { codigo: 'BBVA',        nombre: 'BBVA Paraguay S.A.',            abreviatura: 'BBVA',        orden: 5 },
  { codigo: 'BASA',        nombre: 'Banco BASA S.A.',               abreviatura: 'BASA',        orden: 6 },
  { codigo: 'BNF',         nombre: 'Banco Nacional de Fomento',     abreviatura: 'BNF',         orden: 7 },
  { codigo: 'INTERFISA',   nombre: 'Interfisa Banco S.A.E.C.A.',    abreviatura: 'Interfisa',   orden: 8 },
  { codigo: 'VISION',      nombre: 'Visión Banco S.A.E.C.A.',       abreviatura: 'Visión',      orden: 9 },
  { codigo: 'BANCOP',      nombre: 'Bancop S.A.',                   abreviatura: 'Bancop',      orden: 10 },
  { codigo: 'PATIO',       nombre: 'Banco Patio S.A.',              abreviatura: 'Patio',       orden: 11 },
  { codigo: 'UENO',        nombre: 'Ueno Bank S.A.',                abreviatura: 'Ueno',        orden: 12 },
  { codigo: 'RIO',         nombre: 'Banco RIO S.A.E.C.A.',          abreviatura: 'RIO',         orden: 13 },
  { codigo: 'ATLAS',       nombre: 'Atlas Bank S.A.',               abreviatura: 'Atlas',       orden: 14 },
  { codigo: 'GNB',         nombre: 'Banco GNB Paraguay S.A.',       abreviatura: 'GNB',         orden: 15 },
];

@Injectable()
export class BancosService implements OnModuleInit {
  constructor(@InjectRepository(Banco) private repo: Repository<Banco>) {}

  async onModuleInit() {
    for (const b of BANCOS_PY) {
      const exists = await this.repo.findOne({ where: { codigo: b.codigo } });
      if (!exists) await this.repo.save(this.repo.create({ ...b, activo: true }));
    }
  }

  findAll()     { return this.repo.find({ order: { orden: 'ASC', nombre: 'ASC' } }); }
  findActivos() { return this.repo.find({ where: { activo: true }, order: { orden: 'ASC', nombre: 'ASC' } }); }
  create(data: Partial<Banco>) { return this.repo.save(this.repo.create(data)); }

  async update(id: string, data: Partial<Banco>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
