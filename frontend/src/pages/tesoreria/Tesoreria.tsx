import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, Banknote, Loader2, Download } from 'lucide-react';
import Modal from '../../components/Modal';
import { tesoreriaApi } from '../../services/operacionesApi';
import { panelGlobalApi } from '../../services/contactosApi';
import StatusBadge from '../../components/StatusBadge';
import { formatGs, formatDate } from '../../utils/formatters';
import { Toast } from '../../components/ui/Toast';

// ── FilaDesembolso ─────────────────────────────────────────────────────────────
function FilaDesembolso({ op, cajas, onDesembolsado }: { op: any; cajas: any[]; onDesembolsado: (id: string) => void }) {
  const [cajaId, setCajaId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDesembolsar = async () => {
    if (!cajaId) return;
    setSaving(true);
    try {
      await tesoreriaApi.registrarDesembolso(op.id, { cajaId });
      onDesembolsado(op.id);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al desembolsar.');
    } finally { setSaving(false); }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-xs">{op.nroOperacion}</td>
      <td className="px-4 py-3 font-medium">{op.contactoNombre}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Cheque' : 'Préstamo'}</td>
      <td className="px-4 py-3 font-bold text-green-700">{formatGs(op.netoDesembolsar)}</td>
      <td className="px-4 py-3 text-xs">{formatDate(op.fechaOperacion)}</td>
      <td className="px-4 py-3"><StatusBadge estado={op.estado} /></td>
      <td className="px-4 py-3">
        <select value={cajaId} onChange={e => setCajaId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
          <option value="">Seleccionar...</option>
          {cajas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleDesembolsar} disabled={!cajaId || saving}
          className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40">
          <Check size={12} /> {saving ? '...' : 'Desembolsar'}
        </button>
      </td>
    </tr>
  );
}

// ── Modal de cobro ─────────────────────────────────────────────────────────────
function ModalCobro({
  cheque, onClose, onCobrado
}: {
  cheque: any;
  onClose: () => void;
  onCobrado: (chequeId: string, cerro: boolean) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [fechaCobro, setFechaCobro] = useState(today);
  const [nroRef, setNroRef] = useState('');
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const esTeDescuento = cheque.canal === 'TeDescuento';
  const dias = Number(cheque.dias_restantes ?? 0);

  const handleCobrar = async () => {
    setSaving(true); setErr('');
    try {
      const res = await tesoreriaApi.registrarCobro(cheque.cheque_id, {
        fechaCobro, nroReferencia: nroRef || undefined, notaCobro: nota || undefined,
      });
      onCobrado(cheque.cheque_id, res.operacionCerrada);
    } catch (e: any) {
      setErr(e.response?.data?.message ?? 'Error al registrar cobro.');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      title="Registrar Cobro"
      subtitle={`${cheque.nro_operacion} · ${cheque.contacto_nombre}`}
      onClose={onClose}
    >
      {/* Info del cheque */}
      <div className={`rounded-xl p-4 mb-5 text-sm ${
        dias < 0  ? 'bg-red-50 border border-red-200' :
        dias === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-100'
      }`}>
        <div className="grid grid-cols-2 gap-2">
          <div><p className="text-xs text-gray-500">Banco / Cheque</p><p className="font-semibold">{cheque.banco} #{cheque.nro_cheque}</p></div>
          <div><p className="text-xs text-gray-500">Librador</p><p className="font-medium">{cheque.librador}</p></div>
          <div><p className="text-xs text-gray-500">Valor</p><p className="font-bold">{formatGs(cheque.monto)}</p></div>
          <div>
            <p className="text-xs text-gray-500">Vencimiento</p>
            <p className={`font-medium ${dias < 0 ? 'text-red-700' : ''}`}>
              {String(cheque.fecha_vencimiento).slice(0, 10)}
              {dias < 0  && <span className="ml-1 text-red-600 font-bold">({Math.abs(dias)}d vencido)</span>}
              {dias === 0 && <span className="ml-1 text-amber-600 font-bold">(hoy)</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Canal</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              esTeDescuento ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
            }`}>{cheque.canal ?? 'Particular'}</span>
          </div>
          <div><p className="text-xs text-gray-500">Interés Generado</p><p className="font-semibold text-emerald-700">+{formatGs(cheque.interes)}</p></div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de acreditación</label>
          <input type="date" value={fechaCobro} onChange={e => setFechaCobro(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {esTeDescuento ? 'N° transferencia TeDescuento' : 'N° depósito / referencia'}
          </label>
          <input type="text" value={nroRef} onChange={e => setNroRef(e.target.value)}
            placeholder={esTeDescuento ? 'Ej: TED-20260430-001' : 'Opcional'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nota (opcional)</label>
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2}
            placeholder="Observaciones del cobro..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </div>

      {err && <p className="text-red-600 text-xs mt-3">{err}</p>}

      {/* Acciones */}
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button onClick={handleCobrar} disabled={saving || !fechaCobro}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Confirmar Cobro
        </button>
      </div>
    </Modal>
  );
}

// ── Tab Cobranzas ─────────────────────────────────────────────────────────────
function TabCobranzas() {
  const [cheques, setCheques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any | null>(null);
  const [toast, setToast] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('');

  const load = () => {
    setLoading(true);
    tesoreriaApi.getCobranzas()
      .then(r => setCheques(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCobrado = (chequeId: string, cerro: boolean) => {
    setCheques(prev => prev.filter(c => c.cheque_id !== chequeId));
    setModal(null);
    setToast(cerro ? '✅ Cheque cobrado — Operación cerrada automáticamente.' : '✅ Cheque registrado como cobrado.');
    setTimeout(() => setToast(''), 5000);
  };

  const filtrados = filtroCanal ? cheques.filter(c => c.canal === filtroCanal) : cheques;

  const vencidos  = filtrados.filter(c => Number(c.dias_restantes) < 0).length;
  const hoy       = filtrados.filter(c => Number(c.dias_restantes) === 0).length;
  const proximos  = filtrados.filter(c => Number(c.dias_restantes) > 0).length;

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          {toast}
        </div>
      )}

      {modal && (
        <ModalCobro cheque={modal} onClose={() => setModal(null)} onCobrado={handleCobrado} />
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className={`rounded-xl border p-4 ${vencidos > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-500 mb-1">Vencidos (en mora)</p>
          <p className={`text-2xl font-bold ${vencidos > 0 ? 'text-red-700' : 'text-gray-300'}`}>{vencidos}</p>
        </div>
        <div className={`rounded-xl border p-4 ${hoy > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-500 mb-1">Vencen hoy</p>
          <p className={`text-2xl font-bold ${hoy > 0 ? 'text-amber-700' : 'text-gray-300'}`}>{hoy}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Próximos</p>
          <p className="text-2xl font-bold text-blue-700">{proximos}</p>
        </div>
      </div>

      {/* Filtro canal */}
      <div className="flex gap-2 mb-4">
        {['', 'TeDescuento', 'Particular'].map(c => (
          <button key={c} onClick={() => setFiltroCanal(c)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              filtroCanal === c
                ? c === 'TeDescuento' ? 'bg-violet-600 text-white border-violet-600'
                  : c === 'Particular' ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            {c === '' ? `Todos (${cheques.length})` : `${c} (${cheques.filter(x => x.canal === c).length})`}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando cheques...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <Check size={32} className="text-emerald-400" />
            <p>No hay cheques pendientes de cobro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Operación', 'Cliente', 'Banco', 'N° Cheque', 'Librador', 'Vencimiento', 'Días', 'Valor', 'Capital', 'Interés Gen.', 'Canal', 'Acción'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((c: any) => {
                  const dias = Number(c.dias_restantes ?? 0);
                  const vencido = dias < 0;
                  const esHoy   = dias === 0;
                  return (
                    <tr key={c.cheque_id} className={`hover:bg-gray-50 transition-colors ${vencido ? 'bg-red-50/40' : esHoy ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-3 py-2.5">
                        <Link to={`/operaciones/${c.operacion_id}`} className="text-blue-600 hover:underline font-medium">
                          {c.nro_operacion}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[140px] truncate">{c.contacto_nombre}</td>
                      <td className="px-3 py-2.5 text-gray-600">{c.banco}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{c.nro_cheque}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate">{c.librador}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {String(c.fecha_vencimiento).slice(0, 10)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                          vencido ? 'bg-red-100 text-red-700' :
                          esHoy   ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {vencido ? `⚡ ${Math.abs(dias)}d` : esHoy ? '⚡ hoy' : `${dias}d`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900 text-right whitespace-nowrap">{formatGs(c.monto)}</td>
                      <td className="px-3 py-2.5 text-blue-700 text-right whitespace-nowrap">{formatGs(c.capital_invertido)}</td>
                      <td className="px-3 py-2.5 text-emerald-700 font-semibold text-right whitespace-nowrap">+{formatGs(c.interes)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.canal === 'TeDescuento' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
                        }`}>{c.canal ?? 'Particular'}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => setModal(c)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
                          <Check size={11} /> Cobrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Tesoreria ─────────────────────────────────────────────────────────────
export default function Tesoreria() {
  const [pendientes,    setPendientes]    = useState<any[]>([]);
  const [alertasPagare, setAlertasPagare] = useState<any[]>([]);
  const [cajas,         setCajas]         = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [exportando,    setExportando]    = useState(false);
  const [toast,         setToast]         = useState('');
  const [tab, setTab] = useState<'pendientes' | 'cobranzas' | 'pagare' | 'cajas'>('pendientes');

  const handleExport = async () => {
    setExportando(true);
    try {
      const blob = await tesoreriaApi.exportExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tesoreria-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('Archivo descargado correctamente');
    } catch { /* silencioso */ }
    finally { setExportando(false); }
  };

  useEffect(() => {
    Promise.all([
      tesoreriaApi.getPendientesDesembolso(),
      tesoreriaApi.getAlertasPagare(),
      panelGlobalApi.getCajas(),
    ])
      .then(([p, a, c]) => { setPendientes(p); setAlertasPagare(a); setCajas(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tesorería</h1>
          <p className="text-sm text-gray-500">Desembolsos, cobranzas y control de cajas</p>
        </div>
        <button onClick={handleExport} disabled={exportando}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
          <Download size={15} /> {exportando ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Desembolsos pendientes</p>
          <p className="text-2xl font-bold text-amber-700">{pendientes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Pagarés sin firmar</p>
          <p className="text-2xl font-bold text-red-700">{alertasPagare.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Cajas activas</p>
          <p className="text-2xl font-bold text-green-700">{cajas.length}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pendientes',  label: `Desembolsos (${pendientes.length})` },
          { key: 'cobranzas',   label: 'Cobranzas' },
          { key: 'pagare',      label: `Pagarés (${alertasPagare.length})` },
          { key: 'cajas',       label: 'Cajas' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {tab === 'pendientes' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {pendientes.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No hay desembolsos pendientes.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['N° Op.','Cliente','Tipo','Neto a Desembolsar','Fecha Op.','Estado','Caja','Acción'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pendientes.map(op => (
                        <FilaDesembolso key={op.id} op={op} cajas={cajas}
                          onDesembolsado={id => setPendientes(p => p.filter(x => x.id !== id))} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'cobranzas' && <TabCobranzas />}

          {tab === 'pagare' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {alertasPagare.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Check size={32} className="text-green-500" />
                  <p>Todos los pagarés han sido recibidos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['N° Op.','Cliente','Neto','Fecha desembolso','Estado',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alertasPagare.map((op: any) => (
                        <tr key={op.id} className="hover:bg-gray-50 bg-red-50/30">
                          <td className="px-4 py-3 font-mono text-xs">{op.nroOperacion}</td>
                          <td className="px-4 py-3 font-medium">{op.contactoNombre}</td>
                          <td className="px-4 py-3">{formatGs(op.netoDesembolsar)}</td>
                          <td className="px-4 py-3 text-xs">{formatDate(op.fechaDesembolso)}</td>
                          <td className="px-4 py-3"><StatusBadge estado={op.estado} /></td>
                          <td className="px-4 py-3">
                            <Link to={`/operaciones/${op.id}`} className="text-red-600 hover:underline text-xs font-medium flex items-center gap-1">
                              <AlertTriangle size={12} /> Gestionar
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'cajas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cajas.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Banknote size={18} className="text-blue-600" />
                      <p className="font-semibold text-gray-800">{c.nombre}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatGs(c.saldo)}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.moneda ?? 'PYG'} · {c.banco ?? 'Efectivo'}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
