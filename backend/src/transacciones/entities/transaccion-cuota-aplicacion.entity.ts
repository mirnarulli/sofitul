import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('transaccion_cuota_aplicacion')
export class TransaccionCuotaAplicacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'transaccion_id' }) transaccionId: string;
  @Column({ name: 'cuota_id' }) cuotaId: string;
  @Column({ name: 'capital_aplicado',   type: 'decimal', precision: 20, scale: 0, default: 0 }) capitalAplicado: number;
  @Column({ name: 'interes_aplicado',   type: 'decimal', precision: 20, scale: 0, default: 0 }) interesAplicado: number;
  @Column({ name: 'mora_aplicada',      type: 'decimal', precision: 20, scale: 0, default: 0 }) moraAplicada: number;
  @Column({ name: 'gastos_aplicados',   type: 'decimal', precision: 20, scale: 0, default: 0 }) gastosAplicados: number;
  @Column({ name: 'prorroga_aplicada',  type: 'decimal', precision: 20, scale: 0, default: 0 }) prorrogaAplicada: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
