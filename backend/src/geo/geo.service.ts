import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento, Ciudad } from '../entities';

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Departamento) private deptRepo: Repository<Departamento>,
    @InjectRepository(Ciudad)       private ciudadRepo: Repository<Ciudad>,
  ) {}

  getDepartamentos() {
    return this.deptRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  getCiudades(departamentoId?: number) {
    return this.ciudadRepo.find({
      where: { activo: true, ...(departamentoId ? { departamentoId } : {}) },
      order: { nombre: 'ASC' },
    });
  }
}
