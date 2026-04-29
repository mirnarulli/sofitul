import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const TIPO_OPTIONS = [
  { value: 'DESCUENTO_CHEQUE',  label: 'Descuento de Cheque' },
  { value: 'PRESTAMO_CONSUMO',  label: 'Préstamo de Consumo' },
];

const CONTACTO_OPTIONS = [
  { value: 'pf',    label: 'Persona Física' },
  { value: 'pj',    label: 'Persona Jurídica' },
  { value: 'ambos', label: 'Ambos (PF y PJ)' },
];

const EMPTY_FORM = { codigo: '', nombre: '', descripcion: '', tipoOperacion: 'DESCUENTO_CHEQUE', tipoContacto: 'ambos', activo: true };

const labelContacto = (v: string) => CONTACTO_OPTIONS.find(o => o.value === v)?.label ?? v;
const colorContacto = (v: string) =>
  v === 'pf'    ? 'bg-blue-100 text-blue-700' :
  v === 'pj'    ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-600';

export default function ProductosFinancieros() {
  const [productos,     setProductos]     = useState<any[]>([]);
  const [informes,      setInformes]      = useState<any[]>([]); // catálogo completo
  const [loading,       setLoading]       = useState(true);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [form,          setForm]          = useState({ ...EMPTY_FORM });
  const [showForm,      setShowForm]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [savingInf,     setSavingInf]     = useState(false);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      panelGlobalApi.getProductos(),
      panelGlobalApi.getInformesRigor(),
    ])
      .then(([prods, infs]) => { setProductos(prods); setInformes(infs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  // ── Guardar producto ────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) { alert('Código y nombre son requeridos.'); return; }
    setSaving(true);
    try {
      if (editId) await panelGlobalApi.updateProducto(editId, form);
      else        await panelGlobalApi.createProducto(form);
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (p: any) => {
    setEditId(p.id);
    setForm({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion ?? '',
              tipoOperacion: p.tipoOperacion, tipoContacto: p.tipoContacto ?? 'ambos', activo: p.activo });
    setShowForm(true);
  };

  // ── Gestión de informes del producto (desde catálogo) ─────────────────────
  const informesDelProducto = (p: any): string[] =>
    (p.formularios ?? []).map((f: any) => f.id);

  const isSelected = (p: any, codigo: string) =>
    informesDelProducto(p).includes(codigo);

  const toggleInforme = async (p: any, informe: any) => {
    setSavingInf(true);
    try {
      if (isSelected(p, informe.codigo)) {
        await panelGlobalApi.removeFormularioProducto(p.id, informe.codigo);
      } else {
        await panelGlobalApi.addFormularioProducto(p.id, {
          id:       informe.codigo,
          nombre:   informe.nombre,
          requerido: informe.requerido,
        });
      }
      cargar();
    } catch { alert('Error al actualizar informe.'); }
    finally { setSavingInf(false); }
  };

  // Filtra catálogo según tipoContacto del producto
  const informesFiltrados = (p: any) => {
    const tc = p.tipoContacto ?? 'ambos';
    return informes.filter(i =>
      i.activo && (i.aplicaA === tc || i.aplicaA === 'ambos' || tc === 'ambos')
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos Financieros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurá los productos y seleccioná los informes de rigor requeridos.
          </p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input value={form.codigo} onChange={e => setForm(x => ({ ...x, codigo: e.target.value }))}
                placeholder="Ej: DC-PF-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))}
                placeholder="Ej: Descuento de Cheque — PF Estándar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Operación</label>
              <select value={form.tipoOperacion} onChange={e => setForm(x => ({ ...x, tipoOperacion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Aplica a</label>
              <select value={form.tipoContacto} onChange={e => setForm(x => ({ ...x, tipoContacto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CONTACTO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <input value={form.descripcion} onChange={e => setForm(x => ({ ...x, descripcion: e.target.value }))}
                placeholder="Descripción breve"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(x => ({ ...x, activo: e.target.checked }))} className="w-4 h-4" />
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

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 italic">No hay productos configurados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Código', 'Nombre', 'Tipo Op.', 'Aplica a', 'Informes de Rigor', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((p: any) => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">{p.codigo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.nombre}</p>
                      {p.descripcion && <p className="text-xs text-gray-400 mt-0.5">{p.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Dto. de Cheque' : 'Préstamo de Consumo'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorContacto(p.tipoContacto ?? 'ambos')}`}>
                        {labelContacto(p.tipoContacto ?? 'ambos')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setExpandedId(expandedId === p.id ? null : p.id); }}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        {(p.formularios?.length ?? 0)} informe(s)
                        {expandedId === p.id ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleEditar(p)} className="text-blue-600 hover:text-blue-700">
                        <Pencil size={14}/>
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida: selección de informes desde catálogo */}
                  {expandedId === p.id && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                          Informes de Rigor — seleccioná los que aplican a este producto
                        </p>

                        {informesFiltrados(p).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">
                            No hay informes en el catálogo. Configuralos en{' '}
                            <strong>Panel Global → Informes de Rigor</strong>.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-w-2xl">
                            {informesFiltrados(p).map((inf: any) => {
                              const sel = isSelected(p, inf.codigo);
                              return (
                                <label key={inf.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'}`}>
                                  <input type="checkbox" checked={sel} disabled={savingInf}
                                    onChange={() => toggleInforme(p, inf)}
                                    className="w-4 h-4 mt-0.5 accent-blue-600" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{inf.codigo}</span>
                                      {inf.requerido && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Requerido</span>}
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${inf.aplicaA === 'pf' ? 'bg-blue-50 text-blue-600' : inf.aplicaA === 'pj' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                                        {inf.aplicaA === 'pf' ? 'PF' : inf.aplicaA === 'pj' ? 'PJ' : 'PF+PJ'}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 mt-0.5">{inf.nombre}</p>
                                    {inf.descripcion && <p className="text-xs text-gray-400">{inf.descripcion}</p>}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Informes seleccionados actualmente */}
                        {(p.formularios?.length ?? 0) > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1.5">Seleccionados actualmente:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.formularios.map((f: any) => (
                                <span key={f.id} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  {f.nombre}
                                  <button onClick={() => panelGlobalApi.removeFormularioProducto(p.id, f.id).then(cargar)}
                                    className="hover:text-red-500 transition-colors ml-0.5">
                                    <X size={10}/>
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
