import { useEffect, useState } from 'react';
import { dashboardsApi } from '../../services/operacionesApi';
import { formatGs } from '../../utils/formatters';

export default function DashboardRecupero() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardsApi.getRecupero()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!data) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard — Recupero de Cartera</h1>
        <p className="text-sm text-gray-500">Resumen del estado de cobros y mora</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pendiente de cobro', value: data.totalPendiente, cls: 'text-blue-700' },
          { label: 'Recuperado (mes)', value: data.recuperadoMes, cls: 'text-green-700' },
          { label: 'En mora', value: data.enMora, cls: 'text-red-700' },
          { label: 'Prorrogados', value: data.prorrogados, cls: 'text-orange-700' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.cls}`}>{formatGs(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Por tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Por tipo de operación</h2>
          <div className="space-y-3">
            {(data.porTipo ?? []).map((t: any) => (
              <div key={t.tipo} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{t.tipo === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheque' : 'Préstamo de Consumo'}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatGs(t.saldo)}</p>
                  <p className="text-xs text-gray-400">{t.cantidad} ops.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por cobrador */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Por cobrador asignado</h2>
          {(data.porCobrador ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de cobradores.</p>
          ) : (
            <div className="space-y-3">
              {data.porCobrador.map((c: any) => (
                <div key={c.cobrador} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{c.cobrador ?? 'Sin asignar'}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatGs(c.saldo)}</p>
                    <p className="text-xs text-gray-400">{c.cantidad} ops.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evolución mensual */}
      {(data.mensual ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recupero mensual (últimos 12 meses)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Mes','Recuperado','Mora','Cantidad'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.mensual.map((m: any) => (
                  <tr key={m.mes} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{m.mes}</td>
                    <td className="px-4 py-2 text-green-700 font-medium">{formatGs(m.recuperado)}</td>
                    <td className="px-4 py-2 text-red-600">{formatGs(m.mora)}</td>
                    <td className="px-4 py-2 text-gray-600">{m.cantidad}</td>
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
