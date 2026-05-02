import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('conciliaciones')
export class Conciliacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'cobrador_id', nullable: true }) cobradorId: string;
  @Column({ name: 'caja_id', nullable: true }) cajaId: string;
  @Column({ name: 'fecha_periodo', type: 'date' }) fechaPeriodo: string;
  @Column({ default: 'DIARIA' }) tipo: string;
  @Column({ default: 'ABIERTA' }) estado: string;
  @Column({ name: 'monto_esperado', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoEsperado: number;
  @Column({ name: 'monto_declarado', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoDeclarado: number;
  @Column({ name: 'monto_recibido', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoRecibido: number;
  @Column({ type: 'decimal', precision: 20, scale: 0, default: 0 }) diferencia: number;
  @Column({ name: 'cerrado_por_id', nullable: true }) cerradoPorId: string;
  @Column({ name: 'fecha_cierre', type: 'date', nullable: true }) fechaCierre: string;
  @Column({ nullable: true, type: 'text' }) observaciones: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
