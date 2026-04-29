import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { documentosContactoApi } from '../../services/contactosApi';

const CATEGORIAS = [
  { value: 'documentos',    label: 'Documentos y Contratos' },
  { value: 'due_diligence', label: 'Due Diligence' },
];

const EMPTY = { codigo: '', nombre: '', descripcion: '', categoria: 'documentos', requerido: false, activo: true };

export default function TiposDocumentoAdjunto() {
  const [tipos,    setTipos]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const cargar = () => {
    documentosContactoApi.getTipos()
      .then(setTipos)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) { alert('Código y nombre son requeridos.'); return; }
    setSaving(true);
    try {
      if (editId) await documentosContactoApi.updateTipo(editId, form);
      else        await documentosContactoApi.createTipo(form);
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (t: any) => {
    setEditId(t.id);
    setForm({ codigo: t.codigo, nombre: t.nombre, descripcion: t.descripcion ?? '', categoria: t.categoria, requerido: t.requerido, activo: t.activo });
    setShowForm(true);
  };

  const dd    = tipos.filter(t => t.categoria === 'due_diligence');
  const docs  = tipos.filter(t => t.categoria === 'documentos');

  const TiposTable = ({ items, title }: { items: any[]; title: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-400 italic">Sin tipos configurados.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Código','Nombre','Descripción','Requerido','Estado',''].map(h=>(
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono font-bold text-gray-700">{t.codigo}</td>
                <td className="px-4 py-2.5 font-medium">{t.nombre}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{t.descripcion ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {t.requerido
                    ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">Requerido</span>
                    : <span className="text-xs text-gray-400">Opcional</span>}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => handleEditar(t)} className="text-blue-600 hover:text-blue-700"><Pencil size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Documento Adjunto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurá los documentos que se pueden adjuntar a cada contacto.
          </p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15}/> Nuevo tipo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar tipo' : 'Nuevo tipo de documento'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input value={form.codigo} onChange={e => setForm(x=>({...x,codigo:e.target.value}))}
                placeholder="ej: cedula, informconf"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(x=>({...x,nombre:e.target.value}))}
                placeholder="ej: Cédula de Identidad, Informe INFORMCONF"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.categoria} onChange={e => setForm(x=>({...x,categoria:e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <input value={form.descripcion} onChange={e => setForm(x=>({...x,descripcion:e.target.value}))}
                placeholder="Descripción breve"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.requerido} onChange={e=>setForm(x=>({...x,requerido:e.target.checked}))} className="w-4 h-4"/>
              Requerido
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e=>setForm(x=>({...x,activo:e.target.checked}))} className="w-4 h-4"/>
              Activo
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Check size={14}/> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14}/> Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
        <>
          <TiposTable items={dd}   title="Due Diligence" />
          <TiposTable items={docs} title="Documentos y Contratos" />
        </>
      )}
    </div>
  );
}
