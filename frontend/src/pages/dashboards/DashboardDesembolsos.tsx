import { useEffect, useState } from 'react';
import { dashboardsApi } from '../../services/operacionesApi';
import { formatGs, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import { Link } from 'react-router-dom';

export default function DashboardDesembolsos() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardsApi.getDesembolsos()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!data) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard — Desembolsos</h1>
        <p className="text-sm text-gray-500">Capital en cartera y flujo de desembolsos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Capital desembolsado (mes)', value: data.desembolsadoMes, cls: 'text-blue-700' },
          { label: 'Pendiente de desembolso', value: data.pendienteDesembolso, cls: 'text-amber-700' },
          { label: 'Capital total en cartera', value: data.capitalEnCartera, cls: 'text-green-700' },
          { label: 'Ops. en análisis', value: data.opsEnAnalisis, cls: 'text-indigo-700', isCount: true },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.cls}`}>
              {card.isCount ? card.value : formatGs(card.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Por caja */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Desembolsos por caja</h2>
          {(data.porCaja ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos.</p>
          ) : (
            <div className="space-y-3">
              {data.porCaja.map((c: any) => (
                <div key={c.caja} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{c.caja}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatGs(c.monto)}</p>
                    <p className="text-xs text-gray-400">{c.cantidad} ops.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Por tipo de operación</h2>
          <div className="space-y-3">
            {(data.porTipo ?? []).map((t: any) => (
              <div key={t.tipo} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{t.tipo === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheque' : 'Préstamo de Consumo'}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatGs(t.monto)}</p>
                  <p className="text-xs text-gray-400">{t.cantidad} ops.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operaciones recientes */}
      {(data.recientes ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Últimos desembolsos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['N° Op.','Cliente','Tipo','Neto','Fecha','Estado',''].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recientes.map((op: any) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{op.nroOperacion}</td>
                    <td className="px-4 py-2 font-medium">{op.contactoNombre}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Cheque' : 'Préstamo'}</td>
                    <td className="px-4 py-2 font-medium text-green-700">{formatGs(op.netoDesembolsar)}</td>
                    <td className="px-4 py-2 text-xs">{formatDate(op.fechaDesembolso ?? op.updatedAt)}</td>
                    <td className="px-4 py-2"><StatusBadge estado={op.estado} /></td>
                    <td className="px-4 py-2"><Link to={`/operaciones/${op.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
