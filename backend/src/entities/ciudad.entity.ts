import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('ciudades')
export class Ciudad {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column()
  nombre: string;

  @Column({ name: 'departamento_id' })
  departamentoId: number;

  @Column({ default: true })
  activo: boolean;
}
