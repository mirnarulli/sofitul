import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformeRigor } from '../entities';

@Injectable()
export class InformesRigorService {
  constructor(
    @InjectRepository(InformeRigor)
    private repo: Repository<InformeRigor>,
  ) {}

  findAll()      { return this.repo.find({ order: { aplicaA: 'ASC', nombre: 'ASC' } }); }
  findActivos()  { return this.repo.find({ where: { activo: true }, order: { aplicaA: 'ASC', nombre: 'ASC' } }); }
  findByAplica(aplicaA: string) {
    // Devuelve los que aplican a ese tipo + los que aplican a 'ambos'
    return this.repo
      .createQueryBuilder('ir')
      .where('ir.activo = true')
      .andWhere('(ir.aplica_a = :aplica OR ir.aplica_a = :ambos)', { aplica: aplicaA, ambos: 'ambos' })
      .orderBy('ir.nombre', 'ASC')
      .getMany();
  }

  create(data: Partial<InformeRigor>)            { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<InformeRigor>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
