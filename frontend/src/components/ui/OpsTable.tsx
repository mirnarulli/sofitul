/**
 * OpsTable — tabla de operaciones de un contacto (PF o PJ).
 * Extraída de ContactoPFDetalle y ContactoPJDetalle donde era idéntica.
 */
import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { formatGs, formatDate, diasHasta } from '../../utils/formatters';

interface Props {
  ops:      any[];
  showDias?: boolean;
}

export function OpsTable({ ops, showDias }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{['N° Op.', 'Tipo', 'Monto Total', 'Vencimiento', showDias ? 'Días' : '', 'Estado', ''].map((h, i) => (
            <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ops.map((op: any) => {
            const d = op.fechaVencimiento ? diasHasta(op.fechaVencimiento) : null;
            return (
              <tr key={op.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{op.nroOperacion}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{op.tipoOperacion === 'DESCUENTO_CHEQUE' ? 'Dto. Cheque' : 'Préstamo'}</td>
                <td className="px-3 py-2">{formatGs(op.montoTotal)}</td>
                <td className="px-3 py-2 text-xs">{formatDate(op.fechaVencimiento)}</td>
                {showDias && (
                  <td className="px-3 py-2">
                    {d !== null && (
                      <span className={`text-xs font-medium ${d <= 7 ? 'text-red-600' : d <= 15 ? 'text-orange-500' : 'text-amber-600'}`}>
                        {d}d
                      </span>
                    )}
                  </td>
                )}
                <td className="px-3 py-2"><StatusBadge estado={op.estado} /></td>
                <td className="px-3 py-2">
                  <Link to={`/operaciones/${op.id}`} className="text-blue-600 hover:underline text-xs">Ver</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
