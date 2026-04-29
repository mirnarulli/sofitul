import { useEffect, useRef } from 'react';
import { formatGs } from '../../utils/formatters';
import { DocHeader, DocFooter } from '../../components/DocHeader';
import DocBarcode from '../../components/DocBarcode';

// ── Conversión número → letras (Guaraníes) ─────────────────────────────────

const UNIDADES  = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
                    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS',
                    'DIECISIETE','DIECIOCHO','DIECINUEVE'];
const DECENAS   = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
const CENTENAS  = ['','CIEN','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
                    'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

function grupo(n: number): string {
  if (n === 0) return '';
  if (n < 20)  return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
  }
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100), r = n % 100;
  return r === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${grupo(r)}`;
}

export function numeroALetras(n: number): string {
  if (n === 0) return 'CERO';
  const partes: string[] = [];
  const billones  = Math.floor(n / 1_000_000_000);
  const millones  = Math.floor((n % 1_000_000_000) / 1_000_000);
  const miles     = Math.floor((n % 1_000_000) / 1_000);
  const resto     = n % 1_000;

  if (billones)  partes.push(billones === 1 ? 'MIL MILLONES' : `${grupo(billones)} MIL MILLONES`);
  if (millones)  partes.push(millones === 1 ? 'UN MILLÓN'    : `${grupo(millones)} MILLONES`);
  if (miles)     partes.push(miles    === 1 ? 'MIL'          : `${grupo(miles)} MIL`);
  if (resto)     partes.push(grupo(resto));

  return partes.join(' ');
}

// ── Formato de fecha larga ──────────────────────────────────────────────────

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fechaLarga(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return { dia: d.getDate(), mes: MESES[d.getMonth()], anio: d.getFullYear() };
}

function fechaCorta(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ── Props ───────────────────────────────────────────────────────────────────

export interface PagareProps {
  nroOperacion:       string;
  nroPagare?:         string;
  fechaEmision:       string;   // ISO YYYY-MM-DD
  fechaVencimiento:   string;   // ISO YYYY-MM-DD
  monto:              number;   // en Guaraníes
  // Deudor principal
  deudorNombre:       string;
  deudorDoc:          string;
  deudorDomicilio?:   string;
  // Firmante (rep. legal si es PJ, o mismo deudor si es PF)
  firmanteNombre?:    string;
  firmanteDoc?:       string;
  firmanteDomicilio?: string;
  // Firmantes adicionales (cónyuge, avalistas)
  firmante3Nombre?:   string;
  firmante3Doc?:      string;
  firmante3Domicilio?:string;
  firmante4Nombre?:   string;
  firmante4Doc?:      string;
  firmante4Domicilio?:string;
  // Para modo impresión directa
  autoPrint?: boolean;
}

// ── Componente ──────────────────────────────────────────────────────────────

export default function Pagare({
  nroOperacion, nroPagare, fechaEmision, fechaVencimiento, monto,
  deudorNombre, deudorDoc, deudorDomicilio,
  firmanteNombre, firmanteDoc, firmanteDomicilio,
  firmante3Nombre, firmante3Doc, firmante3Domicilio,
  firmante4Nombre, firmante4Doc, firmante4Domicilio,
  autoPrint = false,
}: PagareProps) {

  const ref = useRef<HTMLDivElement>(null);
  const { dia, mes, anio } = fechaLarga(fechaEmision);
  const montoLetras = numeroALetras(monto);

  useEffect(() => {
    if (autoPrint) setTimeout(() => window.print(), 500);
  }, [autoPrint]);

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body > *:not(#pagare-root) { display: none !important; }
          #pagare-root { display: block !important; }
          @page { size: A4; margin: 20mm 18mm; }
        }
      `}</style>

      <div id="pagare-root" ref={ref}
        className="bg-white text-gray-900 font-serif text-[13px] leading-relaxed max-w-[210mm] mx-auto p-8 print:p-0 print:shadow-none shadow-lg">

        {/* ── Header con logo ── */}
        <DocHeader centered />
        <hr className="border-t-2 border-gray-900 mb-4" />

        {/* ── Título + Barcode ── */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold tracking-widest uppercase inline-block px-8">
              PAGARÉ A LA ORDEN
            </h1>
          </div>
          <div className="shrink-0">
            <DocBarcode value={nroPagare || nroOperacion} height={38} width={1.4} fontSize={9} />
          </div>
        </div>

        {/* ── Datos de cabecera ── */}
        <div className="grid grid-cols-2 gap-x-8 mb-4 text-sm">
          <div className="flex gap-2 items-center">
            <span className="font-semibold whitespace-nowrap">Préstamo N°:</span>
            <span className="flex-1 border-b border-gray-400 min-w-[100px] text-center font-mono">
              {nroPagare || nroOperacion}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold whitespace-nowrap">Fecha de Emisión: Asunción,</span>
            <span className="flex-1 border-b border-gray-400 min-w-[80px] text-center">
              {fechaCorta(fechaEmision)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 items-center mb-1 text-sm">
          <span className="font-semibold whitespace-nowrap">Gs. en Números:</span>
          <span className="flex-1 border-b border-gray-400 font-mono text-center">
            {formatGs(monto)}
          </span>
        </div>

        <div className="flex gap-2 items-center mb-6 text-sm">
          <span className="font-semibold whitespace-nowrap">Gs. en Letras:</span>
          <span className="flex-1 border-b border-gray-400 text-center uppercase font-medium">
            {montoLetras} GUARANÍES
          </span>
        </div>

        {/* ── Cuerpo legal ── */}
        <div className="space-y-3 text-justify text-[12.5px]">

          <p>
            Debo y pagaré en fecha de{' '}
            <span className="font-semibold underline decoration-dotted">{fechaCorta(fechaVencimiento)}</span>,
            incondicional, solidaria e indivisiblemente, libre de protesto, a la orden de{' '}
            <span className="font-bold">ONE TRADE S.A. RUC Nro. 80085524-8</span>,
            en su domicilio, donde se emite este pagaré, o en su defecto, donde el Acreedor indique
            por escrito y a través de medio fehaciente, la suma de{' '}
            <span className="font-semibold">Gs. {formatGs(monto)} (guaraníes {montoLetras})</span>,
            por igual valor recibido a nuestra/mi entera satisfacción.
          </p>

          <p>
            La mora de este documento se producirá por la mera presentación al cobro, sin necesidad de protesto,
            ni de ningún requerimiento judicial o extrajudicial por parte del acreedor.
          </p>

          <p>
            En caso de incumplimiento serán de nuestro cargo todos los gastos judiciales y/o extrajudiciales
            que originase la cobranza de este pagaré, incluso los que derivaren de diligencias preparatorias.
          </p>

          <p>
            Los pagos bajo el presente pagaré se harán en su totalidad, sin ninguna deducción ni retención que,
            de corresponder en virtud de cualquier disposición legal, serán de cuenta, cargo y responsabilidad nuestra.
          </p>

          <p>
            Se establece una tasa de interés moratorio en caso de que este pagaré no sea cancelado al momento
            de su presentación, más un interés punitorio equivalente al{' '}
            <span className="font-semibold">30% (treinta por ciento)</span> de la tasa aplicable en concepto
            de interés moratorio.
          </p>

          <p>
            Por el presente instrumento, con el alcance previsto en la{' '}
            <span className="font-semibold">Ley 6.534/20</span> "De Protección de Datos Personales Crediticios",
            sus modificaciones y normas complementarias, los abajo firmantes, en forma expresa e irrevocable,
            otorgando mandato en los términos del art. 917 inc. a) del Código Civil Paraguayo, autorizamos
            expresamente al acreedor para que en caso de un atraso en el pago de nuestras obligaciones,
            incluyan nuestros datos personales en el Registro de Morosos de cualquier empresa habilitada.
            Una vez cancelada la deuda en capital, gastos e intereses, se procederá a la eliminación de dicho registro.
          </p>

          <p>
            Todas las partes intervinientes en este pagaré constituyen domicilios especiales en los sitios
            indicados al pie, y para cualquier controversia relacionada con éste se someten a la jurisdicción
            y competencia de los Juzgados y Tribunales de la ciudad de{' '}
            <span className="font-semibold">Asunción, Paraguay</span>.
          </p>
        </div>

        {/* ── Firmas ── */}
        <div className="mt-8">
          <p className="font-bold text-center mb-6 uppercase tracking-wide border-t border-gray-300 pt-3">
            FIRMAS DE LOS INTERVINIENTES
          </p>

          {/* Bloque 1 */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <FirmaBloque
              titulo="Deudor"
              nombre={deudorNombre}
              doc={deudorDoc}
              domicilio={deudorDomicilio}
            />
            <FirmaBloque
              titulo={firmanteNombre ? 'Firmante / Rep. Legal' : 'Codeudor / Avalista'}
              nombre={firmanteNombre}
              doc={firmanteDoc}
              domicilio={firmanteDomicilio}
            />
          </div>

          {/* Bloque 2 (opcional) */}
          {(firmante3Nombre || firmante4Nombre) && (
            <div className="grid grid-cols-2 gap-8 mb-8">
              <FirmaBloque titulo="Firmante 3" nombre={firmante3Nombre} doc={firmante3Doc} domicilio={firmante3Domicilio} />
              <FirmaBloque titulo="Firmante 4" nombre={firmante4Nombre} doc={firmante4Doc} domicilio={firmante4Domicilio} />
            </div>
          )}
        </div>

        {/* ── Pie de fecha ── */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-center">
          Lugar y Fecha: Asunción, a los{' '}
          <span className="font-semibold underline decoration-dotted px-2">{dia}</span>{' '}
          días del mes de{' '}
          <span className="font-semibold underline decoration-dotted px-2 capitalize">{mes}</span>{' '}
          del año{' '}
          <span className="font-semibold underline decoration-dotted px-2">{anio}</span>.
        </div>

        {/* ── Pie de página ── */}
        <DocFooter nroDoc={nroPagare || nroOperacion} label="Pagaré N°" />

        {/* Botón imprimir (solo en pantalla) */}
        <div className="mt-6 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
          >
            🖨️ Imprimir Pagaré
          </button>
        </div>
      </div>
    </>
  );
}

// ── Bloque de firma ──────────────────────────────────────────────────────────

function FirmaBloque({ titulo, nombre, doc, domicilio }: {
  titulo: string; nombre?: string; doc?: string; domicilio?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="h-16 border-b-2 border-gray-700 flex items-end justify-center pb-1">
        <span className="text-xs text-gray-400 italic">{titulo}</span>
      </div>
      <div className="flex gap-2 text-xs">
        <span className="font-semibold whitespace-nowrap">Nombre:</span>
        <span className="flex-1 border-b border-gray-400 min-h-[16px] font-medium uppercase">
          {nombre || ''}
        </span>
      </div>
      <div className="flex gap-2 text-xs">
        <span className="font-semibold whitespace-nowrap">CI - RUC N°:</span>
        <span className="flex-1 border-b border-gray-400 min-h-[16px] font-mono">
          {doc || ''}
        </span>
      </div>
      <div className="flex gap-2 text-xs">
        <span className="font-semibold whitespace-nowrap">Domicilio:</span>
        <span className="flex-1 border-b border-gray-400 min-h-[16px]">
          {domicilio || ''}
        </span>
      </div>
    </div>
  );
}
