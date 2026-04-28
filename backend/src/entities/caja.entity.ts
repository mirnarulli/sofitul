import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cajas')
export class Caja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  banco: string;

  @Column({ name: 'numero_cuenta', nullable: true })
  numeroCuenta: string;

  @Column({ name: 'tipo_cuenta', nullable: true })
  tipoCuenta: string;

  @Column({ name: 'moneda_id', nullable: true })
  monedaId: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldo: number;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
