import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { cobranzasApi } from '../../services/operacionesApi';
import StatusBadge from '../../components/StatusBadge';
import { formatGs, formatDate } from '../../utils/formatters';
import { Toast } from '../../components/ui/Toast';

export default function Cobranzas() {
  const [data, setData] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [exportando, setExportando] = useState(false);
  const [toast,      setToast]      = useState('');
  const [filtros, setFiltros] = useState({ estado: '', q: '' });

  const handleExport = async () => {
    setExportando(true);
    try {
      const blob = await cobranzasApi.exportExcel({ estado: filtros.estado || undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cobranzas-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('Archivo descargado correctamente');
    } catch { /* silencioso */ }
    finally { setExportando(false); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      cobranzasApi.getCartera({ estado: filtros.estado || undefined }),
      cobranzasApi.getResumenCartera(),
    ])
      .then(([cartera, res]) => { setData(cartera); setResumen(res); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtros.estado]);

  const filtradas = data.filter(op =>
    !filtros.q ||
    op.contactoNombre?.toLowerCase().includes(filtros.q.toLowerCase()) ||
    op.nroOperacion?.toLowerCase().includes(filtros.q.toLowerCase())
  );

  const estadosCobranza = ['EN_COBRANZA', 'MORA', 'PRORROGADO', 'COBRADO'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobranzas</h1>
          <p className="text-sm text-gray-500">Cartera activa y recupero</p>
        </div>
        <button onClick={handleExport} disabled={exportando}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
          <Download size={16} /> {exportando ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'En cobranza', value: resumen.enCobranza, cls: 'text-blue-700' },
            { label: 'En mora', value: resumen.enMora, cls: 'text-red-700' },
            { label: 'Prorrogados', value: resumen.prorrogados, cls: 'text-orange-700' },
            { label: 'Cobrado (mes)', value: resumen.cobradoMes, cls: 'text-green-700' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-xl font-bold ${card.cls}`}>{formatGs(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o N° operación..."
            value={filtros.q} onChange={e => setFiltros(p => ({ ...p, q: e.target.value }))}
            className="flex-1 text-sm border-0 outline-none bg-transparent" />
        </div>
        <select value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          {estadosCobranza.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay registros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['N° Op.','Cliente','Tipo','Monto Total','Saldo','Vencimiento','Días mora','Estado',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map((op: any) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{op.nroOperacion}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{op.contactoNombre}</p>
                      <p className="text-xs text-gray-400">{op.contactoDoc}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Cheque' : 'Préstamo'}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatGs(op.montoTotal)}</td>
                    <td className="px-4 py-3 font-medium text-red-700">{formatGs(op.saldoPendiente ?? op.montoTotal)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(op.fechaVencimiento)}</td>
                    <td className="px-4 py-3">
                      {op.diasMora > 0
                        ? <span className="text-red-600 font-medium">{op.diasMora}d</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge estado={op.estado} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/operaciones/${op.id}`} className="text-blue-600 hover:underline text-xs font-medium">Ver</Link>
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
