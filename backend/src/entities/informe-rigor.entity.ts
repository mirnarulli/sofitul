import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Catálogo de Informes de Rigor — configurable desde Panel Global. */
@Entity('informes_rigor')
export class InformeRigor {
  @PrimaryGeneratedColumn('uuid') id: string;

  /** Código clave que se usa en formularios/operaciones (ej: informconf, infocheck, contrato, pagare, cheques) */
  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  /** A qué tipo de contacto aplica: 'pf' | 'pj' | 'ambos' */
  @Column({ name: 'aplica_a', default: 'ambos' })
  aplicaA: string;

  @Column({ default: false })
  requerido: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
