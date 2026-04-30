import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Wallet, BarChart2, AlertTriangle,
  Building2, Users, Calendar, ArrowUpRight,
  CheckCircle2, Clock, RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

// ── helpers ─────────────────────────────────────────────────────────────────
const fGs = (v: any) => {
  const n = Number(v ?? 0);
  if (n >= 1_000_000_000) return `₲ ${(n / 1_000_000_000).toFixed(2)} MM`;
  if (n >= 1_000_000)     return `₲ ${(n / 1_000_000).toFixed(1)} M`;
  return `₲ ${n.toLocaleString('es-PY')}`;
};
const fGsFull = (v: any) =>
  `₲ ${Number(v ?? 0).toLocaleString('es-PY')}`;

const ESTADO_LABEL: Record<string, string> = {
  EN_COBRANZA: 'En cobranza', DESEMBOLSADO: 'Desembolsado',
  MORA: 'En mora', PRORROGADO: 'Prorrogado',
  RENOVADO: 'Renovado', COBRADO: 'Cobrado',
};
const ESTADO_COLOR: Record<string, string> = {
  EN_COBRANZA: 'bg-blue-500', DESEMBOLSADO: 'bg-indigo-500',
  MORA: 'bg-red-500', PRORROGADO: 'bg-amber-500',
  RENOVADO: 'bg-violet-500', COBRADO: 'bg-emerald-500',
};
const ESTADO_DOT: Record<string, string> = {
  EN_COBRANZA: 'bg-blue-400', DESEMBOLSADO: 'bg-indigo-400',
  MORA: 'bg-red-400', PRORROGADO: 'bg-amber-400',
  RENOVADO: 'bg-violet-400', COBRADO: 'bg-emerald-400',
};

// ── Mini bar chart (CSS-only) ────────────────────────────────────────────────
function BarH({ value, max, color = 'bg-blue-500', height = 'h-5' }: { value: number; max: number; color?: string; height?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
      <div className={`${color} ${height} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Proyección semanal ───────────────────────────────────────────────────────
function ProyeccionSemanal({ semanas }: { semanas: any[] }) {
  const maxVal = Math.max(...semanas.map((s: any) => Number(s.valor_cheques ?? 0)), 1);

  return (
    <div className="space-y-3">
      {semanas.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">Sin vencimientos programados.</p>
      )}
      {semanas.map((s: any, i: number) => {
        const capital   = Number(s.capital ?? 0);
        const interes   = Number(s.interes ?? 0);
        const total     = Number(s.valor_cheques ?? 0);
        const pctCap    = maxVal > 0 ? (capital  / maxVal) * 100 : 0;
        const pctInt    = maxVal > 0 ? (interes  / maxVal) * 100 : 0;
        const isUrgent  = i === 0;

        return (
          <div key={s.semana_inicio}
            className={`rounded-xl border p-4 ${isUrgent ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                {isUrgent
                  ? <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  : <Calendar size={14} className="text-gray-400 shrink-0" />
                }
                <span className={`text-sm font-semibold ${isUrgent ? 'text-amber-700' : 'text-gray-700'}`}>
                  {s.desde} — {s.hasta}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {s.cantidad} {s.cantidad === 1 ? 'cheque' : 'cheques'}
                </span>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${isUrgent ? 'text-amber-800' : 'text-gray-800'}`}>{fGs(total)}</p>
                <p className="text-xs text-emerald-600 font-medium">+{fGs(interes)} ganancia</p>
              </div>
            </div>

            {/* Barra apilada visual */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              {/* Capital (azul) */}
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${pctCap}%` }}
              />
              {/* Interés encima (verde) desde donde termina capital */}
              <div
                className="absolute top-0 h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ left: `${pctCap}%`, width: `${Math.max(pctInt, 0.5)}%` }}
              />
            </div>

            {/* Leyenda */}
            <div className="flex gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Capital: {fGs(capital)}
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Ganancia: {fGs(interes)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardOperaciones() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ts,      setTs]      = useState(Date.now());

  const load = () => {
    setLoading(true);
    api.get('/dashboards/operaciones')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [ts]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando dashboard...</p>
      </div>
    </div>
  );
  if (!data) return null;

  const { kpis, porEstado, porCliente, porBanco, porCanal, proyeccionSemanal, vencimientosInmediatos } = data;

  const maxCapBanco   = Math.max(...(porBanco   ?? []).map((b: any) => Number(b.capital)), 1);
  const maxCapCliente = Math.max(...(porCliente ?? []).map((c: any) => Number(c.capital)), 1);

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Operaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cartera activa · Proyección de cobranza · Concentración</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setTs(Date.now())}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors">
            <RefreshCw size={14} />
            Actualizar
          </button>
          <Link to="/operaciones/nueva"
            className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">
            <ArrowUpRight size={14} />
            Nueva op.
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Capital en cartera */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Capital en cartera</span>
            <div className="p-1.5 bg-blue-50 rounded-lg"><Wallet size={14} className="text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fGs(kpis.capital_cartera)}</p>
          <p className="text-xs text-gray-400 mt-1">{kpis.ops_activas} operaciones activas</p>
        </div>

        {/* Valor nominal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor cartera</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg"><BarChart2 size={14} className="text-indigo-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fGs(kpis.valor_nominal)}</p>
          <p className="text-xs text-gray-400 mt-1">Valor nominal cheques</p>
        </div>

        {/* Ganancia esperada */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-sm p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Ganancia esperada</span>
            <div className="p-1.5 bg-white/20 rounded-lg"><TrendingUp size={14} className="text-white" /></div>
          </div>
          <p className="text-2xl font-bold">{fGs(kpis.ganancia_esperada)}</p>
          <p className="text-xs text-emerald-100 mt-1">
            {fGs(kpis.ganancia_realizada)} ya realizados
          </p>
        </div>

        {/* En mora */}
        <div className={`rounded-2xl border shadow-sm p-5 ${Number(kpis.ops_mora) > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${Number(kpis.ops_mora) > 0 ? 'text-red-400' : 'text-gray-400'}`}>En mora</span>
            <div className={`p-1.5 rounded-lg ${Number(kpis.ops_mora) > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
              <AlertTriangle size={14} className={Number(kpis.ops_mora) > 0 ? 'text-red-500' : 'text-gray-400'} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${Number(kpis.ops_mora) > 0 ? 'text-red-700' : 'text-gray-300'}`}>
            {kpis.ops_mora}
          </p>
          <p className={`text-xs mt-1 ${Number(kpis.ops_mora) > 0 ? 'text-red-500' : 'text-gray-400'}`}>operaciones</p>
        </div>

        {/* Cobrados este mes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hidden xl:block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cobrado este mes</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg"><CheckCircle2 size={14} className="text-emerald-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fGs(kpis.capital_recuperado)}</p>
          <p className="text-xs text-gray-400 mt-1">{kpis.cobrados_mes} operaciones cobradas</p>
        </div>
      </div>

      {/* ── Fila 2: Proyección semanal + Estados ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Proyección semanal — 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Proyección de Cobranza</h2>
              <p className="text-xs text-gray-400 mt-0.5">Cheques a cobrar por semana — próximas 16 semanas</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Capital
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Ganancia
              </span>
            </div>
          </div>
          <ProyeccionSemanal semanas={proyeccionSemanal ?? []} />
        </div>

        {/* Estados — 1/3 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Estados</h2>
          <p className="text-xs text-gray-400 mb-5">Distribución del capital por estado</p>
          <div className="space-y-4">
            {(porEstado ?? []).map((e: any) => {
              const cap = Number(e.capital ?? 0);
              const maxCap = Math.max(...(porEstado ?? []).map((x: any) => Number(x.capital ?? 0)), 1);
              return (
                <div key={e.estado}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${ESTADO_DOT[e.estado] ?? 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-700">{ESTADO_LABEL[e.estado] ?? e.estado}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{fGs(cap)}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{e.cantidad} ops</span>
                    </div>
                  </div>
                  <BarH value={cap} max={maxCap} color={ESTADO_COLOR[e.estado] ?? 'bg-gray-400'} height="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Fila 3: Clientes + Bancos ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Concentración por cliente */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} className="text-blue-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Concentración por Cliente</h2>
              <p className="text-xs text-gray-400">Top 10 por capital invertido activo</p>
            </div>
          </div>
          <div className="space-y-3">
            {(porCliente ?? []).map((c: any, i: number) => (
              <div key={c.contacto_doc} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold w-5 shrink-0 ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <div className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.contacto_tipo === 'pj' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                      {c.contacto_tipo === 'pj' ? <Building2 size={9} /> : <Users size={9} />}
                      {c.contacto_tipo === 'pj' ? 'PJ' : 'PF'}
                    </div>
                    <span className="text-sm text-gray-800 font-medium truncate">{c.contacto_nombre}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-gray-900">{fGs(c.capital)}</p>
                    <p className="text-xs text-emerald-600">+{fGs(c.ganancia)}</p>
                  </div>
                </div>
                <div className="pl-7">
                  <BarH value={Number(c.capital)} max={maxCapCliente} color={i === 0 ? 'bg-blue-500' : 'bg-blue-300'} height="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por banco + canal */}
        <div className="space-y-6">
          {/* Por banco */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={16} className="text-indigo-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Distribución por Banco</h2>
                <p className="text-xs text-gray-400">Capital en cheques por banco librador</p>
              </div>
            </div>
            <div className="space-y-3">
              {(porBanco ?? []).map((b: any) => (
                <div key={b.banco}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{b.banco}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{fGs(b.capital)}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{b.ops} ops</span>
                    </div>
                  </div>
                  <BarH value={Number(b.capital)} max={maxCapBanco} color="bg-indigo-500" height="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Por canal */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-teal-600 shrink-0" />
              <h2 className="text-base font-bold text-gray-900">Por Canal</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(porCanal ?? []).map((c: any) => {
                const totalCap = (porCanal ?? []).reduce((s: number, x: any) => s + Number(x.capital), 0);
                const pct = totalCap > 0 ? ((Number(c.capital) / totalCap) * 100).toFixed(1) : '0';
                return (
                  <div key={c.canal} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{c.canal}</p>
                    <p className="text-lg font-bold text-gray-900">{fGs(c.capital)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pct}% del total · {c.ops} ops</p>
                    <p className="text-xs text-emerald-600 mt-0.5">+{fGs(c.ganancia)} ganancia</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fila 4: Vencimientos próximos ─────────────────────────────── */}
      {(vencimientosInmediatos ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Vencimientos Próximos 10 Días</h2>
              <p className="text-xs text-gray-400">Cheques que vencen en los próximos días — atención prioritaria</p>
            </div>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Operación', 'Cliente', 'Banco', 'N° Cheque', 'Vencimiento', 'Días', 'Valor', 'Capital', 'Ganancia', 'Canal'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(vencimientosInmediatos ?? []).map((v: any) => {
                  const dias = Number(v.dias_restantes ?? 0);
                  const urgente = dias <= 2;
                  const proximo = dias <= 7;
                  return (
                    <tr key={`${v.id}-${v.nro_cheque}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <Link to={`/operaciones/${v.id}`} className="text-blue-600 hover:underline font-medium">
                          {v.nro_operacion}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[160px] truncate">{v.contacto_nombre}</td>
                      <td className="px-3 py-2.5 text-gray-600">{v.banco}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{v.nro_cheque}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {v.fecha_vencimiento
                          ? new Date(String(v.fecha_vencimiento).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-PY', { day:'2-digit', month:'short', year:'numeric' })
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                          urgente ? 'bg-red-100 text-red-700' : proximo ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {urgente && '⚡'}{dias}d
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900 text-right whitespace-nowrap">{fGsFull(v.monto)}</td>
                      <td className="px-3 py-2.5 text-blue-700 text-right whitespace-nowrap">{fGsFull(v.capital_invertido)}</td>
                      <td className="px-3 py-2.5 text-emerald-700 font-semibold text-right whitespace-nowrap">+{fGsFull(v.interes)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          v.canal === 'TeDescuento' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
                        }`}>{v.canal ?? '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-300 pb-2">
        SOFITUL · Dashboard Operaciones · Datos en tiempo real
      </div>
    </div>
  );
}
