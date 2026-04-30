import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('feriados')
export class Feriado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  fecha: string; // 'YYYY-MM-DD'

  /** 'FIJO' = misma fecha cada año (almacena cualquier año como referencia)
   *  'MOVIL' = fecha específica de un año concreto (Semana Santa, etc.)
   *  'EVENTUAL' = feriado extraordinario o puente */
  @Column({ length: 20 })
  tipo: string;

  @Column({ length: 150 })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;
}
