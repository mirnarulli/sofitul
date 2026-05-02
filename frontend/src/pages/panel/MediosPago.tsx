import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, CreditCard } from 'lucide-react';
import { mediosPagoApi } from '../../services/contactosApi';

const VACIO = {
  codigo: '', nombre: '', descripcion: '', requiereReferencia: false,
  requiereBanco: false, esDigital: false, orden: 0, activo: true,
};

export default function MediosPago() {
  const [lista,    setLista]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [buscar,   setBuscar]   = useState('');

  const cargar = () => {
    mediosPagoApi.getAll()
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { alert('El nombre es obligatorio.'); return; }
    if (!form.codigo.trim()) { alert('El código es obligatorio.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, orden: parseInt(form.orden) || 0 };
      if (editId) await mediosPagoApi.update(editId, payload);
      else        await mediosPagoApi.create(payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (m: any) => {
    setEditId(m.id);
    setForm({
      codigo:             m.codigo              ?? '',
      nombre:             m.nombre              ?? '',
      descripcion:        m.descripcion         ?? '',
      requiereReferencia: m.requiereReferencia  ?? false,
      requiereBanco:      m.requiereBanco       ?? false,
      esDigital:          m.esDigital           ?? false,
      orden:              m.orden               ?? 0,
      activo:             m.activo,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const filtrados = lista.filter(m =>
    !buscar ||
    m.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (m.codigo ?? '').toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Medios de Pago</h1>
          <span className="text-sm text-gray-400 font-normal">{lista.length} registrado{lista.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nuevo medio de pago
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar medio de pago' : 'Nuevo medio de pago'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código <span className="text-red-500">*</span></label>
              <input
                value={form.codigo}
                onChange={e => set('codigo', e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="Ej: EFECTIVO"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                className={inputCls}
                placeholder="Ej: Efectivo"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                className={inputCls}
                placeholder="Descripción opcional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
              <input
                type="number"
                value={form.orden}
                onChange={e => set('orden', e.target.value)}
                className={inputCls}
                min={0}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.requiereReferencia} onChange={e => set('requiereReferencia', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Requiere referencia
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.requiereBanco} onChange={e => set('requiereBanco', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Requiere banco
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.esDigital} onChange={e => set('esDigital', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Es digital
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Activo
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <input
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Código', 'Nombre', '¿Requiere Ref?', '¿Requiere Banco?', 'Tipo', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
              ) : filtrados.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">{m.codigo}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{m.nombre}</td>
                  <td className="px-4 py-3 text-center">
                    {m.requiereReferencia
                      ? <span className="text-green-600 font-medium text-xs">Sí</span>
                      : <span className="text-gray-300 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.requiereBanco
                      ? <span className="text-green-600 font-medium text-xs">Sí</span>
                      : <span className="text-gray-300 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    {m.esDigital
                      ? <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Digital</span>
                      : <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">Efectivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditar(m)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
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
