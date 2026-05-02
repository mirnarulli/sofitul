import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, Stamp, AlertTriangle } from 'lucide-react';
import { talonariosApi } from '../../services/rrhhApi';

type EstadoTimbrado = 'ACTIVO' | 'VENCIDO' | 'AGOTADO' | 'ANULADO';

const ESTADO_COLOR: Record<EstadoTimbrado, string> = {
  ACTIVO:  'bg-green-100 text-green-700',
  VENCIDO: 'bg-red-100 text-red-700',
  AGOTADO: 'bg-orange-100 text-orange-700',
  ANULADO: 'bg-gray-100 text-gray-500',
};

const VACIO = {
  tipoComprobante: '', nroTimbrado: '', establecimiento: '', puntoExpedicion: '',
  nroDesde: '', nroHasta: '', nroSiguiente: '', vigenciaDesde: '', vigenciaHasta: '',
  activo: true,
};

function diasParaVencer(fecha: string): number {
  const hoy = new Date();
  const v   = new Date(fecha);
  return Math.ceil((v.getTime() - hoy.getTime()) / 86_400_000);
}

export default function TimbradosSet() {
  const [lista,    setLista]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const cargar = () => {
    talonariosApi.getTimbrados()
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.nroTimbrado.trim()) { alert('El número de timbrado es obligatorio.'); return; }
    if (!form.tipoComprobante.trim()) { alert('El tipo de comprobante es obligatorio.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        nroDesde:      parseInt(form.nroDesde) || undefined,
        nroHasta:      parseInt(form.nroHasta) || undefined,
        nroSiguiente:  parseInt(form.nroSiguiente) || undefined,
      };
      if (editId) await talonariosApi.updateTimbrado(editId, payload);
      else        await talonariosApi.createTimbrado(payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (t: any) => {
    setEditId(t.id);
    setForm({
      tipoComprobante:  t.tipoComprobante  ?? '',
      nroTimbrado:      t.nroTimbrado      ?? '',
      establecimiento:  t.establecimiento  ?? '',
      puntoExpedicion:  t.puntoExpedicion  ?? '',
      nroDesde:         t.nroDesde         ?? '',
      nroHasta:         t.nroHasta         ?? '',
      nroSiguiente:     t.nroSiguiente     ?? '',
      vigenciaDesde:    t.vigenciaDesde    ? t.vigenciaDesde.substring(0, 10) : '',
      vigenciaHasta:    t.vigenciaHasta    ? t.vigenciaHasta.substring(0, 10) : '',
      activo:           t.activo,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  // Timbrados activos que vencen en menos de 30 días
  const porVencer = lista.filter(t =>
    (t.estado === 'ACTIVO' || t.activo) &&
    t.vigenciaHasta &&
    diasParaVencer(t.vigenciaHasta) <= 30 &&
    diasParaVencer(t.vigenciaHasta) > 0
  );

  const estadoTimbrado = (t: any): EstadoTimbrado => {
    if (t.estado) return t.estado as EstadoTimbrado;
    if (!t.activo) return 'ANULADO';
    if (t.vigenciaHasta && new Date(t.vigenciaHasta) < new Date()) return 'VENCIDO';
    if (t.nroHasta && t.nroSiguiente && t.nroSiguiente > t.nroHasta) return 'AGOTADO';
    return 'ACTIVO';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Stamp size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Timbrados SET</h1>
          <span className="text-sm text-gray-400 font-normal">{lista.length} registrado{lista.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nuevo timbrado
        </button>
      </div>

      {porVencer.length > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-800">
          <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
          <span>
            <strong>{porVencer.length}</strong> timbrado{porVencer.length !== 1 ? 's' : ''} vence{porVencer.length === 1 ? '' : 'n'} en menos de 30 días.
            Renovar antes de que expire para evitar interrupciones.
          </span>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar timbrado' : 'Nuevo timbrado'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo comprobante <span className="text-red-500">*</span></label>
              <input value={form.tipoComprobante} onChange={e => set('tipoComprobante', e.target.value)} className={inputCls} placeholder="Ej: FACTURA" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Timbrado <span className="text-red-500">*</span></label>
              <input value={form.nroTimbrado} onChange={e => set('nroTimbrado', e.target.value)} className={inputCls} placeholder="Ej: 12345678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Establecimiento</label>
              <input value={form.establecimiento} onChange={e => set('establecimiento', e.target.value)} className={inputCls} placeholder="Ej: 001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Punto Expedición</label>
              <input value={form.puntoExpedicion} onChange={e => set('puntoExpedicion', e.target.value)} className={inputCls} placeholder="Ej: 001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Desde</label>
              <input type="number" value={form.nroDesde} onChange={e => set('nroDesde', e.target.value)} className={inputCls} min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Hasta</label>
              <input type="number" value={form.nroHasta} onChange={e => set('nroHasta', e.target.value)} className={inputCls} min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Siguiente N°</label>
              <input type="number" value={form.nroSiguiente} onChange={e => set('nroSiguiente', e.target.value)} className={inputCls} min={1} />
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vigencia desde</label>
              <input type="date" value={form.vigenciaDesde} onChange={e => set('vigenciaDesde', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vigencia hasta</label>
              <input type="date" value={form.vigenciaHasta} onChange={e => set('vigenciaHasta', e.target.value)} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-3">
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-blue-600" />
            Activo
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tipo', 'N° Timbrado', 'Est-Punto', 'Rango', 'Siguiente', 'Vigencia Desde', 'Vigencia Hasta', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sin timbrados registrados</td></tr>
              ) : lista.map((t: any) => {
                const estado = estadoTimbrado(t);
                const diasV  = t.vigenciaHasta ? diasParaVencer(t.vigenciaHasta) : null;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.tipoComprobante}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{t.nroTimbrado}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.establecimiento && t.puntoExpedicion ? `${t.establecimiento}-${t.puntoExpedicion}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {t.nroDesde && t.nroHasta ? `${t.nroDesde} – ${t.nroHasta}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {t.nroSiguiente ? String(t.nroSiguiente).padStart(7, '0') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {t.vigenciaDesde ? new Date(t.vigenciaDesde).toLocaleDateString('es-PY') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.vigenciaHasta ? (
                        <span className={diasV !== null && diasV <= 30 && diasV > 0 ? 'text-yellow-700 font-semibold' : 'text-gray-600'}>
                          {new Date(t.vigenciaHasta).toLocaleDateString('es-PY')}
                          {diasV !== null && diasV <= 30 && diasV > 0 && ` (${diasV}d)`}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[estado]}`}>
                        {estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleEditar(t)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
