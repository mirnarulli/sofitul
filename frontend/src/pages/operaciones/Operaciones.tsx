import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { operacionesApi } from '../../services/operacionesApi';
import StatusBadge from '../../components/StatusBadge';
import { formatGs, formatDate } from '../../utils/formatters';

export default function Operaciones() {
  const [data,   setData]   = useState<any[]>([]);
  const [total,  setTotal]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ estado: '', tipo: '', q: '' });

  useEffect(() => {
    setLoading(true);
    operacionesApi.getAll({ estado: filtros.estado || undefined, tipo: filtros.tipo || undefined })
      .then(r => { setData(r.data); setTotal(r.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtros.estado, filtros.tipo]);

  const filtradas = data.filter(op =>
    !filtros.q ||
    op.contactoNombre?.toLowerCase().includes(filtros.q.toLowerCase()) ||
    op.nroOperacion?.toLowerCase().includes(filtros.q.toLowerCase()) ||
    op.contactoDoc?.includes(filtros.q)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operaciones</h1>
          <p className="text-sm text-gray-500">{total} operaciones totales</p>
        </div>
        <Link to="/operaciones/nueva"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Nueva Operación
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-gray-400" />
          <input
            type="text" placeholder="Buscar por nombre, N° operación o doc..."
            value={filtros.q} onChange={e => setFiltros(p => ({ ...p, q: e.target.value }))}
            className="flex-1 text-sm border-0 outline-none bg-transparent"
          />
        </div>
        <select value={filtros.tipo} onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los tipos</option>
          <option value="DESCUENTO_CHEQUE">Descuento de Cheque</option>
          <option value="PRESTAMO_CONSUMO">Préstamo de Consumo</option>
        </select>
        <select value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          <option value="EN_ANALISIS">En análisis</option>
          <option value="APROBADO">Aprobado</option>
          <option value="EN_TESORERIA">En tesorería</option>
          <option value="DESEMBOLSADO">Desembolsado</option>
          <option value="EN_COBRANZA">En cobranza</option>
          <option value="MORA">Mora</option>
          <option value="COBRADO">Cobrado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay operaciones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['N° Op.','Tipo','Cliente','Monto Total','Neto Desembolsar','Vencimiento','Estado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map(op => (
                  <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{op.nroOperacion}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
                        {op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Cheque' : 'Préstamo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{op.contactoNombre}</p>
                      <p className="text-xs text-gray-400">{op.contactoDoc}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatGs(op.montoTotal)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatGs(op.netoDesembolsar)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(op.fechaVencimiento)}</td>
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
    </div>
  );
}
