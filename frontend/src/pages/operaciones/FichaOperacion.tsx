import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { operacionesApi } from '../../services/operacionesApi';
import { contactosApi } from '../../services/contactosApi';
import { formatGs, formatDate } from '../../utils/formatters';
import { DocHeader, DocFooter } from '../../components/DocHeader';
import DocBarcode from '../../components/DocBarcode';

// ── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '' || n === 0) return '-';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num) || num === 0) return '-';
  return num.toLocaleString('es-PY', { maximumFractionDigits: 0 });
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FichaOperacion() {
  const { id } = useParams<{ id: string }>();
  const [op,      setOp]      = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    operacionesApi.getById(id).then(async o => {
      setOp(o);
      try {
        const c = o.contactoTipo === 'pf'
          ? await contactosApi.getPersonaFisicaById(o.contactoId)
          : await contactosApi.getPersonaJuridicaById(o.contactoId);
        setCliente(c);
      } catch {}
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && op) setTimeout(() => window.print(), 500);
  }, [loading, op]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando liquidación...</div>;
  if (!op)    return <div className="text-center text-red-500 mt-12">Operación no encontrada</div>;

  const cheques: any[]  = op.cheques ?? [];
  const tipoLabel       = op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheques' : 'Préstamo de Consumo';
  const monto           = Number(op.montoTotal   ?? 0);
  const interesTotal    = Number(op.interesTotal  ?? 0);
  const comision        = Number(op.comisionMonto ?? 0);
  const neto            = Number(op.netoDesembolsar ?? 0);

  // Client name
  const clienteNombre = op.contactoTipo === 'pf'
    ? [cliente?.primerNombre, cliente?.segundoNombre, cliente?.primerApellido, cliente?.segundoApellido].filter(Boolean).join(' ') || op.contactoNombre
    : (cliente?.razonSocial ?? op.contactoNombre);

  // Build rows — show at least 5 empty rows when cheques are fewer
  const MIN_ROWS = Math.max(5, cheques.length);
  const rows = Array.from({ length: MIN_ROWS }, (_, i) => cheques[i] ?? null);

  // Totals from cheques
  const totalMonto = cheques.reduce((s, c) => s + Number(c.monto ?? 0), 0) || monto;
  const totalAmort = cheques.reduce((s, c) => s + Number(c.capitalInvertido ?? 0), 0);
  const totalInt   = cheques.reduce((s, c) => s + Number(c.interes ?? 0), 0) || interesTotal;
  const totalDias  = cheques.length > 0 ? Math.max(...cheques.map(c => Number(c.dias ?? 0))) : (op.diasPlazo ?? 0);

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#liquidacion-root) { display: none !important; }
          #liquidacion-root { display: block !important; }
          @page { size: A4 portrait; margin: 18mm 20mm; }
        }
        @media screen {
          #liquidacion-root {
            max-width: 720px;
            margin: 32px auto;
            padding: 32px 40px;
            font-family: Calibri, Arial, sans-serif;
            font-size: 13px;
            background: white;
            box-shadow: 0 2px 16px rgba(0,0,0,.12);
            border-radius: 4px;
          }
        }
      `}</style>

      <div id="liquidacion-root" style={{ background: 'white', color: '#111', fontFamily: 'Calibri, Arial, sans-serif', fontSize: '13px' }}>

        {/* ── Header con logo ── */}
        <DocHeader />
        <hr style={{ border: 'none', borderTop: '2px solid #1e3a5f', marginBottom: '16px' }} />

        {/* ── Título + Código de barras ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', margin: 0, alignSelf: 'center' }}>
            LIQUIDACION DE PRESTAMO
          </h1>
          <div style={{ textAlign: 'right' }}>
            <DocBarcode value={op.nroOperacion} height={38} width={1.4} fontSize={9} />
          </div>
        </div>

        {/* ── Info cliente ── */}
        <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
          <tbody>
            <InfoRow label="Cliente" value={clienteNombre} />
            <InfoRow label="Tipo de operación" value={tipoLabel} />
            <InfoRow label="Fecha de la Operación" value={formatDate(op.fechaOperacion)} />
          </tbody>
        </table>

        {/* ── Tabla de cheques ── */}
        {op.tipoOperacion === 'DESCUENTO_CHEQUE' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#808080', color: 'white' }}>
                {['N°','IMPORTE CHEQUE','AMORTIZACION','INTERES','VENCIMIENTO','DIAS'].map(h => (
                  <th key={h} style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: h === 'N°' ? 'center' : 'right', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((ch, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={tdStyle('center')}>{i + 1}</td>
                  <td style={tdStyle('right')}>{ch ? fmt(ch.monto) : '-'}</td>
                  <td style={tdStyle('right')}>{ch ? fmt(ch.capitalInvertido) : '-'}</td>
                  <td style={tdStyle('right')}>{ch ? fmt(ch.interes) : '-'}</td>
                  <td style={tdStyle('right')}>{ch ? formatDate(ch.fechaVencimiento) : '-'}</td>
                  <td style={tdStyle('right')}>{ch ? (ch.dias ?? '-') : ''}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                <td style={{ ...tdStyle('left'), fontWeight: 'bold' }}>Total</td>
                <td style={tdStyle('right')}>{fmt(totalMonto)}</td>
                <td style={tdStyle('right')}>{fmt(totalAmort || monto - interesTotal)}</td>
                <td style={tdStyle('right')}>{fmt(totalInt)}</td>
                <td style={tdStyle('right')}></td>
                <td style={tdStyle('right')}>{totalDias || ''}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* ── Cuadro resumen ── */}
        <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '280px' }}>
          <tbody>
            <SummaryRow label="Monto de la Operación" value={fmt(monto)} />
            <SummaryRow label="Interés" value={fmt(interesTotal)} />
            {comision > 0 && <SummaryRow label="Comisión Desembolso" value={fmt(comision)} />}
            <SummaryRow label="Neto a Desembolsar" value={fmt(neto)} bold />
          </tbody>
        </table>

        {/* ── Pie de página ── */}
        <DocFooter nroDoc={op.nroOperacion} label="Liquidación N°" />

        {/* ── Botón imprimir (solo pantalla) ── */}
        <div className="print:hidden" style={{ marginTop: '32px', textAlign: 'center' }}>
          <button onClick={() => window.print()}
            style={{ padding: '8px 24px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
            🖨️ Imprimir Liquidación
          </button>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function tdStyle(align: 'left' | 'right' | 'center'): React.CSSProperties {
  return { border: '1px solid #ccc', padding: '5px 10px', textAlign: align };
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr>
      <td style={{ color: '#1e3a8a', fontWeight: '500', width: '200px', paddingBottom: '4px', verticalAlign: 'top' }}>{label}</td>
      <td style={{ paddingBottom: '4px' }}>{value ?? '—'}</td>
    </tr>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td style={{ border: '1px solid #ccc', padding: '5px 12px', background: '#f5f5f5', fontWeight: bold ? 'bold' : 'normal', color: bold ? '#111' : '#333' }}>
        {label}
      </td>
      <td style={{ border: '1px solid #ccc', padding: '5px 12px', textAlign: 'right', fontWeight: bold ? 'bold' : 'normal', minWidth: '130px' }}>
        {value}
      </td>
    </tr>
  );
}
