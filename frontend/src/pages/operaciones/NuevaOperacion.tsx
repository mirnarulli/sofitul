import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, UserCheck, X } from 'lucide-react';
import { contactosApi, panelGlobalApi } from '../../services/contactosApi';
import { operacionesApi } from '../../services/operacionesApi';
import { formatGs, calcularInteres, calcularDias } from '../../utils/formatters';

interface ChequeRow {
  banco: string; librador: string; rucLibrador: string; nroCheque: string;
  fechaVencimiento: string; monto: string; tasaMensual: string;
}
interface FirmanteRow { id: string; nombre: string; documento: string; tipo: 'pf'; }

const CHEQUE_VACIO: ChequeRow = { banco: '', librador: '', rucLibrador: '', nroCheque: '', fechaVencimiento: '', monto: '', tasaMensual: '' };

export default function NuevaOperacion() {
  const navigate = useNavigate();
  const [step, setStep]     = useState<'buscar' | 'contacto' | 'operacion'>('buscar');
  const [doc,  setDoc]      = useState('');
  const [contacto, setContacto] = useState<any>(null);
  const [tipo, setTipo]     = useState<'pf' | 'pj'>('pf');
  const [tipoOp, setTipoOp] = useState<'DESCUENTO_CHEQUE' | 'PRESTAMO_CONSUMO'>('DESCUENTO_CHEQUE');
  const [cheques, setCheques] = useState<ChequeRow[]>([{ ...CHEQUE_VACIO }]);
  const [fechaOp, setFechaOp] = useState(new Date().toISOString().slice(0, 10));
  const [canal,   setCanal]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [bancos, setBancos] = useState<any[]>([]);
  useEffect(() => { panelGlobalApi.getBancosActivos().then(setBancos).catch(() => {}); }, []);

  // Firmantes
  const [firmantes, setFirmantes] = useState<FirmanteRow[]>([]);
  const [buscarFirmante, setBuscarFirmante] = useState('');
  const [loadingFirmante, setLoadingFirmante] = useState(false);
  const [errorFirmante, setErrorFirmante] = useState('');

  const handleBuscar = async () => {
    if (!doc.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await contactosApi.buscarPorDoc(doc.trim());
      if (res) {
        setContacto(res.data);
        setTipo(res.tipo);
        // Si es PF, lo agregamos como firmante automáticamente
        if (res.tipo === 'pf') {
          const pf = res.data;
          const nombre = [pf.primerNombre, pf.segundoNombre, pf.primerApellido, pf.segundoApellido].filter(Boolean).join(' ');
          setFirmantes([{ id: pf.id, nombre, documento: pf.numeroDoc ?? '', tipo: 'pf' }]);
        } else {
          setFirmantes([]);
        }
        setStep('contacto');
      } else {
        setContacto(null); setStep('contacto');
      }
    } catch { setError('Error al buscar.'); }
    finally { setLoading(false); }
  };

  const handleBuscarFirmante = async () => {
    if (!buscarFirmante.trim()) return;
    setErrorFirmante('');
    setLoadingFirmante(true);
    try {
      const res = await contactosApi.buscarPorDoc(buscarFirmante.trim());
      if (res && res.tipo === 'pf') {
        const pf = res.data;
        const nombre = [pf.primerNombre, pf.segundoNombre, pf.primerApellido, pf.segundoApellido].filter(Boolean).join(' ');
        const nuevo: FirmanteRow = { id: pf.id, nombre, documento: pf.numeroDoc ?? '', tipo: 'pf' };
        if (firmantes.some(f => f.id === pf.id)) {
          setErrorFirmante('Este firmante ya fue agregado.');
        } else {
          setFirmantes(f => [...f, nuevo]);
          setBuscarFirmante('');
        }
      } else if (res && res.tipo === 'pj') {
        setErrorFirmante('El firmante debe ser una Persona Física.');
      } else {
        setErrorFirmante('No se encontró la persona. Verificá el documento.');
      }
    } catch { setErrorFirmante('Error al buscar.'); }
    finally { setLoadingFirmante(false); }
  };

  // Liquidación calculada
  const liquidacion = cheques.map(c => {
    const monto  = parseFloat(c.monto) || 0;
    const tasa   = parseFloat(c.tasaMensual) || 0;
    const dias   = c.fechaVencimiento ? calcularDias(fechaOp, c.fechaVencimiento) : 0;
    const interes = calcularInteres(monto, tasa, dias);
    return { ...c, dias, interes, capital: monto - interes };
  });

  const totalMonto      = liquidacion.reduce((a, c) => a + (parseFloat(c.monto) || 0), 0);
  const totalInteres    = liquidacion.reduce((a, c) => a + c.interes, 0);
  const netoDesembolsar = totalMonto - totalInteres;

  const handleGuardar = async () => {
    if (!contacto) { setError('Primero seleccioná un contacto.'); return; }
    if (tipo === 'pj' && firmantes.length === 0) { setError('Debe agregar al menos un firmante para operaciones de empresa.'); return; }
    setLoading(true); setError('');
    try {
      const body: any = {
        tipoOperacion:  tipoOp,
        contactoTipo:   tipo,
        contactoId:     contacto.id,
        contactoNombre: tipo === 'pf'
          ? [contacto.primerNombre, contacto.segundoNombre, contacto.primerApellido, contacto.segundoApellido].filter(Boolean).join(' ')
          : contacto.razonSocial,
        contactoDoc:    tipo === 'pf' ? contacto.numeroDoc : contacto.ruc,
        fechaOperacion: fechaOp,
        canal,
        firmantes,
        montoTotal:    totalMonto,
        interesTotal:  totalInteres,
        netoDesembolsar,
        capitalInvertido: netoDesembolsar,
        cheques: tipoOp === 'DESCUENTO_CHEQUE' ? liquidacion.map(c => ({
          banco: c.banco, librador: c.librador, rucLibrador: c.rucLibrador,
          nroCheque: c.nroCheque, fechaVencimiento: c.fechaVencimiento,
          monto: parseFloat(c.monto) || 0,
          tasaMensual: parseFloat(c.tasaMensual) || 0,
          interes: c.interes, capitalInvertido: c.capital, dias: c.dias,
        })) : [],
      };

      const op = await operacionesApi.create(body);
      navigate(`/operaciones/${op.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Operación</h1>

      {/* Paso 1: Buscar contacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-700 mb-4">1. Identificar cliente</h2>
        <div className="flex gap-3">
          <input type="text" value={doc} onChange={e => setDoc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBuscar()}
            placeholder="Cédula / RUC del cliente"
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleBuscar} disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Search size={15} /> Buscar
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        {step !== 'buscar' && (
          <div className="mt-4">
            {contacto ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800">
                  {tipo === 'pf'
                    ? [contacto.primerNombre, contacto.segundoNombre, contacto.primerApellido, contacto.segundoApellido].filter(Boolean).join(' ')
                    : contacto.razonSocial}
                </p>
                <p className="text-xs text-green-600">{tipo === 'pf' ? contacto.numeroDoc : contacto.ruc}</p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${tipo === 'pf' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {tipo === 'pf' ? 'Persona Física' : 'Empresa (PJ)'}
                </span>
                <button className="mt-2 block text-xs text-green-700 underline" onClick={() => setStep('operacion')}>Continuar con este cliente →</button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">No se encontró el cliente. Podés crearlo:</p>
                <div className="flex gap-2 mt-2">
                  <a href={`/contactos/personas/nuevo?doc=${doc}`} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Crear Persona Física</a>
                  <a href={`/contactos/empresas/nuevo?ruc=${doc}`} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Crear Persona Jurídica</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {step === 'operacion' && (
        <>
          {/* Firmantes — solo para PJ (o editable para PF) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <UserCheck size={16} className="text-blue-600"/>
              2. Firmante(s) del contrato
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {tipo === 'pf'
                ? 'Para operaciones de persona física, el firmante es el propio cliente.'
                : 'Para empresas podés tener uno o más representantes legales que firman.'}
            </p>

            {/* Lista de firmantes seleccionados */}
            {firmantes.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {firmantes.map((f, i) => (
                  <div key={f.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-blue-900">{f.nombre}</span>
                      <span className="ml-2 text-xs text-blue-600 font-mono">{f.documento}</span>
                    </div>
                    <button onClick={() => setFirmantes(ff => ff.filter((_, j) => j !== i))}
                      className="text-blue-400 hover:text-red-500 transition-colors">
                      <X size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Buscar firmante adicional */}
            <div className="flex gap-2">
              <input type="text" value={buscarFirmante}
                onChange={e => setBuscarFirmante(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBuscarFirmante()}
                placeholder={tipo === 'pj' ? 'CI del firmante / representante legal' : 'CI para cambiar firmante'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleBuscarFirmante} disabled={loadingFirmante}
                className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium">
                <Plus size={14}/> {loadingFirmante ? 'Buscando...' : 'Agregar firmante'}
              </button>
            </div>
            {errorFirmante && <p className="text-red-600 text-xs mt-1.5">{errorFirmante}</p>}
          </div>

          {/* Tipo de operación */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-700 mb-4">3. Tipo de operación</h2>
            <div className="flex gap-4">
              {(['DESCUENTO_CHEQUE', 'PRESTAMO_CONSUMO'] as const).map(t => (
                <label key={t} className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${tipoOp === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" checked={tipoOp === t} onChange={() => setTipoOp(t)} className="hidden" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{t === 'DESCUENTO_CHEQUE' ? 'Descuento de Cheque' : 'Préstamo de Consumo'}</p>
                    <p className="text-xs text-gray-500">{t === 'DESCUENTO_CHEQUE' ? 'Descuento de cheques a plazo' : 'Crédito personal en cuotas'}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de operación</label>
                <input type="date" value={fechaOp} onChange={e => setFechaOp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
                <input type="text" value={canal} onChange={e => setCanal(e.target.value)} placeholder="Ej: Particular, Te Descuento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Cheques */}
          {tipoOp === 'DESCUENTO_CHEQUE' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-700">4. Detalle de cheques</h2>
                <button onClick={() => setCheques(p => [...p, { ...CHEQUE_VACIO }])}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus size={14}/> Agregar cheque
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Banco','Librador','RUC/CI','N° Cheque','Vencimiento','Monto (Gs.)','Tasa %','Días','Interés','Capital',''].map(h => (
                        <th key={h} className="px-2 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cheques.map((c, i) => {
                      const liq = liquidacion[i];
                      return (
                        <tr key={i} className="border-t border-gray-100">
                          {/* Banco — select desde tabla bancos */}
                          <td className="px-1 py-1">
                            <select value={c.banco} onChange={e => setCheques(p => p.map((r, j) => j === i ? { ...r, banco: e.target.value } : r))}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                              <option value="">— Banco —</option>
                              {bancos.map((b: any) => (
                                <option key={b.id} value={b.abreviatura || b.nombre}>{b.abreviatura || b.nombre}</option>
                              ))}
                            </select>
                          </td>
                          {/* Librador, RUC/CI, N° Cheque — texto libre */}
                          {(['librador','rucLibrador','nroCheque'] as const).map(f => (
                            <td key={f} className="px-1 py-1">
                              <input value={c[f]} onChange={e => setCheques(p => p.map((r, j) => j === i ? { ...r, [f]: e.target.value } : r))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </td>
                          ))}
                          <td className="px-1 py-1">
                            <input type="date" value={c.fechaVencimiento} onChange={e => setCheques(p => p.map((r, j) => j === i ? { ...r, fechaVencimiento: e.target.value } : r))}
                              className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={c.monto} onChange={e => setCheques(p => p.map((r, j) => j === i ? { ...r, monto: e.target.value } : r))}
                              className="w-28 px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" step="0.01" value={c.tasaMensual} onChange={e => setCheques(p => p.map((r, j) => j === i ? { ...r, tasaMensual: e.target.value } : r))}
                              className="w-16 px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          </td>
                          <td className="px-2 py-1 text-gray-600">{liq.dias}</td>
                          <td className="px-2 py-1 text-red-600 font-medium">{formatGs(liq.interes)}</td>
                          <td className="px-2 py-1 text-green-700 font-medium">{formatGs(liq.capital)}</td>
                          <td className="px-1 py-1">
                            {cheques.length > 1 && (
                              <button onClick={() => setCheques(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                                <Trash2 size={13}/>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 bg-gray-50 rounded-lg p-4 flex flex-wrap gap-6 text-sm">
                <div><p className="text-xs text-gray-500">Total cheques</p><p className="font-bold text-gray-800">{formatGs(totalMonto)}</p></div>
                <div><p className="text-xs text-gray-500">Total intereses</p><p className="font-bold text-red-600">{formatGs(totalInteres)}</p></div>
                <div className="border-l border-gray-300 pl-6"><p className="text-xs text-gray-500">Neto a desembolsar</p><p className="font-bold text-green-700 text-lg">{formatGs(netoDesembolsar)}</p></div>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => navigate('/operaciones')} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar operación'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
