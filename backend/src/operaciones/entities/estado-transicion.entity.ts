import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('estado_transiciones')
@Unique(['desdeId', 'hastaId'])
export class EstadoTransicion {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'desde_id' }) desdeId: string;
  @Column({ name: 'hasta_id' }) hastaId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
