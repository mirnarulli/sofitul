import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const VACIO = { codigo: '', nombre: '', activo: true };

export default function Paises() {
  const [paises, setPaises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    panelGlobalApi.getPaises()
      .then(setPaises)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      if (editId) await panelGlobalApi.updatePais(editId, form);
      else await panelGlobalApi.createPais(form);
      setShowForm(false);
      setEditId(null);
      setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error.');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Países</h1>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo país
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar' : 'Nuevo país'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código ISO (ej: PY)</label>
              <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} className={inputCls} maxLength={3} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="w-4 h-4" />
            Activo
          </label>
          <div className="flex gap-2">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Código','Nombre','Estado',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paises.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-700">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditId(p.id); setForm({ codigo: p.codigo, nombre: p.nombre, activo: p.activo }); setShowForm(true); }}
                      className="text-blue-600 hover:text-blue-700"><Pencil size={14} /></button>
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
