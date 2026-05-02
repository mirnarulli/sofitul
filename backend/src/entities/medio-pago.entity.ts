import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medios_pago')
export class MedioPago {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) codigo: string;
  @Column() nombre: string;
  @Column({ nullable: true }) descripcion: string;
  @Column({ name: 'requiere_referencia', default: false }) requiereReferencia: boolean;
  @Column({ name: 'requiere_banco', default: false }) requiereBanco: boolean;
  @Column({ name: 'es_digital', default: false }) esDigital: boolean;
  @Column({ default: true }) activo: boolean;
  @Column({ default: 0 }) orden: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
