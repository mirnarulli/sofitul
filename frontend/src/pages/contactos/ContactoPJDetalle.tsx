import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { contactosApi } from '../../services/contactosApi';
import { formatDate, formatGs } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

export default function ContactoPJDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pj, setPj] = useState<any>(null);
  const [operaciones, setOperaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      contactosApi.getEmpresaById(id),
      contactosApi.getOperacionesByContacto('pj', id),
    ])
      .then(([p, ops]) => { setPj(p); setOperaciones(ops); })
      .catch(() => navigate('/contactos'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!pj) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/contactos')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pj.razonSocial}</h1>
          <p className="text-gray-500 text-sm mt-0.5">RUC {pj.ruc}</p>
        </div>
        {pj.esPep && <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">PEP</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Datos de la empresa</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-gray-400">Nombre fantasía</dt><dd>{pj.nombreFantasia ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">Actividad</dt><dd>{pj.actividadPrincipal ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">País</dt><dd>{pj.paisConstitucion ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">Constitución</dt><dd>{formatDate(pj.fechaConstitucion) ?? '—'}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-gray-400">Dirección</dt><dd>{[pj.direccion, pj.ciudad].filter(Boolean).join(', ') || '—'}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Representante Legal</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2"><dt className="text-xs text-gray-400">Nombre</dt><dd>{pj.repLegalNombre ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">Documento</dt><dd>{pj.repLegalDoc ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">Cargo</dt><dd>{pj.repLegalCargo ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">Teléfono</dt><dd>{pj.telefono ?? '—'}</dd></div>
            <div><dt className="text-xs text-gray-400">Email</dt><dd>{pj.email ?? '—'}</dd></div>
          </dl>
        </div>
      </div>

      {operaciones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Operaciones ({operaciones.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['N° Op.','Tipo','Monto Total','Vencimiento','Estado',''].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {operaciones.map((op: any) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{op.nroOperacion}</td>
                    <td className="px-4 py-2 text-xs">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Cheque' : 'Préstamo'}</td>
                    <td className="px-4 py-2">{formatGs(op.montoTotal)}</td>
                    <td className="px-4 py-2 text-xs">{formatDate(op.fechaVencimiento)}</td>
                    <td className="px-4 py-2"><StatusBadge estado={op.estado} /></td>
                    <td className="px-4 py-2"><Link to={`/operaciones/${op.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
