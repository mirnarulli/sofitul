import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Save, X, Printer, Plus, Trash2,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import { contactosApi, panelGlobalApi } from '../../services/contactosApi';
import { formatDate, formatGs, diasHasta } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

// ── helpers ─────────────────────────────────────────────────────────────────

const inputCls  = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = inputCls;

const CALIFICACIONES = [
  { value: 'A', label: 'A — Excelente', color: 'bg-green-100 text-green-800' },
  { value: 'B', label: 'B — Bueno',     color: 'bg-blue-100 text-blue-800'  },
  { value: 'C', label: 'C — Regular',   color: 'bg-yellow-100 text-yellow-800' },
  { value: 'D', label: 'D — Malo',      color: 'bg-red-100 text-red-800'    },
];

const ESTADOS_VIGENTES = ['FORMULARIO_CARGADO','DOCUMENTACION','EN_PROCESO','ACTIVA','VIGENTE','APROBADA','DESEMBOLSADA'];

function CalBadge({ cal }: { cal?: string }) {
  const c = CALIFICACIONES.find(q => q.value === cal);
  if (!c) return <span className="text-gray-400 text-xs">Sin calificación</span>;
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c.color}`}>{c.label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800 font-medium">{value || '—'}</dd>
    </div>
  );
}

// ── JSONB table editor ────────────────────────────────────────────────────────

type MontoRow = { concepto: string; monto: number };
type ValorRow = { descripcion: string; valor: number };
type RefRow   = { nombre: string; telefono: string; relacion: string };

function MontoTable({ rows, onChange, editing }: {
  rows: MontoRow[]; onChange: (r: MontoRow[]) => void; editing: boolean;
}) {
  const total = rows.reduce((s, r) => s + (Number(r.monto) || 0), 0);
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin datos cargados</p>;
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2 items-center">
          {editing
            ? <>
                <input value={r.concepto} onChange={e => { const n=[...rows]; n[i]={...n[i],concepto:e.target.value}; onChange(n); }}
                  placeholder="Concepto" className={`${inputCls} flex-1`} />
                <input type="number" value={r.monto} onChange={e => { const n=[...rows]; n[i]={...n[i],monto:Number(e.target.value)}; onChange(n); }}
                  placeholder="Monto Gs." className={`${inputCls} w-36`} />
                <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
              </>
            : <div className="flex justify-between w-full text-sm">
                <span className="text-gray-700">{r.concepto}</span>
                <span className="font-mono">{formatGs(r.monto)}</span>
              </div>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { concepto: '', monto: 0 }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
          <Plus size={12}/> Agregar
        </button>
      )}
      {rows.length > 0 && (
        <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-sm">
          <span>Total</span><span className="font-mono">{formatGs(total)}</span>
        </div>
      )}
    </div>
  );
}

function ValorTable({ rows, onChange, editing }: {
  rows: ValorRow[]; onChange: (r: ValorRow[]) => void; editing: boolean;
}) {
  const total = rows.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin datos cargados</p>;
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2 items-center">
          {editing
            ? <>
                <input value={r.descripcion} onChange={e => { const n=[...rows]; n[i]={...n[i],descripcion:e.target.value}; onChange(n); }}
                  placeholder="Descripción" className={`${inputCls} flex-1`} />
                <input type="number" value={r.valor} onChange={e => { const n=[...rows]; n[i]={...n[i],valor:Number(e.target.value)}; onChange(n); }}
                  placeholder="Valor Gs." className={`${inputCls} w-36`} />
                <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
              </>
            : <div className="flex justify-between w-full text-sm">
                <span className="text-gray-700">{r.descripcion}</span>
                <span className="font-mono">{formatGs(r.valor)}</span>
              </div>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { descripcion: '', valor: 0 }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
          <Plus size={12}/> Agregar
        </button>
      )}
      {rows.length > 0 && (
        <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-sm">
          <span>Total</span><span className="font-mono">{formatGs(total)}</span>
        </div>
      )}
    </div>
  );
}

function RefTable({ rows, onChange, editing }: {
  rows: RefRow[]; onChange: (r: RefRow[]) => void; editing: boolean;
}) {
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin referencias cargadas</p>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className={editing ? 'grid grid-cols-3 gap-2 items-center' : 'flex gap-4 text-sm border-b pb-1'}>
          {editing
            ? <>
                <input value={r.nombre} onChange={e => { const n=[...rows]; n[i]={...n[i],nombre:e.target.value}; onChange(n); }}
                  placeholder="Nombre" className={inputCls} />
                <input value={r.telefono} onChange={e => { const n=[...rows]; n[i]={...n[i],telefono:e.target.value}; onChange(n); }}
                  placeholder="Teléfono" className={inputCls} />
                <div className="flex gap-1">
                  <input value={r.relacion} onChange={e => { const n=[...rows]; n[i]={...n[i],relacion:e.target.value}; onChange(n); }}
                    placeholder="Relación" className={`${inputCls} flex-1`} />
                  <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                </div>
              </>
            : <>
                <span className="font-medium text-gray-800 flex-1">{r.nombre}</span>
                <span className="text-gray-500">{r.telefono}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.relacion}</span>
              </>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { nombre: '', telefono: '', relacion: '' }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
          <Plus size={12}/> Agregar referencia
        </button>
      )}
    </div>
  );
}

// ── Ficha print layout ────────────────────────────────────────────────────────

function FichaImpresa({ pf, operaciones }: { pf: any; operaciones: any[] }) {
  const nombre = [pf.primerNombre, pf.segundoNombre, pf.primerApellido, pf.segundoApellido].filter(Boolean).join(' ');
  const ings   = (pf.ingresos  as MontoRow[] | null) ?? [];
  const egs    = (pf.egresos   as MontoRow[] | null) ?? [];
  const actArr = (pf.activos   as ValorRow[] | null) ?? [];
  const pasArr = (pf.pasivos   as ValorRow[] | null) ?? [];
  const totalI = ings.reduce((s,r)=>s+Number(r.monto),0);
  const totalE = egs.reduce((s,r)=>s+Number(r.monto),0);
  const totalA = actArr.reduce((s,r)=>s+Number(r.valor),0);
  const totalP = pasArr.reduce((s,r)=>s+Number(r.valor),0);

  return (
    <div id="ficha-print" className="hidden print:block bg-white text-gray-900 text-[11px] leading-relaxed p-0">
      <style>{`@media print { @page { size: A4; margin: 12mm 15mm; } }`}</style>
      <div className="text-center border-b-2 border-gray-900 pb-2 mb-3">
        <h1 className="text-base font-bold tracking-wide uppercase">Ficha de Cliente — Persona Física</h1>
        <p className="text-xs text-gray-500">ONE TRADE S.A. · Emitida: {new Date().toLocaleDateString('es-PY')}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 mb-3">
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Identificación</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-32">Nombre completo</td><td className="font-medium">{nombre}</td></tr>
            <tr><td className="text-gray-500">Documento</td><td>{pf.tipoDocumento ?? 'CI'} {pf.numeroDoc}</td></tr>
            <tr><td className="text-gray-500">Nacimiento</td><td>{formatDate(pf.fechaNacimiento)}</td></tr>
            <tr><td className="text-gray-500">Sexo</td><td>{pf.sexo === 'M' ? 'Masculino' : pf.sexo === 'F' ? 'Femenino' : '—'}</td></tr>
            <tr><td className="text-gray-500">Estado civil</td><td>{pf.estadoCivil ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Nacionalidad</td><td>{pf.paisNacionalidad ?? pf.nacionalidad ?? '—'}</td></tr>
          </tbody></table>
        </div>
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Contacto y Domicilio</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-28">Teléfono</td><td>{pf.telefono ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Celular</td><td>{pf.celular ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Email</td><td>{pf.email ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Dirección</td><td>{[pf.domicilio,pf.barrio,pf.ciudad,pf.departamento].filter(Boolean).join(', ') || '—'}</td></tr>
          </tbody></table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 mb-3">
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Actividad</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-32">Empleador</td><td>{pf.empleador ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Cargo</td><td>{pf.cargo ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Profesión</td><td>{pf.profesion ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Antigüedad</td><td>{pf.antiguedadCargo ?? '—'}</td></tr>
          </tbody></table>
        </div>
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Cuenta Bancaria</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-28">Banco</td><td>{pf.bancoAcreditacion ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Cuenta</td><td>{pf.nroCuentaAcreditacion ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Titular</td><td>{pf.titularCuentaAcreditacion ?? '—'}</td></tr>
            <tr><td className="text-gray-500">Alias</td><td>{pf.aliasAcreditacion ?? '—'}</td></tr>
          </tbody></table>
        </div>
      </div>

      {(ings.length > 0 || egs.length > 0) && (
        <div className="grid grid-cols-2 gap-x-6 mb-3">
          <div>
            <p className="font-bold text-sm uppercase border-b mb-1">Ingresos</p>
            {ings.map((r,i)=><div key={i} className="flex justify-between text-xs"><span>{r.concepto}</span><span>{formatGs(r.monto)}</span></div>)}
            <div className="flex justify-between text-xs font-bold border-t mt-0.5 pt-0.5"><span>Total</span><span>{formatGs(totalI)}</span></div>
          </div>
          <div>
            <p className="font-bold text-sm uppercase border-b mb-1">Egresos</p>
            {egs.map((r,i)=><div key={i} className="flex justify-between text-xs"><span>{r.concepto}</span><span>{formatGs(r.monto)}</span></div>)}
            <div className="flex justify-between text-xs font-bold border-t mt-0.5 pt-0.5"><span>Total</span><span>{formatGs(totalE)}</span></div>
          </div>
        </div>
      )}

      {(actArr.length > 0 || pasArr.length > 0) && (
        <div className="grid grid-cols-2 gap-x-6 mb-3">
          <div>
            <p className="font-bold text-sm uppercase border-b mb-1">Activos</p>
            {actArr.map((r,i)=><div key={i} className="flex justify-between text-xs"><span>{r.descripcion}</span><span>{formatGs(r.valor)}</span></div>)}
            <div className="flex justify-between text-xs font-bold border-t mt-0.5 pt-0.5"><span>Total</span><span>{formatGs(totalA)}</span></div>
          </div>
          <div>
            <p className="font-bold text-sm uppercase border-b mb-1">Pasivos</p>
            {pasArr.map((r,i)=><div key={i} className="flex justify-between text-xs"><span>{r.descripcion}</span><span>{formatGs(r.valor)}</span></div>)}
            <div className="flex justify-between text-xs font-bold border-t mt-0.5 pt-0.5"><span>Total</span><span>{formatGs(totalP)}</span></div>
          </div>
        </div>
      )}

      {(ings.length > 0 || egs.length > 0) && (
        <div className="border rounded p-2 mb-3 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-xs text-center">
            <div><p className="text-gray-500">Capacidad de pago</p><p className="font-bold text-sm">{formatGs(totalI - totalE)}</p></div>
            <div><p className="text-gray-500">Patrimonio neto</p><p className="font-bold text-sm">{formatGs(totalA - totalP)}</p></div>
            <div><p className="text-gray-500">Calificación</p><p className="font-bold text-sm">{pf.calificacionInterna || '—'}</p></div>
          </div>
        </div>
      )}

      {operaciones.length > 0 && (
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Operaciones ({operaciones.length})</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b">
              <th className="text-left pr-2">N° Op.</th><th className="text-left pr-2">Tipo</th>
              <th className="text-right pr-2">Monto</th><th className="text-left pr-2">Vencimiento</th>
              <th className="text-left">Estado</th>
            </tr></thead>
            <tbody>{operaciones.map(op=>(
              <tr key={op.id} className="border-b border-gray-100">
                <td className="font-mono pr-2 py-0.5">{op.nroOperacion}</td>
                <td className="pr-2">{op.tipoOperacion==='DESCUENTO_CHEQUE'?'Dto. Cheque':'Préstamo'}</td>
                <td className="text-right pr-2">{formatGs(op.montoTotal)}</td>
                <td className="pr-2">{formatDate(op.fechaVencimiento)}</td>
                <td>{op.estado}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-8 text-center">
        {['Firma del Cliente','Firma del Representante','Sello / Firma ONE TRADE'].map(l=>(
          <div key={l}><div className="border-b border-gray-700 h-10 mb-1"/><p className="text-xs text-gray-500">{l}</p></div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = ['Datos Personales','Financiero','Transferencia','Operaciones','Calificación'] as const;
type Tab = typeof TABS[number];

export default function ContactoPFDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pf,         setPf]         = useState<any>(null);
  const [operaciones,setOperaciones]= useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Tab>('Datos Personales');
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<any>({});
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [tiposDoc,   setTiposDoc]   = useState<any[]>([]);
  const [paises,     setPaises]     = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      contactosApi.getPersonaFisicaById(id),
      contactosApi.getOperacionesByContacto('pf', id),
      panelGlobalApi.getTiposDocumento(),
      panelGlobalApi.getPaises(),
    ])
      .then(([p, ops, td, ps]) => { setPf(p); setOperaciones(ops); setTiposDoc(td); setPaises(ps); })
      .catch(() => navigate('/contactos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!pf) return null;

  const nombreCompleto = [pf.primerNombre, pf.segundoNombre, pf.primerApellido, pf.segundoApellido].filter(Boolean).join(' ');

  const startEdit = () => {
    setForm({ ...pf,
      ingresos:   pf.ingresos   ?? [],
      egresos:    pf.egresos    ?? [],
      activos:    pf.activos    ?? [],
      pasivos:    pf.pasivos    ?? [],
      referencias:pf.referencias?? [],
    });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveMsg(''); };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      // Auto-calc totals
      const ingresos   = form.ingresos   as MontoRow[];
      const egresos    = form.egresos    as MontoRow[];
      const activos    = form.activos    as ValorRow[];
      const pasivos    = form.pasivos    as ValorRow[];
      const totalI = ingresos.reduce((s,r)=>s+Number(r.monto),0);
      const totalE = egresos.reduce((s,r)=>s+Number(r.monto),0);
      const totalA = activos.reduce((s,r)=>s+Number(r.valor),0);
      const totalP = pasivos.reduce((s,r)=>s+Number(r.valor),0);
      const payload = { ...form, totalIngresos: totalI, totalEgresos: totalE,
        capacidadPago: totalI - totalE, patrimonioNeto: totalA - totalP };
      const updated = await contactosApi.actualizarPersonaFisica(id!, payload);
      setPf(updated);
      setEditing(false);
      setSaveMsg('Guardado correctamente ✓');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  // ── Operaciones tabs ──────────────────────────────────────────────────────
  const vigentes   = operaciones.filter(o => ESTADOS_VIGENTES.includes(o.estado));
  const proximos   = operaciones.filter(o => {
    if (!o.fechaVencimiento) return false;
    const d = diasHasta(o.fechaVencimiento);
    return d >= 0 && d <= 30;
  });

  // ── Tab renders ──────────────────────────────────────────────────────────

  const renderDatosPersonales = () => {
    const data = editing ? form : pf;
    if (!editing) return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identificación</h3>
          <dl className="grid grid-cols-2 gap-3">
            <Info label="Documento" value={`${data.tipoDocumento??'CI'} ${data.numeroDoc}`} />
            <Info label="Nacimiento" value={formatDate(data.fechaNacimiento)} />
            <Info label="Sexo" value={data.sexo==='M'?'Masculino':data.sexo==='F'?'Femenino':data.sexo} />
            <Info label="Estado civil" value={data.estadoCivil} />
            <Info label="Cónyuge" value={data.conyugeNombre} />
            <Info label="Doc. cónyuge" value={data.conyugeDoc} />
            <Info label="Nacionalidad" value={data.paisNacionalidad??data.nacionalidad} />
            <Info label="Residencia" value={data.paisResidencia} />
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Domicilio y Contacto</h3>
          <dl className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Info label="Dirección" value={[data.domicilio,data.barrio,data.ciudad,data.departamento].filter(Boolean).join(', ')||undefined} /></div>
            <Info label="Teléfono" value={data.telefono} />
            <Info label="Celular" value={data.celular} />
            <div className="col-span-2"><Info label="Email" value={data.email} /></div>
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actividad Económica</h3>
          <dl className="grid grid-cols-2 gap-3">
            <Info label="Situación laboral" value={data.situacionLaboral} />
            <Info label="Profesión" value={data.profesion} />
            <Info label="Empleador" value={data.empleador} />
            <Info label="Cargo" value={data.cargo} />
            <Info label="Actividad" value={data.actividadEconomica} />
            <Info label="Antigüedad" value={data.antiguedadCargo} />
            <Info label="Nivel instrucción" value={data.nivelInstruccion} />
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compliance</h3>
          <div className="flex gap-4">
            {data.esPep   && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">✓ PEP</span>}
            {!data.esPep  && <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No PEP</span>}
            {data.esFatca && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">✓ FATCA</span>}
            {!data.esFatca&& <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No FATCA</span>}
            {data.declaracionFirmada && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Declaración firmada</span>}
          </div>
          {data.observaciones && <p className="text-sm text-gray-600 mt-2">{data.observaciones}</p>}
        </div>
      </div>
    );

    // ── Edit mode ──
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Identificación</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Tipo documento">
              <select value={data.tipoDocumento??''} onChange={e=>set('tipoDocumento',e.target.value)} className={selectCls}>
                <option value="">Seleccionar...</option>
                {tiposDoc.map((t:any)=><option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
              </select>
            </Field>
            <Field label="N° Documento"><input value={data.numeroDoc??''} onChange={e=>set('numeroDoc',e.target.value)} className={inputCls}/></Field>
            <Field label="Fecha nacimiento"><input type="date" value={data.fechaNacimiento??''} onChange={e=>set('fechaNacimiento',e.target.value)} className={inputCls}/></Field>
            <Field label="Primer Nombre"><input value={data.primerNombre??''} onChange={e=>set('primerNombre',e.target.value)} className={inputCls}/></Field>
            <Field label="Segundo Nombre"><input value={data.segundoNombre??''} onChange={e=>set('segundoNombre',e.target.value)} className={inputCls}/></Field>
            <Field label="Primer Apellido"><input value={data.primerApellido??''} onChange={e=>set('primerApellido',e.target.value)} className={inputCls}/></Field>
            <Field label="Segundo Apellido"><input value={data.segundoApellido??''} onChange={e=>set('segundoApellido',e.target.value)} className={inputCls}/></Field>
            <Field label="Sexo">
              <select value={data.sexo??''} onChange={e=>set('sexo',e.target.value)} className={selectCls}>
                <option value="">—</option><option value="M">Masculino</option><option value="F">Femenino</option>
              </select>
            </Field>
            <Field label="Estado civil">
              <select value={data.estadoCivil??''} onChange={e=>set('estadoCivil',e.target.value)} className={selectCls}>
                <option value="">—</option>
                {['Soltero/a','Casado/a','Divorciado/a','Viudo/a','Unión de hecho'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Cónyuge — Nombre"><input value={data.conyugeNombre??''} onChange={e=>set('conyugeNombre',e.target.value)} className={inputCls}/></Field>
            <Field label="Cónyuge — Doc."><input value={data.conyugeDoc??''} onChange={e=>set('conyugeDoc',e.target.value)} className={inputCls}/></Field>
            <Field label="Nacionalidad">
              <select value={data.paisNacionalidad??'PY'} onChange={e=>set('paisNacionalidad',e.target.value)} className={selectCls}>
                {paises.map((p:any)=><option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
              </select>
            </Field>
            <Field label="País residencia">
              <select value={data.paisResidencia??'PY'} onChange={e=>set('paisResidencia',e.target.value)} className={selectCls}>
                {paises.map((p:any)=><option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Domicilio y Contacto</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="col-span-2 lg:col-span-3">
              <Field label="Dirección"><input value={data.domicilio??''} onChange={e=>set('domicilio',e.target.value)} className={inputCls} placeholder="Calle y número"/></Field>
            </div>
            <Field label="Barrio"><input value={data.barrio??''} onChange={e=>set('barrio',e.target.value)} className={inputCls}/></Field>
            <Field label="Ciudad"><input value={data.ciudad??''} onChange={e=>set('ciudad',e.target.value)} className={inputCls}/></Field>
            <Field label="Departamento"><input value={data.departamento??''} onChange={e=>set('departamento',e.target.value)} className={inputCls}/></Field>
            <Field label="Teléfono"><input value={data.telefono??''} onChange={e=>set('telefono',e.target.value)} className={inputCls}/></Field>
            <Field label="Celular"><input value={data.celular??''} onChange={e=>set('celular',e.target.value)} className={inputCls}/></Field>
            <Field label="Email"><input type="email" value={data.email??''} onChange={e=>set('email',e.target.value)} className={inputCls}/></Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actividad Económica</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Situación laboral">
              <select value={data.situacionLaboral??''} onChange={e=>set('situacionLaboral',e.target.value)} className={selectCls}>
                <option value="">—</option>
                {['Relación de dependencia','Independiente/Comerciante','Jubilado/Pensionado','Desocupado','Ama de casa'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Profesión"><input value={data.profesion??''} onChange={e=>set('profesion',e.target.value)} className={inputCls}/></Field>
            <Field label="Empleador"><input value={data.empleador??''} onChange={e=>set('empleador',e.target.value)} className={inputCls}/></Field>
            <Field label="Cargo"><input value={data.cargo??''} onChange={e=>set('cargo',e.target.value)} className={inputCls}/></Field>
            <Field label="Actividad económica"><input value={data.actividadEconomica??''} onChange={e=>set('actividadEconomica',e.target.value)} className={inputCls}/></Field>
            <Field label="Antigüedad en el cargo"><input value={data.antiguedadCargo??''} onChange={e=>set('antiguedadCargo',e.target.value)} className={inputCls} placeholder="ej. 2 años"/></Field>
            <Field label="Nivel de instrucción">
              <select value={data.nivelInstruccion??''} onChange={e=>set('nivelInstruccion',e.target.value)} className={selectCls}>
                <option value="">—</option>
                {['Primario','Secundario','Terciario','Universitario','Posgrado'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compliance</h3>
          <div className="flex gap-6 mb-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!data.esPep} onChange={e=>set('esPep',e.target.checked)} className="w-4 h-4"/>
              PEP — Persona Expuesta Políticamente
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!data.esFatca} onChange={e=>set('esFatca',e.target.checked)} className="w-4 h-4"/>
              FATCA — Contribuyente EEUU
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!data.declaracionFirmada} onChange={e=>set('declaracionFirmada',e.target.checked)} className="w-4 h-4"/>
              Declaración firmada
            </label>
          </div>
          <Field label="Observaciones">
            <textarea value={data.observaciones??''} onChange={e=>set('observaciones',e.target.value)} rows={3} className={`${inputCls} resize-none`}/>
          </Field>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Referencias Personales</h3>
          <RefTable rows={form.referencias??[]} onChange={v=>set('referencias',v)} editing />
        </div>
      </div>
    );
  };

  const renderFinanciero = () => {
    const data = editing ? form : pf;
    const ings   = (data.ingresos   as MontoRow[] | null) ?? [];
    const egs    = (data.egresos    as MontoRow[] | null) ?? [];
    const actArr = (data.activos    as ValorRow[] | null) ?? [];
    const pasArr = (data.pasivos    as ValorRow[] | null) ?? [];
    const totalI = ings.reduce((s,r)=>s+Number(r.monto),0);
    const totalE = egs.reduce((s,r)=>s+Number(r.monto),0);
    const totalA = actArr.reduce((s,r)=>s+Number(r.valor),0);
    const totalP = pasArr.reduce((s,r)=>s+Number(r.valor),0);
    const cap = totalI - totalE;
    const pat = totalA - totalP;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ingresos Mensuales</h3>
            <MontoTable rows={editing?form.ingresos??[]:ings} onChange={v=>set('ingresos',v)} editing={editing}/>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Egresos Mensuales</h3>
            <MontoTable rows={editing?form.egresos??[]:egs} onChange={v=>set('egresos',v)} editing={editing}/>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Activos</h3>
            <ValorTable rows={editing?form.activos??[]:actArr} onChange={v=>set('activos',v)} editing={editing}/>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pasivos / Deudas</h3>
            <ValorTable rows={editing?form.pasivos??[]:pasArr} onChange={v=>set('pasivos',v)} editing={editing}/>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen Financiero</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className={`rounded-lg p-4 ${cap >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Capacidad de Pago</p>
              <p className={`text-lg font-bold ${cap >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatGs(cap)}</p>
            </div>
            <div className={`rounded-lg p-4 ${pat >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Patrimonio Neto</p>
              <p className={`text-lg font-bold ${pat >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatGs(pat)}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Total Ingresos</p>
              <p className="text-lg font-bold text-gray-700">{formatGs(totalI)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransferencia = () => {
    const data = editing ? form : pf;
    if (!editing) return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-lg">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cuenta para Acreditación</h3>
        <dl className="space-y-3">
          <Info label="Banco" value={data.bancoAcreditacion}/>
          <Info label="N° de cuenta" value={data.nroCuentaAcreditacion}/>
          <Info label="Titular de la cuenta" value={data.titularCuentaAcreditacion}/>
          <Info label="Alias / CVU" value={data.aliasAcreditacion}/>
        </dl>
      </div>
    );
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-lg">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cuenta para Acreditación</h3>
        <div className="space-y-3">
          <Field label="Banco"><input value={data.bancoAcreditacion??''} onChange={e=>set('bancoAcreditacion',e.target.value)} className={inputCls}/></Field>
          <Field label="N° de cuenta"><input value={data.nroCuentaAcreditacion??''} onChange={e=>set('nroCuentaAcreditacion',e.target.value)} className={inputCls}/></Field>
          <Field label="Titular de la cuenta"><input value={data.titularCuentaAcreditacion??''} onChange={e=>set('titularCuentaAcreditacion',e.target.value)} className={inputCls}/></Field>
          <Field label="Alias / CVU"><input value={data.aliasAcreditacion??''} onChange={e=>set('aliasAcreditacion',e.target.value)} className={inputCls}/></Field>
        </div>
      </div>
    );
  };

  const renderOperaciones = () => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 font-medium mb-1">Total operaciones</p>
          <p className="text-2xl font-bold text-blue-700">{operaciones.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium mb-1">Vigentes</p>
          <p className="text-2xl font-bold text-green-700">{vigentes.length}</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${proximos.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
          <p className={`text-xs font-medium mb-1 ${proximos.length > 0 ? 'text-amber-600' : 'text-gray-500'}`}>Vencen en 30 días</p>
          <p className={`text-2xl font-bold ${proximos.length > 0 ? 'text-amber-700' : 'text-gray-600'}`}>{proximos.length}</p>
        </div>
      </div>

      {proximos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1 mb-2">
            <AlertTriangle size={13}/> Próximos Vencimientos (≤ 30 días)
          </h3>
          <OpsTable ops={proximos} showDias/>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
          <TrendingUp size={13}/> Todas las Operaciones
        </h3>
        {operaciones.length === 0
          ? <p className="text-sm text-gray-400 italic">Sin operaciones registradas</p>
          : <OpsTable ops={operaciones} showDias/>}
      </div>
    </div>
  );

  const renderCalificacion = () => {
    const data = editing ? form : pf;
    return (
      <div className="space-y-4 max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Calificación Interna</h3>
          {!editing ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Calificación actual</p>
                <CalBadge cal={data.calificacionInterna}/>
              </div>
              {data.observaciones && (
                <div><p className="text-xs text-gray-400 mb-1">Observaciones</p><p className="text-sm text-gray-700">{data.observaciones}</p></div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Calificación interna">
                <select value={data.calificacionInterna??''} onChange={e=>set('calificacionInterna',e.target.value)} className={selectCls}>
                  <option value="">Sin calificación</option>
                  {CALIFICACIONES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Observaciones internas">
                <textarea value={data.observaciones??''} onChange={e=>set('observaciones',e.target.value)} rows={4} className={`${inputCls} resize-none`}/>
              </Field>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Indicadores</h3>
          <div className="space-y-2 text-sm">
            {operaciones.filter(o=>ESTADOS_VIGENTES.includes(o.estado)).length > 0
              ? <div className="flex items-center gap-2 text-green-700"><CheckCircle size={14}/> {vigentes.length} operación(es) vigente(s)</div>
              : <div className="flex items-center gap-2 text-gray-400"><Clock size={14}/> Sin operaciones vigentes</div>}
            {proximos.length > 0 && <div className="flex items-center gap-2 text-amber-600"><AlertTriangle size={14}/> {proximos.length} vencimiento(s) próximos</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'Datos Personales': return renderDatosPersonales();
      case 'Financiero':       return renderFinanciero();
      case 'Transferencia':    return renderTransferencia();
      case 'Operaciones':      return renderOperaciones();
      case 'Calificación':     return renderCalificacion();
    }
  };

  return (
    <>
      {/* Print-only ficha */}
      <FichaImpresa pf={pf} operaciones={operaciones}/>

      {/* Screen layout */}
      <div className="print:hidden p-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <button onClick={() => navigate('/contactos')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-1 shrink-0">
            <ArrowLeft size={15}/> Volver
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{nombreCompleto}</h1>
              <span className="text-gray-400 text-sm">{pf.tipoDocumento??'CI'} {pf.numeroDoc}</span>
              {pf.esPep   && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">PEP</span>}
              {pf.esFatca && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">FATCA</span>}
              <CalBadge cal={pf.calificacionInterna}/>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Persona Física · ID {id}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Printer size={14}/> Imprimir
            </button>
            {!editing
              ? <button onClick={startEdit} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                  <Edit2 size={14}/> Editar Ficha
                </button>
              : <>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <X size={14}/> Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                    <Save size={14}/> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
            }
          </div>
        </div>

        {saveMsg && (
          <div className={`mb-3 px-4 py-2 rounded-lg text-sm ${saveMsg.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {saveMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'Operaciones' && operaciones.length > 0 ? `${t} (${operaciones.length})` : t}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    </>
  );
}

// ── Operations table (shared) ─────────────────────────────────────────────────

function OpsTable({ ops, showDias }: { ops: any[]; showDias?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{['N° Op.','Tipo','Monto Total','Vencimiento', showDias?'Días':'','Estado',''].map((h,i)=>(
            <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ops.map((op:any) => {
            const d = op.fechaVencimiento ? diasHasta(op.fechaVencimiento) : null;
            return (
              <tr key={op.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{op.nroOperacion}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{op.tipoOperacion==='DESCUENTO_CHEQUE'?'Dto. Cheque':'Préstamo'}</td>
                <td className="px-3 py-2">{formatGs(op.montoTotal)}</td>
                <td className="px-3 py-2 text-xs">{formatDate(op.fechaVencimiento)}</td>
                {showDias && <td className="px-3 py-2">
                  {d !== null && <span className={`text-xs font-medium ${d<=7?'text-red-600':d<=15?'text-orange-500':'text-amber-600'}`}>{d}d</span>}
                </td>}
                <td className="px-3 py-2"><StatusBadge estado={op.estado}/></td>
                <td className="px-3 py-2"><Link to={`/operaciones/${op.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
