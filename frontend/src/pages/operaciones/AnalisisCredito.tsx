import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { operacionesApi } from '../../services/operacionesApi';
import { contactosApi, panelGlobalApi } from '../../services/contactosApi';
import { DocHeader, DocFooter } from '../../components/DocHeader';
import { formatGs, formatDate } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3002';

// ── helpers ────────────────────────────────────────────────────────────────────

const CAL_COLOR: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-blue-100  text-blue-800  border-blue-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-red-100   text-red-800   border-red-300',
};

function cal(v?: string) {
  if (!v) return null;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${CAL_COLOR[v] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      {v}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2 py-0.5 text-sm border-b border-gray-100 last:border-0">
      <span className="text-gray-400 w-36 shrink-0 text-xs">{label}</span>
      <span className="text-gray-800 font-medium">{value || '—'}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 print:border print:rounded-none print:mb-3 print:p-3">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
}

function DocItem({ label, url, label2 }: { label: string; url?: string; label2?: string }) {
  const ok = !!url;
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${ok ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        {ok
          ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
          : <XCircle size={16} className="text-gray-300 shrink-0" />}
        <div>
          <p className={`text-sm font-medium ${ok ? 'text-green-800' : 'text-gray-500'}`}>{label}</p>
          {label2 && <p className="text-xs text-gray-400">{label2}</p>}
        </div>
      </div>
      {ok && url && (
        <a href={`${API_BASE}${url}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-green-700 hover:underline font-medium">
          <ExternalLink size={11} /> Ver
        </a>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AnalisisCredito() {
  const { id } = useParams<{ id: string }>();

  const [op,        setOp]       = useState<any>(null);
  const [cliente,   setCliente]  = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [producto,  setProducto] = useState<any>(null);
  const [loading,   setLoading]  = useState(true);

  useEffect(() => {
    if (!id) return;
    operacionesApi.getById(id).then(async (o) => {
      setOp(o);
      try {
        const c = o.contactoTipo === 'pf'
          ? await contactosApi.getPersonaFisicaById(o.contactoId)
          : await contactosApi.getPersonaJuridicaById(o.contactoId);
        setCliente(c);
      } catch {}
      try {
        const hist = await contactosApi.getOperacionesByContacto(o.contactoTipo, o.contactoId);
        setHistorial((hist.data ?? hist).filter((h: any) => h.id !== id));
      } catch {}
      if (o.productoId) {
        try {
          const prod = await panelGlobalApi.getProductoById(o.productoId);
          setProducto(prod);
        } catch {}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando análisis...</div>;
  if (!op)     return <div className="p-8 text-center text-red-400">Operación no encontrada</div>;

  const esPF = op.contactoTipo === 'pf';

  // Financiero PF
  const ingresos  = (cliente?.ingresos  as any[] | null) ?? [];
  const egresos   = (cliente?.egresos   as any[] | null) ?? [];
  const activos   = (cliente?.activos   as any[] | null) ?? [];
  const pasivos   = (cliente?.pasivos   as any[] | null) ?? [];
  const totalI = ingresos.reduce((s: number, r: any) => s + Number(r.monto ?? 0), 0);
  const totalE = egresos.reduce((s: number, r: any) => s + Number(r.monto ?? 0), 0);
  const totalA = activos.reduce((s: number, r: any) => s + Number(r.valor ?? 0), 0);
  const totalP = pasivos.reduce((s: number, r: any) => s + Number(r.valor ?? 0), 0);
  const capacidad = totalI - totalE;

  // ── Informes de rigor dinámicos ────────────────────────────────────────────
  // Si hay producto con formularios configurados, se usan esos.
  // Si no, se muestran los dos informes base (informconf + infocheck).
  const productFormularios: { id: string; nombre: string; requerido: boolean }[] =
    (producto?.formularios?.length ?? 0) > 0
      ? producto.formularios
      : [
          { id: 'informconf', nombre: 'Ficha INFORMCONF', requerido: true },
          { id: 'infocheck',  nombre: 'Ficha INFOCHECK',  requerido: true },
        ];

  function resolverFormulario(fid: string): { ok: boolean; url?: string; sub: string } {
    const id = fid.toLowerCase();
    if (id.includes('informconf'))
      return { ok: !!op.fichaInformconfUrl,     url: op.fichaInformconfUrl,     sub: op.fichaInformconfUrl     ? 'Cargado' : 'Pendiente' };
    if (id.includes('infocheck'))
      return { ok: !!op.fichaInfocheckUrl,      url: op.fichaInfocheckUrl,      sub: op.fichaInfocheckUrl      ? 'Cargado' : 'Pendiente' };
    if (id.includes('contrato'))
      return { ok: !!op.contratoTeDescuentoUrl, url: op.contratoTeDescuentoUrl, sub: op.nroContratoTeDescuento ? `N° ${op.nroContratoTeDescuento}` : 'Sin número' };
    if (id.includes('pagare'))
      return { ok: !!op.pagareRecibido, sub: op.pagareRecibido ? `Fecha: ${formatDate(op.fechaPagare)}` : 'Pendiente' };
    if (id.includes('cheque'))
      return { ok: (op.cheques?.length ?? 0) > 0, sub: `${op.cheques?.length ?? 0} cheque(s) registrado(s)` };
    return { ok: false, sub: 'Pendiente' };
  }

  // ── Checklist legajo ────────────────────────────────────────────────────────
  // Siempre: ficha del cliente
  // Dinámicos: según formularios del producto
  // Siempre (DESCUENTO_CHEQUE): pagaré + cheques (salvo que ya estén en formularios)
  const tieneFormId = (fid: string) =>
    productFormularios.some(f => f.id.toLowerCase().includes(fid));

  const legajo = [
    { label: 'Ficha del cliente', ok: !!cliente, sub: op.contactoNombre },
    ...productFormularios.map(f => {
      const r = resolverFormulario(f.id);
      return { label: f.nombre, ok: r.ok, sub: r.sub, url: r.url };
    }),
    ...(op.tipoOperacion === 'DESCUENTO_CHEQUE' && !tieneFormId('pagare')
      ? [{ label: 'Pagaré firmado', ok: !!op.pagareRecibido, sub: op.pagareRecibido ? `Fecha: ${formatDate(op.fechaPagare)}` : 'Pendiente' }]
      : []),
    ...(op.tipoOperacion === 'DESCUENTO_CHEQUE' && !tieneFormId('cheque')
      ? [{ label: 'Cheques', ok: (op.cheques?.length ?? 0) > 0, sub: `${op.cheques?.length ?? 0} cheque(s) registrado(s)` }]
      : []),
  ];
  const legajoOk = legajo.filter(l => l.ok).length;

  return (
    <>
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body > *:not(#analisis-root) { display: none !important; }
          #analisis-root { display: block !important; }
          @page { size: A4; margin: 12mm 14mm; }
          .bg-white { background: white !important; }
        }
      `}</style>

      <div id="analisis-root" className="p-4 max-w-5xl mx-auto print:p-0">

        {/* ── Navbar print:hidden ── */}
        <div className="print:hidden flex items-center justify-between mb-5">
          <Link to={`/operaciones/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> Volver a operación
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/operaciones/${id}/solicitud`} target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FileText size={14} /> Liquidación
            </Link>
            <Link to={`/operaciones/${id}/pagare`} target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FileText size={14} /> Pagaré
            </Link>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700">
              <Printer size={14} /> Imprimir ficha
            </button>
          </div>
        </div>

        {/* ── Print header ── */}
        <div className="hidden print:block mb-4">
          <DocHeader />
          <hr className="border-t-2 border-gray-900 mt-2" />
        </div>

        {/* ── Título ── */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Análisis de Crédito</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {op.nroOperacion} · {op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheque' : 'Préstamo de Consumo'}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500 print:hidden">
            <p className="font-bold text-gray-800 text-base">{op.contactoNombre}</p>
            <p className="font-mono text-xs">{op.contactoDoc}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
              op.estado === 'APROBADA' || op.estado === 'DESEMBOLSADA' ? 'bg-green-100 text-green-800 border-green-300' :
              op.estado === 'RECHAZADA' ? 'bg-red-100 text-red-800 border-red-300' :
              'bg-blue-100 text-blue-800 border-blue-300'
            }`}>{op.estado}</span>
          </div>
        </div>

        {/* ── 1. Resumen operación ── */}
        <Section title="Datos de la Operación" icon="📋">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { l: 'N° Operación',      v: op.nroOperacion },
              { l: 'Fecha',             v: formatDate(op.fechaOperacion) },
              { l: 'Vencimiento',       v: formatDate(op.fechaVencimiento) },
              { l: 'Estado',            v: op.estado },
              { l: 'Monto total',       v: formatGs(op.montoTotal) },
              { l: 'Interés total',     v: formatGs(op.interesTotal) },
              { l: 'Neto a desembolsar',v: formatGs(op.netoDesembolsar) },
              { l: 'Canal',             v: op.canal ?? '—' },
            ].map(({ l, v }) => (
              <div key={l}>
                <p className="text-xs text-gray-400">{l}</p>
                <p className="text-sm font-semibold text-gray-800">{v}</p>
              </div>
            ))}
          </div>
          {op.nroContratoTeDescuento && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm">
              <span className="text-gray-400 text-xs">Contrato TeDescuento:</span>
              <span className="font-mono font-bold text-gray-700">{op.nroContratoTeDescuento}</span>
            </div>
          )}
        </Section>

        {/* ── 2. Ficha del solicitante ── */}
        <Section title="Datos del Solicitante" icon="👤">
          {esPF && cliente ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              {/* Columna izquierda */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Identificación</p>
                <Row label="Nombre completo" value={[cliente.primerNombre, cliente.segundoNombre, cliente.primerApellido, cliente.segundoApellido].filter(Boolean).join(' ')} />
                <Row label="Documento" value={`${cliente.tipoDocumento ?? 'CI'} ${cliente.numeroDoc}`} />
                <Row label="Fecha nacimiento" value={formatDate(cliente.fechaNacimiento)} />
                <Row label="Sexo" value={cliente.sexo === 'M' ? 'Masculino' : cliente.sexo === 'F' ? 'Femenino' : undefined} />
                <Row label="Estado civil" value={cliente.estadoCivil} />
                <Row label="Nacionalidad" value={cliente.paisNacionalidad ?? cliente.nacionalidad} />

                <p className="text-xs font-semibold text-gray-400 uppercase mt-3 mb-1">Contacto</p>
                <Row label="Celular" value={cliente.celular} />
                <Row label="Teléfono" value={cliente.telefono} />
                <Row label="Email" value={cliente.email} />
                <Row label="Domicilio" value={[cliente.domicilio, cliente.barrio, cliente.ciudad].filter(Boolean).join(', ')} />
              </div>
              {/* Columna derecha */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Actividad</p>
                <Row label="Profesión" value={cliente.profesion} />
                <Row label="Empleador" value={cliente.empleador} />
                <Row label="Cargo" value={cliente.cargo} />
                <Row label="Antigüedad" value={cliente.antiguedadCargo} />
                <Row label="Situación laboral" value={cliente.situacionLaboral} />

                <p className="text-xs font-semibold text-gray-400 uppercase mt-3 mb-1">Cuenta Bancaria</p>
                <Row label="Banco" value={cliente.bancoAcreditacion} />
                <Row label="N° Cuenta" value={cliente.nroCuentaAcreditacion} />
                <Row label="Titular" value={cliente.titularCuentaAcreditacion} />
                <Row label="Alias" value={cliente.aliasAcreditacion} />

                <p className="text-xs font-semibold text-gray-400 uppercase mt-3 mb-1">Compliance</p>
                <Row label="Es PEP" value={cliente.esPep ? 'SÍ ⚠️' : 'No'} />
                <Row label="Es FATCA" value={cliente.esFatca ? 'SÍ ⚠️' : 'No'} />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 w-36">Calificación interna</span>
                  {cal(cliente.calificacionInterna) ?? <span className="text-gray-400 text-sm">—</span>}
                </div>
              </div>
            </div>
          ) : cliente ? (
            /* PJ */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <Row label="Razón social" value={cliente.razonSocial} />
                <Row label="RUC" value={cliente.ruc} />
                <Row label="Nombre fantasía" value={cliente.nombreFantasia} />
                <Row label="Actividad" value={cliente.actividadPrincipal} />
                <Row label="Fecha constitución" value={formatDate(cliente.fechaConstitucion)} />
                <Row label="País" value={cliente.pais} />
              </div>
              <div>
                <Row label="Rep. legal" value={cliente.repLegalNombre} />
                <Row label="Doc. rep. legal" value={cliente.repLegalDoc} />
                <Row label="Cargo rep. legal" value={cliente.repLegalCargo} />
                <Row label="Teléfono" value={cliente.telefono} />
                <Row label="Email" value={cliente.email} />
                <Row label="Domicilio" value={[cliente.domicilio, cliente.barrio, cliente.ciudad].filter(Boolean).join(', ')} />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 w-36">Calificación interna</span>
                  {cal(cliente.calificacionInterna) ?? <span className="text-gray-400 text-sm">—</span>}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No se pudieron cargar los datos del solicitante.</p>
          )}
        </Section>

        {/* ── 3. Capacidad de pago (solo PF) ── */}
        {esPF && (ingresos.length > 0 || egresos.length > 0) && (
          <Section title="Análisis de Capacidad de Pago" icon="💰">
            <div className="grid grid-cols-2 gap-6 mb-4">
              {/* Ingresos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ingresos</p>
                {ingresos.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-0.5 border-b border-gray-50">
                    <span className="text-gray-600">{r.concepto}</span>
                    <span className="font-mono">{formatGs(r.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 mt-1">
                  <span>Total ingresos</span><span className="text-green-700 font-mono">{formatGs(totalI)}</span>
                </div>
              </div>
              {/* Egresos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Egresos</p>
                {egresos.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-0.5 border-b border-gray-50">
                    <span className="text-gray-600">{r.concepto}</span>
                    <span className="font-mono">{formatGs(r.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 mt-1">
                  <span>Total egresos</span><span className="text-red-600 font-mono">{formatGs(totalE)}</span>
                </div>
              </div>
            </div>

            {(activos.length > 0 || pasivos.length > 0) && (
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Activos</p>
                  {activos.map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-0.5 border-b border-gray-50">
                      <span className="text-gray-600">{r.descripcion}</span>
                      <span className="font-mono">{formatGs(r.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 mt-1">
                    <span>Total activos</span><span className="font-mono">{formatGs(totalA)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pasivos</p>
                  {pasivos.map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-0.5 border-b border-gray-50">
                      <span className="text-gray-600">{r.descripcion}</span>
                      <span className="font-mono">{formatGs(r.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 mt-1">
                    <span>Total pasivos</span><span className="font-mono">{formatGs(totalP)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen financiero */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-3 text-center ${capacidad >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-xs text-gray-500 mb-0.5">Capacidad de pago</p>
                <p className={`text-lg font-bold font-mono ${capacidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatGs(capacidad)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Patrimonio neto</p>
                <p className="text-lg font-bold font-mono text-blue-700">{formatGs(totalA - totalP)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Comprometido / Ingresos</p>
                <p className="text-lg font-bold text-gray-700">
                  {totalI > 0 ? `${Math.round((Number(op.netoDesembolsar) / totalI) * 100)}%` : '—'}
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ── 4. Cheques ── */}
        {op.cheques?.length > 0 && (
          <Section title={`Cheques (${op.cheques.length})`} icon="🏦">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Banco','Librador','N° Cheque','Vencimiento','Monto','Interés','Capital Inv.','Días'].map(h => (
                      <th key={h} className="text-left text-gray-400 font-semibold uppercase py-1 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {op.cheques.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-1.5 pr-3 font-medium">{c.banco}</td>
                      <td className="py-1.5 pr-3">{c.librador}</td>
                      <td className="py-1.5 pr-3 font-mono">{c.nroCheque}</td>
                      <td className="py-1.5 pr-3">{formatDate(c.fechaVencimiento)}</td>
                      <td className="py-1.5 pr-3 font-bold font-mono">{formatGs(c.monto)}</td>
                      <td className="py-1.5 pr-3 text-red-600 font-mono">{formatGs(c.interes)}</td>
                      <td className="py-1.5 pr-3 text-green-700 font-mono">{formatGs(c.capitalInvertido)}</td>
                      <td className="py-1.5">{c.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ── 5. Informes de rigor ── */}
        <Section title={`Informes de Rigor${producto ? ` — ${producto.nombre}` : ''}`} icon="🔍">
          {productFormularios.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No hay informes configurados para este producto.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productFormularios.map(f => {
                const r = resolverFormulario(f.id);
                return (
                  <DocItem
                    key={f.id}
                    label={f.nombre}
                    url={r.url}
                    label2={r.sub}
                  />
                );
              })}
            </div>
          )}
        </Section>

        {/* ── 6. Historial del cliente ── */}
        <Section title={`Historial con la Empresa (${historial.length} operaciones anteriores)`} icon="📊">
          {historial.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Primera operación del cliente.</p>
          ) : (
            <>
              {/* Resumen rápido */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <p className="text-xs text-gray-400">Total operaciones</p>
                  <p className="text-lg font-bold text-gray-800">{historial.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <p className="text-xs text-gray-400">Canceladas</p>
                  <p className="text-lg font-bold text-green-700">{historial.filter((h: any) => h.estado === 'CANCELADA' || h.estado === 'PAGADA').length}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                  <p className="text-xs text-gray-400">Vigentes</p>
                  <p className="text-lg font-bold text-yellow-700">{historial.filter((h: any) => !['CANCELADA','PAGADA','RECHAZADA'].includes(h.estado)).length}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {['N° Op.','Tipo','Monto','Vencimiento','Estado'].map(h => (
                        <th key={h} className="text-left text-gray-400 font-semibold uppercase py-1 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h: any) => (
                      <tr key={h.id} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 font-mono font-medium">{h.nroOperacion}</td>
                        <td className="py-1.5 pr-3">{h.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Dto. Cheque' : 'Préstamo'}</td>
                        <td className="py-1.5 pr-3 font-mono">{formatGs(h.montoTotal)}</td>
                        <td className="py-1.5 pr-3">{formatDate(h.fechaVencimiento)}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            h.estado === 'CANCELADA' || h.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
                            h.estado === 'MORA' || h.estado === 'VENCIDA' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{h.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Section>

        {/* ── 7. Checklist del legajo ── */}
        <Section title={`Legajo (${legajoOk}/${legajo.length} documentos)`} icon="📁">
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Completitud del legajo</span>
              <span className="font-bold">{Math.round((legajoOk / legajo.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${legajoOk === legajo.length ? 'bg-green-500' : legajoOk >= legajo.length * 0.6 ? 'bg-yellow-500' : 'bg-red-400'}`}
                style={{ width: `${(legajoOk / legajo.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {legajo.map((item) => (
              <div key={item.label}
                className={`flex items-center gap-3 p-3 rounded-lg border ${item.ok ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                {item.ok
                  ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                  : <AlertCircle  size={18} className="text-orange-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.ok ? 'text-green-800' : 'text-gray-600'}`}>{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                </div>
                {item.ok && (item as any).url && (
                  <a href={`${API_BASE}${(item as any).url}`} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-xs text-green-700 hover:underline">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── 8. Firmas (print only) ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 print:border print:rounded-none print:p-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">✍️ Firmas y Resolución</h2>
          <div className="grid grid-cols-3 gap-8 text-center">
            {['Firma del Cliente / Solicitante', 'Analista de Crédito', 'Aprobación / Gerencia'].map(l => (
              <div key={l}>
                <div className="h-14 border-b-2 border-gray-400 mb-2" />
                <p className="text-xs text-gray-500 font-medium">{l}</p>
                <p className="text-xs text-gray-400 mt-0.5 border border-gray-200 rounded px-2 py-1">
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>N° Operación: <strong className="text-gray-700">{op.nroOperacion}</strong></span>
            <span>Fecha de análisis: <strong className="text-gray-700">{new Date().toLocaleDateString('es-PY')}</strong></span>
            {op.nroContratoTeDescuento && <span>Contrato TD: <strong className="text-gray-700">{op.nroContratoTeDescuento}</strong></span>}
          </div>
        </div>

        {/* ── Print footer ── */}
        <div className="hidden print:block">
          <DocFooter nroDoc={op.nroOperacion} label="Análisis N°" />
        </div>

        {/* ── Print button (screen only) ── */}
        <div className="mt-4 text-center print:hidden">
          <button onClick={() => window.print()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
            🖨️ Imprimir ficha completa
          </button>
        </div>

      </div>
    </>
  );
}
