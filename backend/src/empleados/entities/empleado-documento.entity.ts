import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('empleado_documentos')
export class EmpleadoDocumento {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'empleado_id' }) empleadoId: string;
  @Column() tipo: string;
  @Column({ name: 'nombre_documento', nullable: true }) nombreDocumento: string;
  @Column({ name: 'url_archivo', nullable: true }) urlArchivo: string;
  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true }) fechaVencimiento: string;
  @Column({ nullable: true }) observaciones: string;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
