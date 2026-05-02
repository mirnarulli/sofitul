import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type CategoriaCargo = 'INTERES' | 'MORA' | 'GASTO_ADMIN' | 'PRORROGA' | 'SEGURO' | 'OTRO';
export type AplicaEn = 'INICIO_OPERACION' | 'POR_CUOTA' | 'AMBOS';
export type BaseCalculo = 'CAPITAL_OPERACION' | 'SALDO_VENCIDO' | 'MONTO_CUOTA' | 'FIJO';

@Entity('tipos_cargo')
export class TipoCargo {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) codigo: string;
  @Column() nombre: string;
  @Column({ nullable: true }) descripcion: string;
  @Column() categoria: string;
  @Column({ name: 'aplica_en' }) aplicaEn: string;
  @Column({ name: 'base_calculo' }) baseCalculo: string;
  @Column({ name: 'monto_fijo', type: 'decimal', precision: 20, scale: 0, nullable: true }) montoFijo: number;
  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true }) porcentaje: number;
  @Column({ name: 'es_obligatorio', default: true }) esObligatorio: boolean;
  @Column({ name: 'permiso_exonerar', nullable: true }) permisoExonerar: string;
  @Column({ default: true }) activo: boolean;
  @Column({ default: 0 }) orden: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
