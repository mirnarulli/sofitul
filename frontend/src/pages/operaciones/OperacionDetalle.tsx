import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Printer, FileText } from 'lucide-react';
import { operacionesApi } from '../../services/operacionesApi';
import StatusBadge from '../../components/StatusBadge';
import { formatGs, formatDate } from '../../utils/formatters';

export default function OperacionDetalle() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [op,      setOp]      = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState<any[]>([]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nota,    setNota]    = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([operacionesApi.getById(id), operacionesApi.getEstados()])
      .then(([o, e]) => { setOp(o); setEstados(e); })
      .catch(() => navigate('/operaciones'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    setSaving(true);
    try {
      const updated = await operacionesApi.cambiarEstado(id!, { estado: nuevoEstado, nota });
      setOp(updated); setNuevoEstado(''); setNota('');
    } catch { } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!op)     return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/operaciones')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Volver a operaciones
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{op.nroOperacion}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{op.contactoNombre} — {op.contactoDoc}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/operaciones/${id}/solicitud`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileText size={14}/> Liquidación
          </Link>
          <Link to={`/operaciones/${id}/pagare`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Printer size={14}/> Pagaré
          </Link>
          <StatusBadge estado={op.estado} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Datos principales */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Datos de la operación</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400 text-xs">Tipo</p><p className="font-medium">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheque' : 'Préstamo de Consumo'}</p></div>
            <div><p className="text-gray-400 text-xs">Fecha operación</p><p className="font-medium">{formatDate(op.fechaOperacion)}</p></div>
            <div><p className="text-gray-400 text-xs">Monto total</p><p className="font-bold text-gray-800">{formatGs(op.montoTotal)}</p></div>
            <div><p className="text-gray-400 text-xs">Neto a desembolsar</p><p className="font-bold text-green-700">{formatGs(op.netoDesembolsar)}</p></div>
            <div><p className="text-gray-400 text-xs">Interés total</p><p className="font-medium text-red-600">{formatGs(op.interesTotal)}</p></div>
            <div><p className="text-gray-400 text-xs">Ganancia neta</p><p className="font-medium text-blue-700">{formatGs(op.gananciaNeta)}</p></div>
            <div><p className="text-gray-400 text-xs">Vencimiento</p><p className="font-medium">{formatDate(op.fechaVencimiento)}</p></div>
            <div><p className="text-gray-400 text-xs">Canal</p><p className="font-medium">{op.canal ?? '—'}</p></div>
          </div>
        </div>

        {/* Cambio de estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Cambiar estado</h2>
          <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3">
            <option value="">Seleccionar nuevo estado...</option>
            {estados.map((e: any) => <option key={e.codigo} value={e.codigo}>{e.nombre}</option>)}
          </select>
          <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Nota opcional..."
            rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none" />
          <button onClick={handleCambiarEstado} disabled={!nuevoEstado || saving}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Cambiar estado'}
          </button>
        </div>
      </div>

      {/* Cheques */}
      {op.cheques?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Cheques ({op.cheques.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>{['Banco','Librador','N° Cheque','Vencimiento','Monto','Interés','Capital Invertido','Estado'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {op.cheques.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2">{c.banco}</td>
                    <td className="px-3 py-2">{c.librador}</td>
                    <td className="px-3 py-2 font-mono">{c.nroCheque}</td>
                    <td className="px-3 py-2">{formatDate(c.fechaVencimiento)}</td>
                    <td className="px-3 py-2 font-medium">{formatGs(c.monto)}</td>
                    <td className="px-3 py-2 text-red-600">{formatGs(c.interes)}</td>
                    <td className="px-3 py-2 text-green-700">{formatGs(c.capitalInvertido)}</td>
                    <td className="px-3 py-2"><StatusBadge estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cuotas */}
      {op.cuotas?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Plan de pagos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>{['N°','Vencimiento','Capital','Interés','Total','Pagado','Saldo','Estado'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {op.cuotas.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-medium">{c.nroCuota}</td>
                    <td className="px-3 py-2">{formatDate(c.fechaVencimiento)}</td>
                    <td className="px-3 py-2">{formatGs(c.capital)}</td>
                    <td className="px-3 py-2 text-red-600">{formatGs(c.interes)}</td>
                    <td className="px-3 py-2 font-medium">{formatGs(c.total)}</td>
                    <td className="px-3 py-2 text-green-700">{formatGs(c.pagado)}</td>
                    <td className="px-3 py-2 font-medium">{formatGs(c.saldo)}</td>
                    <td className="px-3 py-2"><StatusBadge estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bitácora */}
      {op.bitacora?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Historial</h2>
          <div className="space-y-2">
            {[...op.bitacora].reverse().map((b: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-gray-400 shrink-0">{new Date(b.fecha).toLocaleString('es-PY')}</span>
                <span className="text-gray-600">
                  {b.tipo === 'PRORROGA' ? `Prórroga → ${b.nuevaFecha}` : `Estado: ${b.de} → ${b.a}`}
                  {b.nota && <span className="text-gray-400 ml-1">— {b.nota}</span>}
                  {b.usuario && <span className="text-gray-400 ml-1">({b.usuario})</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
