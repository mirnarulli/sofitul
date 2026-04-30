import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, Building2, User } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const SERVICIOS_BASE = ['informconf', 'infocheck', 'criterion'];
const TIPOS = [
  { value: 'persona', label: 'Persona (PF)', icon: User,      color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'empresa', label: 'Empresa (PJ)', icon: Building2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
];
const EMPTY = { servicio: '', tipoInforme: 'persona', nombre: '', descripcion: '', requerido: false, activo: true };

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
    if (!form.servicio.trim()) { alert('El servicio es requerido.'); return; }
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
    setForm({ servicio: i.servicio, tipoInforme: i.tipoInforme, nombre: i.nombre,
              descripcion: i.descripcion ?? '', requerido: i.requerido, activo: i.activo });
    setShowForm(true);
  };

  // Agrupar por servicio
  const servicios = [...new Set(items.map(i => i.servicio))].sort();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios Datos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Servicios externos de verificación (INFORMCONF, INFOCHECK, CRITERION) por tipo de sujeto. Se asocian a los Productos Financieros.
          </p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo informe
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar informe' : 'Nuevo informe de rigor'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Servicio *</label>
              <input value={form.servicio}
                onChange={e => setForm(x => ({ ...x, servicio: e.target.value.toLowerCase().replace(/\s+/g,'_') }))}
                placeholder="informconf / infocheck / criterion / ..."
                list="servicios-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              <datalist id="servicios-list">
                {SERVICIOS_BASE.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de informe</label>
              <div className="flex gap-2">
                {TIPOS.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setForm(x => ({ ...x, tipoInforme: t.value }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.tipoInforme === t.value ? t.color + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <t.icon size={14}/> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre para mostrar</label>
              <input value={form.nombre}
                onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))}
                placeholder={`${form.servicio ? form.servicio.toUpperCase() : 'SERVICIO'} — ${form.tipoInforme === 'empresa' ? 'Empresa' : 'Persona'}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-[10px] text-gray-400 mt-0.5">Si lo dejás vacío, se genera automáticamente.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input value={form.descripcion}
                onChange={e => setForm(x => ({ ...x, descripcion: e.target.value }))}
                placeholder="Breve descripción del informe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.requerido}
                onChange={e => setForm(x => ({ ...x, requerido: e.target.checked }))} className="w-4 h-4" />
              Requerido para el legajo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.activo}
                onChange={e => setForm(x => ({ ...x, activo: e.target.checked }))} className="w-4 h-4" />
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
        <div className="space-y-4">
          {servicios.map(srv => {
            const persona = items.filter(i => i.servicio === srv && i.tipoInforme === 'persona');
            const empresa = items.filter(i => i.servicio === srv && i.tipoInforme === 'empresa');
            return (
              <div key={srv} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header del servicio */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                  <span className="font-bold text-sm text-gray-800 uppercase tracking-wider">{srv}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{persona.length + empresa.length} variante(s)</span>
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {/* Columna PERSONA */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-blue-600"/>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Persona (PF)</span>
                    </div>
                    {persona.length === 0
                      ? <p className="text-xs text-gray-400 italic">No configurado</p>
                      : persona.map(i => <InformeRow key={i.id} item={i} onEdit={handleEditar}/>)
                    }
                  </div>

                  {/* Columna EMPRESA */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 size={14} className="text-indigo-600"/>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Empresa (PJ)</span>
                    </div>
                    {empresa.length === 0
                      ? <p className="text-xs text-gray-400 italic">No configurado</p>
                      : empresa.map(i => <InformeRow key={i.id} item={i} onEdit={handleEditar}/>)
                    }
                  </div>
                </div>
              </div>
            );
          })}

          {servicios.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic text-sm">
              No hay informes configurados. El sistema cargará los predeterminados automáticamente.
            </div>
          )}
        </div>
      )}

      {/* Info regla de negocio */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 space-y-1">
        <p className="font-bold">📋 Regla de negocio</p>
        <p><strong>Descuento de Cheques — PJ:</strong> se requieren informes de la <strong>Empresa</strong> + del <strong>Firmante (PF)</strong> → marcá ambas columnas en el producto.</p>
        <p><strong>Descuento de Cheques — PF:</strong> solo se requieren informes de la <strong>Persona</strong> firmante.</p>
        <p>La asociación se configura en <strong>Panel Global → Productos Financieros</strong> eligiendo qué informes aplican a cada producto.</p>
      </div>
    </div>
  );
}

function InformeRow({ item, onEdit }: { item: any; onEdit: (i: any) => void }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1.5 border border-gray-100">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm text-gray-800">{item.nombre}</span>
          {item.requerido && (
            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Req.</span>
          )}
          {!item.activo && (
            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Inactivo</span>
          )}
        </div>
        {item.descripcion && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.descripcion}</p>}
        <p className="text-[10px] font-mono text-gray-300 mt-0.5">{item.codigo}</p>
      </div>
      <button onClick={() => onEdit(item)} className="ml-2 text-gray-400 hover:text-blue-600 shrink-0">
        <Pencil size={13}/>
      </button>
    </div>
  );
}
