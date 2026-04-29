import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { operacionesApi } from '../../services/operacionesApi';
import { contactosApi } from '../../services/contactosApi';
import Pagare from './Pagare';

export default function PagarePreview() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    operacionesApi.getById(id).then(async op => {
      setData(op);
      // Cargar datos del contacto
      try {
        const c = op.contactoTipo === 'pf'
          ? await contactosApi.getPersonaFisicaById(op.contactoId)
          : await contactosApi.getPersonaJuridicaById(op.contactoId);
        setCliente(c);
      } catch { /* ignorar */ }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando pagaré...</div>;
  if (!data)   return <div className="text-center text-red-500 mt-12">Operación no encontrada</div>;

  const deudorNombre = data.contactoNombre;
  const deudorDoc    = data.contactoDoc;
  const deudorDomicilio = cliente?.domicilio || '';

  return (
    <Pagare
      nroOperacion={data.nroOperacion}
      fechaEmision={data.fechaOperacion}
      fechaVencimiento={data.fechaVencimiento || data.fechaOperacion}
      monto={Number(data.montoTotal)}
      deudorNombre={deudorNombre}
      deudorDoc={deudorDoc}
      deudorDomicilio={deudorDomicilio}
    />
  );
}
