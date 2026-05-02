import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { bitacoraApi } from '../../services/contactosApi';
import { Toast } from '../../components/ui/Toast';

export default function BitacoraAdmin() {
  const [registros,  setRegistros]  = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [exportando, setExportando] = useState(false);
  const [toast,      setToast]      = useState('');
  const [filtros, setFiltros] = useState({ usuarioId: '', accion: '', desde: '', hasta: '' });

  useEffect(() => {
    setLoading(true);
    bitacoraApi.getAll({ desde: filtros.desde || undefined, hasta: filtros.hasta || undefined })
      .then((r: any) => { setRegistros(r.data ?? r); setTotal(r.total ?? (r.data ?? r).length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtros.desde, filtros.hasta]);

  const handleExport = async () => {
    setExportando(true);
    try {
      const blob = await bitacoraApi.exportExcel({
        desde: filtros.desde || undefined,
        hasta: filtros.hasta || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitacora-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('Archivo descargado correctamente');
    } catch { /* silencioso */ }
    finally { setExportando(false); }
  };

  // Filtro local por usuario/acción (no requiere re-fetch)
  const filtrados = registros.filter(r => {
    const usr = (r.usuario_nombre ?? r.usuarioNombre ?? '').toLowerCase();
    const acc = (r.accion ?? '').toLowerCase();
    return (
      (!filtros.usuarioId || usr.includes(filtros.usuarioId.toLowerCase())) &&
      (!filtros.accion    || acc.includes(filtros.accion.toLowerCase()))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bitácora del sistema</h1>
          <p className="text-sm text-gray-500">{total} registros</p>
        </div>
        <button onClick={handleExport} disabled={exportando}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
          <Download size={15} /> {exportando ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Buscar usuario..."
          value={filtros.usuarioId}
          onChange={e => setFiltros(f => ({ ...f, usuarioId: e.target.value }))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[160px]" />
        <input type="text" placeholder="Buscar acción..."
          value={filtros.accion}
          onChange={e => setFiltros(f => ({ ...f, accion: e.target.value }))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[160px]" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Desde</label>
          <input type="date" value={filtros.desde}
            onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Hasta</label>
          <input type="date" value={filtros.hasta}
            onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay registros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Fecha','Usuario','Acción','Módulo','Entidad','Detalle'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((r: any, i: number) => (
                  <tr key={r.id ?? i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.created_at ?? r.createdAt ?? r.fecha).toLocaleString('es-PY')}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                      {r.usuario_nombre ?? r.usuarioNombre ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">{r.accion}</span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">{r.modulo ?? '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{r.entidad ?? '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
                      {r.detalle ? (typeof r.detalle === 'string' ? r.detalle : JSON.stringify(r.detalle)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
