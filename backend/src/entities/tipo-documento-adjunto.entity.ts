import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Catálogo configurable de tipos de documentos adjuntos.
 *  categoria: 'documentos' | 'due_diligence'
 */
@Entity('tipos_documento_adjunto')
export class TipoDocumentoAdjunto {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true })
  codigo: string;                       // ej: 'cedula', 'informconf', 'infocheck'

  @Column()
  nombre: string;                       // ej: 'Cédula de Identidad', 'Informe INFORMCONF'

  @Column({ nullable: true })
  descripcion: string;

  @Column()
  categoria: string;                    // 'documentos' | 'due_diligence'

  @Column({ default: false })
  requerido: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
