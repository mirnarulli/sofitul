import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cheques_detalle')
export class ChequeDetalle {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'operacion_id' })                          operacionId: string;
  @Column({ name: 'nro_cheque' })                            nroCheque: string;
  @Column()                                                  banco: string;
  @Column()                                                  librador: string;
  @Column({ name: 'ruc_librador', nullable: true })          rucLibrador: string;
  @Column({ name: 'fecha_emision', type: 'date', nullable: true }) fechaEmision: string;
  @Column({ name: 'fecha_vencimiento', type: 'date' })       fechaVencimiento: string;
  @Column({ type: 'decimal', precision: 20, scale: 0 })      monto: number;
  @Column({ name: 'tasa_mensual', type: 'decimal', precision: 8, scale: 4 }) tasaMensual: number;
  @Column({ type: 'decimal', precision: 20, scale: 0 })      interes: number;
  @Column({ name: 'capital_invertido', type: 'decimal', precision: 20, scale: 0 }) capitalInvertido: number;
  @Column({ type: 'decimal', precision: 20, scale: 0, nullable: true }) comision: number;
  @Column({ nullable: true })                                dias: number;

  // Estado del cheque
  @Column({ default: 'VIGENTE' })                            estado: string;
  @Column({ type: 'text', nullable: true })                  observaciones: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
