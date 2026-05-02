import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('timbrados_set')
export class TimbradoSet {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tipo_comprobante', default: 'FACTURA' }) tipoComprobante: string;
  @Column({ name: 'nro_timbrado' }) nroTimbrado: string;
  @Column({ default: '001' }) establecimiento: string;
  @Column({ name: 'punto_expedicion', default: '001' }) puntoExpedicion: string;
  @Column({ name: 'nro_desde', type: 'bigint' }) nroDesde: number;
  @Column({ name: 'nro_hasta', type: 'bigint' }) nroHasta: number;
  @Column({ name: 'nro_siguiente', type: 'bigint' }) nroSiguiente: number;
  @Column({ name: 'fecha_vigencia_desde', type: 'date' }) fechaVigenciaDesde: string;
  @Column({ name: 'fecha_vigencia_hasta', type: 'date' }) fechaVigenciaHasta: string;
  @Column({ default: 'ACTIVO' }) estado: string;
  @Column({ nullable: true, type: 'text' }) observaciones: string;
  @Column({ name: 'registrado_por_id', nullable: true }) registradoPorId: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
