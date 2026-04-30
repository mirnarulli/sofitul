import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

/** Bitácora de todas las consultas realizadas al servicio VALIDATA.
 *  Permite reconciliación posterior y auditoría de créditos consultados. */
@Entity('validata_consultas')
export class ValidataConsulta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Número de cédula consultada */
  @Column({ length: 30 })
  cedula: string;

  /** Email del usuario que realizó la consulta (del JWT) */
  @Column({ name: 'usuario_email', nullable: true })
  usuarioEmail: string | null;

  /** Módulo desde donde se originó la consulta ('nueva-pf' | 'analisis-credito' | ...) */
  @Column({ nullable: true })
  origen: string | null;

  /** Respuesta completa de VALIDATA (ficha + nómina) — guardada como JSONB */
  @Column({ name: 'respuesta_raw', type: 'jsonb', nullable: true })
  respuestaRaw: object | null;

  /** Error si la consulta falló parcial o totalmente */
  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string | null;

  /** Estado: 'ok' | 'error' | 'parcial' */
  @Column({ length: 20, default: 'ok' })
  estado: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
