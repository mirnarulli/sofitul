import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Documento adjunto vinculado a un contacto PF o PJ. */
@Entity('documentos_contacto')
export class DocumentoContacto {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'contacto_tipo' })
  contactoTipo: string;                     // 'pf' | 'pj'

  @Column({ name: 'contacto_id' })
  contactoId: string;

  @Column({ name: 'tipo_id', nullable: true })
  tipoId: string;                           // FK lógica a tipos_documento_adjunto

  @Column({ name: 'tipo_nombre' })
  tipoNombre: string;                       // desnormalizado

  @Column({ name: 'tipo_categoria', nullable: true })
  tipoCategoria: string;                    // 'documentos' | 'due_diligence'

  @Column({ name: 'fecha_documento', type: 'date', nullable: true })
  fechaDocumento: string;                   // fecha del documento (emisión / vto / relevante)

  @Column({ nullable: true })
  url: string;                              // ruta relativa del archivo cargado

  @Column({ nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
