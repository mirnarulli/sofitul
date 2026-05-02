import { useEffect, useState } from 'react';
import { transaccionesApi } from '../../services/financieroApi';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n || 0)); }

export default function DashboardFinanciero() {
  const hoy    = new Date();
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-01`);
  const [hasta, setHasta] = useState(hoy.toISOString().split('T')[0]);
  const [año,   setAño]   = useState(hoy.getFullYear());
  const [resumen,  setResumen]  = useState<any>(null);
  const [mensual,  setMensual]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      transaccionesApi.resumenIngresos({ desde, hasta }),
      transaccionesApi.resumenMensual(año),
    ]).then(([r, m]) => { setResumen(r); setMensual(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [desde, hasta, año]);

  const kpis = resumen ? [
    { label: 'Total cobrado',      valor: resumen.totalCobrado,     color: 'blue',   icon: '💰' },
    { label: 'Capital recuperado', valor: resumen.montoCapital,     color: 'gray',   icon: '🏦' },
    { label: 'Ingresos interés',   valor: resumen.montoInteres,     color: 'red',    icon: '📈' },
    { label: 'Ingresos mora',      valor: resumen.montoMora,        color: 'orange', icon: '⚠️' },
    { label: 'Gastos admin.',      valor: resumen.montoGastosAdmin, color: 'purple', icon: '💼' },
    { label: 'Prórrogas',          valor: resumen.montoProrroga,    color: 'indigo', icon: '🔄' },
  ] : [];

  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    gray:   'bg-gray-50 text-gray-700 border-gray-100',
    red:    'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  // Calcular max para el gráfico de barras
  const maxTotal = Math.max(...mensual.map((m: any) => Number(m.total || 0)), 1);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
          <p className="text-sm text-gray-500">Ingresos por categoría</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {kpis.map(k => (
              <div key={k.label} className={`rounded-xl border p-4 ${colorMap[k.color]}`}>
                <p className="text-xl mb-1">{k.icon}</p>
                <p className="text-xs font-medium opacity-70 mb-1">{k.label}</p>
                <p className="text-lg font-bold">Gs. {fGs(k.valor)}</p>
              </div>
            ))}
          </div>

          {/* Tabla de pagos por año */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">Evolución mensual {año}</h2>
              <select value={año} onChange={e => setAño(+e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[hoy.getFullYear()-1, hoy.getFullYear(), hoy.getFullYear()+1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Gráfico de barras horizontal simple */}
            <div className="space-y-2">
              {MESES.map((label, i) => {
                const mes     = mensual.find((m: any) => Number(m.mes) === i + 1);
                const total   = Number(mes?.total   || 0);
                const interes = Number(mes?.interes || 0);
                const mora    = Number(mes?.mora    || 0);
                const gastos  = Number(mes?.gastos  || 0);
                const capital = Number(mes?.capital || 0);
                const pct = total / maxTotal * 100;
                return (
                  <div key={label} className="flex items-center gap-3 text-xs">
                    <span className="w-7 text-gray-500 font-medium">{label}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      {total > 0 && (
                        <div className="absolute inset-y-0 left-0 flex" style={{ width: `${pct}%` }}>
                          {capital > 0  && <div style={{ flex: capital }}  className="bg-gray-400" />}
                          {interes > 0  && <div style={{ flex: interes }}  className="bg-red-400" />}
                          {mora > 0     && <div style={{ flex: mora }}     className="bg-orange-400" />}
                          {gastos > 0   && <div style={{ flex: gastos }}   className="bg-purple-400" />}
                        </div>
                      )}
                    </div>
                    <span className="w-32 text-right font-medium text-gray-700">{total > 0 ? `Gs. ${fGs(total)}` : '—'}</span>
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs">
              {[['bg-gray-400','Capital'],['bg-red-400','Interés'],['bg-orange-400','Mora'],['bg-purple-400','Gastos']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla detalle */}
          {resumen && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Categoría','Monto','% del Total'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Interés cobrado',  monto: resumen.montoInteres,     color: 'text-red-600' },
                    { label: 'Mora cobrada',      monto: resumen.montoMora,        color: 'text-orange-600' },
                    { label: 'Gastos admin.',     monto: resumen.montoGastosAdmin, color: 'text-purple-600' },
                    { label: 'Prórrogas',         monto: resumen.montoProrroga,    color: 'text-indigo-600' },
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{row.label}</td>
                      <td className={`px-4 py-3 font-medium ${row.color}`}>Gs. {fGs(row.monto)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {resumen.totalCobrado > 0 ? `${((row.monto/resumen.totalCobrado)*100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3">Total ingreso financiero</td>
                    <td className="px-4 py-3 text-blue-700">Gs. {fGs((resumen.montoInteres||0)+(resumen.montoMora||0)+(resumen.montoGastosAdmin||0)+(resumen.montoProrroga||0))}</td>
                    <td className="px-4 py-3 text-gray-500">{resumen.cantidadPagos} cobros</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
