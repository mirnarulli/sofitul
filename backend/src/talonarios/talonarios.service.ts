import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TalonarioInterno } from './entities/talonario-interno.entity';
import { TimbradoSet } from './entities/timbrado-set.entity';
import { CreateTimbradoDto } from './dto/create-timbrado.dto';

@Injectable()
export class TalonerosService {
  constructor(
    @InjectRepository(TalonarioInterno) private talonRepo: Repository<TalonarioInterno>,
    @InjectRepository(TimbradoSet) private timbradoRepo: Repository<TimbradoSet>,
    private ds: DataSource,
  ) {}

  // ── Talonarios internos ──────────────────────────────────────────────────

  findTalonariosByEmpleado(empleadoId: string) {
    return this.talonRepo.find({ where: { empleadoId }, order: { createdAt: 'ASC' } });
  }

  async findNextPrefijo(): Promise<string> {
    const result = await this.talonRepo
      .createQueryBuilder('t')
      .select('MAX(t.prefijo)', 'maxPrefijo')
      .getRawOne();
    const maxPrefijo = result?.maxPrefijo;
    if (!maxPrefijo) return '001';
    const next = parseInt(maxPrefijo, 10) + 1;
    return String(next).padStart(3, '0');
  }

  async asignarTalonario(empleadoId: string, asignadoPorId: string, observaciones?: string) {
    const prefijo = await this.findNextPrefijo();
    const hoy = new Date().toISOString().split('T')[0];
    return this.talonRepo.save(
      this.talonRepo.create({
        empleadoId,
        prefijo,
        nroSiguiente: 1,
        activo: true,
        fechaAsignacion: hoy,
        asignadoPorId,
        observaciones,
      }),
    );
  }

  async generarNroRecibo(talonarioId: string): Promise<string> {
    return this.ds.transaction(async (em) => {
      const repo = em.getRepository(TalonarioInterno);
      const talonario = await repo.findOne({ where: { id: talonarioId } });
      if (!talonario) throw new NotFoundException(`Talonario ${talonarioId} no encontrado`);
      if (!talonario.activo) throw new BadRequestException('Talonario inactivo');
      const nro = talonario.nroSiguiente;
      await repo.update(talonarioId, { nroSiguiente: nro + 1 });
      return `${talonario.prefijo}-${String(nro).padStart(6, '0')}`;
    });
  }

  // ── Timbrados ────────────────────────────────────────────────────────────

  findTimbrados() {
    return this.timbradoRepo.find({ order: { createdAt: 'DESC' } });
  }

  findTimbradoActivo() {
    const hoy = new Date().toISOString().split('T')[0];
    return this.timbradoRepo
      .createQueryBuilder('t')
      .where('t.estado = :estado', { estado: 'ACTIVO' })
      .andWhere('t.fechaVigenciaDesde <= :hoy', { hoy })
      .andWhere('t.fechaVigenciaHasta >= :hoy', { hoy })
      .orderBy('t.createdAt', 'DESC')
      .getOne();
  }

  async createTimbrado(body: CreateTimbradoDto, userId: string) {
    const timbrado = this.timbradoRepo.create({
      ...body,
      nroSiguiente: body.nroDesde,
      estado: 'ACTIVO',
      registradoPorId: userId,
    });
    return this.timbradoRepo.save(timbrado);
  }

  async updateTimbrado(id: string, body: Partial<TimbradoSet>) {
    await this.timbradoRepo.update(id, body);
    return this.timbradoRepo.findOne({ where: { id } });
  }

  async generarNroFiscal(timbradoId: string): Promise<string> {
    return this.ds.transaction(async (em) => {
      const repo = em.getRepository(TimbradoSet);
      const timbrado = await repo.findOne({ where: { id: timbradoId } });
      if (!timbrado) throw new NotFoundException(`Timbrado ${timbradoId} no encontrado`);
      if (timbrado.estado !== 'ACTIVO') throw new BadRequestException('Timbrado no activo');
      const nro = Number(timbrado.nroSiguiente);
      if (nro > Number(timbrado.nroHasta)) {
        await repo.update(timbradoId, { estado: 'AGOTADO' });
        throw new BadRequestException('Timbrado agotado');
      }
      await repo.update(timbradoId, { nroSiguiente: nro + 1 });
      return `${timbrado.establecimiento}-${timbrado.puntoExpedicion}-${String(nro).padStart(7, '0')}`;
    });
  }

  async verificarVigenciaTimbrados() {
    await this.timbradoRepo.query(`
      UPDATE timbrados_set
      SET estado = 'VENCIDO'
      WHERE estado = 'ACTIVO' AND fecha_vigencia_hasta < CURRENT_DATE
    `);
  }
}
