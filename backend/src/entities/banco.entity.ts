import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bancos')
export class Banco {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  codigo: string;

  @Column({ nullable: true })
  abreviatura: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: 0 })
  orden: number;

  @Column({ nullable: true })
  contacto: string;

  @Column({ nullable: true })
  correo: string;

  @Column({ nullable: true })
  telefono: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
