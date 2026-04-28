import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('configuracion')
export class Configuracion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  clave: string;

  @Column({ type: 'text', nullable: true })
  valor: string;

  @Column({ nullable: true })
  descripcion: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
