import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Seguimiento de Due Diligence por operación.
 * Cada fila = un tipo de documento requerido para un sujeto (empresa o firmante)
 * dentro de una operación específica.
 */
@Entity('operacion_informes_rigor')
export class OperacionInformeRigor {
  @PrimaryGeneratedColumn('uuid') id: string;

  /** ID de la operación */
  @Column({ name: 'operacion_id' })
  operacionId: string;

  /** ID del TipoDocumento (esDueDiligencia=true) */
  @Column({ name: 'tipo_documento_id' })
  tipoDocumentoId: string;

  /** Nombre del tipo de documento (snapshot para evitar joins) */
  @Column({ name: 'tipo_nombre' })
  tipoNombre: string;

  /** A quién aplica: 'firmante' | 'empresa' */
  @Column({ name: 'sujeto_tipo' })
  sujetoTipo: string;

  /** ID del contacto (PF o PJ) al que aplica */
  @Column({ name: 'sujeto_id', nullable: true })
  sujetoId: string;

  /** Nombre del sujeto (snapshot) */
  @Column({ name: 'sujeto_nombre', nullable: true })
  sujetoNombre: string;

  /** Estado: 'pendiente' | 'cargado' | 'aprobado' | 'no_aplica' */
  @Column({ default: 'pendiente' })
  estado: string;

  /** URL del archivo subido */
  @Column({ name: 'archivo_url', nullable: true })
  archivoUrl: string;

  /** Nombre original del archivo */
  @Column({ name: 'archivo_nombre', nullable: true })
  archivoNombre: string;

  /** ID del operador que cargó */
  @Column({ name: 'operador_id', nullable: true })
  operadorId: string;

  /** Nombre del operador (snapshot) */
  @Column({ name: 'operador_nombre', nullable: true })
  operadorNombre: string;

  /** Fecha en que se cargó el documento */
  @Column({ name: 'fecha_carga', nullable: true, type: 'timestamptz' })
  fechaCarga: Date;

  /** Observación del analista */
  @Column({ nullable: true })
  observacion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
