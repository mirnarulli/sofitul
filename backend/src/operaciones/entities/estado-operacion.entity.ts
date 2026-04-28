import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('estados_operacion')
export class EstadoOperacion {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true })    codigo: string;
  @Column()                    nombre: string;
  @Column({ nullable: true })  descripcion: string;
  @Column({ nullable: true })  color: string;
  @Column({ default: 0 })      orden: number;
  @Column({ default: true })   activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
