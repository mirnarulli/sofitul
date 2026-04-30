import { useEffect, useState } from 'react';
import { Plus, Search, ShieldOff, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const TIPOS_DOC = ['CI', 'RUC', 'PASAPORTE', 'DNI', 'OTRO'];
const MOTIVOS   = ['Incumplimiento de pago', 'Cheque rechazado', 'Fraude', 'Lista negra externa', 'Conducta indebida', 'Otro'];

const VACIO = {
  tipoDoc: 'CI', numeroDoc: '', nombre: '', motivo: '', fechaVeto: '', observaciones: '', activo: true,
};

export default function ClientesVetados() {
  const [lista,    setLista]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [buscar,   setBuscar]   = useState('');
  const [filtro,   setFiltro]   = useState<'todos' | 'activos' | 'inactivos'>('activos');

  const cargar = (q?: string) => {
    panelGlobalApi.getClientesVetados(q)
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleBuscar = (v: string) => {
    setBuscar(v);
    if (v.length >= 3 || v.length === 0) cargar(v || undefined);
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.numeroDoc.trim()) { alert('El número de documento es obligatorio.'); return; }
    if (!form.nombre.trim())    { alert('El nombre es obligatorio.'); return; }
    setSaving(true);
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const payload = { ...form, agregadoPor: `${usuario.primerNombre ?? ''} ${usuario.primerApellido ?? ''}`.trim() };
      if (editId) await panelGlobalApi.updateClienteVetado(editId, payload);
      else        await panelGlobalApi.createClienteVetado(payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar(buscar || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (v: any) => {
    setEditId(v.id);
    setForm({
      tipoDoc: v.tipoDoc, numeroDoc: v.numeroDoc, nombre: v.nombre,
      motivo: v.motivo ?? '', fechaVeto: v.fechaVeto ?? '', observaciones: v.observaciones ?? '', activo: v.activo,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

  const filtrados = lista.filter(v => {
    if (filtro === 'activos')   return v.activo;
    if (filtro === 'inactivos') return !v.activo;
    return true;
  });

  const activos   = lista.filter(v => v.activo).length;
  const inactivos = lista.filter(v => !v.activo).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldOff size={22} className="text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Clientes Vetados</h1>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO, fechaVeto: new Date().toISOString().slice(0,10) }); setShowForm(true); }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium">
          <Plus size={15} /> Agregar veto
        </button>
      </div>

      {/* KPI mini */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total registros', val: lista.length,    color: 'text-gray-700',   bg: 'bg-gray-50' },
          { label: 'Activos (vetados)', val: activos,       color: 'text-red-700',    bg: 'bg-red-50' },
          { label: 'Inactivos',        val: inactivos,      color: 'text-gray-500',   bg: 'bg-gray-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 border border-gray-200`}>
            <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-red-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-gray-700">{editId ? 'Editar registro' : 'Nuevo veto'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo documento</label>
              <select value={form.tipoDoc} onChange={e => set('tipoDoc', e.target.value)} className={inputCls}>
                {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Número de documento <span className="text-red-500">*</span></label>
              <input value={form.numeroDoc} onChange={e => set('numeroDoc', e.target.value)} className={inputCls}
                placeholder="Ej: 3412413" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo <span className="text-red-500">*</span></label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls}
                placeholder="Nombre y apellido" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
              <select value={form.motivo} onChange={e => set('motivo', e.target.value)} className={inputCls}>
                <option value="">Sin especificar</option>
                {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de veto</label>
              <input type="date" value={form.fechaVeto} onChange={e => set('fechaVeto', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
              <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
                className={inputCls + ' resize-none'} rows={2} placeholder="Detalle adicional…" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-red-600" />
                Veto activo
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros y buscador */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={buscar} onChange={e => handleBuscar(e.target.value)}
            placeholder="Buscar por documento o nombre…"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['activos', 'todos', 'inactivos'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 capitalize transition-colors ${filtro === f ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Doc', 'Número', 'Nombre', 'Motivo', 'Fecha veto', 'Agregado por', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin registros</td></tr>
              ) : filtrados.map((v: any) => (
                <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${v.activo ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{v.tipoDoc}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-800 font-medium">{v.numeroDoc}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{v.nombre}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[150px] truncate">{v.motivo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{v.fechaVeto ? new Date(v.fechaVeto + 'T12:00:00').toLocaleDateString('es-PY') : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{v.agregadoPor ?? '—'}</td>
                  <td className="px-4 py-3">
                    {v.activo
                      ? <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-medium w-fit">
                          <ShieldOff size={10} /> VETADO
                        </span>
                      : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditar(v)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
