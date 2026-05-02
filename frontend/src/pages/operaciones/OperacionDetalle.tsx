import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Upload, ExternalLink, Save, UserCheck, Plus, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { operacionesApi } from '../../services/operacionesApi';
import { contactosApi, mediosPagoApi } from '../../services/contactosApi';
import { transaccionesApi, cargosOperacionApi } from '../../services/financieroApi';
import { empleadosApi, talonariosApi } from '../../services/rrhhApi';
import StatusBadge from '../../components/StatusBadge';
import { formatGs, formatDate } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3002';

// ── Sub-componente: upload de ficha ──────────────────────────────────────────
function FichaUpload({ label, url, uploading, inputRef, onChange, inputId, apiBase }: {
  label: string;
  url?: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  apiBase: string;
}) {
  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 transition-colors ${url ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {url && <span className="text-xs text-green-600 font-medium">✔ Cargado</span>}
      </div>

      {url ? (
        <div className="flex gap-2">
          <a href={`${apiBase}${url}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 border border-green-400 rounded-lg hover:bg-green-100 font-medium">
            <ExternalLink size={12} /> Ver documento
          </a>
          <label htmlFor={inputId}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 font-medium ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={12} /> Reemplazar
          </label>
        </div>
      ) : (
        <label htmlFor={inputId}
          className={`flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={16} />
          {uploading ? 'Subiendo...' : 'Subir PDF / imagen'}
        </label>
      )}

      <input ref={inputRef} id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png"
        onChange={onChange} className="hidden" />
    </div>
  );
}

export default function OperacionDetalle() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [op,      setOp]      = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState<any[]>([]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nota,    setNota]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [siguientes, setSiguientes] = useState<any[]>([]);  // estados permitidos desde el actual

  // Contrato TeDescuento
  const [nroContrato,        setNroContrato]        = useState('');
  const [savingContrato,     setSavingContrato]      = useState(false);
  const [uploadingFile,      setUploadingFile]       = useState(false);
  const fileInputRef         = useRef<HTMLInputElement>(null);

  // Fichas de análisis
  const [uploadingInformconf, setUploadingInformconf] = useState(false);
  const [uploadingInfocheck,  setUploadingInfocheck]  = useState(false);
  const informconfRef        = useRef<HTMLInputElement>(null);
  const infocheckRef         = useRef<HTMLInputElement>(null);

  // Cobro
  const [modalCobro,    setModalCobro]    = useState(false);
  const [cobrando,      setCobrando]      = useState(false);
  const [cuotasSel,     setCuotasSel]     = useState<string[]>([]);
  const [medioPagoId,   setMedioPagoId]   = useState('');
  const [mediosPago,    setMediosPago]    = useState<any[]>([]);
  const [nroReferencia, setNroReferencia] = useState('');
  const [fechaCobroTx,  setFechaCobroTx]  = useState(new Date().toISOString().split('T')[0]);
  const [toastCobro,    setToastCobro]    = useState('');
  const [cobradores,        setCobradores]        = useState<any[]>([]);
  const [cobradorSelId,     setCobradorSelId]     = useState('');
  const [usarTalonario,     setUsarTalonario]     = useState(false);
  const [talonarioPreview,  setTalonarioPreview]  = useState<any | null>(null);

  // Cheques — cambio de estado individual
  const [updatingCheque, setUpdatingCheque] = useState<string | null>(null); // id del cheque en proceso

  // Transacciones y cargos
  const [transacciones,   setTransacciones]   = useState<any[]>([]);
  const [cargos,          setCargos]          = useState<any[]>([]);
  const [modalReverso,    setModalReverso]    = useState<string | null>(null); // transaccionId
  const [motivoReverso,   setMotivoReverso]   = useState('');
  const [reversando,      setReversando]      = useState(false);
  const [modalExonerar,   setModalExonerar]   = useState<string | null>(null); // cargoId
  const [motivoExonerar,  setMotivoExonerar]  = useState('');
  const [exonerando,      setExonerando]      = useState(false);

  // Firmantes
  const [firmantes,        setFirmantes]        = useState<any[]>([]);
  const [buscarFirmante,   setBuscarFirmante]   = useState('');
  const [loadingFirmante,  setLoadingFirmante]  = useState(false);
  const [errorFirmante,    setErrorFirmante]    = useState('');
  const [savingFirmantes,  setSavingFirmantes]  = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([operacionesApi.getById(id), operacionesApi.getEstados()])
      .then(([o, e]) => {
        setOp(o); setEstados(e);
        setNroContrato(o.nroContratoTeDescuento ?? '');
        setFirmantes(o.firmantes ?? []);
        if (o.estado) {
          operacionesApi.getSiguientesEstados(o.estado)
            .then(setSiguientes)
            .catch(() => setSiguientes(e));
        } else {
          setSiguientes(e);
        }
      })
      .catch(() => navigate('/operaciones'))
      .finally(() => setLoading(false));
    // Load transactions and charges independently (don't block main load)
    transaccionesApi.getByOperacion(id).then(setTransacciones).catch(() => {});
    cargosOperacionApi.getByOperacion(id).then(setCargos).catch(() => {});
    mediosPagoApi.getActivos().then(setMediosPago).catch(() => {});
  }, [id, navigate]);

  useEffect(() => {
    if (modalCobro) {
      if (mediosPago.length === 0)
        mediosPagoApi.getActivos().then(setMediosPago).catch(() => {});
      if (cobradores.length === 0)
        empleadosApi.getCobradores().then(setCobradores).catch(() => {});
    }
  }, [modalCobro]);

  useEffect(() => {
    if (cobradorSelId && usarTalonario) {
      talonariosApi.getByEmpleado(cobradorSelId)
        .then((ts: any[]) => setTalonarioPreview(ts.find((t: any) => t.activo) ?? null))
        .catch(() => setTalonarioPreview(null));
    } else {
      setTalonarioPreview(null);
    }
  }, [cobradorSelId, usarTalonario]);

  const cargar = async () => {
    if (!id) return;
    const o = await operacionesApi.getById(id);
    setOp(o);
    if (o.estado) {
      operacionesApi.getSiguientesEstados(o.estado).then(setSiguientes).catch(() => {});
    }
    // Also refresh transactions and charges
    transaccionesApi.getByOperacion(id).then(setTransacciones).catch(() => {});
    cargosOperacionApi.getByOperacion(id).then(setCargos).catch(() => {});
  };

  const recargarOp = async () => {
    if (!id) return;
    const [o, siguientesNuevos] = await Promise.all([
      operacionesApi.getById(id),
      operacionesApi.getSiguientesEstados('').catch(() => []),
    ]);
    setOp(o);
    if (o.estado) {
      operacionesApi.getSiguientesEstados(o.estado).then(setSiguientes).catch(() => {});
    }
  };

  const handleChequeEstado = async (chequeId: string, nuevoEstado: 'COBRADO' | 'DEVUELTO' | 'PROTESTADO' | 'VIGENTE') => {
    setUpdatingCheque(chequeId);
    try {
      await operacionesApi.updateCheque(chequeId, { estado: nuevoEstado });
      await recargarOp();
    } catch {
      alert('Error al actualizar el cheque.');
    } finally {
      setUpdatingCheque(null);
    }
  };

  const handleBuscarFirmante = async () => {
    if (!buscarFirmante.trim()) return;
    setErrorFirmante(''); setLoadingFirmante(true);
    try {
      const res = await contactosApi.buscarPorDoc(buscarFirmante.trim());
      if (res && res.tipo === 'pf') {
        const pf = res.data;
        const nombre = [pf.primerNombre, pf.segundoNombre, pf.primerApellido, pf.segundoApellido].filter(Boolean).join(' ');
        if (firmantes.some((f: any) => f.id === pf.id)) {
          setErrorFirmante('Este firmante ya está en la lista.');
        } else {
          setFirmantes(ff => [...ff, { id: pf.id, nombre, documento: pf.numeroDoc ?? '', tipo: 'pf' }]);
          setBuscarFirmante('');
        }
      } else if (res?.tipo === 'pj') {
        setErrorFirmante('El firmante debe ser una Persona Física.');
      } else {
        setErrorFirmante('No se encontró la persona.');
      }
    } catch { setErrorFirmante('Error al buscar.'); }
    finally { setLoadingFirmante(false); }
  };

  const handleGuardarFirmantes = async () => {
    if (!id) return;
    setSavingFirmantes(true);
    try {
      const updated = await operacionesApi.updateFirmantes(id, firmantes);
      setOp(updated); setFirmantes(updated.firmantes ?? []);
    } catch { alert('Error al guardar firmantes.'); }
    finally { setSavingFirmantes(false); }
  };

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    setSaving(true);
    try {
      const updated = await operacionesApi.cambiarEstado(id!, { estado: nuevoEstado, nota });
      setOp(updated); setNuevoEstado(''); setNota('');
      // Refrescar estados permitidos desde el nuevo estado
      operacionesApi.getSiguientesEstados(updated.estado)
        .then(setSiguientes)
        .catch(() => {});
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Transición no permitida.');
    } finally { setSaving(false); }
  };

  const handleGuardarNroContrato = async () => {
    if (!id) return;
    setSavingContrato(true);
    try {
      const updated = await operacionesApi.actualizarContrato(id, { nroContratoTeDescuento: nroContrato });
      setOp(updated);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar número de contrato.');
    } finally { setSavingContrato(false); }
  };

  const handleUploadContrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingFile(true);
    try {
      const updated = await operacionesApi.uploadContrato(id, file);
      setOp(updated);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al subir el contrato.');
    } finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleUploadInformconf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingInformconf(true);
    try {
      const updated = await operacionesApi.uploadFichaInformconf(id, file);
      setOp(updated);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al subir la ficha Informconf.');
    } finally { setUploadingInformconf(false); if (informconfRef.current) informconfRef.current.value = ''; }
  };

  const handleUploadInfocheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingInfocheck(true);
    try {
      const updated = await operacionesApi.uploadFichaInfocheck(id, file);
      setOp(updated);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al subir la ficha Infocheck.');
    } finally { setUploadingInfocheck(false); if (infocheckRef.current) infocheckRef.current.value = ''; }
  };

  const cuotasPendientes = (op?.cuotas ?? []).filter((c: any) => ['PENDIENTE','MORA'].includes(c.estado));
  const cuotasSelObj     = cuotasPendientes.filter((c: any) => cuotasSel.includes(c.id));

  const totalCapital  = cuotasSelObj.reduce((s: number, c: any) => s + Math.max(0, Number(c.capital) - Number(c.pagado ?? 0)), 0);
  const totalInteres  = cuotasSelObj.reduce((s: number, c: any) => s + Math.max(0, Number(c.interes) - Number(c.interesPagado ?? 0)), 0);
  const totalMora     = cuotasSelObj.reduce((s: number, c: any) => s + Math.max(0, Number(c.moraCalculada ?? 0) - Number(c.moraPagada ?? 0)), 0);
  const totalGastos   = cuotasSelObj.reduce((s: number, c: any) => s + Math.max(0, Number(c.gastosAdmin ?? 0) - Number(c.gastosAdminPagado ?? 0)), 0);
  const totalGeneral  = totalCapital + totalInteres + totalMora + totalGastos;

  const handleRegistrarCobro = async () => {
    if (!cuotasSel.length || !medioPagoId) return;
    setCobrando(true);
    try {
      const result = await transaccionesApi.registrarPago({
        operacionId:      op.id,
        fechaTransaccion: fechaCobroTx,
        fechaValor:       fechaCobroTx,
        montoTotal:       totalGeneral,
        montoCapital:     totalCapital,
        montoInteres:     totalInteres,
        montoMora:        totalMora,
        montoGastosAdmin: totalGastos,
        montoProrroga:    0,
        medioPagoId,
        nroReferencia:    nroReferencia || undefined,
        cobradorId:    cobradorSelId || undefined,
        usarTalonario: usarTalonario && !!cobradorSelId,
        aplicaciones: cuotasSelObj.map((c: any) => ({
          cuotaId:         c.id,
          capitalAplicado: Math.max(0, Number(c.capital) - Number(c.pagado ?? 0)),
          interesAplicado: Math.max(0, Number(c.interes) - Number(c.interesPagado ?? 0)),
          moraAplicada:    Math.max(0, Number(c.moraCalculada ?? 0) - Number(c.moraPagada ?? 0)),
          gastosAplicados: Math.max(0, Number(c.gastosAdmin ?? 0) - Number(c.gastosAdminPagado ?? 0)),
          prorrogaAplicada: 0,
        })),
      });
      setModalCobro(false);
      setCuotasSel([]);
      setNroReferencia('');
      setCobradorSelId('');
      setUsarTalonario(false);
      setTalonarioPreview(null);
      setToastCobro(result?.nroRecibo ? `Cobro registrado · Recibo ${result.nroRecibo}` : 'Cobro registrado correctamente');
      cargar();
    } catch (e: any) {
      setToastCobro(e?.response?.data?.message ?? 'Error al registrar cobro');
    } finally { setCobrando(false); }
  };

  const handleReversar = async () => {
    if (!modalReverso || !motivoReverso.trim()) return;
    setReversando(true);
    try {
      await transaccionesApi.reversar(modalReverso, { motivo: motivoReverso });
      setModalReverso(null); setMotivoReverso('');
      setToastCobro('Transacción reversada');
      cargar();
    } catch (e: any) {
      setToastCobro(e?.response?.data?.message ?? 'Error al reversar');
    } finally { setReversando(false); }
  };

  const handleExonerar = async () => {
    if (!modalExonerar || !motivoExonerar.trim()) return;
    setExonerando(true);
    try {
      await cargosOperacionApi.exonerar(modalExonerar, { motivo: motivoExonerar });
      setModalExonerar(null); setMotivoExonerar('');
      setToastCobro('Cargo exonerado');
      cargosOperacionApi.getByOperacion(id!).then(setCargos).catch(() => {});
    } catch (e: any) {
      setToastCobro(e?.response?.data?.message ?? 'Error al exonerar');
    } finally { setExonerando(false); }
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
          <Link to={`/operaciones/${id}/analisis`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
            <FileText size={14}/> Análisis
          </Link>
          <Link to={`/operaciones/${id}/estado-cuenta`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FileText size={14}/> Estado de Cuenta
          </Link>
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
            <div><p className="text-gray-400 text-xs">Interés Generado neto</p><p className="font-medium text-blue-700">{formatGs(op.gananciaNeta)}</p></div>
            <div><p className="text-gray-400 text-xs">Vencimiento</p><p className="font-medium">{formatDate(op.fechaVencimiento)}</p></div>
            <div><p className="text-gray-400 text-xs">Canal</p><p className="font-medium">{op.canal ?? '—'}</p></div>
          </div>
        </div>

        {/* Cambio de estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Cambiar estado</h2>
          {siguientes.length === 0 ? (
            <p className="text-xs text-gray-400 italic mb-3">No hay transiciones definidas — estado terminal.</p>
          ) : (
            <p className="text-xs text-gray-400 mb-3">
              {siguientes.length === estados.length
                ? 'Modo libre — todas las transiciones permitidas'
                : `${siguientes.length} transición${siguientes.length !== 1 ? 'es' : ''} permitida${siguientes.length !== 1 ? 's' : ''} desde el estado actual`}
            </p>
          )}
          <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3">
            <option value="">Seleccionar nuevo estado...</option>
            {(siguientes.length > 0 ? siguientes : estados).map((e: any) => (
              <option key={e.codigo} value={e.codigo}>{e.nombre}</option>
            ))}
          </select>
          <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Nota opcional..."
            rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none" />
          <button onClick={handleCambiarEstado} disabled={!nuevoEstado || saving}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Cambiar estado'}
          </button>
        </div>
      </div>

      {/* Firmantes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <UserCheck size={15} className="text-blue-600"/> Firmante(s) del contrato
          </h2>
          {firmantes.length > 0 && (
            <button onClick={handleGuardarFirmantes} disabled={savingFirmantes}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={12}/> {savingFirmantes ? 'Guardando...' : 'Guardar firmantes'}
            </button>
          )}
        </div>

        {/* Lista actual */}
        {firmantes.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {firmantes.map((f: any, i: number) => (
              <div key={f.id ?? i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-900">{f.nombre}</span>
                  <span className="font-mono text-xs text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">{f.documento}</span>
                </div>
                <button onClick={() => setFirmantes(ff => ff.filter((_: any, j: number) => j !== i))}
                  className="text-blue-300 hover:text-red-500 transition-colors">
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {firmantes.length === 0 && (
          <p className="text-xs text-gray-400 italic mb-3">Sin firmantes registrados.</p>
        )}

        {/* Agregar firmante */}
        <div className="flex gap-2">
          <input type="text" value={buscarFirmante}
            onChange={e => setBuscarFirmante(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBuscarFirmante()}
            placeholder="CI del firmante / representante legal"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleBuscarFirmante} disabled={loadingFirmante}
            className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium whitespace-nowrap">
            <Plus size={14}/> {loadingFirmante ? 'Buscando...' : 'Agregar'}
          </button>
        </div>
        {errorFirmante && <p className="text-red-500 text-xs mt-1.5">{errorFirmante}</p>}

        {/* Botón guardar si hay cambios pendientes */}
        {firmantes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button onClick={handleGuardarFirmantes} disabled={savingFirmantes}
              className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800 disabled:opacity-50">
              <Save size={14}/> {savingFirmantes ? 'Guardando...' : 'Guardar cambios en firmantes'}
            </button>
          </div>
        )}
      </div>

      {/* Cheques */}
      {op.cheques?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Cheques ({op.cheques.length})
            </h2>
            {/* Resumen rápido */}
            <div className="flex gap-3 text-xs">
              {(() => {
                const cobrados  = op.cheques.filter((c: any) => c.estado === 'COBRADO').length;
                const devueltos = op.cheques.filter((c: any) => c.estado === 'DEVUELTO' || c.estado === 'PROTESTADO').length;
                const vigentes  = op.cheques.filter((c: any) => c.estado === 'VIGENTE').length;
                return (<>
                  {cobrados  > 0 && <span className="flex items-center gap-1 text-green-700 font-medium"><CheckCircle2 size={12}/>{cobrados} cobrado{cobrados>1?'s':''}</span>}
                  {devueltos > 0 && <span className="flex items-center gap-1 text-red-600 font-medium"><XCircle size={12}/>{devueltos} devuelto/protestado</span>}
                  {vigentes  > 0 && <span className="flex items-center gap-1 text-amber-600 font-medium"><AlertTriangle size={12}/>{vigentes} pendiente{vigentes>1?'s':''}</span>}
                </>);
              })()}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>{['Banco','Librador','N° Cheque','F. Emisión','F. Vencimiento','Monto','Capital','Estado','Acción'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {op.cheques.map((c: any) => {
                  const busy = updatingCheque === c.id;
                  return (
                    <tr key={c.id} className={c.estado === 'COBRADO' ? 'bg-green-50' : c.estado === 'DEVUELTO' || c.estado === 'PROTESTADO' ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2">{c.banco}</td>
                      <td className="px-3 py-2">{c.librador}</td>
                      <td className="px-3 py-2 font-mono">{c.nroCheque}</td>
                      <td className="px-3 py-2">{c.fechaEmision ? formatDate(c.fechaEmision) : '—'}</td>
                      <td className="px-3 py-2">{formatDate(c.fechaVencimiento)}</td>
                      <td className="px-3 py-2 font-medium">{formatGs(c.monto)}</td>
                      <td className="px-3 py-2 text-green-700">{formatGs(c.capitalInvertido)}</td>
                      <td className="px-3 py-2"><StatusBadge estado={c.estado} /></td>
                      <td className="px-3 py-2">
                        {c.estado === 'VIGENTE' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleChequeEstado(c.id, 'COBRADO')}
                              disabled={busy}
                              title="Marcar como cobrado"
                              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-xs whitespace-nowrap">
                              <CheckCircle2 size={11}/> {busy ? '...' : 'Cobrado'}
                            </button>
                            <button
                              onClick={() => handleChequeEstado(c.id, 'DEVUELTO')}
                              disabled={busy}
                              title="Marcar como devuelto"
                              className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 disabled:opacity-50 font-medium text-xs whitespace-nowrap">
                              <XCircle size={11}/> Dev.
                            </button>
                            <button
                              onClick={() => handleChequeEstado(c.id, 'PROTESTADO')}
                              disabled={busy}
                              title="Marcar como protestado"
                              className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300 rounded-md hover:bg-orange-200 disabled:opacity-50 font-medium text-xs whitespace-nowrap">
                              <AlertTriangle size={11}/> Prot.
                            </button>
                          </div>
                        )}
                        {c.estado === 'COBRADO' && (
                          <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={12}/> Cubierto</span>
                        )}
                        {(c.estado === 'DEVUELTO' || c.estado === 'PROTESTADO') && (
                          <button
                            onClick={() => handleChequeEstado(c.id, 'COBRADO')}
                            disabled={busy}
                            className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded-md hover:bg-green-200 disabled:opacity-50 font-medium text-xs whitespace-nowrap">
                            <CheckCircle2 size={11}/> Cobrar igualmente
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Nota informativa */}
          <p className="mt-3 text-xs text-gray-400">
            Al marcar todos los cheques como cobrados, la operación se cierra automáticamente como <strong>COBRADO</strong>.
          </p>
        </div>
      )}

      {/* Cuotas */}
      {op.cuotas?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Plan de pagos</h2>
            {cuotasPendientes.length > 0 && (
              <button onClick={() => setModalCobro(true)}
                className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700">
                <span>+</span> Registrar Cobro
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>{['N°','Vencimiento','Capital','Interés','Mora','Gastos','Total','Pagado','Saldo','Estado'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase text-xs">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {op.cuotas.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-medium">{c.nroCuota}</td>
                    <td className="px-3 py-2">{formatDate(c.fechaVencimiento)}</td>
                    <td className="px-3 py-2">{formatGs(c.capital)}</td>
                    <td className="px-3 py-2 text-red-600">{formatGs(c.interes)}</td>
                    <td className="px-3 py-2 text-orange-600">{Number(c.moraCalculada) > 0 ? formatGs(c.moraCalculada) : '—'}</td>
                    <td className="px-3 py-2 text-purple-600">{Number(c.gastosAdmin) > 0 ? formatGs(c.gastosAdmin) : '—'}</td>
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

      {/* Cobros registrados */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Cobros registrados ({transacciones.filter((t: any) => t.tipo === 'PAGO').length})
        </h2>
        {transacciones.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sin cobros registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>{['Fecha','N° Recibo','Medio pago','Capital','Interés','Mora','Gastos','Total','Estado',''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase text-xs">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transacciones.map((tx: any) => {
                  const esReverso = tx.esReverso || tx.tipo === 'REVERSO';
                  return (
                    <tr key={tx.id} className={esReverso ? 'bg-red-50 opacity-70' : tx.estado === 'REVERSADO' ? 'opacity-50' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(tx.fechaTransaccion)}</td>
                      <td className="px-3 py-2 font-mono">
                        {esReverso
                          ? <span className="text-red-500">REVERSO</span>
                          : tx.nroRecibo ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2">{mediosPago.find((m: any) => m.id === tx.medioPagoId)?.nombre ?? (tx.medioPagoId ? '—' : '—')}</td>
                      <td className="px-3 py-2 font-medium">{formatGs(tx.montoCapital)}</td>
                      <td className="px-3 py-2 text-red-600">{Number(tx.montoInteres) > 0 ? formatGs(tx.montoInteres) : '—'}</td>
                      <td className="px-3 py-2 text-orange-600">{Number(tx.montoMora) > 0 ? formatGs(tx.montoMora) : '—'}</td>
                      <td className="px-3 py-2 text-purple-600">{Number(tx.montoGastosAdmin) > 0 ? formatGs(tx.montoGastosAdmin) : '—'}</td>
                      <td className="px-3 py-2 font-bold">{formatGs(Math.abs(Number(tx.montoTotal)))}</td>
                      <td className="px-3 py-2">
                        {tx.estado === 'APLICADO' && !esReverso
                          ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Aplicado</span>
                          : tx.estado === 'REVERSADO'
                          ? <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">Reversado</span>
                          : <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-medium">Reverso</span>}
                      </td>
                      <td className="px-3 py-2">
                        {tx.estado === 'APLICADO' && !esReverso && (
                          <button
                            onClick={() => { setModalReverso(tx.id); setMotivoReverso(''); }}
                            className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium">
                            Reversar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={7} className="px-3 py-2 text-xs text-gray-500 font-medium">Total cobrado (aplicados)</td>
                  <td className="px-3 py-2 font-bold text-green-700 text-xs">
                    {formatGs(transacciones
                      .filter((t: any) => t.estado === 'APLICADO' && !t.esReverso && t.tipo !== 'REVERSO')
                      .reduce((s: number, t: any) => s + Number(t.montoTotal), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Cargos de la operación */}
      {cargos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Cargos de la operación ({cargos.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>{['Descripción','Categoría','Monto','Estado','Observación',''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargos.map((c: any) => {
                  const catColor: Record<string,string> = {
                    INTERES: 'bg-blue-100 text-blue-700', MORA: 'bg-orange-100 text-orange-700',
                    GASTO_ADMIN: 'bg-purple-100 text-purple-700', PRORROGA: 'bg-yellow-100 text-yellow-700',
                    SEGURO: 'bg-teal-100 text-teal-700', OTRO: 'bg-gray-100 text-gray-600',
                  };
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-medium">{c.descripcion}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColor[c.categoria] ?? 'bg-gray-100 text-gray-600'}`}>
                          {c.categoria}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{formatGs(c.montoCalculado)}</td>
                      <td className="px-3 py-2">
                        {c.estado === 'PENDIENTE'
                          ? <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">Pendiente</span>
                          : c.estado === 'COBRADO'
                          ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Cobrado</span>
                          : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">Exonerado</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-400 max-w-xs truncate">
                        {c.estado === 'EXONERADO' && c.motivoExoneracion
                          ? <span className="italic">{c.motivoExoneracion}</span>
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {c.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => { setModalExonerar(c.id); setMotivoExonerar(''); }}
                            className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                            Exonerar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fichas de análisis — solo en Descuento de Cheque */}
      {op.tipoOperacion === 'DESCUENTO_CHEQUE' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Documentos de Análisis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* INFORMCONF */}
            <FichaUpload
              label="Ficha INFORMCONF"
              url={op.fichaInformconfUrl}
              uploading={uploadingInformconf}
              inputRef={informconfRef}
              onChange={handleUploadInformconf}
              inputId="upload-informconf"
              apiBase={API_BASE}
            />

            {/* INFOCHECK */}
            <FichaUpload
              label="Ficha INFOCHECK"
              url={op.fichaInfocheckUrl}
              uploading={uploadingInfocheck}
              inputRef={infocheckRef}
              onChange={handleUploadInfocheck}
              inputId="upload-infocheck"
              apiBase={API_BASE}
            />

          </div>
        </div>
      )}

      {/* Contrato TeDescuento */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Contrato TeDescuento
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          {/* Número de contrato */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">N° Contrato TeDescuento</label>
            <input
              type="text"
              placeholder="Ej: 1767"
              value={nroContrato}
              onChange={e => setNroContrato(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            onClick={handleGuardarNroContrato}
            disabled={savingContrato}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={14} /> {savingContrato ? 'Guardando...' : 'Guardar N°'}
          </button>

          {/* Upload PDF */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUploadContrato}
              className="hidden"
              id="contrato-upload"
            />
            <label
              htmlFor="contrato-upload"
              className={`flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-50 ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Upload size={14} /> {uploadingFile ? 'Subiendo...' : 'Subir contrato PDF'}
            </label>

            {op.contratoTeDescuentoUrl && (
              <a
                href={`${API_BASE}${op.contratoTeDescuentoUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-50"
              >
                <ExternalLink size={14} /> Ver contrato
              </a>
            )}
          </div>
        </div>

        {/* Estado actual */}
        {(op.nroContratoTeDescuento || op.contratoTeDescuentoUrl) && (
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            {op.nroContratoTeDescuento && (
              <span>📄 Contrato N° <strong className="text-gray-800 font-mono">{op.nroContratoTeDescuento}</strong></span>
            )}
            {op.contratoTeDescuentoUrl && (
              <span className="text-green-600">✔ PDF cargado</span>
            )}
          </div>
        )}
      </div>

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

      {/* Modal Registrar Cobro */}
      {modalCobro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Registrar Cobro</h2>
              <button onClick={() => setModalCobro(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Selección de cuotas */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cuotas a cobrar</p>
                <div className="space-y-2">
                  {cuotasPendientes.map((c: any) => {
                    const saldoReal = Math.max(0, Number(c.capital) - Number(c.pagado ?? 0))
                                    + Math.max(0, Number(c.interes) - Number(c.interesPagado ?? 0))
                                    + Math.max(0, Number(c.moraCalculada ?? 0) - Number(c.moraPagada ?? 0))
                                    + Math.max(0, Number(c.gastosAdmin ?? 0) - Number(c.gastosAdminPagado ?? 0));
                    return (
                      <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${cuotasSel.includes(c.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="checkbox" checked={cuotasSel.includes(c.id)}
                          onChange={e => setCuotasSel(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))}
                          className="w-4 h-4 accent-blue-600" />
                        <div className="flex-1 grid grid-cols-4 gap-2 text-xs">
                          <span className="font-medium">Cuota {c.nroCuota}</span>
                          <span className="text-gray-500">{c.fechaVencimiento}</span>
                          <span className={c.estado === 'MORA' ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {c.estado}
                            {c.diasMora > 0 && <span className="ml-1 text-red-500">({c.diasMora}d mora)</span>}
                          </span>
                          <span className="font-semibold text-right">Gs. {saldoReal.toLocaleString('es-PY')}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Desglose waterfall */}
              {cuotasSel.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Desglose del cobro</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Capital</span>
                    <span className="text-right font-medium">Gs. {totalCapital.toLocaleString('es-PY')}</span>
                    <span className="text-gray-600">Interés</span>
                    <span className="text-right font-medium text-red-600">Gs. {totalInteres.toLocaleString('es-PY')}</span>
                    {totalMora > 0 && <>
                      <span className="text-gray-600">Mora</span>
                      <span className="text-right font-medium text-orange-600">Gs. {totalMora.toLocaleString('es-PY')}</span>
                    </>}
                    {totalGastos > 0 && <>
                      <span className="text-gray-600">Gastos Admin.</span>
                      <span className="text-right font-medium text-purple-600">Gs. {totalGastos.toLocaleString('es-PY')}</span>
                    </>}
                    <span className="font-bold border-t border-gray-200 pt-2">Total</span>
                    <span className="text-right font-bold text-blue-700 border-t border-gray-200 pt-2">Gs. {totalGeneral.toLocaleString('es-PY')}</span>
                  </div>
                </div>
              )}

              {/* Medio de pago */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Medio de pago *</label>
                <select value={medioPagoId} onChange={e => setMedioPagoId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar...</option>
                  {mediosPago.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>

              {/* N° referencia (si el medio lo requiere) */}
              {mediosPago.find((m: any) => m.id === medioPagoId)?.requiereReferencia && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">N° Referencia / Comprobante</label>
                  <input type="text" value={nroReferencia} onChange={e => setNroReferencia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 0001234567" />
                </div>
              )}

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha del cobro</label>
                <input type="date" value={fechaCobroTx} onChange={e => setFechaCobroTx(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Cobrador */}
              {cobradores.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cobrador</label>
                  <select value={cobradorSelId} onChange={e => { setCobradorSelId(e.target.value); setUsarTalonario(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sin cobrador asignado</option>
                    {cobradores.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Talonario */}
              {cobradorSelId && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={usarTalonario} onChange={e => setUsarTalonario(e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Generar N° de recibo
                  </label>
                  {usarTalonario && (
                    talonarioPreview
                      ? <span className="font-mono text-sm font-bold text-blue-700">
                          {talonarioPreview.prefijo}-{String(talonarioPreview.nroSiguiente).padStart(6, '0')}
                        </span>
                      : <span className="text-xs text-red-500">Sin talonario activo</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalCobro(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={handleRegistrarCobro} disabled={cobrando || !cuotasSel.length || !medioPagoId}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {cobrando ? 'Registrando...' : `Confirmar cobro Gs. ${totalGeneral.toLocaleString('es-PY')}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast cobro */}
      {toastCobro && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3 ${toastCobro.includes('Error') || toastCobro.includes('error') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toastCobro}
          <button onClick={() => setToastCobro('')} className="ml-2 opacity-70 hover:opacity-100 text-lg font-bold">×</button>
        </div>
      )}

      {/* Modal Reverso */}
      {modalReverso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Reversar transacción</h2>
              <p className="text-sm text-gray-500 mt-1">Esta acción crea un registro inverso. No puede deshacerse.</p>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Motivo del reverso *</label>
              <textarea
                value={motivoReverso}
                onChange={e => setMotivoReverso(e.target.value)}
                rows={3}
                placeholder="Describir el motivo del reverso..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalReverso(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleReversar} disabled={reversando || !motivoReverso.trim()}
                className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                {reversando ? 'Reversando...' : 'Confirmar reverso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Exonerar cargo */}
      {modalExonerar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Exonerar cargo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Monto: <strong>{formatGs(cargos.find((c: any) => c.id === modalExonerar)?.montoCalculado ?? 0)}</strong>
              </p>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Motivo *</label>
              <textarea
                value={motivoExonerar}
                onChange={e => setMotivoExonerar(e.target.value)}
                rows={3}
                placeholder="Ej: cliente VIP, acuerdo de pago..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalExonerar(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleExonerar} disabled={exonerando || !motivoExonerar.trim()}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {exonerando ? 'Exonerando...' : 'Confirmar exoneración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
