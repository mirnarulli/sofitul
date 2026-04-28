import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, Banknote } from 'lucide-react';
import { tesoreriaApi } from '../../services/operacionesApi';
import { panelGlobalApi } from '../../services/contactosApi';
import StatusBadge from '../../components/StatusBadge';
import { formatGs, formatDate } from '../../utils/formatters';

function FilaDesembolso({ op, cajas, onDesembolsado }: { op: any; cajas: any[]; onDesembolsado: (id: string) => void }) {
  const [cajaId, setCajaId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDesembolsar = async () => {
    if (!cajaId) return;
    setSaving(true);
    try {
      await tesoreriaApi.registrarDesembolso(op.id, { cajaId });
      onDesembolsado(op.id);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al desembolsar.');
    } finally { setSaving(false); }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-xs">{op.nroOperacion}</td>
      <td className="px-4 py-3 font-medium">{op.contactoNombre}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Cheque' : 'Préstamo'}</td>
      <td className="px-4 py-3 font-bold text-green-700">{formatGs(op.netoDesembolsar)}</td>
      <td className="px-4 py-3 text-xs">{formatDate(op.fechaOperacion)}</td>
      <td className="px-4 py-3"><StatusBadge estado={op.estado} /></td>
      <td className="px-4 py-3">
        <select value={cajaId} onChange={e => setCajaId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
          <option value="">Seleccionar...</option>
          {cajas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleDesembolsar} disabled={!cajaId || saving}
          className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40">
          <Check size={12} /> {saving ? '...' : 'Desembolsar'}
        </button>
      </td>
    </tr>
  );
}

export default function Tesoreria() {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [alertasPagare, setAlertasPagare] = useState<any[]>([]);
  const [cajas, setCajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pendientes' | 'pagare' | 'cajas'>('pendientes');

  useEffect(() => {
    Promise.all([
      tesoreriaApi.getPendientesDesembolso(),
      tesoreriaApi.getAlertasPagare(),
      panelGlobalApi.getCajas(),
    ])
      .then(([p, a, c]) => { setPendientes(p); setAlertasPagare(a); setCajas(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tesorería</h1>
        <p className="text-sm text-gray-500">Desembolsos y control de cajas</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Desembolsos pendientes</p>
          <p className="text-2xl font-bold text-amber-700">{pendientes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Pagarés sin firmar</p>
          <p className="text-2xl font-bold text-red-700">{alertasPagare.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Cajas activas</p>
          <p className="text-2xl font-bold text-green-700">{cajas.length}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pendientes', label: `Pendientes (${pendientes.length})` },
          { key: 'pagare', label: `Pagarés (${alertasPagare.length})` },
          { key: 'cajas', label: 'Cajas' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {tab === 'pendientes' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {pendientes.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No hay desembolsos pendientes.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['N° Op.','Cliente','Tipo','Neto a Desembolsar','Fecha Op.','Estado','Caja','Acción'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pendientes.map(op => (
                        <FilaDesembolso key={op.id} op={op} cajas={cajas}
                          onDesembolsado={id => setPendientes(p => p.filter(x => x.id !== id))} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'pagare' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {alertasPagare.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Check size={32} className="text-green-500" />
                  <p>Todos los pagarés han sido recibidos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['N° Op.','Cliente','Neto','Fecha desembolso','Estado',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alertasPagare.map((op: any) => (
                        <tr key={op.id} className="hover:bg-gray-50 bg-red-50/30">
                          <td className="px-4 py-3 font-mono text-xs">{op.nroOperacion}</td>
                          <td className="px-4 py-3 font-medium">{op.contactoNombre}</td>
                          <td className="px-4 py-3">{formatGs(op.netoDesembolsar)}</td>
                          <td className="px-4 py-3 text-xs">{formatDate(op.fechaDesembolso)}</td>
                          <td className="px-4 py-3"><StatusBadge estado={op.estado} /></td>
                          <td className="px-4 py-3">
                            <Link to={`/operaciones/${op.id}`} className="text-red-600 hover:underline text-xs font-medium flex items-center gap-1">
                              <AlertTriangle size={12} /> Gestionar
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'cajas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cajas.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Banknote size={18} className="text-blue-600" />
                      <p className="font-semibold text-gray-800">{c.nombre}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatGs(c.saldo)}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.moneda ?? 'PYG'} · {c.banco ?? 'Efectivo'}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
