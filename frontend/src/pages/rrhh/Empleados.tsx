import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Users2, Search } from 'lucide-react';
import { empleadosApi } from '../../services/rrhhApi';

const VACIO = {
  nombre: '', apellido: '', nroDoc: '', tipoDoc: 'CI',
  cargo: '', departamento: '', fechaIngreso: '',
  esCobrador: false, esVendedor: false, esAnalista: false,
  usuarioId: '',
};

type EstadoEmpleado = 'ACTIVO' | 'SUSPENDIDO' | 'EGRESADO';

const ESTADO_COLOR: Record<EstadoEmpleado, string> = {
  ACTIVO:     'bg-green-100 text-green-700',
  SUSPENDIDO: 'bg-yellow-100 text-yellow-700',
  EGRESADO:   'bg-gray-100 text-gray-500',
};

export default function Empleados() {
  const navigate = useNavigate();
  const [lista,    setLista]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [buscar,   setBuscar]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [saving,   setSaving]   = useState(false);

  const cargar = (q?: string) => {
    setLoading(true);
    empleadosApi.getAll(q)
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleBuscar = (val: string) => {
    setBuscar(val);
    cargar(val || undefined);
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.nombre.trim())   { alert('El nombre es obligatorio.');   return; }
    if (!form.apellido.trim()) { alert('El apellido es obligatorio.'); return; }
    if (!form.nroDoc.trim())   { alert('El documento es obligatorio.'); return; }
    setSaving(true);
    try {
      await empleadosApi.create({ ...form, usuarioId: form.usuarioId || undefined });
      setShowForm(false); setForm({ ...VACIO });
      cargar(buscar || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const roles = (e: any): string[] => {
    const r: string[] = [];
    if (e.esCobrador)  r.push('COBRADOR');
    if (e.esVendedor)  r.push('VENDEDOR');
    if (e.esAnalista)  r.push('ANALISTA');
    return r;
  };

  const ROL_COLOR: Record<string, string> = {
    COBRADOR: 'bg-blue-100 text-blue-700',
    VENDEDOR: 'bg-purple-100 text-purple-700',
    ANALISTA: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users2 size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <span className="text-sm text-gray-400 font-normal">{lista.length} registrado{lista.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => { setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nuevo empleado
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nuevo empleado</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} placeholder="Primer nombre" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Apellido <span className="text-red-500">*</span></label>
              <input value={form.apellido} onChange={e => set('apellido', e.target.value)} className={inputCls} placeholder="Primer apellido" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Documento</label>
              <select value={form.tipoDoc} onChange={e => set('tipoDoc', e.target.value)} className={inputCls}>
                <option value="CI">CI</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Documento <span className="text-red-500">*</span></label>
              <input value={form.nroDoc} onChange={e => set('nroDoc', e.target.value)} className={inputCls} placeholder="Ej: 1234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
              <input value={form.cargo} onChange={e => set('cargo', e.target.value)} className={inputCls} placeholder="Ej: Cobrador" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
              <input value={form.departamento} onChange={e => set('departamento', e.target.value)} className={inputCls} placeholder="Ej: Cobranzas" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Ingreso</label>
              <input type="date" value={form.fechaIngreso} onChange={e => set('fechaIngreso', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Usuario (opcional)</label>
              <input value={form.usuarioId} onChange={e => set('usuarioId', e.target.value)} className={inputCls} placeholder="UUID del usuario del sistema" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.esCobrador} onChange={e => set('esCobrador', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Es cobrador
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.esVendedor} onChange={e => set('esVendedor', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Es vendedor
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.esAnalista} onChange={e => set('esAnalista', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Es analista
            </label>
          </div>
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

      <div className="mb-4 relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={buscar}
          onChange={e => handleBuscar(e.target.value)}
          placeholder="Buscar por nombre, apellido o documento…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre completo', 'Documento', 'Cargo', 'Departamento', 'Roles', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
              ) : lista.map((e: any) => (
                <tr
                  key={e.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/rrhh/empleados/${e.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">{e.apellido}, {e.nombre}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-mono">{e.tipoDoc} {e.nroDoc}</td>
                  <td className="px-4 py-3 text-gray-600">{e.cargo || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{e.departamento || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {roles(e).length > 0
                        ? roles(e).map(r => (
                            <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLOR[r] ?? 'bg-gray-100 text-gray-600'}`}>{r}</span>
                          ))
                        : <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[(e.estado as EstadoEmpleado) ?? 'ACTIVO'] ?? 'bg-gray-100 text-gray-500'}`}>
                      {e.estado ?? 'ACTIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-400 text-xs">Ver →</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
