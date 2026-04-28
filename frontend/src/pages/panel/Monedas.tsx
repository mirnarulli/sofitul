import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

export default function Monedas() {
  const [monedas, setMonedas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', simbolo: '', activo: true });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    panelGlobalApi.getMonedas()
      .then(setMonedas)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      if (editId) {
        await panelGlobalApi.updateMoneda(editId, form);
      } else {
        await panelGlobalApi.createMoneda(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ codigo: '', nombre: '', simbolo: '', activo: true });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error.');
    } finally { setSaving(false); }
  };

  const handleEditar = (m: any) => {
    setEditId(m.id);
    setForm({ codigo: m.codigo, nombre: m.nombre, simbolo: m.simbolo, activo: m.activo });
    setShowForm(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monedas</h1>
        <button onClick={() => { setEditId(null); setForm({ codigo: '', nombre: '', simbolo: '', activo: true }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nueva moneda
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar moneda' : 'Nueva moneda'}</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { k: 'codigo', label: 'Código (ej: PYG)' },
              { k: 'nombre', label: 'Nombre' },
              { k: 'simbolo', label: 'Símbolo (ej: Gs.)' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input value={(form as any)[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(x => ({ ...x, activo: e.target.checked }))} className="w-4 h-4" />
            Activa
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
              <tr>{['Código','Nombre','Símbolo','Estado',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monedas.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-700">{m.codigo}</td>
                  <td className="px-4 py-3 font-medium">{m.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{m.simbolo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditar(m)} className="text-blue-600 hover:text-blue-700">
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
