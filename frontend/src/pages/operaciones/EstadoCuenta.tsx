import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { operacionesApi } from '../../services/operacionesApi';
import { transaccionesApi, cargosOperacionApi } from '../../services/financieroApi';
import { mediosPagoApi } from '../../services/contactosApi';
import { formatGs, formatDate } from '../../utils/formatters';

interface Cuota {
  nroCuota: number;
  fechaVencimiento: string;
  capitalCuota: number;
  interesCuota: number;
  moraCuota?: number;
  totalCuota: number;
  montoPagado?: number;
  saldo?: number;
  estado: string;
}

interface Transaccion {
  id: string;
  tipo: string;
  estado: string;
  fechaTransaccion: string;
  montoTotal: number;
  montoCapital: number;
  montoInteres: number;
  montoMora: number;
  montoGastosAdmin: number;
  nroRecibo?: string;
  medioPagoId?: string;
}

interface Cargo {
  id: string;
  descripcion: string;
  categoria: string;
  montoCalculado: number;
  estado: string;
  motivoExoneracion?: string;
}

interface MedioPago {
  id: string;
  nombre: string;
}

interface Operacion {
  nroOperacion: string;
  contactoNombre: string;
  contactoDoc: string;
  tipoOperacion: string;
  fechaOperacion: string;
  fechaVencimiento: string;
  montoTotal: number;
  netoDesembolsar: number;
  interesTotal: number;
  estado: string;
  cuotas?: Cuota[];
}

function estadoCuotaColor(estado: string): string {
  if (estado === 'PAGADA') return 'text-green-700 font-semibold';
  if (estado === 'MORA' || estado === 'VENCIDA') return 'text-red-600 font-semibold';
  return 'text-gray-500';
}

export default function EstadoCuenta() {
  const { id } = useParams<{ id: string }>();
  const [op, setOp]               = useState<Operacion | null>(null);
  const [transacciones, setTrans] = useState<Transaccion[]>([]);
  const [cargos, setCargos]       = useState<Cargo[]>([]);
  const [medios, setMedios]       = useState<MedioPago[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      operacionesApi.getById(id),
      transaccionesApi.getByOperacion(id),
      cargosOperacionApi.getByOperacion(id),
      mediosPagoApi.getActivos(),
    ])
      .then(([opData, txData, cargoData, mediosData]) => {
        setOp(opData);
        setTrans(txData);
        setCargos(cargoData);
        setMedios(mediosData);
        document.title = 'Estado de Cuenta - ' + (opData?.nroOperacion ?? '');
      })
      .catch(() => setError('No se pudo cargar la información de la operación.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans text-gray-500">
        Cargando estado de cuenta...
      </div>
    );
  }

  if (error || !op) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans text-red-600">
        {error ?? 'Operación no encontrada.'}
      </div>
    );
  }

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const cobrosAplicados = transacciones.filter(
    tx => tx.estado === 'APLICADO' && tx.tipo !== 'REVERSO' && tx.tipo === 'PAGO',
  );

  const totalCobrado = cobrosAplicados.reduce((acc, tx) => acc + Number(tx.montoTotal), 0);

  const cuotas: Cuota[] = op.cuotas ?? [];
  const saldoPendiente =
    cuotas.length > 0
      ? cuotas.reduce((acc, c) => acc + Number(c.saldo ?? 0), 0)
      : Math.max(0, Number(op.montoTotal) - totalCobrado);

  const cargosPendientes = cargos.filter(c => c.estado === 'PENDIENTE');
  const cargosPendientesTotal = cargosPendientes.reduce(
    (acc, c) => acc + Number(c.montoCalculado),
    0,
  );

  const tipoLabel =
    op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheque' : 'Préstamo de Consumo';

  const fechaEmision = new Date().toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getMedioPago = (medioPagoId?: string) =>
    medioPagoId ? (medios.find(m => m.id === medioPagoId)?.nombre ?? '—') : '—';

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 text-sm print:text-xs">
      {/* Botón de impresión — oculto en print */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg shadow hover:bg-blue-700"
        >
          Imprimir
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-6 print:max-w-none">
        {/* ── Encabezado ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-4">
          <div>
            <p className="text-2xl font-bold tracking-wide text-gray-900">SOFITUL</p>
            <p className="text-xs text-gray-500 mt-0.5">sofitul.onetradesa.pro</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-gray-800">Estado de Cuenta del Deudor</p>
            <p className="text-xs text-gray-500 mt-0.5">Fecha de emisión: {fechaEmision}</p>
          </div>
        </div>

        {/* ── Datos del cliente y operación ───────────────────────────────────── */}
        <div className="border border-gray-300 rounded p-4 mb-4 grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Cliente:</span>
            <span className="font-semibold">{op.contactoNombre}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">CI / RUC:</span>
            <span className="font-semibold">{op.contactoDoc}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Operación:</span>
            <span className="font-semibold">{op.nroOperacion}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Tipo:</span>
            <span>{tipoLabel}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Fecha operación:</span>
            <span>{formatDate(op.fechaOperacion)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Vencimiento:</span>
            <span>{formatDate(op.fechaVencimiento)}</span>
          </div>
        </div>

        {/* ── Resumen ─────────────────────────────────────────────────────────── */}
        <div className="border border-gray-300 rounded p-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Resumen</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-500 mb-1">Monto desembolsado</p>
              <p className="font-semibold">{formatGs(op.netoDesembolsar)}</p>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-500 mb-1">Total cobrado</p>
              <p className="font-semibold">{formatGs(totalCobrado)}</p>
            </div>
            <div className={`border rounded p-3 ${saldoPendiente > 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Saldo pendiente</p>
              {saldoPendiente > 0 ? (
                <p className="font-bold text-red-700">{formatGs(saldoPendiente)}</p>
              ) : (
                <p className="font-bold text-green-700">SIN DEUDA</p>
              )}
            </div>
          </div>
          {cargosPendientesTotal > 0 && (
            <p className="text-xs text-orange-600 mt-2 text-right">
              + {formatGs(cargosPendientesTotal)} en cargos pendientes
            </p>
          )}
        </div>

        {/* ── Plan de pagos ───────────────────────────────────────────────────── */}
        {cuotas.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Plan de Pagos</p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left">N°</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Vencimiento</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Capital</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Interés</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Mora</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Total</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Pagado</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Saldo</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map(c => (
                  <tr key={c.nroCuota} className="hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="border border-gray-200 px-2 py-1 text-center">{c.nroCuota}</td>
                    <td className="border border-gray-200 px-2 py-1">{formatDate(c.fechaVencimiento)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(c.capitalCuota)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(c.interesCuota)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(c.moraCuota ?? 0)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right font-medium">{formatGs(c.totalCuota)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(c.montoPagado ?? 0)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(c.saldo ?? 0)}</td>
                    <td className={`border border-gray-200 px-2 py-1 text-center ${estadoCuotaColor(c.estado)}`}>
                      {c.estado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Cobros registrados ──────────────────────────────────────────────── */}
        {cobrosAplicados.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Cobros Registrados</p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Fecha</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left">N° Recibo</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Medio</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Capital</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Interés</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Mora</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cobrosAplicados.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="border border-gray-200 px-2 py-1">{formatDate(tx.fechaTransaccion)}</td>
                    <td className="border border-gray-200 px-2 py-1">{tx.nroRecibo ?? '—'}</td>
                    <td className="border border-gray-200 px-2 py-1">{getMedioPago(tx.medioPagoId)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(tx.montoCapital)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(tx.montoInteres)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(tx.montoMora)}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right font-medium">{formatGs(tx.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right text-xs">Total cobrado</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">
                    {formatGs(cobrosAplicados.reduce((a, tx) => a + Number(tx.montoCapital), 0))}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">
                    {formatGs(cobrosAplicados.reduce((a, tx) => a + Number(tx.montoInteres), 0))}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">
                    {formatGs(cobrosAplicados.reduce((a, tx) => a + Number(tx.montoMora), 0))}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{formatGs(totalCobrado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Cargos pendientes ───────────────────────────────────────────────── */}
        {cargosPendientes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Cargos Pendientes</p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Descripción</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left">Categoría</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {cargosPendientes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="border border-gray-200 px-2 py-1">{c.descripcion}</td>
                    <td className="border border-gray-200 px-2 py-1">{c.categoria}</td>
                    <td className="border border-gray-200 px-2 py-1 text-right">{formatGs(c.montoCalculado)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="border border-gray-300 px-2 py-1.5 text-right text-xs">Total cargos pendientes</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right">{formatGs(cargosPendientesTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Nota informativa ────────────────────────────────────────────────── */}
        <p className="text-xs text-gray-400 italic mb-8">
          Nota: Este estado de cuenta es informativo y no reemplaza documentación legal.
        </p>

        {/* ── Firmas ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-12 mt-10">
          <div className="text-center">
            <div className="border-t border-gray-800 pt-2">
              <p className="text-xs font-medium">Firma del Deudor</p>
            </div>
            <div className="mt-6 border-t border-gray-800 pt-2">
              <p className="text-xs text-gray-500">Aclaración</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 pt-2">
              <p className="text-xs font-medium">Representante de la Empresa</p>
            </div>
            <div className="mt-6 border-t border-gray-800 pt-2">
              <p className="text-xs text-gray-500">Sello</p>
            </div>
          </div>
        </div>

        {/* ── Pie de página ───────────────────────────────────────────────────── */}
        <div className="mt-8 pt-3 border-t border-gray-200 text-center text-xs text-gray-400">
          Emitido desde SOFITUL — sofitul.onetradesa.pro
        </div>
      </div>
    </div>
  );
}
