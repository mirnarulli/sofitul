import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const APLICA_OPTIONS = [
  { value: 'pf',    label: 'Solo Persona Física' },
  { value: 'pj',    label: 'Solo Persona Jurídica' },
  { value: 'ambos', label: 'Ambos (PF y PJ)' },
];

const EMPTY = { codigo: '', nombre: '', descripcion: '', aplicaA: 'ambos', requerido: false, activo: true };

export default function InformesRigor() {
  const [items,    setItems]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState({ ...EMPTY });
  const [saving,   setSaving]   = useState(false);

  const cargar = () => {
    panelGlobalApi.getInformesRigor()
      .then(setItems).catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) { alert('Código y nombre son requeridos.'); return; }
    setSaving(true);
    try {
      if (editId) await panelGlobalApi.updateInformeRigor(editId, form);
      else        await panelGlobalApi.createInformeRigor(form);
      setShowForm(false); setEditId(null); setForm({ ...EMPTY }); cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (i: any) => {
    setEditId(i.id);
    setForm({ codigo: i.codigo, nombre: i.nombre, descripcion: i.descripcion ?? '', aplicaA: i.aplicaA, requerido: i.requerido, activo: i.activo });
    setShowForm(true);
  };

  const pf    = items.filter(i => i.aplicaA === 'pf' || i.aplicaA === 'ambos');
  const pj    = items.filter(i => i.aplicaA === 'pj' || i.aplicaA === 'ambos');

  const labelAplica = (v: string) => APLICA_OPTIONS.find(o => o.value === v)?.label ?? v;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informes de Rigor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catálogo de informes disponibles para asociar a los Productos Financieros.
          </p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo informe
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar informe' : 'Nuevo informe de rigor'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
              <input value={form.codigo} onChange={e => setForm(x => ({ ...x, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="ej: informconf, infocheck, contrato"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              <p className="text-[10px] text-gray-400 mt-0.5">Sin espacios. Se usa para vincular con campos de la operación.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))}
                placeholder="ej: Ficha INFORMCONF, Contrato TeDescuento"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Aplica a</label>
              <select value={form.aplicaA} onChange={e => setForm(x => ({ ...x, aplicaA: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {APLICA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <input value={form.descripcion} onChange={e => setForm(x => ({ ...x, descripcion: e.target.value }))}
                placeholder="Descripción breve"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.requerido} onChange={e => setForm(x => ({ ...x, requerido: e.target.checked }))} className="w-4 h-4" />
              Requerido para el legajo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => setForm(x => ({ ...x, activo: e.target.checked }))} className="w-4 h-4" />
              Activo
            </label>
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

      {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
        <div className="space-y-4">
          {[
            { title: 'Persona Física (PF)', color: 'blue',  items: items.filter(i => i.aplicaA === 'pf') },
            { title: 'Persona Jurídica (PJ)', color: 'indigo', items: items.filter(i => i.aplicaA === 'pj') },
            { title: 'Aplica a ambos (PF y PJ)', color: 'gray', items: items.filter(i => i.aplicaA === 'ambos') },
          ].map(grupo => (
            <div key={grupo.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{grupo.title}</h2>
              </div>
              {grupo.items.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400 italic">Sin informes configurados.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Código','Nombre','Descripción','Requerido','Estado',''].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grupo.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono font-bold text-gray-700 text-xs">{item.codigo}</td>
                        <td className="px-4 py-2.5 font-medium">{item.nombre}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{item.descripcion ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {item.requerido
                            ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">Requerido</span>
                            : <span className="text-xs text-gray-400">Opcional</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleEditar(item)} className="text-blue-600 hover:text-blue-700">
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs font-semibold text-amber-700 mb-1">💡 Códigos reservados del sistema</p>
        <p className="text-xs text-amber-600 leading-relaxed">
          <code className="bg-amber-100 px-1 rounded">informconf</code> → Ficha INFORMCONF · {' '}
          <code className="bg-amber-100 px-1 rounded">infocheck</code> → Ficha INFOCHECK · {' '}
          <code className="bg-amber-100 px-1 rounded">contrato</code> → Contrato TeDescuento · {' '}
          <code className="bg-amber-100 px-1 rounded">pagare</code> → Pagaré firmado · {' '}
          <code className="bg-amber-100 px-1 rounded">cheques</code> → Cheques registrados
        </p>
      </div>
    </div>
  );
}
