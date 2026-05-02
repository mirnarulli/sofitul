/**
 * Dashboard Principal — vista ejecutiva para SUPERADMIN / ADMIN.
 * COBRADOR → redirige a /cobranzas
 * TESORERIA → redirige a /tesoreria
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw, TrendingUp, Activity, AlertTriangle,
  Clock, Landmark, ChevronRight,
} from 'lucide-react';
import { dashboardsApi, inventarioApi } from '../services/operacionesApi';
import { KpiCard } from '../components/ui/KpiCard';
import { BarH   } from '../components/ui/BarH';

// ── helpers ──────────────────────────────────────────────────────────────────
const fGs = (v: unknown) => {
  const n = Number(v ?? 0);
  if (n >= 1_000_000_000) return `₲ ${(n / 1_000_000_000).toFixed(2)} MM`;
  if (n >= 1_000_000)     return `₲ ${(n / 1_000_000).toFixed(1)} M`;
  return `₲ ${n.toLocaleString('es-PY')}`;
};

const fDate = (d: unknown) => {
  if (!d) return '—';
  const s = String(d).slice(0, 10);
  return new Date(s + 'T00:00:00').toLocaleDateString('es-PY', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const ESTADO_COLOR: Record<string, string> = {
  EN_COBRANZA: 'bg-blue-500',
  DESEMBOLSADO:'bg-sky-500',
  MORA:        'bg-red-500',
  PRORROGADO:  'bg-orange-500',
  RENOVADO:    'bg-violet-500',
  COBRADO:     'bg-emerald-500',
};
const ESTADO_LABEL: Record<string, string> = {
  EN_COBRANZA: 'En cobranza',
  DESEMBOLSADO:'Desembolsado',
  MORA:        'En mora',
  PRORROGADO:  'Prorrogado',
  RENOVADO:    'Renovado',
  COBRADO:     'Cobrado',
};

// ── tipos ─────────────────────────────────────────────────────────────────────
type Row = Record<string, unknown>;

// ── Loading ───────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Cargando dashboard...</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [opsData,    setOpsData]    = useState<Record<string, unknown> | null>(null);
  const [chData,     setChData]     = useState<Record<string, unknown> | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [ts,         setTs]         = useState(Date.now());

  // Redirect COBRADOR / TESORERIA antes de cargar datos
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const rol = usuario.rolCodigo ?? '';
    if (rol === 'COBRADOR')  { navigate('/cobranzas', { replace: true }); return; }
    if (rol === 'TESORERIA') { navigate('/tesoreria', { replace: true }); return; }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardsApi.getOperaciones(),
      inventarioApi.getChequesDashboard(),
    ])
      .then(([ops, ch]) => {
        setOpsData(ops as Record<string, unknown>);
        setChData(ch  as Record<string, unknown>);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ts]);

  if (loading) return <PageLoader />;
  if (!opsData) return null;

  const kpis       = (opsData.kpis                as Row)   ?? {};
  const porBanco   = (opsData.porBanco             as Row[]) ?? [];
  const porEstado  = (opsData.porEstado            as Row[]) ?? [];
  const vencim     = (opsData.vencimientosInmediatos as Row[]) ?? [];
  const proyecc    = (opsData.proyeccionSemanal    as Row[]) ?? [];
  const chKpis     = ((chData?.kpis)               as Row)   ?? {};

  const maxBanco  = Math.max(...porBanco.map(b  => Number(b.capital  ?? 0)), 1);
  const maxEstado = Math.max(...porEstado.map(e => Number(e.capital  ?? 0)), 1);

  const ahora = new Date().toLocaleDateString('es-PY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{ahora}</p>
        </div>
        <button onClick={() => setTs(Date.now())}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600
                     border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          variant="gradient"
          label="Capital colocado"
          value={fGs(kpis.capital_cartera)}
          sub={`${fGs(kpis.valor_nominal)} valor nominal`}
          icon={<TrendingUp size={14} />}
        />
        <KpiCard
          label="Operaciones activas"
          value={String(kpis.ops_activas ?? 0)}
          sub={`${String(kpis.cobrados_mes ?? 0)} cobradas este mes`}
          icon={<Activity size={14} />} iconBg="bg-sky-50" iconColor="text-sky-600"
        />
        <KpiCard
          variant="alert"
          label="En mora"
          value={String(kpis.ops_mora ?? 0)}
          sub="Operaciones con atraso"
          icon={<AlertTriangle size={14} />}
          highlight={Number(kpis.ops_mora ?? 0) > 0}
        />
        <KpiCard
          variant="alert"
          label="Cheques próx. 14d"
          value={String(chKpis.proximos_14 ?? 0)}
          sub={`${fGs(chKpis.monto_proximos_14)} por cobrar`}
          icon={<Clock size={14} />}
          highlight={Number(chKpis.proximos_14 ?? 0) > 0}
        />
      </div>

      {/* ── Bancos + Estados ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Por banco */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Landmark size={16} className="text-indigo-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Capital por Banco</h2>
              <p className="text-xs text-gray-400">Cheques en cartera activa</p>
            </div>
          </div>
          <div className="space-y-3">
            {porBanco.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Sin datos.</p>
              : porBanco.slice(0, 6).map(b => (
              <div key={String(b.banco)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 truncate max-w-[160px]">{String(b.banco ?? '—')}</span>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-sm font-bold text-gray-900">{fGs(b.capital)}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{String(b.ops)} op.</span>
                  </div>
                </div>
                <BarH value={Number(b.capital ?? 0)} max={maxBanco} color="bg-indigo-500" height="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Por estado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-blue-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Capital por Estado</h2>
              <p className="text-xs text-gray-400">Operaciones activas e históricas</p>
            </div>
          </div>
          <div className="space-y-3">
            {porEstado.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Sin datos.</p>
              : porEstado.map(e => (
              <div key={String(e.estado)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ESTADO_COLOR[String(e.estado)] ?? 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-700">{ESTADO_LABEL[String(e.estado)] ?? String(e.estado)}</span>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900">{fGs(e.capital)}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{String(e.cantidad)} op.</span>
                  </div>
                </div>
                <BarH value={Number(e.capital ?? 0)} max={maxEstado}
                  color={ESTADO_COLOR[String(e.estado)] ?? 'bg-gray-400'} height="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Vencimientos próximos 10 días ──────────────────────────── */}
      {vencim.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Cheques que vencen en 10 días</h2>
                <p className="text-xs text-gray-400">{vencim.length} cheque{vencim.length !== 1 ? 's' : ''} — acción inmediata</p>
              </div>
            </div>
            <Link to="/tesoreria/cheques"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              Ver dashboard <ChevronRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Operación','Cliente','Banco','N° Cheque','Vencimiento','Días','Monto','Capital','Interés'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vencim.map((r, i) => {
                  const dias = Number(r.dias_restantes) || 0;
                  const urgente = dias <= 2;
                  const medio   = dias <= 5;
                  return (
                    <tr key={String(r.id ?? i)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <Link to={`/operaciones/${String(r.id ?? '')}`}
                          className="text-blue-600 hover:underline font-medium text-xs">
                          {String(r.nro_operacion ?? '—')}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[160px] truncate">{String(r.contacto_nombre ?? '—')}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{String(r.banco ?? '—')}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600 text-xs">{String(r.nro_cheque ?? '—')}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{fDate(r.fecha_vencimiento)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${
                          urgente ? 'bg-red-100 text-red-700'
                          : medio  ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                        }`}>
                          {urgente && '⚡ '}{dias}d
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900 text-right whitespace-nowrap">{fGs(r.monto)}</td>
                      <td className="px-3 py-2.5 text-blue-700 text-right whitespace-nowrap">{fGs(r.capital_invertido)}</td>
                      <td className="px-3 py-2.5 text-emerald-700 font-semibold text-right whitespace-nowrap">+{fGs(r.interes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Proyección semanal ─────────────────────────────────────── */}
      {proyecc.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Proyección de Cobro por Semana</h2>
              <p className="text-xs text-gray-400">Cheques activos · próximas {proyecc.length} semanas</p>
            </div>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Semana','Período','Cheques','Valor nominal','Capital','Interés'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {proyecc.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">S{i + 1}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                      {String(s.desde ?? '—')} – {String(s.hasta ?? '—')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {String(s.cantidad ?? 0)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900 text-right whitespace-nowrap">{fGs(s.valor_cheques)}</td>
                    <td className="px-3 py-2.5 text-blue-700 text-right whitespace-nowrap">{fGs(s.capital)}</td>
                    <td className="px-3 py-2.5 text-emerald-700 font-semibold text-right whitespace-nowrap">+{fGs(s.interes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-300 pb-2">
        SOFITUL · Dashboard Ejecutivo · Datos en tiempo real
      </div>
    </div>
  );
}
