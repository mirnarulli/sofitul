import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cargos_operacion')
export class CargoOperacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'operacion_id' }) operacionId: string;
  @Column({ name: 'cuota_id', nullable: true }) cuotaId: string;
  @Column({ name: 'tipo_cargo_id' }) tipoCargoid: string;
  @Column() descripcion: string;
  @Column({ nullable: true }) categoria: string;
  @Column({ name: 'monto_calculado', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoCalculado: number;
  @Column({ name: 'monto_cobrado', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoCobrado: number;
  @Column({ name: 'monto_exonerado', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoExonerado: number;
  @Column({ name: 'fecha_cargo', type: 'date' }) fechaCargo: string;
  @Column({ default: 'PENDIENTE' }) estado: string;
  @Column({ name: 'exonerado_por_id', nullable: true }) exoneradoPorId: string;
  @Column({ name: 'motivo_exoneracion', nullable: true, type: 'text' }) motivoExoneracion: string;
  @Column({ name: 'fecha_exoneracion', type: 'date', nullable: true }) fechaExoneracion: string;
  @Column({ name: 'cobrado_en_transaccion_id', nullable: true }) cobradoEnTransaccionId: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
