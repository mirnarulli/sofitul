import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TipoOperacion = 'DESCUENTO_CHEQUE' | 'PRESTAMO_CONSUMO';

@Entity('operaciones')
export class Operacion {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'nro_operacion', unique: true })
  nroOperacion: string;

  @Column({ name: 'tipo_operacion' })
  tipoOperacion: TipoOperacion;

  // Contacto (PF o PJ)
  @Column({ name: 'contacto_tipo' })                    contactoTipo: 'pf' | 'pj';
  @Column({ name: 'contacto_id' })                      contactoId: string;
  @Column({ name: 'contacto_nombre' })                  contactoNombre: string;
  @Column({ name: 'contacto_doc' })                     contactoDoc: string;

  // Estado (configurable desde tabla estados_operacion)
  @Column({ default: 'FORMULARIO_CARGADO' })            estado: string;

  // Datos financieros principales
  @Column({ name: 'monto_total', type: 'decimal', precision: 20, scale: 0, default: 0 })
  montoTotal: number;

  @Column({ name: 'tasa_mensual', type: 'decimal', precision: 8, scale: 4, nullable: true })
  tasaMensual: number;

  @Column({ name: 'interes_total', type: 'decimal', precision: 20, scale: 0, default: 0 })
  interesTotal: number;

  @Column({ name: 'neto_desembolsar', type: 'decimal', precision: 20, scale: 0, default: 0 })
  netoDesembolsar: number;

  @Column({ name: 'capital_invertido', type: 'decimal', precision: 20, scale: 0, default: 0 })
  capitalInvertido: number;

  @Column({ name: 'ganancia_neta', type: 'decimal', precision: 20, scale: 0, default: 0 })
  gananciaNeta: number;

  @Column({ name: 'fecha_operacion', type: 'date' })
  fechaOperacion: string;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: string;

  @Column({ name: 'dias_plazo', nullable: true })
  diasPlazo: number;

  // Canal / sucursal
  @Column({ nullable: true })                           canal: string;
  @Column({ nullable: true })                           sucursal: string;

  // Cuenta para acreditación de fondos
  @Column({ name: 'banco_acreditacion', nullable: true })    bancoAcreditacion: string;
  @Column({ name: 'nro_cuenta_acreditacion', nullable: true }) nroCuentaAcreditacion: string;
  @Column({ name: 'titular_cuenta_acreditacion', nullable: true }) titularCuentaAcreditacion: string;
  @Column({ name: 'alias_acreditacion', nullable: true })    aliasAcreditacion: string;

  // Tesorería
  @Column({ name: 'caja_id', nullable: true })          cajaId: string;
  @Column({ name: 'fecha_desembolso', type: 'date', nullable: true }) fechaDesembolso: string;
  @Column({ name: 'comprobante_url', nullable: true })  comprobanteUrl: string;
  @Column({ name: 'pagare_recibido', default: false })  pagareRecibido: boolean;
  @Column({ name: 'fecha_pagare', type: 'date', nullable: true }) fechaPagare: string;

  // Comisión
  @Column({ name: 'comision_monto', type: 'decimal', precision: 20, scale: 0, default: 0 }) comisionMonto: number;

  // Producto financiero
  @Column({ name: 'producto_id', nullable: true })      productoId: string;
  @Column({ name: 'producto_nombre', nullable: true })  productoNombre: string;

  // Vendedor / Analista / Cobrador
  @Column({ name: 'vendedor_id', nullable: true })      vendedorId: string;
  @Column({ name: 'vendedor_nombre', nullable: true })  vendedorNombre: string;
  @Column({ name: 'analista_id', nullable: true })      analistaId: string;
  @Column({ name: 'cobrador_id', nullable: true })      cobradorId: string;

  // Prórrogas / renovaciones
  @Column({ default: 0 })                               prorrogas: number;
  @Column({ default: 0 })                               renovaciones: number;

  // Scoring
  @Column({ name: 'scoring', type: 'decimal', precision: 5, scale: 2, nullable: true }) scoring: number;

  @Column({ type: 'text', nullable: true })             observaciones: string;

  // Bitácora interna de la operación (jsonb array de eventos)
  @Column({ type: 'jsonb', default: '[]' })             bitacora: any[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
