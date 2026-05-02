import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface LogEntry {
  usuarioId?: string;
  usuarioNombre?: string;
  accion: string;
  modulo: string;
  entidad?: string;
  entidadId?: string;
  detalle?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class BitacoraService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async log(entry: LogEntry): Promise<void> {
    try {
      await this.ds.query(
        `INSERT INTO bitacora (usuario_id, usuario_nombre, accion, modulo, entidad, entidad_id, detalle, ip)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          entry.usuarioId    || null,
          entry.usuarioNombre || null,
          entry.accion,
          entry.modulo,
          entry.entidad      || null,
          entry.entidadId    || null,
          entry.detalle ? JSON.stringify(entry.detalle) : null,
          entry.ip           || null,
        ],
      );
    } catch { /* nunca bloquear */ }
  }

  async getAll(filtros: { modulo?: string; usuarioId?: string; desde?: string; hasta?: string; page?: number; limit?: number } = {}) {
    const page   = Math.max(1, filtros.page  ?? 1);
    const limit  = Math.min(200, filtros.limit ?? 50);
    const offset = (page - 1) * limit;

    const conds: string[] = [];
    const params: string[] = [];
    let i = 1;

    if (filtros.modulo)    { conds.push(`b.modulo = $${i++}`);       params.push(filtros.modulo); }
    if (filtros.usuarioId) { conds.push(`b.usuario_id = $${i++}`);   params.push(filtros.usuarioId); }
    if (filtros.desde)     { conds.push(`b.created_at >= $${i++}`);  params.push(filtros.desde); }
    if (filtros.hasta)     { conds.push(`b.created_at <= $${i++}`);  params.push(filtros.hasta + 'T23:59:59'); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const [rows, total] = await Promise.all([
      this.ds.query(
        `SELECT b.*, u.email AS usuario_email FROM bitacora b
         LEFT JOIN usuarios u ON u.id = b.usuario_id
         ${where} ORDER BY b.created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      ),
      this.ds.query(`SELECT COUNT(*)::int AS total FROM bitacora b ${where}`, params),
    ]);

    return { data: rows, total: total[0]?.total ?? 0, page, limit, pages: Math.ceil((total[0]?.total ?? 0) / limit) };
  }
}
