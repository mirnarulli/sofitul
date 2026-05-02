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

  // Interés — desglose pagado
  @Column({ name: 'interes_pagado', type: 'decimal', precision: 20, scale: 0, default: 0 }) interesPagado: number;

  // Mora
  @Column({ name: 'mora_calculada', type: 'decimal', precision: 20, scale: 0, default: 0 }) moraCalculada: number;
  @Column({ name: 'mora_pagada',    type: 'decimal', precision: 20, scale: 0, default: 0 }) moraPagada: number;
  @Column({ name: 'mora_exonerada', type: 'decimal', precision: 20, scale: 0, default: 0 }) moraExonerada: number;

  // Gastos admin
  @Column({ name: 'gastos_admin',        type: 'decimal', precision: 20, scale: 0, default: 0 }) gastosAdmin: number;
  @Column({ name: 'gastos_admin_pagado', type: 'decimal', precision: 20, scale: 0, default: 0 }) gastosAdminPagado: number;

  // Prórroga
  @Column({ name: 'cargo_prorroga',        type: 'decimal', precision: 20, scale: 0, default: 0 }) cargoProrroga: number;
  @Column({ name: 'cargo_prorroga_pagado', type: 'decimal', precision: 20, scale: 0, default: 0 }) cargoProrrogaPagado: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
