import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('productos_financieros')
export class ProductoFinanciero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ name: 'tipo_operacion' })
  tipoOperacion: string;

  // Array de formularios asociados: [{ id, nombre, requerido }]
  @Column({ type: 'jsonb', default: '[]' })
  formularios: any[];

  // Configuración del producto: max_cheques, numeracion_inicio, etc.
  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
