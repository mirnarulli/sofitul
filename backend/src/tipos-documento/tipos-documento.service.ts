import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoDocumento } from '../entities';

@Injectable()
export class TiposDocumentoService {
  constructor(@InjectRepository(TipoDocumento) private repo: Repository<TipoDocumento>) {}

  findAll()    { return this.repo.find({ order: { orden: 'ASC', nombre: 'ASC' } }); }
  findActivos(){ return this.repo.find({ where: { activo: true }, order: { orden: 'ASC', nombre: 'ASC' } }); }
  findDueDiligencia() {
    return this.repo.find({ where: { activo: true, esDueDiligencia: true }, order: { orden: 'ASC', nombre: 'ASC' } });
  }

  create(data: Partial<TipoDocumento>)  { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<TipoDocumento>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
  async delete(id: string) { await this.repo.delete(id); return { mensaje: 'Eliminado' }; }

  /**
   * Seed de tipos de documento Due Diligence estándar.
   * Usa upsert por código para poder agregar/corregir sin duplicar.
   * También limpia entradas incorrectas (RUC no es un documento, es dato de formulario).
   */
  async seedDueDiligencia() {
    // Limpieza: RUC no es un tipo de documento adjuntable, es dato del contacto
    const rucEntry = await this.repo.findOne({ where: { codigo: 'RUC', esDueDiligencia: true } });
    if (rucEntry) await this.repo.delete(rucEntry.id);

    const defaults: Partial<TipoDocumento>[] = [
      // Persona Física
      { codigo: 'CI',      nombre: 'Cédula de Identidad',                descripcion: 'Documento de identidad nacional',                               esDueDiligencia: true, aplicaTipo: 'pf',    orden: 1,  activo: true },
      { codigo: 'CI_EXT',  nombre: 'Cédula Extranjera',                  descripcion: 'Documento de identidad extranjero',                             esDueDiligencia: true, aplicaTipo: 'pf',    orden: 2,  activo: true },
      { codigo: 'PASAP',   nombre: 'Pasaporte',                          descripcion: 'Pasaporte vigente',                                             esDueDiligencia: true, aplicaTipo: 'pf',    orden: 3,  activo: true },
      { codigo: 'DOC_HAB', nombre: 'Documento Habilitante del Firmante', descripcion: 'Poder notarial, acta o estatuto que acredita su representación', esDueDiligencia: true, aplicaTipo: 'pf',    orden: 4,  activo: true },
      // Persona Jurídica
      { codigo: 'CONST',   nombre: 'Constitución Social',                descripcion: 'Escritura de constitución de la empresa',                       esDueDiligencia: true, aplicaTipo: 'pj',    orden: 11, activo: true },
      { codigo: 'ACTA_AS', nombre: 'Último Acta de Asamblea',            descripcion: 'Acta de asamblea con designación de autoridades vigente',       esDueDiligencia: true, aplicaTipo: 'pj',    orden: 12, activo: true },
      // Ambos
      { codigo: 'CUMPL_T', nombre: 'Cumplimiento Tributario',            descripcion: 'Certificado de cumplimiento tributario vigente',                esDueDiligencia: true, aplicaTipo: 'ambos', orden: 20, activo: true },
    ];

    for (const d of defaults) {
      const exists = await this.repo.findOne({ where: { codigo: d.codigo } });
      if (!exists) await this.repo.save(this.repo.create(d));
    }
  }
}
