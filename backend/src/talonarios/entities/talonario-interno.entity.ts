import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('talonarios_internos')
export class TalonarioInterno {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'empleado_id' }) empleadoId: string;
  @Column({ unique: true, length: 3 }) prefijo: string;
  @Column({ name: 'nro_siguiente', default: 1 }) nroSiguiente: number;
  @Column({ default: true }) activo: boolean;
  @Column({ name: 'fecha_asignacion', type: 'date', nullable: true }) fechaAsignacion: string;
  @Column({ name: 'asignado_por_id', nullable: true }) asignadoPorId: string;
  @Column({ nullable: true }) observaciones: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
