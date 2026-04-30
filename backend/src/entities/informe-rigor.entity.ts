import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Catálogo de Informes de Rigor — configurable desde Panel Global.
 *
 * Estructura:
 *  - servicio   : proveedor del informe (informconf | infocheck | criterion | otro)
 *  - tipoInforme: a quién se le hace ('persona' = PF  |  'empresa' = PJ)
 *  - codigo     : clave única = "{servicio}_{tipoInforme}"  (ej: informconf_persona)
 *
 * Cada combinación servicio×tipo es un registro independiente.
 */
@Entity('informes_rigor')
export class InformeRigor {
  @PrimaryGeneratedColumn('uuid') id: string;

  /** Proveedor del servicio: 'informconf' | 'infocheck' | 'criterion' | (libre) */
  @Column()
  servicio: string;

  /** A quién se emite: 'persona' (PF) | 'empresa' (PJ) */
  @Column({ name: 'tipo_informe' })
  tipoInforme: string;

  /** Clave única autogenerada: servicio_tipoInforme  (ej: informconf_persona) */
  @Column({ unique: true })
  codigo: string;

  /** Nombre para mostrar (ej: "INFORMCONF — Persona") */
  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: false })
  requerido: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
