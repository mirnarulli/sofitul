import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Save, X, Printer, Plus, Trash2, Pencil,
  TrendingUp, AlertTriangle, CheckCircle, Clock, FileText,
} from 'lucide-react';
import { contactosApi, panelGlobalApi, documentosContactoApi } from '../../services/contactosApi';
import { formatDate, formatGs, diasHasta } from '../../utils/formatters';
import { ESTADOS_VIGENTES } from '../../utils/estados';
import StatusBadge from '../../components/StatusBadge';
import CuentasTransferencia from '../../components/CuentasTransferencia';

// ── helpers ─────────────────────────────────────────────────────────────────

const inputCls  = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = inputCls;

const CALIFICACIONES = [
  { value: 'A', label: 'A — Excelente', color: 'bg-green-100 text-green-800' },
  { value: 'B', label: 'B — Bueno',     color: 'bg-blue-100 text-blue-800'  },
  { value: 'C', label: 'C — Regular',   color: 'bg-yellow-100 text-yellow-800' },
  { value: 'D', label: 'D — Malo',      color: 'bg-red-100 text-red-800'    },
];


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

// ── Helpers de print ──────────────────────────────────────────────────────────

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  SO: 'Soltero/a',  CA: 'Casado/a',  DI: 'Divorciado/a',
  VI: 'Viudo/a',    ME: 'Menor de edad', UH: 'Unión de hecho',
};
const labelEC = (v?: string | null) => ESTADO_CIVIL_LABELS[v ?? ''] ?? v ?? '—';
const labelSexo = (v?: string | null) => v === 'M' ? 'Masculino' : v === 'F' ? 'Femenino' : (v ?? '—');

function SubTitulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-bold text-[9px] uppercase tracking-wider text-gray-700 border-b border-gray-700 pb-0.5 mb-1.5">
      {children}
    </p>
  );
}

function Fila({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr>
      <td className="text-gray-500 pr-2 py-0.5 align-top whitespace-nowrap">{label}</td>
      <td className="font-medium py-0.5">{value || '—'}</td>
    </tr>
  );
}

function OpsTablePrint({ ops }: { ops: any[] }) {
  return (
    <table className="w-full text-[10px]">
      <thead>
        <tr className="border-b border-gray-300">
          {['N° Op.', 'Tipo', 'Monto', 'Vencimiento', 'Estado'].map(h => (
            <th key={h} className="text-left text-gray-500 font-semibold pb-0.5 pr-3">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ops.map(op => (
          <tr key={op.id} className="border-b border-gray-100">
            <td className="py-0.5 pr-3 font-mono">{op.nroOperacion}</td>
            <td className="py-0.5 pr-3">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Dto. Cheque' : 'Préstamo'}</td>
            <td className="py-0.5 pr-3 font-mono">{formatGs(op.montoTotal)}</td>
            <td className="py-0.5 pr-3">{formatDate(op.fechaVencimiento)}</td>
            <td className="py-0.5">{op.estado}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Ficha print layout ────────────────────────────────────────────────────────

function FichaImpresa({ pf, operaciones, empresas }: { pf: any; operaciones: any[]; empresas: any[] }) {
  const nombre = [pf.primerNombre, pf.segundoNombre, pf.primerApellido, pf.segundoApellido].filter(Boolean).join(' ');
  const ings   = (pf.ingresos  as MontoRow[] | null) ?? [];
  const egs    = (pf.egresos   as MontoRow[] | null) ?? [];
  const actArr = (pf.activos   as ValorRow[] | null) ?? [];
  const pasArr = (pf.pasivos   as ValorRow[] | null) ?? [];
  const totalI = ings.reduce((s,r)=>s+Number(r.monto),0);
  const totalE = egs.reduce((s,r)=>s+Number(r.monto),0);
  const totalA = actArr.reduce((s,r)=>s+Number(r.valor),0);
  const totalP = pasArr.reduce((s,r)=>s+Number(r.valor),0);

  const opVigentes = operaciones.filter(o => ESTADOS_VIGENTES.includes(o.estado));
  const opHistorial = operaciones.filter(o => !ESTADOS_VIGENTES.includes(o.estado));

  return (
    <div id="ficha-print" className="hidden print:block bg-white text-gray-900 leading-snug p-0">
      <style>{`@media print { @page { size: A4; margin: 10mm 14mm; } }`}</style>

      {/* ── Encabezado ── */}
      <div className="border-b-2 border-gray-900 pb-2 mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wide">Ficha de Cliente — Persona Física</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">ONE TRADE S.A. · Emitida: {new Date().toLocaleDateString('es-PY')}</p>
        </div>
        <div className="text-right text-[10px]">
          {pf.calificacionInterna && (
            <span className="font-bold text-xs">Cal. interna: {pf.calificacionInterna}</span>
          )}
          {pf.esPep   && <p className="text-orange-600 font-bold mt-0.5">⚠ PEP</p>}
          {pf.esFatca && <p className="text-purple-600 font-bold mt-0.5">⚠ FATCA</p>}
        </div>
      </div>

      {/* ── Nombre / CI prominente ── */}
      <div className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 mb-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{nombre}</p>
          <p className="text-[10px] text-gray-500">{pf.tipoDocumento ?? 'CI'} N° {pf.numeroDoc}</p>
        </div>
        <div className="text-[10px] text-gray-500 text-right">
          <p>{labelEC(pf.estadoCivil)} · {labelSexo(pf.sexo)}</p>
          <p>Nac.: {formatDate(pf.fechaNacimiento) ?? '—'}</p>
        </div>
      </div>

      {/* ── Sección 1: Datos básicos ── */}
      <div className="grid grid-cols-2 gap-x-8 mb-3 text-[10px]">
        <div>
          <SubTitulo>Identificación</SubTitulo>
          <table className="w-full"><tbody>
            <Fila label="Nacionalidad"  value={pf.paisNacionalidad ?? pf.nacionalidad} />
            <Fila label="País residencia" value={pf.paisResidencia} />
            {pf.conyugeNombre && <Fila label="Cónyuge" value={`${pf.conyugeNombre}${pf.conyugeDoc ? ` · CI ${pf.conyugeDoc}` : ''}`} />}
          </tbody></table>
        </div>
        <div>
          <SubTitulo>Domicilio y Contacto</SubTitulo>
          <table className="w-full"><tbody>
            <Fila label="Dirección" value={[pf.domicilio, pf.barrio, pf.ciudad, pf.departamento].filter(Boolean).join(', ') || undefined} />
            <Fila label="Celular"   value={pf.celular} />
            <Fila label="Teléfono"  value={pf.telefono} />
            <Fila label="Email"     value={pf.email} />
          </tbody></table>
        </div>
      </div>

      {/* ── Sección 2: Actividad + Cuenta ── */}
      <div className="grid grid-cols-2 gap-x-8 mb-3 text-[10px]">
        <div>
          <SubTitulo>Actividad Económica</SubTitulo>
          <table className="w-full"><tbody>
            <Fila label="Profesión"   value={pf.profesion} />
            <Fila label="Empleador"   value={pf.empleador} />
            <Fila label="Cargo"       value={pf.cargo} />
            <Fila label="Situación"   value={pf.situacionLaboral} />
            <Fila label="Antigüedad"  value={pf.antiguedadCargo} />
          </tbody></table>
        </div>
        <div>
          <SubTitulo>Cuenta para Acreditación</SubTitulo>
          <table className="w-full"><tbody>
            <Fila label="Banco"    value={pf.bancoAcreditacion} />
            <Fila label="N° Cta."  value={pf.nroCuentaAcreditacion} />
            <Fila label="Titular"  value={pf.titularCuentaAcreditacion} />
            <Fila label="Alias"    value={pf.aliasAcreditacion} />
          </tbody></table>
        </div>
      </div>

      {/* ── Sección 3: Capacidad de pago (si tiene datos) ── */}
      {(ings.length > 0 || egs.length > 0) && (
        <div className="mb-3 text-[10px]">
          <SubTitulo>Capacidad de Pago</SubTitulo>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              {ings.map((r,i)=>(
                <div key={i} className="flex justify-between border-b border-gray-50 py-0.5">
                  <span className="text-gray-600">{r.concepto}</span><span className="font-mono">{formatGs(r.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-0.5 border-t border-gray-300 mt-0.5">
                <span>Total ingresos</span><span className="font-mono text-green-700">{formatGs(totalI)}</span>
              </div>
            </div>
            <div>
              {egs.map((r,i)=>(
                <div key={i} className="flex justify-between border-b border-gray-50 py-0.5">
                  <span className="text-gray-600">{r.concepto}</span><span className="font-mono">{formatGs(r.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-0.5 border-t border-gray-300 mt-0.5">
                <span>Total egresos</span><span className="font-mono text-red-600">{formatGs(totalE)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-8 mt-1.5 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
            <div className="text-center">
              <p className="text-[9px] text-gray-500">Capacidad de pago</p>
              <p className={`font-bold text-xs font-mono ${totalI-totalE>=0?'text-green-700':'text-red-700'}`}>{formatGs(totalI-totalE)}</p>
            </div>
            {(actArr.length > 0 || pasArr.length > 0) && (
              <div className="text-center">
                <p className="text-[9px] text-gray-500">Patrimonio neto</p>
                <p className="font-bold text-xs font-mono text-blue-700">{formatGs(totalA-totalP)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sección 4: Empresas vinculadas ── */}
      <div className="mb-3 text-[10px]">
        <SubTitulo>Empresas Vinculadas</SubTitulo>
        {empresas.length === 0 ? (
          <p className="text-gray-400 italic">Sin empresas vinculadas como representante legal.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                {['Razón Social', 'RUC', 'Cargo', 'Actividad', 'Tel.'].map(h => (
                  <th key={h} className="text-left text-gray-500 font-semibold pb-0.5 pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empresas.map(e => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-0.5 pr-2 font-medium">{e.razonSocial}</td>
                  <td className="py-0.5 pr-2 font-mono">{e.ruc}</td>
                  <td className="py-0.5 pr-2">{e.repLegalCargo ?? '—'}</td>
                  <td className="py-0.5 pr-2">{e.actividadPrincipal ?? '—'}</td>
                  <td className="py-0.5">{e.telefono ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Sección 5: Operaciones vigentes ── */}
      {opVigentes.length > 0 && (
        <div className="mb-3 text-[10px]">
          <SubTitulo>Operaciones Vigentes ({opVigentes.length})</SubTitulo>
          <OpsTablePrint ops={opVigentes} />
        </div>
      )}

      {/* ── Sección 6: Historial ── */}
      {opHistorial.length > 0 && (
        <div className="mb-3 text-[10px]">
          <SubTitulo>Historial de Operaciones ({opHistorial.length})</SubTitulo>
          <OpsTablePrint ops={opHistorial} />
        </div>
      )}

      {operaciones.length === 0 && (
        <div className="mb-3 text-[10px]">
          <SubTitulo>Operaciones</SubTitulo>
          <p className="text-gray-400 italic">Sin operaciones registradas.</p>
        </div>
      )}

      {/* ── Firmas ── */}
      <div className="mt-6 pt-3 border-t border-gray-300 grid grid-cols-3 gap-8 text-center text-[10px]">
        {['Firma del Cliente', 'Firma del Representante', 'Sello / Firma ONE TRADE'].map(l => (
          <div key={l}>
            <div className="border-b border-gray-700 h-10 mb-1" />
            <p className="text-gray-500">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3002';
const TABS = ['Datos Personales','Financiero','Transferencia','Documentos','Due Diligencia','Operaciones','Calificación'] as const;
type Tab = typeof TABS[number];

export default function ContactoPFDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pf,         setPf]         = useState<any>(null);
  const [operaciones,setOperaciones]= useState<any[]>([]);
  const [empresas,   setEmpresas]   = useState<any[]>([]);
  const [documentos,  setDocumentos] = useState<any[]>([]);
  const [tiposAdj,    setTiposAdj]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<Tab>('Datos Personales');
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<any>({});
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [tiposDoc,      setTiposDoc]      = useState<any[]>([]);
  const [paises,        setPaises]        = useState<any[]>([]);
  const [bancos,        setBancos]        = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades,      setCiudades]      = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      contactosApi.getPersonaFisicaById(id),
      contactosApi.getOperacionesByContacto('pf', id),
      panelGlobalApi.getTiposDocumento(),
      panelGlobalApi.getPaises(),
    ])
      .then(([p, ops, td, ps]) => {
        setPf(p);
        setOperaciones(ops);
        setTiposDoc(td);
        setPaises(ps);
        // Cargar empresas vinculadas (no bloquea si falla)
        contactosApi.getEmpresasVinculadas(id).then(setEmpresas).catch(() => {});
        // Cargar documentos adjuntos y tipos
        documentosContactoApi.getByContacto('pf', id).then(setDocumentos).catch(() => {});
        documentosContactoApi.getTiposActivos().then(setTiposAdj).catch(() => {});
        panelGlobalApi.getBancosActivos().then(setBancos).catch(() => {});
        panelGlobalApi.getDepartamentos().then(setDepartamentos).catch(() => {});
      })
      .catch(() => navigate('/contactos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Cargar ciudades al cambiar departamento en modo edición
  useEffect(() => {
    if (!editing) return;
    const dept = departamentos.find((d: any) => d.nombre === form.departamento);
    if (dept) {
      panelGlobalApi.getCiudades(dept.id).then(setCiudades).catch(() => setCiudades([]));
    } else {
      setCiudades([]);
    }
  }, [form.departamento, editing, departamentos]);

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

        {/* Empresas vinculadas (solo vista, no en modo edición) */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Empresas Vinculadas
            {empresas.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{empresas.length}</span>
            )}
          </h3>
          {empresas.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Sin empresas vinculadas como representante legal.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Razón Social', 'RUC', 'Cargo', 'Actividad', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empresas.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{e.razonSocial}</td>
                      <td className="px-3 py-2 font-mono text-xs">{e.ruc}</td>
                      <td className="px-3 py-2 text-gray-600">{e.repLegalCargo ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{e.actividadPrincipal ?? '—'}</td>
                      <td className="px-3 py-2">
                        <Link to={`/contactos/empresas/${e.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            <Field label="Departamento">
              <select value={data.departamento??''} onChange={e=>{ set('departamento',e.target.value); set('ciudad',''); }} className={selectCls}>
                <option value="">— Seleccionar —</option>
                {departamentos.map((d:any)=><option key={d.id} value={d.nombre}>{d.nombre}</option>)}
              </select>
            </Field>
            <Field label="Ciudad">
              {ciudades.length > 0 ? (
                <select value={data.ciudad??''} onChange={e=>set('ciudad',e.target.value)} className={selectCls}>
                  <option value="">— Seleccionar —</option>
                  {ciudades.map((c:any)=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              ) : (
                <input value={data.ciudad??''} onChange={e=>set('ciudad',e.target.value)} className={inputCls} placeholder={data.departamento ? 'Ingrese ciudad' : 'Seleccioná departamento primero'}/>
              )}
            </Field>
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

  const renderTransferencia = () => (
    <CuentasTransferencia contactoTipo="pf" contactoId={id!} />
  );

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

  // ── Documentos / Due Diligencia tabs ────────────────────────────────────────
  const recargarDocs = () =>
    documentosContactoApi.getByContacto('pf', id!).then(setDocumentos).catch(() => {});

  const renderDocsTab = (categoria: 'documentos' | 'due_diligence') => (
    <DocTab
      contactoTipo="pf"
      contactoId={id!}
      categoria={categoria}
      documentos={documentos.filter(d => d.tipoCategoria === categoria)}
      tipos={tiposAdj.filter(t => t.categoria === categoria)}
      apiBase={API_BASE}
      onReload={recargarDocs}
    />
  );

  const renderTabContent = () => {
    switch (tab) {
      case 'Datos Personales': return renderDatosPersonales();
      case 'Financiero':       return renderFinanciero();
      case 'Transferencia':    return renderTransferencia();
      case 'Documentos':       return renderDocsTab('documentos');
      case 'Due Diligencia':   return renderDocsTab('due_diligence');
      case 'Operaciones':      return renderOperaciones();
      case 'Calificación':     return renderCalificacion();
    }
  };

  return (
    <>
      {/* Print-only ficha */}
      <FichaImpresa pf={pf} operaciones={operaciones} empresas={empresas} />

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

// ── DocTab ────────────────────────────────────────────────────────────────────

function DocTab({
  contactoTipo, contactoId, categoria, documentos, tipos, apiBase, onReload,
}: {
  contactoTipo: string; contactoId: string; categoria: string;
  documentos: any[]; tipos: any[]; apiBase: string; onReload: () => void;
}) {
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ tipoId: '', tipoNombre: '', tipoCodigo: '', tipoCategoria: categoria, fechaDocumento: '', observaciones: '' });
  const [file,      setFile]      = useState<File | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState<any>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const labelCat = categoria === 'due_diligence' ? 'Due Diligence' : 'Documentos y Contratos';

  const handleTipoChange = (tipoId: string) => {
    const t = tipos.find((x: any) => x.id === tipoId);
    setForm(f => ({ ...f, tipoId, tipoNombre: t?.nombre ?? '', tipoCodigo: t?.codigo ?? '', tipoCategoria: categoria }));
  };

  const handleAgregar = async () => {
    if (!form.tipoId) { alert('Seleccioná un tipo de documento.'); return; }
    setSaving(true);
    try {
      const body = { ...form, contactoTipo, contactoId };
      if (file) await documentosContactoApi.createConArchivo(body, file);
      else       await documentosContactoApi.create(body);
      setShowForm(false);
      setForm({ tipoId: '', tipoNombre: '', tipoCodigo: '', tipoCategoria: categoria, fechaDocumento: '', observaciones: '' });
      setFile(null);
      onReload();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleGuardarEdicion = async (id: string) => {
    setSaving(true);
    try {
      await documentosContactoApi.update(id, editForm);
      setEditingId(null);
      onReload();
    } catch { alert('Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await documentosContactoApi.delete(id); onReload(); } catch { alert('Error.'); }
  };

  const handleSubirArchivo = async (docId: string, f: File) => {
    setUploadingId(docId);
    try { await documentosContactoApi.upload(docId, f); onReload(); }
    catch { alert('Error al subir el archivo.'); }
    finally { setUploadingId(null); }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{labelCat}</h2>
        <button
          onClick={() => { setShowForm(s => !s); setForm({ tipoId: '', tipoNombre: '', tipoCodigo: '', tipoCategoria: categoria, fechaDocumento: '', observaciones: '' }); setFile(null); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700"
        >
          <Plus size={14}/> Agregar documento
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Nuevo documento</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento *</label>
              <select value={form.tipoId} onChange={e => handleTipoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del documento</label>
              <input type="date" value={form.fechaDocumento}
                onChange={e => setForm(f => ({ ...f, fechaDocumento: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Archivo (PDF / imagen)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
              <input value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAgregar} disabled={saving}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={14}/> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14}/> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Listado */}
      {documentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic text-sm">
          Sin documentos cargados.
          {tipos.length === 0 && (
            <p className="text-xs mt-1">
              Primero configurá los tipos en <strong>Panel Global → Tipos Doc. Adjunto</strong>.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc: any) => (
            <div key={doc.id} className={`bg-white rounded-xl border p-4 ${doc.url ? 'border-green-200' : 'border-gray-200'}`}>
              {editingId === doc.id ? (
                /* Modo edición */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-0.5">Fecha documento</label>
                    <input type="date" value={editForm.fechaDocumento ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, fechaDocumento: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-0.5">Observaciones</label>
                    <input value={editForm.observaciones ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, observaciones: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div className="col-span-2 flex gap-2 mt-1">
                    <button onClick={() => handleGuardarEdicion(doc.id)} disabled={saving}
                      className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                      <Save size={12}/> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                      <X size={12}/> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo vista */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.url ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <FileText size={16}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{doc.tipoNombre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {doc.fechaDocumento && (
                          <span className="text-xs text-gray-500">📅 {formatDate(doc.fechaDocumento)}</span>
                        )}
                        {doc.url
                          ? <a href={`${apiBase}${doc.url}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-green-700 hover:underline font-medium flex items-center gap-0.5">
                              ✓ Ver archivo
                            </a>
                          : <span className="text-xs text-gray-400">Sin archivo</span>
                        }
                        {doc.observaciones && <span className="text-xs text-gray-400 truncate">{doc.observaciones}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Upload / Replace */}
                    <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-0.5">
                      {uploadingId === doc.id ? '...' : doc.url ? '↑ Reemplazar' : '↑ Subir'}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleSubirArchivo(doc.id, f); e.target.value = ''; }}/>
                    </label>
                    {/* Edit */}
                    <button
                      onClick={() => { setEditingId(doc.id); setEditForm({ fechaDocumento: doc.fechaDocumento ?? '', observaciones: doc.observaciones ?? '' }); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
                      <Pencil size={14}/>
                    </button>
                    {/* Delete */}
                    <button onClick={() => handleEliminar(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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
