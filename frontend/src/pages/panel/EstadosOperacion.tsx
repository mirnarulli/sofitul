import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Check, X, GitBranch, List, Save, Info } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';
import { operacionesApi } from '../../services/operacionesApi';
import StatusBadge from '../../components/StatusBadge';

type Tab = 'estados' | 'matriz';

const VACIO = { codigo: '', nombre: '', descripcion: '', color: '#6b7280', orden: 0, activo: true, esInicial: false, esTerminal: false };

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ── Pestaña Estados ────────────────────────────────────────────────────────────

function TabEstados() {
  const [estados, setEstados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(() => {
    panelGlobalApi.getEstadosOperacion()
      .then((e: any[]) => setEstados(e.sort((a, b) => a.orden - b.orden)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) { alert('Código y nombre son obligatorios.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, orden: parseInt(form.orden as any) || 0 };
      if (editId) await panelGlobalApi.updateEstadoOperacion(editId, payload);
      else await panelGlobalApi.createEstadoOperacion(payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO }); cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error.');
    } finally { setSaving(false); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Definí los estados del ciclo de vida de una operación. Luego configurá las transiciones en la pestaña <strong>Matriz</strong>.
        </p>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shrink-0 ml-4">
          <Plus size={14} /> Nuevo estado
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar estado' : 'Nuevo estado'}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código <span className="text-red-500">*</span></label>
              <input value={form.codigo}
                onChange={e => set('codigo', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                className={inputCls} placeholder="EN_ANALISIS" disabled={!!editId} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre visible <span className="text-red-500">*</span></label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} placeholder="En análisis" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className={inputCls} placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
              <input type="number" value={form.orden} onChange={e => set('orden', parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color (hex)</label>
              <div className="flex gap-2">
                <input value={form.color} onChange={e => set('color', e.target.value)} className={`${inputCls} flex-1`} placeholder="#6b7280" />
                <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                  className="w-10 h-9 rounded border border-gray-300 cursor-pointer p-0.5" />
              </div>
            </div>
            <div className="flex flex-col gap-2 justify-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.esInicial} onChange={e => set('esInicial', e.target.checked)} className="w-4 h-4 accent-green-600" />
                <span className="text-green-700 font-medium">Estado inicial</span>
                <span className="text-xs text-gray-400">(primera asignación)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.esTerminal} onChange={e => set('esTerminal', e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-red-600 font-medium">Estado terminal</span>
                <span className="text-xs text-gray-400">(fin de ciclo)</span>
              </label>
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
        {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : estados.length === 0 ? (
          <div className="p-8 text-center text-gray-400 italic">Sin estados configurados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Código', 'Nombre', 'Vista previa', 'Flags', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estados.map((e: any) => (
                <tr key={e.id} className={`hover:bg-gray-50 ${!e.activo ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{e.orden}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{e.codigo}</td>
                  <td className="px-4 py-3 font-medium">{e.nombre}</td>
                  <td className="px-4 py-3"><StatusBadge estado={e.codigo} label={e.nombre} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {e.esInicial   && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Inicial</span>}
                      {e.esTerminal  && <span className="text-xs bg-red-100   text-red-600   px-2 py-0.5 rounded-full font-medium">Terminal</span>}
                      {!e.activo     && <span className="text-xs bg-gray-100  text-gray-500  px-2 py-0.5 rounded-full">Inactivo</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => {
                      setEditId(e.id);
                      setForm({ codigo: e.codigo, nombre: e.nombre, descripcion: e.descripcion ?? '', color: e.color ?? '#6b7280', orden: e.orden, activo: e.activo, esInicial: e.esInicial ?? false, esTerminal: e.esTerminal ?? false });
                      setShowForm(true);
                    }} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
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

// ── Pestaña Matriz ─────────────────────────────────────────────────────────────

function TabMatriz() {
  const [estados,     setEstados]     = useState<any[]>([]);
  const [transiciones,setTransiciones]= useState<Set<string>>(new Set()); // "desdeId|hastaId"
  const [loading,    setLoading]     = useState(true);
  const [saving,     setSaving]      = useState(false);
  const [dirty,      setDirty]       = useState(false);
  const [saveMsg,    setSaveMsg]     = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { estados: ests, transiciones: trans } = await operacionesApi.getTransicionesMatriz();
      setEstados(ests);
      const set = new Set<string>(trans.map((t: any) => `${t.desdeId}|${t.hastaId}`));
      setTransiciones(set);
      setDirty(false);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = (desdeId: string, hastaId: string) => {
    const key = `${desdeId}|${hastaId}`;
    setTransiciones(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  };

  const handleGuardar = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const batch = Array.from(transiciones).map(k => {
        const [desdeId, hastaId] = k.split('|');
        return { desdeId, hastaId };
      });
      await operacionesApi.saveMatriz(batch);
      setDirty(false);
      setSaveMsg('Matriz guardada correctamente ✓');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const estadosActivos = estados.filter(e => e.activo);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  if (estadosActivos.length < 2) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
      <Info size={20} className="mx-auto mb-2 text-amber-500" />
      <p className="text-sm font-medium text-amber-700">Necesitás al menos 2 estados activos para configurar la matriz.</p>
      <p className="text-xs text-amber-600 mt-1">Creá los estados en la pestaña <strong>Estados</strong> primero.</p>
    </div>
  );

  // Calcular salida por fila (cantidad de transiciones definidas desde cada estado)
  const countDesde = (desdeId: string) =>
    Array.from(transiciones).filter(k => k.startsWith(desdeId + '|')).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex-1">
          <strong>¿Cómo funciona?</strong> Cada fila es el estado <em>desde</em> el que venís.
          Cada columna es el estado <em>al que podés ir</em>. Tildá las celdas para permitir esa transición.
          Si una fila no tiene ninguna tildada, se permite cualquier cambio (modo libre).
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saveMsg && (
            <span className={`text-sm px-3 py-1.5 rounded-lg ${saveMsg.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {saveMsg}
            </span>
          )}
          <button onClick={handleGuardar} disabled={saving || !dirty}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium">
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar matriz'}
          </button>
          <button onClick={cargar} className="text-sm text-gray-500 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50">
            Recargar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              {/* Esquina superior izquierda */}
              <th className="sticky left-0 z-10 bg-gray-100 border-b border-r border-gray-200 px-4 py-3 text-left">
                <span className="text-gray-400 font-normal">DESDE ↓ / HASTA →</span>
              </th>
              {estadosActivos.map(col => (
                <th key={col.id}
                  className="border-b border-r border-gray-200 px-2 py-3 text-center bg-gray-50 min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-gray-700 leading-tight">{col.nombre}</span>
                    {col.esTerminal && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">terminal</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estadosActivos.map(row => {
              const count = countDesde(row.id);
              return (
                <tr key={row.id} className="group">
                  {/* Label fila */}
                  <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 whitespace-nowrap group-hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{row.nombre}</span>
                      {row.esInicial && <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded">inicial</span>}
                      {row.esTerminal && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">terminal</span>}
                      {count === 0
                        ? <span className="text-[9px] text-amber-500 ml-1">libre</span>
                        : <span className="text-[9px] text-blue-500 ml-1">{count} salidas</span>
                      }
                    </div>
                  </td>
                  {/* Celdas */}
                  {estadosActivos.map(col => {
                    const esMismoEstado = row.id === col.id;
                    const key = `${row.id}|${col.id}`;
                    const activa = transiciones.has(key);
                    return (
                      <td key={col.id}
                        className={`border-b border-r border-gray-100 text-center transition-colors
                          ${esMismoEstado
                            ? 'bg-gray-50 cursor-not-allowed'
                            : activa
                              ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                              : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                        onClick={() => !esMismoEstado && toggle(row.id, col.id)}
                        title={esMismoEstado ? 'Mismo estado' : `${row.nombre} → ${col.nombre}`}
                      >
                        {esMismoEstado ? (
                          <span className="text-gray-300 text-base select-none">—</span>
                        ) : activa ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white mx-auto my-2">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded border-2 border-gray-200 mx-auto my-2.5 group-hover:border-gray-300" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        💡 Las filas con <span className="text-amber-500 font-medium">"libre"</span> permiten cualquier cambio de estado.
        Las que tienen salidas definidas sólo permiten las tildadas.
      </p>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function EstadosOperacion() {
  const [tab, setTab] = useState<Tab>('estados');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estados y Flujo de Operaciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configurá los estados y las transiciones permitidas entre ellos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button onClick={() => setTab('estados')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            ${tab === 'estados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <List size={14} /> Estados
        </button>
        <button onClick={() => setTab('matriz')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            ${tab === 'matriz' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <GitBranch size={14} /> Matriz de Transiciones
        </button>
      </div>

      {tab === 'estados' ? <TabEstados /> : <TabMatriz />}
    </div>
  );
}
