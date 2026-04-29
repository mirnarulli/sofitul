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

// ── Beneficiarios finales table ───────────────────────────────────────────────

type BenefRow = { nombre: string; doc: string; porcentaje: number };

function BenefTable({ rows, onChange, editing }: {
  rows: BenefRow[]; onChange: (r: BenefRow[]) => void; editing: boolean;
}) {
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin beneficiarios cargados</p>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className={editing ? 'grid grid-cols-3 gap-2 items-center' : 'flex gap-4 text-sm border-b pb-1'}>
          {editing
            ? <>
                <input value={r.nombre} onChange={e=>{ const n=[...rows]; n[i]={...n[i],nombre:e.target.value}; onChange(n); }} placeholder="Nombre" className={inputCls}/>
                <input value={r.doc}    onChange={e=>{ const n=[...rows]; n[i]={...n[i],doc:e.target.value}; onChange(n); }}    placeholder="CI / RUC" className={inputCls}/>
                <div className="flex gap-1">
                  <input type="number" value={r.porcentaje} onChange={e=>{ const n=[...rows]; n[i]={...n[i],porcentaje:Number(e.target.value)}; onChange(n); }} placeholder="%" className={`${inputCls} flex-1`}/>
                  <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                </div>
              </>
            : <>
                <span className="font-medium text-gray-800 flex-1">{r.nombre}</span>
                <span className="text-gray-500">{r.doc}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.porcentaje}%</span>
              </>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { nombre: '', doc: '', porcentaje: 0 }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
          <Plus size={12}/> Agregar beneficiario
        </button>
      )}
    </div>
  );
}

// ── Ficha print layout ────────────────────────────────────────────────────────

function FichaImpresa({ pj, operaciones }: { pj: any; operaciones: any[] }) {
  const benefs = (pj.beneficiariosFinales as BenefRow[] | null) ?? [];
  return (
    <div id="ficha-print" className="hidden print:block bg-white text-gray-900 text-[11px] leading-relaxed p-0">
      <style>{`@media print { @page { size: A4; margin: 12mm 15mm; } }`}</style>
      <div className="text-center border-b-2 border-gray-900 pb-2 mb-3">
        <h1 className="text-base font-bold tracking-wide uppercase">Ficha de Cliente — Persona Jurídica</h1>
        <p className="text-xs text-gray-500">ONE TRADE S.A. · Emitida: {new Date().toLocaleDateString('es-PY')}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 mb-3">
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Datos de la Empresa</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-36">RUC</td><td className="font-medium">{pj.ruc}</td></tr>
            <tr><td className="text-gray-500">Razón Social</td><td className="font-medium">{pj.razonSocial}</td></tr>
            <tr><td className="text-gray-500">Nombre fantasía</td><td>{pj.nombreFantasia??'—'}</td></tr>
            <tr><td className="text-gray-500">Actividad</td><td>{pj.actividadPrincipal??'—'}</td></tr>
            <tr><td className="text-gray-500">Constitución</td><td>{formatDate(pj.fechaConstitucion)}</td></tr>
            <tr><td className="text-gray-500">País</td><td>{pj.paisConstitucion??pj.pais??'—'}</td></tr>
          </tbody></table>
        </div>
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Contacto y Domicilio</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-28">Teléfono</td><td>{pj.telefono??'—'}</td></tr>
            <tr><td className="text-gray-500">Email</td><td>{pj.email??'—'}</td></tr>
            <tr><td className="text-gray-500">Web</td><td>{pj.sitioWeb??pj.web??'—'}</td></tr>
            <tr><td className="text-gray-500">Dirección</td><td>{[pj.domicilio,pj.barrio,pj.ciudad,pj.departamento].filter(Boolean).join(', ')||'—'}</td></tr>
          </tbody></table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 mb-3">
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Representante Legal</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-28">Nombre</td><td>{pj.repLegalNombre??'—'}</td></tr>
            <tr><td className="text-gray-500">Documento</td><td>{pj.repLegalDoc??'—'}</td></tr>
            <tr><td className="text-gray-500">Cargo</td><td>{pj.repLegalCargo??'—'}</td></tr>
          </tbody></table>
        </div>
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Cuenta Bancaria</p>
          <table className="w-full text-xs"><tbody>
            <tr><td className="pr-2 text-gray-500 w-28">Banco</td><td>{pj.bancoAcreditacion??'—'}</td></tr>
            <tr><td className="text-gray-500">Cuenta</td><td>{pj.nroCuentaAcreditacion??'—'}</td></tr>
            <tr><td className="text-gray-500">Titular</td><td>{pj.titularCuentaAcreditacion??'—'}</td></tr>
            <tr><td className="text-gray-500">Alias</td><td>{pj.aliasAcreditacion??'—'}</td></tr>
          </tbody></table>
        </div>
      </div>

      {benefs.length > 0 && (
        <div className="mb-3">
          <p className="font-bold text-sm uppercase border-b mb-1">Beneficiarios Finales</p>
          <table className="w-full text-xs">
            <thead><tr><th className="text-left pr-2">Nombre</th><th className="text-left pr-2">Documento</th><th className="text-right">%</th></tr></thead>
            <tbody>{benefs.map((b,i)=><tr key={i}><td className="pr-2">{b.nombre}</td><td className="pr-2">{b.doc}</td><td className="text-right">{b.porcentaje}%</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {operaciones.length > 0 && (
        <div>
          <p className="font-bold text-sm uppercase border-b mb-1">Operaciones ({operaciones.length})</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b"><th className="text-left pr-2">N° Op.</th><th className="text-left pr-2">Tipo</th><th className="text-right pr-2">Monto</th><th className="text-left pr-2">Vencimiento</th><th className="text-left">Estado</th></tr></thead>
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
        {['Firma del Rep. Legal','Firma del Representante 2','Sello / Firma ONE TRADE'].map(l=>(
          <div key={l}><div className="border-b border-gray-700 h-10 mb-1"/><p className="text-xs text-gray-500">{l}</p></div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = ['Datos Empresa','Rep. Legal','Transferencia','Operaciones','Calificación'] as const;
type Tab = typeof TABS[number];

export default function ContactoPJDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pj,         setPj]         = useState<any>(null);
  const [operaciones,setOperaciones]= useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Tab>('Datos Empresa');
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<any>({});
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [paises,     setPaises]     = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      contactosApi.getEmpresaById(id),
      contactosApi.getOperacionesByContacto('pj', id),
      panelGlobalApi.getPaises(),
    ])
      .then(([p, ops, ps]) => { setPj(p); setOperaciones(ops); setPaises(ps); })
      .catch(() => navigate('/contactos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!pj) return null;

  const startEdit = () => {
    setForm({ ...pj, beneficiariosFinales: pj.beneficiariosFinales ?? [] });
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setSaveMsg(''); };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const updated = await contactosApi.actualizarEmpresa(id!, form);
      setPj(updated);
      setEditing(false);
      setSaveMsg('Guardado correctamente ✓');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const vigentes = operaciones.filter(o => ESTADOS_VIGENTES.includes(o.estado));
  const proximos = operaciones.filter(o => {
    if (!o.fechaVencimiento) return false;
    const d = diasHasta(o.fechaVencimiento);
    return d >= 0 && d <= 30;
  });

  // ── Tab renders ──────────────────────────────────────────────────────────

  const renderDatosEmpresa = () => {
    const data = editing ? form : pj;
    if (!editing) return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de la Empresa</h3>
          <dl className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Info label="Razón Social" value={data.razonSocial}/></div>
            <Info label="Nombre fantasía" value={data.nombreFantasia}/>
            <Info label="RUC" value={data.ruc}/>
            <Info label="Actividad principal" value={data.actividadPrincipal}/>
            <Info label="Fecha constitución" value={formatDate(data.fechaConstitucion)}/>
            <Info label="País constitución" value={data.paisConstitucion??data.pais}/>
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto y Domicilio</h3>
          <dl className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Info label="Dirección" value={[data.domicilio,data.barrio,data.ciudad,data.departamento].filter(Boolean).join(', ')||undefined}/></div>
            <Info label="Teléfono" value={data.telefono}/>
            <Info label="Email" value={data.email}/>
            <div className="col-span-2"><Info label="Sitio web" value={data.sitioWeb??data.web}/></div>
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compliance</h3>
          <div className="flex gap-4">
            {data.esPep   && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">✓ PEP</span>}
            {!data.esPep  && <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No PEP</span>}
            {data.esFatca && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">✓ FATCA</span>}
            {!data.esFatca&& <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No FATCA</span>}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de la Empresa</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="RUC"><input value={data.ruc??''} onChange={e=>set('ruc',e.target.value)} className={inputCls}/></Field>
            <div className="col-span-2">
              <Field label="Razón Social"><input value={data.razonSocial??''} onChange={e=>set('razonSocial',e.target.value)} className={inputCls}/></Field>
            </div>
            <Field label="Nombre fantasía"><input value={data.nombreFantasia??''} onChange={e=>set('nombreFantasia',e.target.value)} className={inputCls}/></Field>
            <Field label="Actividad principal"><input value={data.actividadPrincipal??''} onChange={e=>set('actividadPrincipal',e.target.value)} className={inputCls}/></Field>
            <Field label="Fecha constitución"><input type="date" value={data.fechaConstitucion??''} onChange={e=>set('fechaConstitucion',e.target.value)} className={inputCls}/></Field>
            <Field label="País constitución">
              <select value={data.paisConstitucion??'PY'} onChange={e=>set('paisConstitucion',e.target.value)} className={selectCls}>
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
            <Field label="Email"><input type="email" value={data.email??''} onChange={e=>set('email',e.target.value)} className={inputCls}/></Field>
            <Field label="Sitio web"><input value={data.sitioWeb??''} onChange={e=>set('sitioWeb',e.target.value)} className={inputCls}/></Field>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compliance</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!data.esPep} onChange={e=>set('esPep',e.target.checked)} className="w-4 h-4"/>
              PEP
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!data.esFatca} onChange={e=>set('esFatca',e.target.checked)} className="w-4 h-4"/>
              FATCA
            </label>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Observaciones</h3>
          <textarea value={data.observaciones??''} onChange={e=>set('observaciones',e.target.value)} rows={3} className={`${inputCls} resize-none`}/>
        </div>
      </div>
    );
  };

  const renderRepLegal = () => {
    const data = editing ? form : pj;
    const benefs = (data.beneficiariosFinales as BenefRow[] | null) ?? [];
    if (!editing) return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Representante Legal</h3>
          <dl className="space-y-3">
            <Info label="Nombre completo" value={data.repLegalNombre}/>
            <Info label="Documento (CI/RUC)" value={data.repLegalDoc}/>
            <Info label="Cargo" value={data.repLegalCargo}/>
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Beneficiarios Finales</h3>
          <BenefTable rows={benefs} onChange={()=>{}} editing={false}/>
        </div>
      </div>
    );
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Representante Legal</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Nombre completo"><input value={data.repLegalNombre??''} onChange={e=>set('repLegalNombre',e.target.value)} className={inputCls}/></Field>
            </div>
            <Field label="Documento"><input value={data.repLegalDoc??''} onChange={e=>set('repLegalDoc',e.target.value)} className={inputCls}/></Field>
            <Field label="Cargo"><input value={data.repLegalCargo??''} onChange={e=>set('repLegalCargo',e.target.value)} className={inputCls}/></Field>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Beneficiarios Finales</h3>
          <BenefTable rows={form.beneficiariosFinales??[]} onChange={v=>set('beneficiariosFinales',v)} editing/>
        </div>
      </div>
    );
  };

  const renderTransferencia = () => {
    const data = editing ? form : pj;
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
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 font-medium mb-1">Total operaciones</p>
          <p className="text-2xl font-bold text-blue-700">{operaciones.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium mb-1">Vigentes</p>
          <p className="text-2xl font-bold text-green-700">{vigentes.length}</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${proximos.length>0?'bg-amber-50':'bg-gray-50'}`}>
          <p className={`text-xs font-medium mb-1 ${proximos.length>0?'text-amber-600':'text-gray-500'}`}>Vencen en 30 días</p>
          <p className={`text-2xl font-bold ${proximos.length>0?'text-amber-700':'text-gray-600'}`}>{proximos.length}</p>
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
        {operaciones.length===0
          ? <p className="text-sm text-gray-400 italic">Sin operaciones registradas</p>
          : <OpsTable ops={operaciones} showDias/>}
      </div>
    </div>
  );

  const renderCalificacion = () => {
    const data = editing ? form : pj;
    return (
      <div className="space-y-4 max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Calificación Interna</h3>
          {!editing ? (
            <div className="flex flex-col gap-4">
              <div><p className="text-xs text-gray-400 mb-1">Calificación actual</p><CalBadge cal={data.calificacionInterna}/></div>
              {data.observaciones && <div><p className="text-xs text-gray-400 mb-1">Observaciones</p><p className="text-sm text-gray-700">{data.observaciones}</p></div>}
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
            {vigentes.length > 0
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
      case 'Datos Empresa':  return renderDatosEmpresa();
      case 'Rep. Legal':     return renderRepLegal();
      case 'Transferencia':  return renderTransferencia();
      case 'Operaciones':    return renderOperaciones();
      case 'Calificación':   return renderCalificacion();
    }
  };

  return (
    <>
      <FichaImpresa pj={pj} operaciones={operaciones}/>

      <div className="print:hidden p-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <button onClick={() => navigate('/contactos')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-1 shrink-0">
            <ArrowLeft size={15}/> Volver
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{pj.razonSocial}</h1>
              <span className="text-gray-400 text-sm">RUC {pj.ruc}</span>
              {pj.esPep   && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">PEP</span>}
              {pj.esFatca && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">FATCA</span>}
              <CalBadge cal={pj.calificacionInterna}/>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Persona Jurídica · {pj.nombreFantasia ?? ''}</p>
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

function OpsTable({ ops, showDias }: { ops: any[]; showDias?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{['N° Op.','Tipo','Monto Total','Vencimiento',showDias?'Días':'','Estado',''].map((h,i)=>(
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
