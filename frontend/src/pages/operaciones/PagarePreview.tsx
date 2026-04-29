import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { operacionesApi } from '../../services/operacionesApi';
import { contactosApi, documentosContactoApi } from '../../services/contactosApi';
import Pagare from './Pagare';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'https://sofitul.onetradesa.pro';

export default function PagarePreview() {
  const { id } = useParams<{ id: string }>();
  const [data,    setData]    = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [ciDocs,  setCiDocs]  = useState<{ frente?: any; dorso?: any }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    operacionesApi.getById(id).then(async op => {
      setData(op);
      try {
        const c = op.contactoTipo === 'pf'
          ? await contactosApi.getPersonaFisicaById(op.contactoId)
          : await contactosApi.getPersonaJuridicaById(op.contactoId);
        setCliente(c);

        // Cargar documentos de CI (due_diligence con tipoCodigo o tipoNombre que contenga cédula)
        const docs: any[] = await documentosContactoApi.getByContacto(op.contactoTipo, op.contactoId);
        const ciAll = docs.filter(d =>
          d.tipoCodigo?.includes('cedula') ||
          d.tipoNombre?.toLowerCase().includes('cédula') ||
          d.tipoNombre?.toLowerCase().includes('cedula') ||
          d.tipoNombre?.toLowerCase().includes('c.i.')
        );
        const frente = ciAll.find(d =>
          d.tipoCodigo === 'cedula_frente' ||
          d.tipoNombre?.toLowerCase().includes('frente') ||
          d.tipoNombre?.toLowerCase().includes('anverso')
        ) ?? ciAll[0];
        const dorso = ciAll.find(d =>
          d.tipoCodigo === 'cedula_dorso' ||
          d.tipoNombre?.toLowerCase().includes('dorso') ||
          d.tipoNombre?.toLowerCase().includes('atr') ||
          d.tipoNombre?.toLowerCase().includes('reverso')
        ) ?? (ciAll.length > 1 ? ciAll[1] : undefined);
        setCiDocs({ frente, dorso });
      } catch { /* ignorar */ }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Cargando pagaré...</div>;
  if (!data)   return <div className="text-center text-red-500 mt-12">Operación no encontrada</div>;

  const deudorNombre    = data.contactoNombre;
  const deudorDoc       = data.contactoDoc;
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
      ciFrente={ciDocs.frente}
      ciDorso={ciDocs.dorso}
      ciCliente={cliente}
      apiBase={API_BASE}
    />
  );
}
