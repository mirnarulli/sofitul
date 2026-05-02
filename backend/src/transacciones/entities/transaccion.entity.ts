import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('transacciones')
export class Transaccion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'operacion_id' }) operacionId: string;
  @Column() tipo: string;
  @Column({ name: 'fecha_transaccion', type: 'date' }) fechaTransaccion: string;
  @Column({ name: 'fecha_valor', type: 'date' }) fechaValor: string;
  @Column({ name: 'monto_total', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoTotal: number;
  @Column({ name: 'monto_capital',      type: 'decimal', precision: 20, scale: 0, default: 0 }) montoCapital: number;
  @Column({ name: 'monto_interes',      type: 'decimal', precision: 20, scale: 0, default: 0 }) montoInteres: number;
  @Column({ name: 'monto_mora',         type: 'decimal', precision: 20, scale: 0, default: 0 }) montoMora: number;
  @Column({ name: 'monto_gastos_admin', type: 'decimal', precision: 20, scale: 0, default: 0 }) montoGastosAdmin: number;
  @Column({ name: 'monto_prorroga',     type: 'decimal', precision: 20, scale: 0, default: 0 }) montoProrroga: number;
  @Column({ name: 'medio_pago_id',    nullable: true }) medioPagoId: string;
  @Column({ name: 'nro_referencia',   nullable: true }) nroReferencia: string;
  @Column({ name: 'talonario_id',     nullable: true }) talonarioId: string;
  @Column({ name: 'nro_recibo',       nullable: true }) nroRecibo: string;
  @Column({ name: 'timbrado_id',      nullable: true }) timbradoId: string;
  @Column({ name: 'nro_comprobante_fiscal', nullable: true }) nroComprobanteFiscal: string;
  @Column({ name: 'cobrador_id',      nullable: true }) cobradorId: string;
  @Column({ name: 'caja_id',          nullable: true }) cajaId: string;
  @Column({ name: 'conciliacion_id',  nullable: true }) conciliacionId: string;
  @Column({ default: 'APLICADO' }) estado: string;
  @Column({ name: 'es_reverso', default: false }) esReverso: boolean;
  @Column({ name: 'transaccion_origen_id', nullable: true }) transaccionOrigenId: string;
  @Column({ name: 'motivo_reverso', nullable: true, type: 'text' }) motivoReverso: string;
  @Column({ name: 'reversado_por_id', nullable: true }) reversadoPorId: string;
  @Column({ name: 'fecha_reverso', type: 'date', nullable: true }) fechaReverso: string;
  @Column({ name: 'creado_por_id', nullable: true }) creadoPorId: string;
  @Column({ nullable: true }) ip: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
