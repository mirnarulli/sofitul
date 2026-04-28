import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cuotas')
export class Cuota {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'operacion_id' })                          operacionId: string;
  @Column({ name: 'nro_cuota' })                             nroCuota: number;
  @Column({ name: 'fecha_vencimiento', type: 'date' })       fechaVencimiento: string;
  @Column({ type: 'decimal', precision: 20, scale: 0 })      capital: number;
  @Column({ type: 'decimal', precision: 20, scale: 0 })      interes: number;
  @Column({ type: 'decimal', precision: 20, scale: 0 })      total: number;
  @Column({ type: 'decimal', precision: 20, scale: 0, default: 0 }) pagado: number;
  @Column({ type: 'decimal', precision: 20, scale: 0, default: 0 }) saldo: number;

  // Estado: PENDIENTE | PAGADO | VENCIDO | MORA | PRORROGADO
  @Column({ default: 'PENDIENTE' })                          estado: string;
  @Column({ name: 'fecha_pago', type: 'date', nullable: true }) fechaPago: string;
  @Column({ name: 'dias_mora', default: 0 })                 diasMora: number;
  @Column({ name: 'cargo_mora', type: 'decimal', precision: 20, scale: 0, default: 0 }) cargoMora: number;

  @Column({ type: 'text', nullable: true })                  observaciones: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
