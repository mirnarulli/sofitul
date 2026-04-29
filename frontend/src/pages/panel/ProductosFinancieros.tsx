import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const TIPO_OPTIONS = [
  { value: 'DESCUENTO_CHEQUE',  label: 'Descuento de Cheque' },
  { value: 'PRESTAMO_CONSUMO',  label: 'Préstamo de Consumo' },
];

const EMPTY_FORM = { codigo: '', nombre: '', descripcion: '', tipoOperacion: 'DESCUENTO_CHEQUE', activo: true };
const EMPTY_INF  = { id: '', nombre: '', requerido: true };

export default function ProductosFinancieros() {
  const [productos,       setProductos]       = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [editId,          setEditId]          = useState<string | null>(null);
  const [form,            setForm]            = useState({ ...EMPTY_FORM });
  const [showForm,        setShowForm]        = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);

  // Estado formulario de informe de rigor
  const [newInf,          setNewInf]          = useState({ ...EMPTY_INF });
  const [addingInf,       setAddingInf]       = useState(false);
  const [savingInf,       setSavingInf]       = useState(false);
  // Guarda a qué producto le estamos agregando informe (puede diferir de expandedId si hay animación)
  const [addingForProd,   setAddingForProd]   = useState<string | null>(null);

  const cargar = () => {
    setLoading(true);
    panelGlobalApi.getProductos()
      .then(setProductos)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  // ── Guardar producto ──────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      alert('Código y nombre son requeridos.');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await panelGlobalApi.updateProducto(editId, form);
      } else {
        await panelGlobalApi.createProducto(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (p: any) => {
    setEditId(p.id);
    setForm({
      codigo:        p.codigo,
      nombre:        p.nombre,
      descripcion:   p.descripcion ?? '',
      tipoOperacion: p.tipoOperacion,
      activo:        p.activo,
    });
    setShowForm(true);
  };

  // ── Gestión de informes de rigor ──────────────────────────────────────────
  const abrirAgregarInforme = (productoId: string) => {
    setAddingForProd(productoId);
    setAddingInf(true);
    setNewInf({ ...EMPTY_INF });
  };

  const handleAgregarInforme = async (productoId: string) => {
    const id = newInf.id.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id || !newInf.nombre.trim()) {
      alert('ID y nombre son requeridos.');
      return;
    }
    setSavingInf(true);
    try {
      await panelGlobalApi.addFormularioProducto(productoId, {
        id,
        nombre:   newInf.nombre.trim(),
        requerido: newInf.requerido,
      });
      setAddingInf(false);
      setAddingForProd(null);
      setNewInf({ ...EMPTY_INF });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al agregar informe.');
    } finally { setSavingInf(false); }
  };

  const handleEliminarInforme = async (productoId: string, formularioId: string) => {
    if (!confirm('¿Eliminar este informe de rigor del producto?')) return;
    try {
      await panelGlobalApi.removeFormularioProducto(productoId, formularioId);
      cargar();
    } catch { alert('Error al eliminar.'); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos Financieros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurá los productos y los informes de rigor requeridos por cada tipo.
          </p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      {/* Formulario de producto */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input
                value={form.codigo}
                onChange={e => setForm(x => ({ ...x, codigo: e.target.value }))}
                placeholder="Ej: DC-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                value={form.nombre}
                onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))}
                placeholder="Ej: Descuento de Cheque Estándar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Operación</label>
              <select
                value={form.tipoOperacion}
                onChange={e => setForm(x => ({ ...x, tipoOperacion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <input
                value={form.descripcion}
                onChange={e => setForm(x => ({ ...x, descripcion: e.target.value }))}
                placeholder="Descripción breve"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => setForm(x => ({ ...x, activo: e.target.checked }))}
              className="w-4 h-4"
            />
            Activo
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 italic">No hay productos configurados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Código', 'Nombre', 'Tipo operación', 'Informes de rigor', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((p: any) => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-700">{p.codigo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.nombre}</p>
                      {p.descripcion && <p className="text-xs text-gray-400 mt-0.5">{p.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Dto. de Cheque' : 'Préstamo de Consumo'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setExpandedId(expandedId === p.id ? null : p.id);
                          setAddingInf(false);
                          setAddingForProd(null);
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {(p.formularios?.length ?? 0)} informe(s)
                        {expandedId === p.id
                          ? <ChevronUp size={13} />
                          : <ChevronDown size={13} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleEditar(p)} className="text-blue-600 hover:text-blue-700">
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida: informes de rigor */}
                  {expandedId === p.id && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="max-w-xl">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Informes de Rigor del producto
                            </p>
                            {!(addingInf && addingForProd === p.id) && (
                              <button
                                onClick={() => abrirAgregarInforme(p.id)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Plus size={12} /> Agregar informe
                              </button>
                            )}
                          </div>

                          {/* Listado actual */}
                          {(p.formularios?.length ?? 0) === 0 ? (
                            <p className="text-xs text-gray-400 italic mb-3">Sin informes configurados para este producto.</p>
                          ) : (
                            <div className="space-y-1.5 mb-3">
                              {p.formularios.map((f: any) => (
                                <div
                                  key={f.id}
                                  className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                      {f.id}
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium truncate">{f.nombre}</span>
                                    {f.requerido && (
                                      <span className="shrink-0 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                        Requerido
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleEliminarInforme(p.id, f.id)}
                                    className="ml-3 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Formulario agregar informe */}
                          {addingInf && addingForProd === p.id && (
                            <div className="bg-white border border-blue-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Nuevo informe de rigor</p>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <label className="text-xs text-gray-500 block mb-0.5">ID / clave</label>
                                  <input
                                    value={newInf.id}
                                    onChange={e => setNewInf(x => ({ ...x, id: e.target.value }))}
                                    placeholder="ej: informconf"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <p className="text-[10px] text-gray-400 mt-0.5">Sin espacios, en minúsculas</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-0.5">Nombre para mostrar</label>
                                  <input
                                    value={newInf.nombre}
                                    onChange={e => setNewInf(x => ({ ...x, nombre: e.target.value }))}
                                    placeholder="ej: Ficha INFORMCONF"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <label className="flex items-center gap-2 text-xs text-gray-700 mb-2">
                                <input
                                  type="checkbox"
                                  checked={newInf.requerido}
                                  onChange={e => setNewInf(x => ({ ...x, requerido: e.target.checked }))}
                                  className="w-3.5 h-3.5"
                                />
                                Requerido para el legajo
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAgregarInforme(p.id)}
                                  disabled={savingInf}
                                  className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  <Check size={12} /> {savingInf ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={() => { setAddingInf(false); setAddingForProd(null); setNewInf({ ...EMPTY_INF }); }}
                                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
                                >
                                  <X size={12} /> Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tip sobre IDs reconocidos */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs font-semibold text-blue-700 mb-1">💡 IDs reconocidos automáticamente</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          El ID de cada informe se vincula con los campos de la operación en el Análisis de Crédito.
          IDs reservados:
          {' '}<code className="bg-blue-100 px-1 rounded">informconf</code> → Ficha INFORMCONF,
          {' '}<code className="bg-blue-100 px-1 rounded">infocheck</code> → Ficha INFOCHECK,
          {' '}<code className="bg-blue-100 px-1 rounded">contrato</code> → Contrato TeDescuento,
          {' '}<code className="bg-blue-100 px-1 rounded">pagare</code> → Pagaré firmado,
          {' '}<code className="bg-blue-100 px-1 rounded">cheques</code> → Cheques registrados.
        </p>
      </div>
    </div>
  );
}
