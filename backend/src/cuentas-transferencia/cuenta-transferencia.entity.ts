import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cuentas_transferencia')
export class CuentaTransferencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 'pf' | 'pj' */
  @Column({ name: 'contacto_tipo' })
  contactoTipo: string;

  @Column({ name: 'contacto_id' })
  contactoId: string;

  /** Abreviatura del banco (ej: 'Continental', 'Itaú') */
  @Column({ nullable: true })
  banco: string;

  @Column({ name: 'numero_cuenta', nullable: true })
  numeroCuenta: string;

  @Column({ nullable: true })
  titular: string;

  /** Alias Bancard / PagoMóvil / CBU / etc. */
  @Column({ nullable: true })
  alias: string;

  /** CTA_CTE | CTA_AHO | ALIAS | OTRO */
  @Column({ name: 'tipo_cuenta', nullable: true })
  tipoCuenta: string;

  /** Cuenta preferida para desembolsos */
  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true, type: 'text' })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
