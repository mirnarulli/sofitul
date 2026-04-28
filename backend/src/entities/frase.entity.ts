import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('frases')
export class Frase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  texto: string;

  @Column({ nullable: true })
  autor: string;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
