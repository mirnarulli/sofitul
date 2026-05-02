import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoringCliente } from './entities/scoring-cliente.entity';
import { CreateScoringClienteDto } from './dto/create-scoring-cliente.dto';
import { UpdateScoringClienteDto } from './dto/update-scoring-cliente.dto';

@Injectable()
export class ScoringClientesService {
  constructor(
    @InjectRepository(ScoringCliente) private repo: Repository<ScoringCliente>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCi(ci: string) {
    return this.repo.find({ where: { ci }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const sc = await this.repo.findOne({ where: { id } });
    if (!sc) throw new NotFoundException(`Scoring ${id} no encontrado`);
    return sc;
  }

  create(body: CreateScoringClienteDto) {
    return this.repo.save(this.repo.create(body));
  }

  async update(id: string, body: UpdateScoringClienteDto) {
    await this.findById(id);
    await this.repo.update(id, body as Partial<ScoringCliente>);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
    return { ok: true };
  }
}
