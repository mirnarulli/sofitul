import { useEffect, useState } from 'react';
import { bitacoraApi } from '../../services/contactosApi';
import { formatDate } from '../../utils/formatters';

export default function BitacoraAdmin() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ usuario: '', accion: '', desde: '', hasta: '' });

  useEffect(() => {
    setLoading(true);
    bitacoraApi.getAll(filtros)
      .then(setRegistros)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtros]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bitácora del sistema</h1>
        <p className="text-sm text-gray-500">Registro de acciones de usuarios</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Usuario..." value={filtros.usuario}
          onChange={e => setFiltros(f => ({ ...f, usuario: e.target.value }))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" placeholder="Acción..." value={filtros.accion}
          onChange={e => setFiltros(f => ({ ...f, accion: e.target.value }))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={filtros.desde}
          onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={filtros.hasta}
          onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : registros.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay registros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Fecha','Usuario','Acción','Entidad','Detalle'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.fecha ?? r.createdAt).toLocaleString('es-PY')}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-800">{r.usuario ?? r.userEmail ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">{r.accion ?? r.action}</span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">{r.entidad ?? r.entity ?? '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">{r.detalle ?? r.detail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
