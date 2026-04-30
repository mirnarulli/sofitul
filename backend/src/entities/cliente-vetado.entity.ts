import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('clientes_vetados')
export class ClienteVetado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tipo_doc' })
  tipoDoc: string;

  @Column({ name: 'numero_doc' })
  numeroDoc: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  motivo: string;

  @Column({ name: 'fecha_veto', type: 'date', nullable: true })
  fechaVeto: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true, type: 'text' })
  observaciones: string;

  @Column({ name: 'agregado_por', nullable: true })
  agregadoPor: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
