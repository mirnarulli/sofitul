import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatGs, calcularDias, formatDate } from '../../utils/formatters';
import { contactosApi } from '../../services/contactosApi';
import { operacionesApi } from '../../services/operacionesApi';
import { DocHeader, DocFooter } from '../../components/DocHeader';
import DocBarcode from '../../components/DocBarcode';
import { useEmpresa } from '../../context/LogosContext';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Cheque {
  banco:         string;
  librador:      string;
  rucLibrador:   string;
  nroCheque:     string;
  vencimiento:   string;
  monto:         string;   // string para input libre
  tasaMensual:   string;   // % mensual, ej: "7"
}

interface Liquidacion {
  dias:         number;
  monto:        number;
  interes:      number;
  amortizacion: number;
}

interface ContactoOption {
  id:    string;
  label: string;
  doc:   string;
  tipo:  'pf' | 'pj';
}

const CHEQUE_VACIO: Cheque = {
  banco: '', librador: '', rucLibrador: '',
  nroCheque: '', vencimiento: '', monto: '', tasaMensual: '',
};

// ── Lógica de cálculo ──────────────────────────────────────────────────────

function calcularLiquidacion(cheques: Cheque[], fechaOperacion: string): Liquidacion[] {
  return cheques.map(c => {
    const monto = parseFloat(c.monto.replace(/\./g, '').replace(',', '.')) || 0;
    const tasa  = parseFloat(c.tasaMensual) || 0;
    if (!monto || !c.vencimiento || !fechaOperacion) return { dias: 0, monto, interes: 0, amortizacion: monto };
    const dias = Math.max(0, calcularDias(fechaOperacion, c.vencimiento));
    const interes = Math.round(monto * (tasa / 100) * dias / 30);
    return { dias, monto, interes, amortizacion: monto - interes };
  });
}

// ── Componente principal ───────────────────────────────────────────────────

export default function SimuladorDescuento() {
  const navigate = useNavigate();
  const empresa  = useEmpresa();

  // Encabezado
  const [fechaOperacion, setFechaOperacion] = useState(() => new Date().toISOString().slice(0, 10));
  const [nroOperacion,   setNroOperacion]   = useState('');
  const [canal,          setCanal]          = useState('');

  // Cliente principal
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteOpts,     setClienteOpts]     = useState<ContactoOption[]>([]);
  const [clienteSel,      setClienteSel]      = useState<ContactoOption | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Firmante (para PJ)
  const [busquedaFirmante, setBusquedaFirmante] = useState('');
  const [firmanteOpts,     setFiremanteOpts]     = useState<ContactoOption[]>([]);
  const [firmanteSel,      setFirmanteSel]       = useState<ContactoOption | null>(null);

  // Cheques (max 10)
  const [cheques, setCheques] = useState<Cheque[]>([{ ...CHEQUE_VACIO }]);

  // Resumen inputs
  const [comision, setComision] = useState('');

  // Acreditación
  const [bancoAcred,   setBancoAcred]   = useState('');
  const [cuentaAcred,  setCuentaAcred]  = useState('');
  const [titularAcred, setTitularAcred] = useState('');
  const [aliasAcred,   setAliasAcred]   = useState('');

  // Guardar operación
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Búsqueda de contactos ─────────────────────────────────────────────

  const buscarContacto = useCallback(async (q: string, esFirmante = false) => {
    if (q.length < 2) return;
    try {
      const [pfs, pjs] = await Promise.all([
        contactosApi.getPersonasFisicas(q),
        contactosApi.getPersonasJuridicas(q),
      ]);
      const opts: ContactoOption[] = [
        ...pfs.map((p: any) => ({
          id: p.id, tipo: 'pf' as const,
          doc: p.numeroDoc,
          label: `${p.primerNombre} ${p.primerApellido} · CI ${p.numeroDoc}`,
        })),
        ...pjs.map((p: any) => ({
          id: p.id, tipo: 'pj' as const,
          doc: p.ruc,
          label: `${p.razonSocial} · RUC ${p.ruc}`,
        })),
      ];
      if (esFirmante) setFiremanteOpts(opts.filter(o => o.tipo === 'pf'));
      else            setClienteOpts(opts);
    } catch { /* ignorar */ }
  }, []);

  // ── Cheques helpers ───────────────────────────────────────────────────

  const updateCheque = (i: number, field: keyof Cheque, value: string) => {
    setCheques(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const agregarCheque = () => {
    if (cheques.length < 10) setCheques(prev => [...prev, { ...CHEQUE_VACIO }]);
  };

  const quitarCheque = (i: number) => {
    if (cheques.length > 1) setCheques(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Cálculos ──────────────────────────────────────────────────────────

  const liquidacion   = calcularLiquidacion(cheques, fechaOperacion);
  const totalCheques  = liquidacion.reduce((s, l) => s + l.monto, 0);
  const totalIntereses= liquidacion.reduce((s, l) => s + l.interes, 0);
  const comisionNum   = parseFloat(comision.replace(/\./g, '').replace(',', '.')) || 0;
  const netoDesembolsar = totalCheques - totalIntereses - comisionNum;
  const nroCheques    = cheques.filter(c => parseFloat(c.monto) > 0).length;

  // ── Aplicar tasa global ───────────────────────────────────────────────
  const [tasaGlobal, setTasaGlobal] = useState('');
  const aplicarTasaGlobal = () => {
    if (!tasaGlobal) return;
    setCheques(prev => prev.map(c => ({ ...c, tasaMensual: tasaGlobal })));
  };

  // ── Guardar como Operación ────────────────────────────────────────────
  const handleGuardarOperacion = async () => {
    if (!clienteSel || netoDesembolsar <= 0) return;
    setSaving(true);
    setSaveError('');
    try {
      const nombre = clienteSel.label.split(' · ')[0];
      const chequesData = cheques
        .map((c, i) => ({ c, liq: liquidacion[i] }))
        .filter(({ liq }) => liq.monto > 0)
        .map(({ c, liq }) => ({
          banco:            c.banco,
          librador:         c.librador,
          rucLibrador:      c.rucLibrador,
          nroCheque:        c.nroCheque,
          fechaVencimiento: c.vencimiento,
          monto:            liq.monto,
          tasaMensual:      parseFloat(c.tasaMensual) || 0,
          interes:          liq.interes,
          capitalInvertido: liq.amortizacion,
          dias:             liq.dias,
        }));

      const body = {
        tipoOperacion:    'DESCUENTO_CHEQUE',
        contactoTipo:     clienteSel.tipo,
        contactoId:       clienteSel.id,
        contactoNombre:   nombre,
        contactoDoc:      clienteSel.doc,
        fechaOperacion,
        canal,
        montoTotal:       totalCheques,
        interesTotal:     totalIntereses,
        comisionMonto:    comisionNum,
        netoDesembolsar,
        capitalInvertido: netoDesembolsar,
        cheques:          chequesData,
      };

      const op = await operacionesApi.create(body);
      navigate(`/operaciones/${op.id}`);
    } catch (err: any) {
      setSaveError(err.response?.data?.message ?? 'Error al guardar la operación.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  // ── Helpers fmt para liquidación ─────────────────────────────────────
  const fmtN = (n: number) => n > 0 ? n.toLocaleString('es-PY', { maximumFractionDigits: 0 }) : '-';
  const MIN_ROWS = Math.max(5, cheques.filter(c => parseFloat(c.monto) > 0).length);
  const chequesConDatos = cheques.filter(c => parseFloat(c.monto) > 0);

  return (
    <>
    {/* ── Liquidación print-only ────────────────────────────────────────── */}
    <div id="liquidacion-sim-root" className="hidden print:block"
      style={{ background: 'white', color: '#111', fontFamily: 'Calibri, Arial, sans-serif', fontSize: '13px', padding: '0' }}>
      <style>{`@media print { @page { size: A4 portrait; margin: 18mm 20mm; } }`}</style>

      <DocHeader />
      <hr style={{ border: 'none', borderTop: '2px solid #1e3a5f', marginBottom: '16px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', margin: 0, alignSelf: 'center' }}>
          LIQUIDACION DE PRESTAMO
        </h1>
        {nroOperacion && <DocBarcode value={nroOperacion} height={38} width={1.4} fontSize={9} />}
      </div>

      {/* Info */}
      <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={{ color: '#1e3a8a', fontWeight: '500', width: '200px', paddingBottom: '4px' }}>Cliente</td>
              <td>{clienteSel?.label ?? '—'}</td></tr>
          <tr><td style={{ color: '#1e3a8a', fontWeight: '500', paddingBottom: '4px' }}>Tipo de operación</td>
              <td>Descuento de Cheques</td></tr>
          <tr><td style={{ color: '#1e3a8a', fontWeight: '500', paddingBottom: '4px' }}>Fecha de la Operación</td>
              <td>{formatDate(fechaOperacion)}</td></tr>
        </tbody>
      </table>

      {/* Tabla cheques */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#808080', color: 'white' }}>
            {['N°','IMPORTE CHEQUE','AMORTIZACION','INTERES','VENCIMIENTO','DIAS'].map(h => (
              <th key={h} style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: h==='N°'?'center':'right', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: MIN_ROWS }, (_, i) => {
            const liq = liquidacion[i];
            const hasData = liq && liq.monto > 0;
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{hasData ? fmtN(liq.monto) : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{hasData ? fmtN(liq.amortizacion) : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{hasData ? fmtN(liq.interes) : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{hasData && cheques[i]?.vencimiento ? formatDate(cheques[i].vencimiento) : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{hasData ? liq.dias : ''}</td>
              </tr>
            );
          })}
          <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
            <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>Total</td>
            <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{fmtN(totalCheques)}</td>
            <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{fmtN(totalCheques - totalIntereses)}</td>
            <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>{fmtN(totalIntereses)}</td>
            <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}></td>
            <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'right' }}>
              {chequesConDatos.length > 0 ? Math.max(...liquidacion.filter(l => l.monto > 0).map(l => l.dias)) : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Resumen */}
      <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '280px' }}>
        <tbody>
          {[
            { label: 'Monto de la Operación', value: fmtN(totalCheques), bold: false },
            { label: 'Interés',               value: fmtN(totalIntereses), bold: false },
            ...(comisionNum > 0 ? [{ label: 'Comisión Desembolso', value: fmtN(comisionNum), bold: false }] : []),
            { label: 'Neto a Desembolsar',    value: fmtN(netoDesembolsar), bold: true },
          ].map(r => (
            <tr key={r.label}>
              <td style={{ border: '1px solid #ccc', padding: '5px 12px', background: '#f5f5f5', fontWeight: r.bold ? 'bold' : 'normal' }}>{r.label}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px 12px', textAlign: 'right', fontWeight: r.bold ? 'bold' : 'normal', minWidth: '130px' }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <DocFooter nroDoc={nroOperacion || undefined} label="Liquidación N°" />
    </div>

    {/* ── CSS: al imprimir, ocultar UI y mostrar solo liquidación ── */}
    <style>{`
      @media print {
        body > *:not(#liquidacion-sim-root) { display: none !important; }
        #liquidacion-sim-root { display: block !important; }
        @page { size: A4 portrait; margin: 18mm 20mm; }
      }
    `}</style>

    {/* ── UI normal (oculta al imprimir) ────────────────────────────────── */}
    <div className="max-w-6xl mx-auto space-y-6 print:hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulador de Descuento de Cheques</h1>
          <p className="text-sm text-gray-500 mt-0.5">{empresa.empresa_nombre}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              disabled={netoDesembolsar <= 0}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40"
            >
              🖨️ Imprimir Liquidación
            </button>
            <button
              onClick={handleGuardarOperacion}
              disabled={!clienteSel || netoDesembolsar <= 0 || saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar como Operación'}
            </button>
          </div>
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
        </div>
      </div>

      {/* ── Encabezado de operación ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          1 · Encabezado de Operación
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">N° Operación</label>
            <input value={nroOperacion} onChange={e => setNroOperacion(e.target.value)}
              placeholder="OP-26-01001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Operación</label>
            <input type="date" value={fechaOperacion} onChange={e => setFechaOperacion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
            <select value={canal} onChange={e => setCanal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Seleccionar...</option>
              <option>Particular</option>
              <option>Te Descuento</option>
              <option>Referido</option>
              <option>Digital</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Datos del cliente ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          2 · Datos del Cliente
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Búsqueda cliente */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Descontante (CI o Razón Social)
            </label>
            <input
              value={busquedaCliente}
              onChange={e => { setBusquedaCliente(e.target.value); buscarContacto(e.target.value); }}
              placeholder="Buscar por CI, RUC o nombre..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {clienteOpts.length > 0 && !clienteSel && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {clienteOpts.map(o => (
                  <button key={o.id}
                    onClick={() => { setClienteSel(o); setClienteOpts([]); setBusquedaCliente(o.label); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0">
                    <span className={`inline-block text-xs px-1.5 py-0.5 rounded mr-2 font-medium ${o.tipo === 'pf' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {o.tipo.toUpperCase()}
                    </span>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {clienteSel && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${clienteSel.tipo === 'pf' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {clienteSel.tipo === 'pf' ? 'Persona Física' : 'Persona Jurídica'}
                </span>
                <span className="text-sm text-gray-700">{clienteSel.label}</span>
                <button onClick={() => { setClienteSel(null); setBusquedaCliente(''); setFirmanteSel(null); setBusquedaFirmante(''); }}
                  className="text-xs text-red-500 hover:text-red-700 ml-auto">✕ Cambiar</button>
              </div>
            )}
          </div>

          {/* Firmante (solo si PJ) */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Firmante del Pagaré (PF)
              {clienteSel?.tipo === 'pj' && <span className="text-red-500 ml-1">* requerido para PJ</span>}
            </label>
            <input
              value={busquedaFirmante}
              onChange={e => { setBusquedaFirmante(e.target.value); buscarContacto(e.target.value, true); }}
              placeholder={clienteSel?.tipo === 'pf' ? 'Mismo cliente (PF)' : 'Buscar representante legal...'}
              disabled={clienteSel?.tipo === 'pf'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
            {firmanteOpts.length > 0 && !firmanteSel && (
              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {firmanteOpts.map(o => (
                  <button key={o.id}
                    onClick={() => { setFirmanteSel(o); setFiremanteOpts([]); setBusquedaFirmante(o.label); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0">
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {clienteSel?.tipo === 'pf' && (
              <p className="text-xs text-gray-400 mt-1">El firmante es el mismo cliente (persona física)</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabla de cheques ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            3 · Detalle de Cheques a Descontar
          </h2>
          <div className="flex items-center gap-3">
            {/* Tasa global */}
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-600 whitespace-nowrap">Tasa global %:</label>
              <input value={tasaGlobal} onChange={e => setTasaGlobal(e.target.value)}
                type="number" min="0" max="100" step="0.5" placeholder="ej: 7"
                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center" />
              <button onClick={aplicarTasaGlobal}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">
                Aplicar a todos
              </button>
            </div>
            <button onClick={agregarCheque} disabled={cheques.length >= 10}
              className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 disabled:opacity-40">
              + Agregar cheque
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-8">#</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Banco</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Librador del Cheque</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">RUC/CI Librador</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">N° Cheque</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Vencimiento</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Monto (Gs.)</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Tasa %/mes</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {cheques.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-1 py-1">
                    <input value={c.banco} onChange={e => updateCheque(i, 'banco', e.target.value)}
                      placeholder="Banco..."
                      className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                  </td>
                  <td className="px-1 py-1">
                    <input value={c.librador} onChange={e => updateCheque(i, 'librador', e.target.value)}
                      placeholder="Nombre librador..."
                      className="w-full border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                  </td>
                  <td className="px-1 py-1">
                    <input value={c.rucLibrador} onChange={e => updateCheque(i, 'rucLibrador', e.target.value)}
                      placeholder="RUC / CI"
                      className="w-28 border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                  </td>
                  <td className="px-1 py-1">
                    <input value={c.nroCheque} onChange={e => updateCheque(i, 'nroCheque', e.target.value)}
                      placeholder="N° cheque"
                      className="w-28 border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                  </td>
                  <td className="px-1 py-1">
                    <input type="date" value={c.vencimiento} onChange={e => updateCheque(i, 'vencimiento', e.target.value)}
                      className="w-36 border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                  </td>
                  <td className="px-1 py-1">
                    <input value={c.monto} onChange={e => updateCheque(i, 'monto', e.target.value)}
                      placeholder="0"
                      className="w-32 border-0 bg-transparent px-2 py-1 text-sm text-right font-mono focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                  </td>
                  <td className="px-1 py-1">
                    <input type="number" value={c.tasaMensual} onChange={e => updateCheque(i, 'tasaMensual', e.target.value)}
                      min="0" max="100" step="0.5" placeholder="0"
                      className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center font-medium text-blue-700 focus:ring-2 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-1">
                    <button onClick={() => quitarCheque(i)} disabled={cheques.length === 1}
                      className="text-gray-300 hover:text-red-400 disabled:opacity-0 text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tabla de liquidación ── */}
      {totalCheques > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            4 · Tabla de Liquidación
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Vencimiento</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Días</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Monto Cheque</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Tasa %/mes</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 text-orange-600">Interés (Gs.)</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 text-green-600">Amortización (Gs.)</th>
                </tr>
              </thead>
              <tbody>
                {cheques.map((c, i) => {
                  const l = liquidacion[i];
                  if (!l.monto) return null;
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {c.vencimiento ? new Date(c.vencimiento + 'T00:00:00').toLocaleDateString('es-PY') : '—'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${l.dias <= 15 ? 'bg-red-100 text-red-700' : l.dias <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {l.dias}d
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatGs(l.monto)}</td>
                      <td className="px-3 py-2 text-center text-blue-700 font-medium">{c.tasaMensual || 0}%</td>
                      <td className="px-3 py-2 text-right font-mono text-orange-600">{formatGs(l.interes)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">{formatGs(l.amortizacion)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-gray-700">TOTALES — {nroCheques} cheque{nroCheques !== 1 ? 's' : ''}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatGs(totalCheques)}</td>
                  <td></td>
                  <td className="px-3 py-2 text-right font-mono text-orange-600">{formatGs(totalIntereses)}</td>
                  <td className="px-3 py-2 text-right font-mono text-green-700">{formatGs(totalCheques - totalIntereses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Resumen de liquidación ── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            5 · Resumen de Liquidación
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Monto total de cheques</span>
              <span className="font-mono font-medium">{formatGs(totalCheques)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total intereses descontados</span>
              <span className="font-mono font-medium text-orange-600">- {formatGs(totalIntereses)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Comisión de desembolso (Gs.)</span>
              <input value={comision} onChange={e => setComision(e.target.value)}
                placeholder="0"
                className="w-36 text-right font-mono border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3">
              <span className="font-semibold text-gray-800">NETO A DESEMBOLSAR</span>
              <span className={`font-mono font-bold text-lg ${netoDesembolsar >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {formatGs(netoDesembolsar)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs text-gray-500">
              <span>N° cheques en operación</span>
              <span className="font-semibold">{nroCheques}</span>
            </div>
          </div>
        </div>

        {/* ── Datos de acreditación ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            6 · Datos para Acreditación de Fondos
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
                <input value={bancoAcred} onChange={e => setBancoAcred(e.target.value)}
                  placeholder="Banco..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">N° de Cuenta</label>
                <input value={cuentaAcred} onChange={e => setCuentaAcred(e.target.value)}
                  placeholder="Nro de cuenta"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titular de la Cuenta</label>
              <input value={titularAcred} onChange={e => setTitularAcred(e.target.value)}
                placeholder="Nombre del titular"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alias</label>
              <input value={aliasAcred} onChange={e => setAliasAcred(e.target.value)}
                placeholder="Alias de la cuenta"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra de resultado final (print-friendly) ── */}
      {totalCheques > 0 && (
        <div className="bg-blue-900 text-white rounded-xl p-5 print:bg-gray-100 print:text-black print:border-2 print:border-gray-900">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-blue-300 print:text-gray-500 uppercase tracking-wide">Cheques</div>
              <div className="text-xl font-bold mt-1">{nroCheques}</div>
            </div>
            <div>
              <div className="text-xs text-blue-300 print:text-gray-500 uppercase tracking-wide">Monto Total</div>
              <div className="text-lg font-bold mt-1 font-mono">{formatGs(totalCheques)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-300 print:text-gray-500 uppercase tracking-wide">Total Intereses</div>
              <div className="text-lg font-bold mt-1 font-mono text-orange-300 print:text-orange-600">{formatGs(totalIntereses)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-300 print:text-gray-500 uppercase tracking-wide">Neto a Desembolsar</div>
              <div className="text-xl font-bold mt-1 font-mono text-green-300 print:text-green-700">{formatGs(netoDesembolsar)}</div>
            </div>
          </div>
        </div>
      )}
    </div>  {/* /UI normal */}
    </>   /* /Fragment */
  );
}
