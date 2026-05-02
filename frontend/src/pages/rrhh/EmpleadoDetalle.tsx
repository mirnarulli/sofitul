import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { empleadosApi, talonariosApi } from '../../services/rrhhApi';

type Tab = 'personal' | 'laboral' | 'documentos' | 'talonarios' | 'historial';

function diasParaVencer(fecha: string): number {
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

export default function EmpleadoDetalle() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [tab,        setTab]        = useState<Tab>('personal');
  const [empleado,   setEmpleado]   = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [editMode,   setEditMode]   = useState(false);
  const [form,       setForm]       = useState<any>({});
  const [saving,     setSaving]     = useState(false);

  // Talonarios state
  const [talonarios,      setTalonarios]      = useState<any[]>([]);
  const [loadingTalon,    setLoadingTalon]    = useState(false);
  const [asignando,       setAsignando]       = useState(false);
  const [obsAsignacion,   setObsAsignacion]   = useState('');

  const cargar = () => {
    if (!id) return;
    setLoading(true);
    empleadosApi.getById(id)
      .then(data => { setEmpleado(data); setForm(flatForm(data)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const flatForm = (e: any) => ({
    // Datos personales
    nombre:         e.nombre          ?? '',
    apellido:       e.apellido        ?? '',
    tipoDoc:        e.tipoDoc         ?? 'CI',
    nroDoc:         e.nroDoc          ?? '',
    fechaNacimiento: e.fechaNacimiento ? e.fechaNacimiento.substring(0, 10) : '',
    sexo:           e.sexo            ?? '',
    emailPersonal:  e.emailPersonal   ?? '',
    telefono:       e.telefono        ?? '',
    // Datos laborales
    cargo:          e.cargo           ?? '',
    departamento:   e.departamento    ?? '',
    fechaIngreso:   e.fechaIngreso    ? e.fechaIngreso.substring(0, 10) : '',
    fechaEgreso:    e.fechaEgreso     ? e.fechaEgreso.substring(0, 10)  : '',
    estado:         e.estado          ?? 'ACTIVO',
    usuarioId:      e.usuarioId       ?? '',
    esCobrador:     e.esCobrador      ?? false,
    esVendedor:     e.esVendedor      ?? false,
    esAnalista:     e.esAnalista      ?? false,
  });

  const cargarTalonarios = () => {
    if (!id) return;
    setLoadingTalon(true);
    talonariosApi.getByEmpleado(id)
      .then(setTalonarios)
      .catch(() => {})
      .finally(() => setLoadingTalon(false));
  };

  useEffect(() => { cargar(); }, [id]);

  useEffect(() => {
    if (tab === 'talonarios' && empleado?.esCobrador) cargarTalonarios();
  }, [tab, empleado]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await empleadosApi.update(id!, { ...form, usuarioId: form.usuarioId || undefined });
      setEditMode(false);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleAsignarTalonario = async () => {
    if (!id) return;
    setAsignando(true);
    try {
      await talonariosApi.asignar({ empleadoId: id, observaciones: obsAsignacion || undefined });
      setObsAsignacion('');
      cargarTalonarios();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al asignar talonario.');
    } finally { setAsignando(false); }
  };

  const handleEliminarDoc = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await empleadosApi.deleteDocumento(docId);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al eliminar.');
    }
  };

  const inputCls  = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const readCls   = 'px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'personal',   label: 'Datos Personales' },
    { key: 'laboral',    label: 'Datos Laborales' },
    { key: 'documentos', label: 'Documentos' },
    { key: 'talonarios', label: 'Talonarios' },
    { key: 'historial',  label: 'Historial' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!empleado) {
    return (
      <div className="p-6 text-center text-gray-500">
        Empleado no encontrado.{' '}
        <button onClick={() => navigate('/rrhh/empleados')} className="text-blue-600 hover:underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/rrhh/empleados')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{empleado.apellido}, {empleado.nombre}</h1>
          <p className="text-sm text-gray-500">{empleado.tipoDoc} {empleado.nroDoc} · {empleado.cargo ?? 'Sin cargo'}</p>
        </div>
        {!editMode && (
          <button onClick={() => setEditMode(true)}
            className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
            Editar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

        {/* TAB: DATOS PERSONALES */}
        {tab === 'personal' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Apellido',      key: 'apellido' },
              { label: 'Nombre',        key: 'nombre' },
              { label: 'Tipo Documento',key: 'tipoDoc' },
              { label: 'N° Documento',  key: 'nroDoc' },
              { label: 'Fecha Nacimiento', key: 'fechaNacimiento', type: 'date' },
              { label: 'Sexo',          key: 'sexo', type: 'select', options: [{ v: '', l: '—' }, { v: 'M', l: 'Masculino' }, { v: 'F', l: 'Femenino' }] },
              { label: 'Email Personal',key: 'emailPersonal', type: 'email' },
              { label: 'Teléfono',      key: 'telefono' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                {editMode ? (
                  field.type === 'select' ? (
                    <select value={form[field.key]} onChange={e => set(field.key, e.target.value)} className={inputCls}>
                      {field.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type={field.type ?? 'text'} value={form[field.key]} onChange={e => set(field.key, e.target.value)} className={inputCls} />
                  )
                ) : (
                  <div className={readCls}>{form[field.key] || <span className="text-gray-300">—</span>}</div>
                )}
              </div>
            ))}
            {editMode && (
              <div className="col-span-2 flex gap-2 pt-2">
                <button onClick={handleGuardar} disabled={saving}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditMode(false); setForm(flatForm(empleado)); }}
                  className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                  <X size={14} /> Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: DATOS LABORALES */}
        {tab === 'laboral' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Cargo',         key: 'cargo' },
              { label: 'Departamento',  key: 'departamento' },
              { label: 'Fecha Ingreso', key: 'fechaIngreso', type: 'date' },
              { label: 'Fecha Egreso',  key: 'fechaEgreso',  type: 'date' },
              { label: 'Estado',        key: 'estado', type: 'select', options: [
                { v: 'ACTIVO', l: 'Activo' }, { v: 'SUSPENDIDO', l: 'Suspendido' }, { v: 'EGRESADO', l: 'Egresado' }
              ]},
              { label: 'ID Usuario sistema', key: 'usuarioId' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                {editMode ? (
                  field.type === 'select' ? (
                    <select value={form[field.key]} onChange={e => set(field.key, e.target.value)} className={inputCls}>
                      {field.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type={field.type ?? 'text'} value={form[field.key]} onChange={e => set(field.key, e.target.value)} className={inputCls} />
                  )
                ) : (
                  <div className={readCls}>{form[field.key] || <span className="text-gray-300">—</span>}</div>
                )}
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-2">Roles asignados</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'esCobrador', label: 'Cobrador' },
                  { key: 'esVendedor', label: 'Vendedor' },
                  { key: 'esAnalista', label: 'Analista' },
                ].map(r => (
                  <label key={r.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    {editMode
                      ? <input type="checkbox" checked={form[r.key]} onChange={e => set(r.key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                      : <input type="checkbox" checked={form[r.key]} readOnly className="w-4 h-4 accent-blue-600" />
                    }
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            {editMode && (
              <div className="col-span-2 flex gap-2 pt-2">
                <button onClick={handleGuardar} disabled={saving}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditMode(false); setForm(flatForm(empleado)); }}
                  className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                  <X size={14} /> Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: DOCUMENTOS */}
        {tab === 'documentos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Documentos</h3>
            </div>
            {(!empleado.documentos || empleado.documentos.length === 0) ? (
              <div className="text-center text-gray-400 py-8 text-sm">Sin documentos adjuntos.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {empleado.documentos.map((doc: any) => {
                  const vence   = doc.fechaVencimiento ? diasParaVencer(doc.fechaVencimiento) : null;
                  const proxVto = vence !== null && vence <= 30 && vence > 0;
                  const vencido = vence !== null && vence <= 0;
                  return (
                    <div key={doc.id} className="flex items-center gap-4 py-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{doc.tipo ?? doc.nombre}</div>
                        {doc.nombre && doc.tipo && <div className="text-xs text-gray-500">{doc.nombre}</div>}
                        {doc.fechaVencimiento && (
                          <div className={`flex items-center gap-1 text-xs mt-0.5 ${vencido ? 'text-red-600' : proxVto ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {(proxVto || vencido) && <AlertTriangle size={12} />}
                            Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-PY')}
                            {proxVto && ` (en ${vence} días)`}
                            {vencido && ' (vencido)'}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleEliminarDoc(doc.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: TALONARIOS */}
        {tab === 'talonarios' && (
          <div>
            {!empleado.esCobrador ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Este empleado no tiene rol de cobrador. Los talonarios solo se asignan a cobradores.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Talonarios Internos</h3>
                  <button
                    onClick={handleAsignarTalonario}
                    disabled={asignando}
                    className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus size={14} /> {asignando ? 'Asignando...' : 'Asignar nuevo'}
                  </button>
                </div>
                <div className="mb-3">
                  <input
                    value={obsAsignacion}
                    onChange={e => setObsAsignacion(e.target.value)}
                    placeholder="Observaciones para la asignación (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {loadingTalon ? (
                  <div className="text-center text-gray-400 py-6 text-sm">Cargando talonarios…</div>
                ) : talonarios.length === 0 ? (
                  <div className="text-center text-gray-400 py-6 text-sm">Sin talonarios asignados.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Prefijo', 'Próximo N°', 'Estado', 'Fecha Asignación', 'Observaciones'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {talonarios.map((t: any) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-gray-700">{t.prefijo ?? '—'}</td>
                          <td className="px-4 py-2 font-mono text-blue-700 font-semibold">
                            {t.prefijo && t.nroSiguiente
                              ? `${t.prefijo}-${String(t.nroSiguiente).padStart(6, '0')}`
                              : t.nroSiguiente ?? '—'}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {t.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-PY') : '—'}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{t.observaciones || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: HISTORIAL */}
        {tab === 'historial' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Historial</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 text-xs w-32 shrink-0">Registro creado</span>
                <span>{empleado.createdAt ? new Date(empleado.createdAt).toLocaleString('es-PY') : '—'}</span>
              </div>
              {empleado.updatedAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 text-xs w-32 shrink-0">Última actualización</span>
                  <span>{new Date(empleado.updatedAt).toLocaleString('es-PY')}</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 text-xs w-32 shrink-0">Estado actual</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  empleado.estado === 'ACTIVO'     ? 'bg-green-100 text-green-700' :
                  empleado.estado === 'SUSPENDIDO' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{empleado.estado ?? 'ACTIVO'}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
