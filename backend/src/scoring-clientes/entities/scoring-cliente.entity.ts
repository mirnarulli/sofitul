import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('scoring_clientes')
export class ScoringCliente {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 30 }) ci: string;
  @Column({ name: 'nombre_cliente', nullable: true }) nombreCliente: string;
  @Column({ type: 'int', nullable: true }) calificacion: number;
  @Column({ nullable: true }) descripcion: string;
  @Column({ name: 'url_documento', nullable: true }) urlDocumento: string;
  @Column({ nullable: true, type: 'text' }) observacion: string;
  @Column({ name: 'fecha', type: 'date', nullable: true }) fecha: string;
  @Column({ name: 'verificador_id', nullable: true }) verificadorId: string;
  @Column({ name: 'verificador_nombre', nullable: true }) verificadorNombre: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
