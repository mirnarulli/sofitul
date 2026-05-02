import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Landmark, TrendingUp, FileWarning, Download,
} from 'lucide-react';
import { inventarioApi } from '../../services/operacionesApi';
import { KpiCard } from '../../components/ui/KpiCard';
import { BarH  } from '../../components/ui/BarH';
import { Toast } from '../../components/ui/Toast';

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
  return new Date(s + 'T00:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ESTADO_LABEL: Record<string, string> = {
  VIGENTE:    'Vigente',
  COBRADO:    'Cobrado',
  DEVUELTO:   'Devuelto',
  PROTESTADO: 'Protestado',
  ENDOSADO:   'Endosado',
};

const ESTADO_COLOR: Record<string, string> = {
  VIGENTE:    'bg-blue-500',
  COBRADO:    'bg-emerald-500',
  DEVUELTO:   'bg-amber-500',
  PROTESTADO: 'bg-red-500',
  ENDOSADO:   'bg-violet-500',
};

const ESTADO_DOT: Record<string, string> = {
  VIGENTE:    'bg-blue-400',
  COBRADO:    'bg-emerald-400',
  DEVUELTO:   'bg-amber-400',
  PROTESTADO: 'bg-red-400',
  ENDOSADO:   'bg-violet-400',
};

// ── Tabla de cheques próximos / vencidos ──────────────────────────────────────
type ChequeRow = Record<string, unknown>;

function TablaCheques({ rows, tipo }: { rows: ChequeRow[]; tipo: 'proximos' | 'vencidos' }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        {tipo === 'proximos' ? 'Sin cheques próximos a vencer.' : 'Sin cheques vencidos.'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Operación', 'Cliente', 'Banco', 'N° Cheque', 'Vencimiento',
              tipo === 'proximos' ? 'Días' : 'Mora',
              'Monto', 'Capital', 'Interés'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => {
            const dias   = Number(tipo === 'proximos' ? r.dias_restantes : r.dias_mora) || 0;
            const urgente = tipo === 'proximos' ? dias <= 2 : dias > 30;
            const medio   = tipo === 'proximos' ? dias <= 7 : dias > 10;
            return (
              <tr key={String(r.id ?? i)} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5">
                  <Link to={`/operaciones/${String(r.operacion_id ?? '')}`}
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
                    : tipo === 'proximos' ? 'bg-blue-50 text-blue-700'
                    : 'bg-orange-50 text-orange-700'
                  }`}>
                    {tipo === 'proximos' && urgente && '⚡ '}{dias}d
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
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardCheques() {
  const [data,        setData]        = useState<Record<string, unknown> | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [exportando,  setExportando]  = useState(false);
  const [ts,          setTs]          = useState(Date.now());
  const [tab,         setTab]         = useState<'proximos' | 'vencidos'>('proximos');
  const [filterBanco, setFilterBanco] = useState('');
  const [toast,       setToast]       = useState('');

  const handleExport = async () => {
    setExportando(true);
    try {
      const blob = await inventarioApi.exportCheques();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cheques-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('Archivo descargado correctamente');
    } catch { /* silencioso */ }
    finally { setExportando(false); }
  };

  useEffect(() => {
    setLoading(true);
    inventarioApi.getChequesDashboard()
      .then((d: unknown) => setData(d as Record<string, unknown>))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ts]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando dashboard de cheques...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const kpis      = (data.kpis      as Record<string, unknown>) ?? {};
  const porEstado = (data.porEstado  as ChequeRow[]) ?? [];
  const porBanco  = (data.porBanco   as ChequeRow[]) ?? [];
  const proximos  = (data.proximos   as ChequeRow[]) ?? [];
  const vencidos  = (data.vencidos   as ChequeRow[]) ?? [];

  const maxBanco  = Math.max(...porBanco.map(b => Number(b.monto ?? 0)), 1);
  const maxEstado = Math.max(...porEstado.map(e => Number(e.monto ?? 0)), 1);

  // Lista de bancos únicos para el filtro
  const bancosDisponibles = Array.from(new Set([...proximos, ...vencidos].map(r => String(r.banco ?? '')).filter(Boolean))).sort();
  const proximosFiltrados = filterBanco ? proximos.filter(r => String(r.banco ?? '') === filterBanco) : proximos;
  const vencidosFiltrados  = filterBanco ? vencidos.filter(r => String(r.banco ?? '') === filterBanco)  : vencidos;

  return (
    <div className="p-5 max-w-[1400px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Cheques</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cartera de cheques activos · Vencimientos · Concentración por banco</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exportando}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Download size={14} /> {exportando ? 'Exportando...' : 'Excel'}
          </button>
          <button onClick={() => setTs(Date.now())}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors">
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Cheques vigentes"
          value={String(kpis.vigentes ?? 0)}
          sub={`${fGs(kpis.monto_vigente)} en valor nominal`}
          icon={<CheckCircle2 size={14} />} iconBg="bg-blue-50" iconColor="text-blue-600"
        />
        <KpiCard
          variant="gradient"
          label="Capital invertido"
          value={fGs(kpis.capital_vigente)}
          sub="En cheques vigentes"
          icon={<TrendingUp size={14} />}
        />
        <KpiCard
          variant="alert"
          label="Cheques vencidos"
          value={String(kpis.vencidos ?? 0)}
          sub={`${fGs(kpis.monto_vencido)} en gestión`}
          icon={<FileWarning size={14} />}
          highlight={Number(kpis.vencidos ?? 0) > 0}
        />
        <KpiCard
          variant="alert"
          label="Próximos 14 días"
          value={String(kpis.proximos_14 ?? 0)}
          sub={`${fGs(kpis.monto_proximos_14)} por cobrar`}
          icon={<Clock size={14} />}
          highlight={Number(kpis.proximos_14 ?? 0) > 0}
        />
      </div>

      {/* ── Bancos + Estados ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Por banco */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Landmark size={16} className="text-indigo-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Concentración por Banco</h2>
              <p className="text-xs text-gray-400">Cheques vigentes — valor nominal por banco librador</p>
            </div>
          </div>
          <div className="space-y-3">
            {porBanco.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Sin datos.</p>
              : porBanco.map(b => (
              <div key={String(b.banco)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{String(b.banco ?? '—')}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{fGs(b.monto)}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{String(b.cantidad)} ch.</span>
                  </div>
                </div>
                <BarH value={Number(b.monto ?? 0)} max={maxBanco} color="bg-indigo-500" height="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Por estado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Distribución por Estado</h2>
              <p className="text-xs text-gray-400">Todos los cheques en operaciones activas</p>
            </div>
          </div>
          <div className="space-y-4">
            {porEstado.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Sin datos.</p>
              : porEstado.map(e => (
              <div key={String(e.estado)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ESTADO_DOT[String(e.estado)] ?? 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-700">
                      {ESTADO_LABEL[String(e.estado)] ?? String(e.estado)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{fGs(e.monto)}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{String(e.cantidad)} ch.</span>
                  </div>
                </div>
                <BarH value={Number(e.monto ?? 0)} max={maxEstado}
                  color={ESTADO_COLOR[String(e.estado)] ?? 'bg-gray-400'} height="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabla tabbed: Próximos / Vencidos ─────────────────────── */}
      <div className={`bg-white rounded-2xl border shadow-sm p-6 ${
        tab === 'vencidos' && vencidos.length > 0 ? 'border-red-200' : 'border-amber-200'
      }`}>
        {/* Tabs + filtro banco */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <button
            onClick={() => setTab('proximos')}
            className={`flex items-center gap-2 text-sm font-semibold pb-1 border-b-2 transition-colors ${
              tab === 'proximos'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Clock size={15} />
            Próximos 30 días
            {proximosFiltrados.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {proximosFiltrados.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('vencidos')}
            className={`flex items-center gap-2 text-sm font-semibold pb-1 border-b-2 transition-colors ${
              tab === 'vencidos'
                ? 'border-red-500 text-red-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <FileWarning size={15} />
            Vencidos sin cobrar
            {vencidosFiltrados.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {vencidosFiltrados.length}
              </span>
            )}
          </button>

          {/* Filtro banco */}
          {bancosDisponibles.length > 0 && (
            <select
              value={filterBanco}
              onChange={e => setFilterBanco(e.target.value)}
              className="ml-auto text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">Todos los bancos</option>
              {bancosDisponibles.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
        </div>

        <TablaCheques rows={tab === 'proximos' ? proximosFiltrados : vencidosFiltrados} tipo={tab} />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-300 pb-2">
        SOFITUL · Dashboard Cheques · Datos en tiempo real
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
