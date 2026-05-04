import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatGs, formatDate } from '../../utils/formatters';
import { contactosApi, panelGlobalApi } from '../../services/contactosApi';
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

// ── Helpers de fecha local (evita desfase por UTC en toISOString) ─────────

function fechaLocal(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ── Próximo día hábil (si la fecha cae en finde/feriado, avanza al siguiente) ──
// Se usa para ajustar el vencimiento antes de calcular los días.

function proximoHabilLocal(fecha: string, feriados: Set<string>): string {
  const d = new Date(fecha + 'T00:00:00');
  while (true) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !feriados.has(fechaLocal(d))) return fechaLocal(d);
    d.setDate(d.getDate() + 1);
  }
}

// ── Días hábiles entre dos fechas.
//    El vencimiento se ajusta al próximo día hábil si cae en finde/feriado. ──

function calcDiasHabiles(from: string, to: string, feriados: Set<string>): number {
  if (!from || !to) return 0;
  // Si el vencimiento cae sábado/domingo/feriado, mover al próximo día hábil
  const toEfectivo = proximoHabilLocal(to, feriados);
  const start = new Date(from       + 'T00:00:00');
  const end   = new Date(toEfectivo + 'T00:00:00');
  if (end <= start) return 0;
  let count = 0;
  const curr = new Date(start);
  curr.setDate(curr.getDate() + 1);  // el primer día que cuenta es el día siguiente
  while (curr <= end) {
    const dow = curr.getDay();        // 0=Dom, 6=Sáb
    if (dow !== 0 && dow !== 6 && !feriados.has(fechaLocal(curr))) count++;
    curr.setDate(curr.getDate() + 1);
  }
  return count;
}

// ── Lógica de cálculo ──────────────────────────────────────────────────────

function calcularLiquidacion(
  cheques: Cheque[],
  fechaOperacion: string,
  calcDiasFn: (from: string, to: string) => number,
): Liquidacion[] {
  return cheques.map(c => {
    const monto = parseFloat(c.monto.replace(/\./g, '').replace(',', '.')) || 0;
    const tasa  = parseFloat(c.tasaMensual) || 0;
    if (!monto || !c.vencimiento || !fechaOperacion) return { dias: 0, monto, interes: 0, amortizacion: monto };
    const dias    = Math.max(0, calcDiasFn(fechaOperacion, c.vencimiento));
    const interes = Math.round(monto * (tasa / 100) * dias / 30);
    return { dias, monto, interes, amortizacion: monto - interes };
  });
}

// ── Componente principal ───────────────────────────────────────────────────

export default function SimuladorDescuento() {
  const navigate = useNavigate();
  const empresa  = useEmpresa();

  // Encabezado — fechaLocal evita el bug de toISOString() con UTC
  const [fechaOperacion, setFechaOperacion] = useState(() => fechaLocal(new Date()));
  const [nroOperacion,   setNroOperacion]   = useState('');
  const [canal,          setCanal]          = useState('');

  // Cliente principal
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteOpts,     setClienteOpts]     = useState<ContactoOption[]>([]);
  const [clienteSel,      setClienteSel]      = useState<ContactoOption | null>(null);

  // Firmante (para PJ)
  const [busquedaFirmante, setBusquedaFirmante] = useState('');
  const [firmanteOpts,     setFiremanteOpts]     = useState<ContactoOption[]>([]);
  const [firmanteSel,      setFirmanteSel]       = useState<ContactoOption | null>(null);

  // Cheques (max 10)
  const [cheques, setCheques] = useState<Cheque[]>([{ ...CHEQUE_VACIO }]);

  // Librador búsqueda por cheque (arrays paralelos a cheques)
  const [libradorBusqs,   setLibradorBusqs]   = useState<string[]>(['']);
  const [libradorOptsAll, setLibradorOptsAll] = useState<ContactoOption[][]>([[]]);

  // Bancos (Panel Global) — se usan en <datalist> para evitar problemas de
  // z-index/overflow con dropdown custom dentro de tabla overflow-x-auto
  const [bancos, setBancos] = useState<any[]>([]);

  // Feriados — Set de fechas YYYY-MM-DD para lookup O(1) al calcular días hábiles
  const [feriados, setFeriados] = useState<Set<string>>(new Set());

  // Timer refs para debounce de búsqueda de librador (uno por fila)
  const libradorTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Resumen inputs
  const [comision, setComision] = useState('');

  // Acreditación
  const [bancoAcred,        setBancoAcred]        = useState('');
  const [cuentaAcred,       setCuentaAcred]       = useState('');
  const [titularAcred,      setTitularAcred]      = useState('');
  const [aliasAcred,        setAliasAcred]        = useState('');
  const [cuentasDisponibles, setCuentasDisponibles] = useState<any[]>([]);
  const [cuentaSelIdx,      setCuentaSelIdx]      = useState<number>(-1);

  // Guardar operación
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Cargar bancos al montar (getBancos igual que Panel Global) ──────────
  useEffect(() => {
    panelGlobalApi.getBancos()
      .then((data: any) => {
        const arr = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        setBancos(arr.filter((b: any) => b.activo !== false));
      })
      .catch(() => {});
  }, []);

  // ── Cargar feriados (año de operación + siguiente para cubrir 180 días) ──
  useEffect(() => {
    const año1 = new Date(fechaOperacion + 'T00:00:00').getFullYear();
    const año2 = año1 + 1;
    Promise.all([
      panelGlobalApi.getFeriados(año1),
      panelGlobalApi.getFeriados(año2),
    ]).then(([f1, f2]) => {
      const set = new Set<string>();
      [...(Array.isArray(f1) ? f1 : []), ...(Array.isArray(f2) ? f2 : [])].forEach((f: any) => {
        const fecha = (f.fecha ?? f.date ?? '').toString().slice(0, 10);
        if (fecha) set.add(fecha);
      });
      setFeriados(set);
    }).catch(() => {});
  }, [fechaOperacion]);

  // ── Cargar cuentas de acreditación al seleccionar cliente ────────────
  useEffect(() => {
    if (!clienteSel) {
      setCuentasDisponibles([]);
      setCuentaSelIdx(-1);
      return;
    }
    contactosApi.getCuentasTransferencia(clienteSel.tipo, clienteSel.id)
      .then((cuentas: any[]) => {
        const activas = cuentas.filter((c: any) => c.activo !== false);
        setCuentasDisponibles(activas);
        if (activas.length >= 1) {
          // Pre-seleccionar la principal o la primera
          const idx = activas.findIndex((c: any) => c.esPrincipal) >= 0
            ? activas.findIndex((c: any) => c.esPrincipal)
            : 0;
          setCuentaSelIdx(idx);
        }
      })
      .catch(() => {});
  }, [clienteSel]);

  // ── Llenar campos de acreditación cuando se elige cuenta ─────────────
  useEffect(() => {
    if (cuentaSelIdx >= 0 && cuentasDisponibles[cuentaSelIdx]) {
      const c = cuentasDisponibles[cuentaSelIdx];
      setBancoAcred(c.banco || '');
      setCuentaAcred(c.numeroCuenta || '');
      setTitularAcred(c.titular || '');
      setAliasAcred(c.alias || '');
    }
  }, [cuentaSelIdx, cuentasDisponibles]);

  // ── Búsqueda de contactos (cliente / firmante) ────────────────────────

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

  // ── Búsqueda de librador por cheque (PF + PJ) con debounce ──────────

  const buscarLibrador = useCallback((i: number, q: string) => {
    // Actualiza el buffer visible Y el campo librador del cheque
    setLibradorBusqs(prev => prev.map((v, idx) => idx === i ? q : v));
    setCheques(prev => prev.map((c, idx) => idx === i ? { ...c, librador: q } : c));

    if (q.length < 2) {
      clearTimeout(libradorTimers.current[i]);
      setLibradorOptsAll(prev => prev.map((v, idx) => idx === i ? [] : v));
      return;
    }

    // Debounce 300 ms — evita race conditions y saturar la API en cada tecla
    clearTimeout(libradorTimers.current[i]);
    libradorTimers.current[i] = setTimeout(async () => {
      try {
        const [pfsRaw, pjsRaw] = await Promise.all([
          contactosApi.getPersonasFisicas(q),
          contactosApi.getPersonasJuridicas(q),
        ]);
        // Normalizar respuesta: puede venir como array o como { data: [] }
        const pfs: any[] = Array.isArray(pfsRaw) ? pfsRaw : (pfsRaw?.data ?? pfsRaw?.items ?? []);
        const pjs: any[] = Array.isArray(pjsRaw) ? pjsRaw : (pjsRaw?.data ?? pjsRaw?.items ?? []);

        const opts: ContactoOption[] = [
          ...pfs.map((p: any) => ({
            id:    p.id,
            tipo:  'pf' as const,
            doc:   p.numeroDoc ?? p.ci ?? '',
            label: `${p.primerNombre ?? ''} ${p.primerApellido ?? ''}`.trim() + ` · CI ${p.numeroDoc ?? ''}`,
          })),
          ...pjs.map((p: any) => ({
            id:    p.id,
            tipo:  'pj' as const,
            doc:   p.ruc ?? '',
            label: `${p.razonSocial ?? p.nombre ?? ''} · RUC ${p.ruc ?? ''}`,
          })),
        ];
        setLibradorOptsAll(prev => prev.map((v, idx) => idx === i ? opts : v));
      } catch {
        /* ignorar — no bloquear la UI por error de búsqueda */
      }
    }, 300);
  }, []);

  const seleccionarLibrador = (i: number, o: ContactoOption) => {
    const nombre = o.label.split(' · ')[0];
    setCheques(prev => prev.map((c, idx) => idx === i ? { ...c, librador: nombre, rucLibrador: o.doc } : c));
    setLibradorBusqs(prev => prev.map((v, idx) => idx === i ? nombre : v));
    setLibradorOptsAll(prev => prev.map((v, idx) => idx === i ? [] : v));
  };

  // ── Cheques helpers ───────────────────────────────────────────────────

  const updateCheque = (i: number, field: keyof Cheque, value: string) => {
    setCheques(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const agregarCheque = () => {
    if (cheques.length < 10) {
      setCheques(prev => [...prev, { ...CHEQUE_VACIO }]);
      setLibradorBusqs(prev => [...prev, '']);
      setLibradorOptsAll(prev => [...prev, []]);
    }
  };

  const quitarCheque = (i: number) => {
    if (cheques.length > 1) {
      setCheques(prev => prev.filter((_, idx) => idx !== i));
      setLibradorBusqs(prev => prev.filter((_, idx) => idx !== i));
      setLibradorOptsAll(prev => prev.filter((_, idx) => idx !== i));
    }
  };

  // ── Cálculos ──────────────────────────────────────────────────────────

  // calcDiasFn cierra sobre `feriados` — lo pasamos a calcularLiquidacion
  const calcDiasFn = useCallback(
    (from: string, to: string) => calcDiasHabiles(from, to, feriados),
    [feriados],
  );

  const liquidacion   = calcularLiquidacion(cheques, fechaOperacion, calcDiasFn);
  const totalCheques  = liquidacion.reduce((s, l) => s + l.monto, 0);
  const totalIntereses= liquidacion.reduce((s, l) => s + l.interes, 0);
  const comisionNum   = parseFloat(comision.replace(/\./g, '').replace(',', '.')) || 0;
  const netoDesembolsar = totalCheques - totalIntereses - comisionNum;
  const nroCheques    = cheques.filter(c => parseFloat(c.monto) > 0).length;

  // ── Validación de vencimiento (límite legal 180 días en PY) ──────────
  const maxVencDate = (() => {
    const d = new Date(fechaOperacion + 'T00:00:00');
    d.setDate(d.getDate() + 180);
    return fechaLocal(d);  // fechaLocal evita desfase UTC
  })();

  const vencStatus = (venc: string): '' | 'ok' | 'pasada' | 'excede180' => {
    if (!venc) return '';
    if (venc < fechaOperacion) return 'pasada';
    if (venc > maxVencDate)    return 'excede180';
    return 'ok';
  };

  // Días hábiles desde fechaOperacion hasta vencimiento (excluye fines de semana y feriados)
  const calcDias = (venc: string): number => calcDiasHabiles(fechaOperacion, venc, feriados);

  // ── Tasa global + carga desde Producto Financiero ────────────────────
  const [tasaGlobal, setTasaGlobal] = useState('');

  useEffect(() => {
    // Pre-cargar tasa por defecto desde el Producto DESCUENTO_CHEQUE del Panel Global
    panelGlobalApi.getProductosActivos()
      .then((prods: any[]) => {
        const prod = prods.find((p: any) =>
          p.tipoOperacion === 'DESCUENTO_CHEQUE' && p.config?.tasaMensualDefault != null
        );
        if (prod) {
          const tasa = String(prod.config.tasaMensualDefault);
          setTasaGlobal(tasa);
          setCheques(prev => prev.map(c => c.tasaMensual ? c : { ...c, tasaMensual: tasa }));
        }
      })
      .catch(() => {});
  }, []);

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

        {/* datalist de bancos — referenciado por list="bancos-datalist" en cada fila */}
        <datalist id="bancos-datalist">
          {bancos.map((b: any) => (
            <option key={b.id} value={b.nombre} />
          ))}
        </datalist>

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
                <th className="text-center px-2 py-2 text-xs font-medium text-gray-500" title="Días hábiles (excluye sábados, domingos y feriados)">Días háb.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Monto (Gs.)</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Tasa %/mes</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {cheques.map((c, i) => {
                const vs = vencStatus(c.vencimiento);
                const vencInvalido = vs === 'pasada' || vs === 'excede180';
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="px-3 py-2 text-gray-400 text-xs pt-3">{i + 1}</td>

                    {/* Banco — datalist nativo: evita problemas de z-index/overflow
                        dentro de tabla overflow-x-auto. El browser renderiza la lista
                        fuera del DOM flow, sin conflictos de posicionamiento. */}
                    <td className="px-1 py-1">
                      <input
                        value={c.banco}
                        onChange={e => updateCheque(i, 'banco', e.target.value)}
                        list="bancos-datalist"
                        placeholder="Banco..."
                        autoComplete="off"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </td>

                    {/* Librador — búsqueda PF + PJ con debounce 300ms.
                        onBlur usa setTimeout(200) para que el click en el item
                        se registre antes de cerrar el dropdown. */}
                    <td className="px-1 py-1">
                      <div className="relative">
                        <input
                          value={libradorBusqs[i] ?? ''}
                          onChange={e => buscarLibrador(i, e.target.value)}
                          onBlur={() => {
                            setLibradorOptsAll(prev => prev.map((v, idx) => idx === i ? [] : v));
                          }}
                          placeholder="Buscar librador (nombre, CI o RUC)..."
                          autoComplete="off"
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {(libradorOptsAll[i] || []).length > 0 && (
                          <div className="absolute z-30 left-0 min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto">
                            {(libradorOptsAll[i] || []).map((o: ContactoOption) => (
                              <button
                                key={o.id}
                                onMouseDown={e => { e.preventDefault(); seleccionarLibrador(i, o); }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-0"
                              >
                                <span className={`inline-block text-xs px-1.5 py-0.5 rounded mr-2 font-semibold ${o.tipo === 'pf' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {o.tipo === 'pf' ? 'PF' : 'PJ'}
                                </span>
                                {o.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* RUC/CI Librador — se rellena al seleccionar, editable */}
                    <td className="px-1 py-1">
                      <input
                        value={c.rucLibrador}
                        onChange={e => updateCheque(i, 'rucLibrador', e.target.value)}
                        placeholder="RUC / CI"
                        className="w-28 border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded"
                      />
                    </td>

                    {/* N° Cheque */}
                    <td className="px-1 py-1">
                      <input value={c.nroCheque} onChange={e => updateCheque(i, 'nroCheque', e.target.value)}
                        placeholder="N° cheque"
                        className="w-28 border-0 bg-transparent px-2 py-1 text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                    </td>

                    {/* Vencimiento — con validación 180 días */}
                    <td className="px-1 py-1">
                      <input
                        type="date"
                        value={c.vencimiento}
                        onChange={e => updateCheque(i, 'vencimiento', e.target.value)}
                        min={fechaOperacion}
                        className={`w-36 px-2 py-1 text-sm rounded transition-colors ${
                          vencInvalido
                            ? 'border border-red-400 bg-red-50 text-red-700'
                            : 'border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300'
                        }`}
                      />
                      {vs === 'pasada' && (
                        <div className="text-xs text-red-500 px-1 mt-0.5 whitespace-nowrap">⚠ Fecha pasada</div>
                      )}
                      {vs === 'excede180' && (
                        <div className="text-xs text-red-500 px-1 mt-0.5 whitespace-nowrap">⚠ Supera 180 días (límite legal PY)</div>
                      )}
                    </td>

                    {/* Días — calculado desde fechaOperacion, independiente del monto */}
                    <td className="px-1 py-2 text-center align-middle">
                      {c.vencimiento ? (
                        <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                          vencInvalido
                            ? 'bg-red-100 text-red-700'
                            : calcDias(c.vencimiento) > 0
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-400'
                        }`}>
                          {calcDias(c.vencimiento) > 0 ? `${calcDias(c.vencimiento)}d` : '—'}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="px-1 py-1">
                      <input value={c.monto} onChange={e => updateCheque(i, 'monto', e.target.value)}
                        placeholder="0"
                        className="w-32 border-0 bg-transparent px-2 py-1 text-sm text-right font-mono focus:bg-white focus:border focus:border-blue-300 focus:rounded" />
                    </td>

                    {/* Tasa */}
                    <td className="px-1 py-1">
                      <input type="number" value={c.tasaMensual} onChange={e => updateCheque(i, 'tasaMensual', e.target.value)}
                        min="0" max="100" step="0.5" placeholder="0"
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center font-medium text-blue-700 focus:ring-2 focus:ring-blue-500" />
                    </td>

                    {/* Quitar */}
                    <td className="px-2 py-1 pt-3">
                      <button onClick={() => quitarCheque(i)} disabled={cheques.length === 1}
                        className="text-gray-300 hover:text-red-400 disabled:opacity-0 text-lg leading-none">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Advertencia general si algún cheque tiene fecha inválida */}
        {cheques.some(c => vencStatus(c.vencimiento) === 'excede180') && (
          <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <span>
              <strong>Límite legal de cheques en Paraguay: 180 días.</strong>{' '}
              Los cheques marcados en rojo superan este plazo y podrían no ser válidos al momento del cobro.
            </span>
          </div>
        )}
      </div>

      {/* ── Tabla de liquidación ── */}
      {cheques.some(c => c.vencimiento) && (
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
                  <th className="text-center px-3 py-2 text-xs font-medium text-gray-500" title="Días hábiles (excluye sábados, domingos y feriados)">Días háb.</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Monto Cheque</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-gray-500">Tasa %/mes</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 text-orange-600">Interés (Gs.)</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 text-green-600">Amortización (Gs.)</th>
                </tr>
              </thead>
              <tbody>
                {cheques.map((c, i) => {
                  if (!c.vencimiento) return null;
                  const l   = liquidacion[i];
                  const dias = calcDias(c.vencimiento);
                  const vs   = vencStatus(c.vencimiento);
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {new Date(c.vencimiento + 'T00:00:00').toLocaleDateString('es-PY')}
                        {(vs === 'pasada' || vs === 'excede180') && (
                          <span className="ml-1 text-red-500 text-xs">⚠</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          vs === 'pasada' || vs === 'excede180'
                            ? 'bg-red-100 text-red-700'
                            : dias <= 15 ? 'bg-red-100 text-red-700'
                            : dias <= 30 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {dias > 0 ? `${dias}d` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {l.monto > 0 ? formatGs(l.monto) : <span className="text-gray-300 text-xs">sin monto</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-blue-700 font-medium">{c.tasaMensual || '—'}%</td>
                      <td className="px-3 py-2 text-right font-mono text-orange-600">
                        {l.monto > 0 ? formatGs(l.interes) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">
                        {l.monto > 0 ? formatGs(l.amortizacion) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
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

      {/* ── Resumen + Acreditación ── */}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              6 · Datos para Acreditación de Fondos
            </h2>
            {clienteSel && cuentasDisponibles.length === 0 && (
              <span className="text-xs text-gray-400 italic">Sin cuentas registradas</span>
            )}
          </div>

          {/* Selector de cuenta si hay múltiples */}
          {cuentasDisponibles.length > 1 && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cuentas registradas del cliente ({cuentasDisponibles.length})
              </label>
              <select
                value={cuentaSelIdx}
                onChange={e => setCuentaSelIdx(Number(e.target.value))}
                className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-blue-50"
              >
                <option value={-1}>— Seleccionar cuenta —</option>
                {cuentasDisponibles.map((ct: any, idx: number) => (
                  <option key={ct.id} value={idx}>
                    {[ct.banco, ct.numeroCuenta || ct.alias, ct.titular].filter(Boolean).join(' · ')}
                    {ct.esPrincipal ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Badge cuenta pre-cargada (1 sola cuenta) */}
          {cuentasDisponibles.length === 1 && (
            <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center justify-between">
              <span>✓ Datos pre-cargados del perfil del cliente</span>
              <button
                onClick={() => { setBancoAcred(''); setCuentaAcred(''); setTitularAcred(''); setAliasAcred(''); setCuentasDisponibles([]); setCuentaSelIdx(-1); }}
                className="text-gray-400 hover:text-red-500 ml-2"
              >✕ Limpiar</button>
            </div>
          )}

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
