import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contactos_pj')
export class ContactoPJ {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true })                                  ruc: string;
  @Column({ name: 'razon_social' })                          razonSocial: string;
  @Column({ name: 'nombre_fantasia', nullable: true })       nombreFantasia: string;
  @Column({ name: 'actividad_principal', nullable: true })   actividadPrincipal: string;
  @Column({ name: 'fecha_constitucion', type: 'date', nullable: true }) fechaConstitucion: string;
  @Column({ nullable: true })                                pais: string;
  @Column({ name: 'pais_constitucion', nullable: true })     paisConstitucion: string;  // código país

  // Contacto
  @Column({ nullable: true })                                telefono: string;
  @Column({ nullable: true })                                email: string;
  @Column({ nullable: true })                                domicilio: string;
  @Column({ nullable: true })                                barrio: string;
  @Column({ nullable: true })                               ciudad: string;
  @Column({ nullable: true })                                departamento: string;
  @Column({ nullable: true })                                web: string;
  @Column({ name: 'sitio_web', nullable: true })             sitioWeb: string;

  // Representante legal
  @Column({ name: 'rep_legal_nombre', nullable: true })      repLegalNombre: string;
  @Column({ name: 'rep_legal_doc', nullable: true })         repLegalDoc: string;
  @Column({ name: 'rep_legal_cargo', nullable: true })       repLegalCargo: string;

  // Beneficiarios finales (jsonb array)
  @Column({ name: 'beneficiarios_finales', type: 'jsonb', nullable: true }) beneficiariosFinales: unknown;

  // Due diligence
  @Column({ name: 'es_pep', default: false })                esPep: boolean;
  @Column({ name: 'es_fatca', default: false })              esFatca: boolean;

  // Cuenta bancaria
  @Column({ name: 'banco_acreditacion', nullable: true })    bancoAcreditacion: string;
  @Column({ name: 'nro_cuenta_acreditacion', nullable: true }) nroCuentaAcreditacion: string;
  @Column({ name: 'titular_cuenta_acreditacion', nullable: true }) titularCuentaAcreditacion: string;
  @Column({ name: 'alias_acreditacion', nullable: true })    aliasAcreditacion: string;

  // Calificación interna
  @Column({ name: 'calificacion_interna', nullable: true })  calificacionInterna: string; // 'A'|'B'|'C'|'D'

  @Column({ default: true })                                 activo: boolean;
  @Column({ type: 'text', nullable: true })                  observaciones: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
