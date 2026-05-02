import { useEffect, useState } from 'react';
import { Plus, X, Check, CheckSquare } from 'lucide-react';
import { conciliacionesApi } from '../../services/financieroApi';
import { empleadosApi } from '../../services/rrhhApi';

type EstadoConciliacion = 'ABIERTA' | 'CERRADA' | 'CONCILIADA';

const ESTADO_COLOR: Record<EstadoConciliacion, string> = {
  ABIERTA:    'bg-yellow-100 text-yellow-700',
  CERRADA:    'bg-blue-100 text-blue-700',
  CONCILIADA: 'bg-green-100 text-green-700',
};

const VACIO_NUEVA = {
  cobradorId: '', cajaId: '', fechaPeriodo: '', tipo: 'DIARIA',
};

const VACIO_CIERRE = {
  montoDeclarado: '', montoRecibido: '', observaciones: '',
};

function fmtMoneda(n: number | null | undefined) {
  if (n == null) return <span className="text-gray-300">—</span>;
  return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0 }).format(n);
}

export default function Conciliaciones() {
  const [lista,      setLista]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [cobradores, setCobradores] = useState<any[]>([]);

  // Filtros
  const [filtCobrador, setFiltCobrador] = useState('');
  const [filtEstado,   setFiltEstado]   = useState('');
  const [filtDesde,    setFiltDesde]    = useState('');
  const [filtHasta,    setFiltHasta]    = useState('');

  // Modal nueva
  const [showNueva,   setShowNueva]   = useState(false);
  const [formNueva,   setFormNueva]   = useState<any>({ ...VACIO_NUEVA });
  const [guardando,   setGuardando]   = useState(false);

  // Modal detalle
  const [detalle,     setDetalle]     = useState<any>(null);
  const [loadDet,     setLoadDet]     = useState(false);

  // Modal cierre
  const [showCierre,  setShowCierre]  = useState(false);
  const [formCierre,  setFormCierre]  = useState<any>({ ...VACIO_CIERRE });
  const [cerrando,    setCerrando]    = useState(false);

  const cargar = () => {
    setLoading(true);
    const params: any = {};
    if (filtCobrador) params.cobradorId   = filtCobrador;
    if (filtEstado)   params.estado       = filtEstado;
    if (filtDesde)    params.fechaDesde   = filtDesde;
    if (filtHasta)    params.fechaHasta   = filtHasta;
    conciliacionesApi.getAll(params)
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    empleadosApi.getCobradores().then(setCobradores).catch(() => {});
    cargar();
  }, []);

  const handleFiltrar = () => cargar();

  const setN = (k: string, v: any) => setFormNueva((f: any) => ({ ...f, [k]: v }));
  const setC = (k: string, v: any) => setFormCierre((f: any) => ({ ...f, [k]: v }));

  const handleCrear = async () => {
    if (!formNueva.cobradorId) { alert('Seleccione un cobrador.'); return; }
    setGuardando(true);
    try {
      await conciliacionesApi.create({ ...formNueva, cajaId: formNueva.cajaId || undefined });
      setShowNueva(false); setFormNueva({ ...VACIO_NUEVA });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al crear.');
    } finally { setGuardando(false); }
  };

  const abrirDetalle = async (item: any) => {
    setLoadDet(true);
    setDetalle({ ...item, transacciones: [] });
    try {
      const full = await conciliacionesApi.getById(item.id);
      setDetalle(full);
    } catch {
      // mostrar datos parciales
    } finally { setLoadDet(false); }
  };

  const handleAccion = async (accion: 'cerrar' | 'conciliar' | 'reabrir') => {
    if (!detalle) return;
    if (accion === 'cerrar') {
      setShowCierre(true);
      return;
    }
    try {
      if (accion === 'conciliar') await conciliacionesApi.conciliar(detalle.id);
      if (accion === 'reabrir')   await conciliacionesApi.reabrir(detalle.id);
      setDetalle(null);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error en la operación.');
    }
  };

  const handleCerrar = async () => {
    if (!detalle) return;
    if (!formCierre.montoDeclarado) { alert('El monto declarado es obligatorio.'); return; }
    setCerrando(true);
    try {
      await conciliacionesApi.cerrar(detalle.id, {
        montoDeclarado: parseFloat(formCierre.montoDeclarado),
        montoRecibido:  parseFloat(formCierre.montoRecibido) || undefined,
        observaciones:  formCierre.observaciones || undefined,
      });
      setShowCierre(false); setFormCierre({ ...VACIO_CIERRE }); setDetalle(null);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al cerrar.');
    } finally { setCerrando(false); }
  };

  const diferencia = (item: any) => {
    const d = (item.montoDeclarado ?? 0) - (item.montoRecibido ?? 0);
    return d;
  };

  const inputCls  = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const inputFullCls = inputCls + ' w-full';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckSquare size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Conciliaciones</h1>
          <span className="text-sm text-gray-400 font-normal">{lista.length} registrada{lista.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => { setFormNueva({ ...VACIO_NUEVA }); setShowNueva(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nueva conciliación
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cobrador</label>
            <select value={filtCobrador} onChange={e => setFiltCobrador(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {cobradores.map(c => (
                <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select value={filtEstado} onChange={e => setFiltEstado(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="ABIERTA">Abierta</option>
              <option value="CERRADA">Cerrada</option>
              <option value="CONCILIADA">Conciliada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={filtDesde} onChange={e => setFiltDesde(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={filtHasta} onChange={e => setFiltHasta(e.target.value)} className={inputCls} />
          </div>
          <button onClick={handleFiltrar} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Cobrador', 'Tipo', 'Estado', 'M. Esperado', 'M. Declarado', 'M. Recibido', 'Diferencia', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sin conciliaciones</td></tr>
              ) : lista.map((item: any) => {
                const diff = diferencia(item);
                const hasDiff = item.montoDeclarado != null && item.montoRecibido != null && diff !== 0;
                return (
                  <tr key={item.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => abrirDetalle(item)}>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {item.fechaPeriodo ? new Date(item.fechaPeriodo).toLocaleDateString('es-PY') : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.cobrador
                        ? `${item.cobrador.apellido ?? ''}, ${item.cobrador.nombre ?? ''}`
                        : item.cobradorId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.tipo ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[(item.estado as EstadoConciliacion)] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmtMoneda(item.montoEsperado)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtMoneda(item.montoDeclarado)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtMoneda(item.montoRecibido)}</td>
                    <td className="px-4 py-3">
                      {hasDiff
                        ? <span className="text-red-600 font-semibold">{fmtMoneda(diff)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-blue-400 text-xs">Ver →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: Nueva conciliación */}
      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Nueva Conciliación</h2>
              <button onClick={() => setShowNueva(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cobrador <span className="text-red-500">*</span></label>
                <select value={formNueva.cobradorId} onChange={e => setN('cobradorId', e.target.value)} className={inputFullCls}>
                  <option value="">Seleccionar cobrador…</option>
                  {cobradores.map(c => (
                    <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Caja ID</label>
                <input value={formNueva.cajaId} onChange={e => setN('cajaId', e.target.value)} className={inputFullCls} placeholder="UUID de la caja (opcional)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Período</label>
                <input type="date" value={formNueva.fechaPeriodo} onChange={e => setN('fechaPeriodo', e.target.value)} className={inputFullCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select value={formNueva.tipo} onChange={e => setN('tipo', e.target.value)} className={inputFullCls}>
                  <option value="DIARIA">Diaria</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCrear} disabled={guardando}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                <Check size={14} /> {guardando ? 'Creando...' : 'Crear'}
              </button>
              <button onClick={() => setShowNueva(false)}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalle conciliación */}
      {detalle && !showCierre && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Detalle de Conciliación</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[detalle.estado as EstadoConciliacion] ?? 'bg-gray-100 text-gray-500'}`}>
                    {detalle.estado}
                  </span>
                  <span className="text-xs text-gray-500">
                    {detalle.fechaPeriodo ? new Date(detalle.fechaPeriodo).toLocaleDateString('es-PY') : ''}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {/* Datos resumen */}
            <div className="grid grid-cols-3 gap-3 mb-5 text-sm">
              {[
                { label: 'Monto esperado',  val: fmtMoneda(detalle.montoEsperado) },
                { label: 'Monto declarado', val: fmtMoneda(detalle.montoDeclarado) },
                { label: 'Monto recibido',  val: fmtMoneda(detalle.montoRecibido) },
              ].map(r => (
                <div key={r.label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{r.label}</div>
                  <div className="font-semibold text-gray-800">{r.val}</div>
                </div>
              ))}
            </div>

            {/* Transacciones */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Transacciones</h3>
            {loadDet ? (
              <div className="text-center text-gray-400 py-4 text-sm">Cargando…</div>
            ) : (!detalle.transacciones || detalle.transacciones.length === 0) ? (
              <div className="text-center text-gray-400 py-4 text-sm">Sin transacciones asociadas.</div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fecha', 'Tipo', 'Referencia', 'Monto'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalle.transacciones.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{t.fecha ? new Date(t.fecha).toLocaleDateString('es-PY') : '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{t.tipo ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{t.referencia ?? '—'}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{fmtMoneda(t.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {detalle.estado === 'ABIERTA' && (
                <button onClick={() => handleAccion('cerrar')}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                  Cerrar conciliación
                </button>
              )}
              {detalle.estado === 'CERRADA' && (
                <>
                  <button onClick={() => handleAccion('conciliar')}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium">
                    Conciliar
                  </button>
                  <button onClick={() => handleAccion('reabrir')}
                    className="text-sm border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">
                    Reabrir
                  </button>
                </>
              )}
              {detalle.estado === 'CONCILIADA' && (
                <button onClick={() => handleAccion('reabrir')}
                  className="text-sm border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">
                  Reabrir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cierre */}
      {showCierre && detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Cerrar Conciliación</h2>
              <button onClick={() => setShowCierre(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monto declarado <span className="text-red-500">*</span></label>
                <input type="number" value={formCierre.montoDeclarado} onChange={e => setC('montoDeclarado', e.target.value)} className={inputFullCls} placeholder="0" step="0.01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monto recibido</label>
                <input type="number" value={formCierre.montoRecibido} onChange={e => setC('montoRecibido', e.target.value)} className={inputFullCls} placeholder="0" step="0.01" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                <textarea value={formCierre.observaciones} onChange={e => setC('observaciones', e.target.value)} className={inputFullCls} rows={2} placeholder="Observaciones opcionales" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCerrar} disabled={cerrando}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                <Check size={14} /> {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
              <button onClick={() => setShowCierre(false)}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
