import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp, FileText, Search } from 'lucide-react';
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
  v === 'pf' ? 'bg-blue-100 text-blue-700' : v === 'pj' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600';

const labelAplicaTipo = (v: string) => v === 'pf' ? 'PF' : v === 'pj' ? 'PJ' : 'PF+PJ';
const colorAplicaTipo = (v: string) =>
  v === 'pf' ? 'bg-blue-50 text-blue-600' : v === 'pj' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500';

export default function ProductosFinancieros() {
  const [productos,   setProductos]   = useState<any[]>([]);
  const [tiposDD,     setTiposDD]     = useState<any[]>([]); // tipos-documento due diligence
  const [servicios,   setServicios]   = useState<any[]>([]); // servicios datos (informes-rigor)
  const [loading,     setLoading]     = useState(true);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [savingReq,   setSavingReq]   = useState(false);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      panelGlobalApi.getProductos(),
      panelGlobalApi.getTiposDueDiligencia(),
      panelGlobalApi.getInformesRigor(),
    ])
      .then(([prods, tipos, svcs]) => { setProductos(prods); setTiposDD(tipos); setServicios(svcs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const handleGuardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) { alert('Código y nombre son requeridos.'); return; }
    setSaving(true);
    try {
      if (editId) await panelGlobalApi.updateProducto(editId, form);
      else        await panelGlobalApi.createProducto(form);
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); cargar();
    } catch (err: any) { alert(err.response?.data?.message ?? 'Error.'); }
    finally { setSaving(false); }
  };

  const handleEditar = (p: any) => {
    setEditId(p.id);
    setForm({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion ?? '',
              tipoOperacion: p.tipoOperacion, tipoContacto: p.tipoContacto ?? 'ambos', activo: p.activo });
    setShowForm(true);
  };

  // formularios = [{id, nombre, tipo:'doc'|'servicio', requerido?, aplicaTipo?}]
  const getFormIds = (p: any): string[] => (p.formularios ?? []).map((f: any) => f.id);
  const isSelected = (p: any, id: string) => getFormIds(p).includes(id);

  const toggleItem = async (p: any, item: any, tipo: 'doc' | 'servicio') => {
    setSavingReq(true);
    try {
      if (isSelected(p, item.id)) {
        await panelGlobalApi.removeFormularioProducto(p.id, item.id);
      } else {
        await panelGlobalApi.addFormularioProducto(p.id, {
          id:          item.id,
          nombre:      item.nombre,
          tipo,
          requerido:   item.requerido ?? false,
          aplicaTipo:  item.aplicaTipo ?? item.tipoInforme ?? 'ambos',
        });
      }
      cargar();
    } catch { alert('Error al actualizar.'); }
    finally { setSavingReq(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos Financieros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurá cada producto y sus requerimientos de due diligence (documentos + servicios de datos).
          </p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15}/> Nuevo producto
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
                placeholder="DESC_CHEQUE_PJ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))}
                placeholder="Descuento de Cheque PJ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                placeholder="Descripción breve" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(x => ({ ...x, activo: e.target.checked }))} className="w-4 h-4"/>
            Activo
          </label>
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

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div>
        : productos.length === 0 ? <div className="p-8 text-center text-gray-400 italic">No hay productos configurados.</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Código','Nombre','Tipo Op.','Aplica a','Due Diligence','Estado',''].map(h => (
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
                      {p.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Dto. Cheque' : 'Préstamo'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorContacto(p.tipoContacto ?? 'ambos')}`}>
                        {labelContacto(p.tipoContacto ?? 'ambos')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <FileText size={12}/>
                        {(p.formularios?.length ?? 0)} req.
                        {expandedId === p.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleEditar(p)} className="text-blue-600 hover:text-blue-700"><Pencil size={14}/></button>
                    </td>
                  </tr>

                  {expandedId === p.id && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                        <div className="grid grid-cols-2 gap-5">

                          {/* Columna 1: Documentos Due Diligence */}
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <FileText size={12}/> Documentos Due Diligence
                            </p>
                            {tiposDD.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">
                                No hay documentos DD configurados. Marcalos en <strong>Tipos de Documento</strong>.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {tiposDD.map((t: any) => {
                                  const sel = isSelected(p, t.id);
                                  return (
                                    <label key={t.id}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                                      <input type="checkbox" checked={sel} disabled={savingReq}
                                        onChange={() => toggleItem(p, t, 'doc')}
                                        className="w-4 h-4 mt-0.5 accent-blue-600 shrink-0" />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-sm font-medium text-gray-800">{t.nombre}</span>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorAplicaTipo(t.aplicaTipo ?? 'ambos')}`}>
                                            {labelAplicaTipo(t.aplicaTipo ?? 'ambos')}
                                          </span>
                                        </div>
                                        {t.descripcion && <p className="text-xs text-gray-400">{t.descripcion}</p>}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Columna 2: Servicios Datos */}
                          <div>
                            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <Search size={12}/> Servicios Datos
                            </p>
                            {servicios.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">
                                No hay servicios configurados. Configuralos en <strong>Servicios Datos</strong>.
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {servicios.filter((s: any) => s.activo).map((s: any) => {
                                  const sel = isSelected(p, s.id);
                                  return (
                                    <label key={s.id}
                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${sel ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}>
                                      <input type="checkbox" checked={sel} disabled={savingReq}
                                        onChange={() => toggleItem(p, s, 'servicio')}
                                        className="w-4 h-4 mt-0.5 accent-indigo-600 shrink-0" />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">{s.servicio}</span>
                                          <span className="text-sm font-medium text-gray-800">{s.nombre}</span>
                                          {s.requerido && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Req.</span>}
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorAplicaTipo(s.tipoInforme ?? 'ambos')}`}>
                                            {s.tipoInforme === 'persona' ? 'PF' : s.tipoInforme === 'empresa' ? 'PJ' : 'PF+PJ'}
                                          </span>
                                        </div>
                                        {s.descripcion && <p className="text-xs text-gray-400">{s.descripcion}</p>}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Resumen seleccionados */}
                        {(p.formularios?.length ?? 0) > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-1.5">
                            <span className="text-xs text-gray-500 self-center">Seleccionados:</span>
                            {p.formularios.map((f: any) => (
                              <span key={f.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${f.tipo === 'servicio' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                {f.nombre}
                                <button onClick={() => panelGlobalApi.removeFormularioProducto(p.id, f.id).then(cargar)}
                                  className="hover:text-red-500 ml-0.5"><X size={10}/></button>
                              </span>
                            ))}
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
