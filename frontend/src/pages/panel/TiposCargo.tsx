import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, Receipt } from 'lucide-react';
import { tiposCargoApi } from '../../services/contactosApi';

const CATEGORIAS = ['INTERES', 'MORA', 'GASTO_ADMIN', 'PRORROGA', 'SEGURO', 'OTRO'] as const;
const APLICA_EN  = ['OPERACION', 'CUOTA', 'MORA', 'PRORROGA', 'OTRO'] as const;
const BASE_CALC  = ['FIJO', 'PORCENTAJE_MONTO', 'PORCENTAJE_SALDO', 'PORCENTAJE_CUOTA'] as const;

type Categoria = typeof CATEGORIAS[number];

const CATEGORIA_COLOR: Record<Categoria, string> = {
  INTERES:     'bg-blue-100 text-blue-700',
  MORA:        'bg-red-100 text-red-700',
  GASTO_ADMIN: 'bg-orange-100 text-orange-700',
  PRORROGA:    'bg-purple-100 text-purple-700',
  SEGURO:      'bg-green-100 text-green-700',
  OTRO:        'bg-gray-100 text-gray-600',
};

const VACIO = {
  codigo: '', nombre: '', descripcion: '', categoria: 'OTRO',
  aplicaEn: 'OPERACION', baseCalculo: 'FIJO',
  montoFijo: '', porcentaje: '',
  esObligatorio: false, permisoExonerar: false,
  activo: true, orden: 0,
};

export default function TiposCargo() {
  const [lista,    setLista]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [buscar,   setBuscar]   = useState('');

  const cargar = () => {
    tiposCargoApi.getAll()
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
      const payload: any = {
        ...form,
        orden: parseInt(form.orden) || 0,
        montoFijo:   form.baseCalculo === 'FIJO'                ? parseFloat(form.montoFijo) || null  : null,
        porcentaje:  form.baseCalculo !== 'FIJO'                ? parseFloat(form.porcentaje) || null : null,
      };
      if (editId) await tiposCargoApi.update(editId, payload);
      else        await tiposCargoApi.create(payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (t: any) => {
    setEditId(t.id);
    setForm({
      codigo:          t.codigo          ?? '',
      nombre:          t.nombre          ?? '',
      descripcion:     t.descripcion     ?? '',
      categoria:       t.categoria       ?? 'OTRO',
      aplicaEn:        t.aplicaEn        ?? 'OPERACION',
      baseCalculo:     t.baseCalculo     ?? 'FIJO',
      montoFijo:       t.montoFijo       ?? '',
      porcentaje:      t.porcentaje      ?? '',
      esObligatorio:   t.esObligatorio   ?? false,
      permisoExonerar: t.permisoExonerar ?? false,
      activo:          t.activo,
      orden:           t.orden           ?? 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputCls  = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls = inputCls;

  const filtrados = lista.filter(t =>
    !buscar ||
    t.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (t.codigo ?? '').toLowerCase().includes(buscar.toLowerCase())
  );

  const fmtMonto = (t: any) => {
    if (t.baseCalculo === 'FIJO' && t.montoFijo != null) return `$ ${Number(t.montoFijo).toLocaleString('es-PY')}`;
    if (t.porcentaje != null) return `${t.porcentaje}%`;
    return <span className="text-gray-300">—</span>;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Receipt size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Cargo</h1>
          <span className="text-sm text-gray-400 font-normal">{lista.length} registrado{lista.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nuevo tipo de cargo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar tipo de cargo' : 'Nuevo tipo de cargo'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código <span className="text-red-500">*</span></label>
              <input value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} className={inputCls} placeholder="Ej: MORA_DIARIA" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} placeholder="Ej: Mora diaria" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className={inputCls} placeholder="Descripción opcional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={selectCls}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Aplica en</label>
              <select value={form.aplicaEn} onChange={e => set('aplicaEn', e.target.value)} className={selectCls}>
                {APLICA_EN.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Base de cálculo</label>
              <select value={form.baseCalculo} onChange={e => set('baseCalculo', e.target.value)} className={selectCls}>
                {BASE_CALC.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              {form.baseCalculo === 'FIJO' ? (
                <>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monto fijo</label>
                  <input type="number" value={form.montoFijo} onChange={e => set('montoFijo', e.target.value)} className={inputCls} min={0} step="0.01" placeholder="0.00" />
                </>
              ) : (
                <>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Porcentaje (%)</label>
                  <input type="number" value={form.porcentaje} onChange={e => set('porcentaje', e.target.value)} className={inputCls} min={0} step="0.01" placeholder="0.00" />
                </>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
              <input type="number" value={form.orden} onChange={e => set('orden', e.target.value)} className={inputCls} min={0} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.esObligatorio} onChange={e => set('esObligatorio', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Es obligatorio
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.permisoExonerar} onChange={e => set('permisoExonerar', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Permite exonerar
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Activo
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
                {['Código', 'Nombre', 'Categoría', 'Aplica en', 'Base cálculo', 'Monto / %', 'Exonerable', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
              ) : filtrados.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">{t.codigo}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{t.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIA_COLOR[t.categoria as Categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{t.aplicaEn}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{t.baseCalculo}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{fmtMonto(t)}</td>
                  <td className="px-4 py-3 text-center">
                    {t.permisoExonerar
                      ? <span className="text-green-600 font-medium text-xs">Sí</span>
                      : <span className="text-gray-300 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditar(t)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
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
