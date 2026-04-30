import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, CalendarDays, Trash2 } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const TIPOS = [
  { value: 'FIJO',     label: 'Fijo',     desc: 'Misma fecha todos los años',        cls: 'bg-blue-100 text-blue-700'   },
  { value: 'MOVIL',    label: 'Móvil',    desc: 'Fecha variable (Semana Santa, etc.)', cls: 'bg-amber-100 text-amber-700' },
  { value: 'EVENTUAL', label: 'Eventual', desc: 'Feriado extraordinario o puente',    cls: 'bg-purple-100 text-purple-700' },
];

const VACIO = { fecha: '', tipo: 'FIJO', descripcion: '', activo: true };

const anyoActual = new Date().getFullYear();

function TipoBadge({ tipo }: { tipo: string }) {
  const t = TIPOS.find(t => t.value === tipo);
  if (!t) return <span className="text-xs text-gray-400">{tipo}</span>;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.cls}`}>{t.label}</span>;
}

export default function Feriados() {
  const [feriados, setFeriados] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [año,      setAño]      = useState(anyoActual);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [buscar,   setBuscar]   = useState('');
  const [confirm,  setConfirm]  = useState<number | null>(null);

  const cargar = (a = año) => {
    setLoading(true);
    panelGlobalApi.getFeriados(a)
      .then(setFeriados)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [año]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.fecha)        { alert('La fecha es obligatoria.'); return; }
    if (!form.descripcion.trim()) { alert('La descripción es obligatoria.'); return; }
    setSaving(true);
    try {
      if (editId !== null) await panelGlobalApi.updateFeriado(editId, form);
      else                 await panelGlobalApi.createFeriado(form);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (f: any) => {
    setEditId(f.id);
    setForm({ fecha: f.fecha, tipo: f.tipo, descripcion: f.descripcion, activo: f.activo });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number) => {
    try {
      await panelGlobalApi.deleteFeriado(id);
      setConfirm(null);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al eliminar.');
    }
  };

  const inputCls  = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls = inputCls;

  const filtrados = feriados.filter(f =>
    !buscar ||
    f.descripcion.toLowerCase().includes(buscar.toLowerCase()) ||
    f.tipo.toLowerCase().includes(buscar.toLowerCase()),
  );

  const fijos    = filtrados.filter(f => f.tipo === 'FIJO');
  const moviles  = filtrados.filter(f => f.tipo === 'MOVIL');
  const eventuales = filtrados.filter(f => f.tipo === 'EVENTUAL');

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Feriados</h1>
          <span className="text-sm text-gray-400 font-normal">{feriados.length} registros</span>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nuevo feriado
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId !== null ? 'Editar feriado' : 'Nuevo feriado'}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha <span className="text-red-500">*</span></label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo <span className="text-red-500">*</span></label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={selectCls}>
                {TIPOS.map(t => (
                  <option key={t.value} value={t.value} title={t.desc}>{t.label} — {t.desc}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción <span className="text-red-500">*</span></label>
              <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className={inputCls} placeholder="Ej: Día de la Independencia" maxLength={150} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                Activo
              </label>
            </div>
          </div>
          {form.tipo === 'FIJO' && (
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">
              💡 Los feriados <strong>Fijos</strong> aplican todos los años — el año de la fecha ingresada se usa solo como referencia.
            </p>
          )}
          <div className="flex gap-2 pt-1">
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

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input value={buscar} onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar descripción o tipo…"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Año:</label>
          <select value={año} onChange={e => setAño(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 10 }, (_, i) => anyoActual - 1 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 ml-auto text-xs text-gray-500">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{fijos.length} fijos</span>
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{moviles.length} móviles</span>
          {eventuales.length > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{eventuales.length} eventuales</span>}
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
                {['Fecha', 'Tipo', 'Descripción', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin registros para los filtros aplicados</td></tr>
              ) : filtrados.map((f: any) => (
                <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${!f.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-sm text-gray-800 whitespace-nowrap">{f.fecha}</td>
                  <td className="px-4 py-3"><TipoBadge tipo={f.tipo} /></td>
                  <td className="px-4 py-3 text-gray-700">{f.descripcion}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {f.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEditar(f)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Editar">
                        <Pencil size={14} />
                      </button>
                      {confirm === f.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleEliminar(f.id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 font-medium">Sí</button>
                          <button onClick={() => setConfirm(null)} className="text-gray-500 hover:text-gray-700 p-1">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirm(f.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info tipos */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-500">
        {TIPOS.map(t => (
          <div key={t.value} className="flex gap-2 items-start">
            <span className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${t.cls}`}>{t.label}</span>
            <span>{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
