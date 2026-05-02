import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tipo_doc', nullable: true }) tipoDoc: string;
  @Column({ name: 'nro_doc', nullable: true }) nroDoc: string;
  @Column() apellido: string;
  @Column() nombre: string;
  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true }) fechaNacimiento: string;
  @Column({ nullable: true }) sexo: string;
  @Column({ name: 'email_personal', nullable: true }) emailPersonal: string;
  @Column({ nullable: true }) telefono: string;
  @Column({ nullable: true }) cargo: string;
  @Column({ nullable: true }) departamento: string;
  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true }) fechaIngreso: string;
  @Column({ name: 'fecha_egreso', type: 'date', nullable: true }) fechaEgreso: string;
  @Column({ default: 'ACTIVO' }) estado: string;
  @Column({ name: 'usuario_id', nullable: true }) usuarioId: string;
  @Column({ name: 'es_cobrador', default: false }) esCobrador: boolean;
  @Column({ name: 'es_vendedor', default: false }) esVendedor: boolean;
  @Column({ name: 'es_analista', default: false }) esAnalista: boolean;
  @Column({ nullable: true, type: 'text' }) observaciones: string;
  @Column({ name: 'creado_por_id', nullable: true }) creadoPorId: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
