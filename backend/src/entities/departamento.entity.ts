import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('departamentos')
export class Departamento {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column()
  nombre: string;

  @Column({ default: true })
  activo: boolean;
}
