import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, Landmark } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const VACIO = { nombre: '', codigo: '', abreviatura: '', orden: 0, activo: true, contacto: '', correo: '', telefono: '' };

export default function Bancos() {
  const [bancos,   setBancos]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [buscar,   setBuscar]   = useState('');

  const cargar = () => {
    panelGlobalApi.getBancos()
      .then(setBancos)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { alert('El nombre es obligatorio.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, orden: parseInt(form.orden) || 0 };
      if (editId) await panelGlobalApi.updateBanco(editId, payload);
      else        await panelGlobalApi.createBanco(payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (b: any) => {
    setEditId(b.id);
    setForm({
      nombre:       b.nombre,
      codigo:       b.codigo      ?? '',
      abreviatura:  b.abreviatura ?? '',
      orden:        b.orden       ?? 0,
      activo:       b.activo,
      contacto:     b.contacto    ?? '',
      correo:       b.correo      ?? '',
      telefono:     b.telefono    ?? '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const filtrados = bancos.filter(b =>
    !buscar || b.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (b.codigo ?? '').toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Landmark size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Bancos</h1>
          <span className="text-sm text-gray-400 font-normal">{bancos.length} registrado{bancos.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo banco
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar banco' : 'Nuevo banco'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo <span className="text-red-500">*</span></label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls}
                placeholder="Ej: Banco Continental S.A.E.C.A." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} className={inputCls}
                placeholder="Ej: CONTINENTAL" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Abreviatura</label>
              <input value={form.abreviatura} onChange={e => set('abreviatura', e.target.value)} className={inputCls}
                placeholder="Ej: Continental" />
            </div>
            {/* Datos de contacto */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contacto (persona)</label>
              <input value={form.contacto} onChange={e => set('contacto', e.target.value)} className={inputCls}
                placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
              <input type="email" value={form.correo} onChange={e => set('correo', e.target.value)} className={inputCls}
                placeholder="Ej: contacto@banco.com.py" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls}
                placeholder="Ej: +595 21 000 000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
              <input type="number" value={form.orden} onChange={e => set('orden', e.target.value)} className={inputCls} min={0} />
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

      {/* Buscador */}
      <div className="mb-3">
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre o código…"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Nombre', 'Código', 'Contacto', 'Correo', 'Teléfono', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
              ) : filtrados.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs w-8">{b.orden}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{b.nombre}</td>
                  <td className="px-4 py-3">
                    {b.codigo
                      ? <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">{b.codigo}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.contacto || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.correo
                      ? <a href={`mailto:${b.correo}`} className="text-blue-600 hover:underline">{b.correo}</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.telefono
                      ? <a href={`tel:${b.telefono}`} className="text-blue-600 hover:underline">{b.telefono}</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditar(b)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
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
