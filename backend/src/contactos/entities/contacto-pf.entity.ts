import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contactos_pf')
export class ContactoPF {
  @PrimaryGeneratedColumn('uuid') id: string;

  // Datos personales
  @Column({ name: 'numero_doc', unique: true })             numeroDoc: string;
  @Column({ name: 'tipo_doc_id', nullable: true })          tipoDocId: string;
  @Column({ name: 'tipo_documento', nullable: true })       tipoDocumento: string;   // código: 'CI', 'RUC', etc.
  @Column({ name: 'primer_nombre' })                        primerNombre: string;
  @Column({ name: 'segundo_nombre', nullable: true })       segundoNombre: string;
  @Column({ name: 'primer_apellido' })                      primerApellido: string;
  @Column({ name: 'segundo_apellido', nullable: true })     segundoApellido: string;
  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true }) fechaNacimiento: string;
  @Column({ nullable: true })                               sexo: string;            // 'M' | 'F'
  @Column({ nullable: true })                               nacionalidad: string;
  @Column({ name: 'pais_id', nullable: true })              paisId: string;
  @Column({ name: 'pais_nacionalidad', nullable: true })    paisNacionalidad: string; // código país
  @Column({ name: 'pais_residencia', nullable: true })      paisResidencia: string;
  @Column({ name: 'estado_civil', nullable: true })         estadoCivil: string;
  @Column({ name: 'conyuge_nombre', nullable: true })       conyugeNombre: string;
  @Column({ name: 'conyuge_doc', nullable: true })          conyugeDoc: string;

  // Contacto y domicilio
  @Column({ nullable: true })                               telefono: string;
  @Column({ nullable: true })                               celular: string;
  @Column({ nullable: true })                               email: string;
  @Column({ nullable: true })                               domicilio: string;
  @Column({ nullable: true })                               barrio: string;
  @Column({ nullable: true })                               ciudad: string;
  @Column({ nullable: true })                               departamento: string;

  // Actividad económica
  @Column({ name: 'situacion_laboral', nullable: true })    situacionLaboral: string;
  @Column({ nullable: true })                               empleador: string;
  @Column({ nullable: true })                               cargo: string;
  @Column({ name: 'actividad_economica', nullable: true })  actividadEconomica: string;
  @Column({ name: 'antiguedad_cargo', nullable: true })     antiguedadCargo: string;
  @Column({ name: 'nivel_instruccion', nullable: true })    nivelInstruccion: string;
  @Column({ nullable: true })                               profesion: string;

  // Ingresos y egresos (en Guaraníes)
  @Column({ type: 'jsonb', nullable: true })                ingresos: any;
  @Column({ type: 'jsonb', nullable: true })                egresos: any;
  @Column({ name: 'total_ingresos', type: 'decimal', precision: 20, scale: 0, default: 0 }) totalIngresos: number;
  @Column({ name: 'total_egresos', type: 'decimal', precision: 20, scale: 0, default: 0 })  totalEgresos: number;
  @Column({ name: 'capacidad_pago', type: 'decimal', precision: 20, scale: 0, default: 0 }) capacidadPago: number;

  // Patrimonio
  @Column({ type: 'jsonb', nullable: true })                activos: any;
  @Column({ type: 'jsonb', nullable: true })                pasivos: any;
  @Column({ name: 'patrimonio_neto', type: 'decimal', precision: 20, scale: 0, default: 0 }) patrimonioNeto: number;

  // Referencias
  @Column({ type: 'jsonb', nullable: true })                referencias: any;

  // Due diligence / compliance
  @Column({ name: 'es_pep', default: false })               esPep: boolean;
  @Column({ name: 'es_fatca', default: false })             esFatca: boolean;
  @Column({ name: 'declaracion_firmada', default: false })  declaracionFirmada: boolean;

  // Cuenta bancaria para acreditación
  @Column({ name: 'banco_acreditacion', nullable: true })   bancoAcreditacion: string;
  @Column({ name: 'nro_cuenta_acreditacion', nullable: true }) nroCuentaAcreditacion: string;
  @Column({ name: 'titular_cuenta_acreditacion', nullable: true }) titularCuentaAcreditacion: string;
  @Column({ name: 'alias_acreditacion', nullable: true })   aliasAcreditacion: string;

  // Calificación interna
  @Column({ name: 'calificacion_interna', nullable: true }) calificacionInterna: string; // 'A'|'B'|'C'|'D'

  @Column({ default: true })                                activo: boolean;
  @Column({ type: 'text', nullable: true })                 observaciones: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
