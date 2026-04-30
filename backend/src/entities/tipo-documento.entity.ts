import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tipos_documento')
export class TipoDocumento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Código corto único: CI, RUC, CONST, etc. */
  @Column({ nullable: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  abreviatura: string;

  @Column({ default: true })
  activo: boolean;

  /** Si este tipo de documento es parte del Due Diligence de una operación */
  @Column({ name: 'es_due_diligencia', default: false })
  esDueDiligencia: boolean;

  /** A quién aplica en el contexto de due diligence: 'pf' | 'pj' | 'ambos' */
  @Column({ name: 'aplica_tipo', default: 'ambos' })
  aplicaTipo: string;

  /** Orden de visualización */
  @Column({ name: 'orden', default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
