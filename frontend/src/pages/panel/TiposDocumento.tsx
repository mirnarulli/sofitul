import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, User, Building2, Users } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const APLICA_OPTS = [
  { value: 'pf',    label: 'Persona Física',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'pj',    label: 'Empresa (PJ)',     color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'ambos', label: 'Ambos',            color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

const VACIO = { codigo: '', nombre: '', descripcion: '', activo: true, esDueDiligencia: false, aplicaTipo: 'ambos', orden: 0 };

const labelAplica = (v: string) => APLICA_OPTS.find(o => o.value === v)?.label ?? v;
const colorAplica = (v: string) => APLICA_OPTS.find(o => o.value === v)?.color ?? '';
const iconAplica  = (v: string) => v === 'pf' ? User : v === 'pj' ? Building2 : Users;

export default function TiposDocumento() {
  const [tipos,    setTipos]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const cargar = () => {
    panelGlobalApi.getTiposDocumento()
      .then(setTipos).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { alert('El nombre es requerido.'); return; }
    setSaving(true);
    try {
      if (editId) await panelGlobalApi.updateTipoDocumento(editId, form);
      else        await panelGlobalApi.createTipoDocumento(form);
      setShowForm(false); setEditId(null); setForm({ ...VACIO }); cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error.');
    } finally { setSaving(false); }
  };

  const handleEditar = (t: any) => {
    setEditId(t.id);
    setForm({
      codigo: t.codigo ?? '', nombre: t.nombre, descripcion: t.descripcion ?? '',
      activo: t.activo, esDueDiligencia: t.esDueDiligencia ?? false,
      aplicaTipo: t.aplicaTipo ?? 'ambos', orden: t.orden ?? 0,
    });
    setShowForm(true);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  // Separar en dos grupos
  const docDD  = tipos.filter(t => t.esDueDiligencia);
  const docReg = tipos.filter(t => !t.esDueDiligencia);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Documento</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Documentos de identidad y due diligence. Los marcados como "Due Diligence" se solicitan en el análisis de operaciones.
          </p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo tipo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar tipo' : 'Nuevo tipo de documento'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código (ej: CI)</label>
              <input value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                className={inputCls} maxLength={10} placeholder="CI / RUC / PASAP..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className={inputCls} placeholder="Cédula de Identidad" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className={inputCls} placeholder="Descripción opcional" />
            </div>
          </div>

          {/* Due Diligence toggle */}
          <div className="border border-dashed border-blue-200 rounded-lg p-4 mb-3 bg-blue-50/30">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer mb-3">
              <input type="checkbox" checked={form.esDueDiligencia}
                onChange={e => setForm(f => ({ ...f, esDueDiligencia: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
              Es documento de <strong>Due Diligence</strong> (se solicita en el análisis de operaciones)
            </label>

            {form.esDueDiligencia && (
              <div>
                <p className="text-xs text-gray-500 mb-2">¿A quién se le solicita?</p>
                <div className="flex gap-2">
                  {APLICA_OPTS.map(o => {
                    const Icon = iconAplica(o.value);
                    return (
                      <button key={o.value} type="button"
                        onClick={() => setForm(f => ({ ...f, aplicaTipo: o.value }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          form.aplicaTipo === o.value
                            ? o.color + ' ring-2 ring-offset-1 ring-current'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}>
                        <Icon size={14}/> {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
            <input type="checkbox" checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="w-4 h-4" />
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

      {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
        <div className="space-y-5">

          {/* Tabla Due Diligence */}
          {docDD.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">📋 Due Diligence</span>
                <span className="text-xs text-gray-400">· {docDD.length} documento(s) — se solicitan en el análisis de operaciones</span>
              </div>
              <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 border-b border-blue-100">
                    <tr>{['Código','Nombre','Aplica a','Estado',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-blue-700 uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {docDD.map((t: any) => {
                      const Icon = iconAplica(t.aplicaTipo ?? 'ambos');
                      return (
                        <tr key={t.id} className="hover:bg-blue-50/30">
                          <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">{t.codigo}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{t.nombre}
                            {t.descripcion && <p className="text-xs text-gray-400 font-normal mt-0.5">{t.descripcion}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${colorAplica(t.aplicaTipo ?? 'ambos')}`}>
                              <Icon size={11}/> {labelAplica(t.aplicaTipo ?? 'ambos')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {t.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleEditar(t)} className="text-blue-600 hover:text-blue-700">
                              <Pencil size={14}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabla documentos regulares */}
          <div>
            {docDD.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Documentos de identidad / otros</span>
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Código','Nombre','Estado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(docDD.length > 0 ? docReg : tipos).map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">{t.codigo}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{t.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleEditar(t)} className="text-blue-600 hover:text-blue-700">
                          <Pencil size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(docDD.length > 0 ? docReg : tipos).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 italic text-xs">No hay documentos regulares</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {tipos.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic text-sm">
              No hay tipos de documento configurados.
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 space-y-1">
        <p className="font-bold">📋 Due Diligence</p>
        <p>Los documentos marcados como Due Diligence se generan automáticamente en la tab <strong>Análisis</strong> de cada operación según el Producto Financiero elegido.</p>
        <p><strong>Aplica PF:</strong> se pide al firmante · <strong>Aplica PJ:</strong> se pide a la empresa · <strong>Ambos:</strong> se pide a los dos.</p>
      </div>
    </div>
  );
}
