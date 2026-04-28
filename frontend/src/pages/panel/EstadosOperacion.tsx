import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';
import StatusBadge from '../../components/StatusBadge';

const VACIO = { codigo: '', nombre: '', color: '#6b7280', orden: 0, activo: true };

export default function EstadosOperacion() {
  const [estados, setEstados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    panelGlobalApi.getEstadosOperacion()
      .then((e: any[]) => setEstados(e.sort((a, b) => a.orden - b.orden)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const payload = { ...form, orden: parseInt(form.orden as any) || 0 };
      if (editId) await panelGlobalApi.updateEstadoOperacion(editId, payload);
      else await panelGlobalApi.createEstadoOperacion(payload);
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estados de Operación</h1>
          <p className="text-sm text-gray-500">Flujo de estados configurables</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo estado
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar estado' : 'Nuevo estado'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código (ej: EN_ANALISIS)</label>
              <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre visible</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
              <input type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: parseInt(e.target.value) || 0 }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color (hex)</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className={inputCls} placeholder="#6b7280" />
            </div>
          </div>
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
              <tr>{['Orden','Código','Nombre','Vista previa',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estados.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.orden}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{e.codigo}</td>
                  <td className="px-4 py-3 font-medium">{e.nombre}</td>
                  <td className="px-4 py-3"><StatusBadge estado={e.codigo} label={e.nombre} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditId(e.id); setForm({ codigo: e.codigo, nombre: e.nombre, color: e.color, orden: e.orden, activo: e.activo }); setShowForm(true); }}
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
