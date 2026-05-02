import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { EmpleadoDocumento } from './entities/empleado-documento.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateDocumentoDto } from './dto/create-documento.dto';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado) private repo: Repository<Empleado>,
    @InjectRepository(EmpleadoDocumento) private docRepo: Repository<EmpleadoDocumento>,
  ) {}

  findAll(q?: string) {
    if (q) {
      const like = ILike(`%${q}%`);
      return this.repo.find({
        where: [{ nombre: like }, { apellido: like }, { nroDoc: like }],
        order: { apellido: 'ASC', nombre: 'ASC' },
      });
    }
    return this.repo.find({ order: { apellido: 'ASC', nombre: 'ASC' } });
  }

  findCobradores() {
    return this.repo.find({
      where: { esCobrador: true, estado: 'ACTIVO' },
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
  }

  async findById(id: string) {
    const emp = await this.repo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException(`Empleado ${id} no encontrado`);
    return emp;
  }

  create(body: CreateEmpleadoDto, userId: string) {
    return this.repo.save(this.repo.create({ ...body, creadoPorId: userId }));
  }

  async update(id: string, body: UpdateEmpleadoDto) {
    await this.findById(id);
    await this.repo.update(id, body as Partial<Empleado>);
    return this.repo.findOne({ where: { id } });
  }

  addDocumento(empleadoId: string, body: CreateDocumentoDto) {
    return this.docRepo.save(this.docRepo.create({ ...body, empleadoId }));
  }

  async updateDocumento(id: string, body: Partial<EmpleadoDocumento>) {
    await this.docRepo.update(id, body);
    return this.docRepo.findOne({ where: { id } });
  }

  async deleteDocumento(id: string) {
    await this.docRepo.update(id, { activo: false });
    return { ok: true };
  }

  async setDocumentoUrl(docId: string, url: string) {
    await this.docRepo.update(docId, { urlArchivo: url });
    return this.docRepo.findOne({ where: { id: docId } });
  }

  findDocumentosByEmpleado(empleadoId: string) {
    return this.docRepo.find({ where: { empleadoId, activo: true }, order: { createdAt: 'DESC' } });
  }
}
