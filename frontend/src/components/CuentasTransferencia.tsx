import { useEffect, useState } from 'react';
import { Plus, Pencil, Star, Check, X, CreditCard, Copy } from 'lucide-react';
import { panelGlobalApi } from '../services/contactosApi';
import api from '../services/api';

const TIPOS_CUENTA = [
  { value: 'CTA_CTE',    label: 'Cuenta Corriente' },
  { value: 'CTA_AHO',    label: 'Caja de Ahorro' },
  { value: 'ALIAS',      label: 'Solo Alias / PagoMóvil' },
  { value: 'OTRO',       label: 'Otro' },
];

const VACIO = {
  banco: '', numeroCuenta: '', titular: '', alias: '',
  tipoCuenta: 'CTA_AHO', esPrincipal: false, activo: true, observaciones: '',
};

interface Props {
  contactoTipo: 'pf' | 'pj';
  contactoId:   string;
}

export default function CuentasTransferencia({ contactoTipo, contactoId }: Props) {
  const [cuentas,  setCuentas]  = useState<any[]>([]);
  const [bancos,   setBancos]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<any>({ ...VACIO });
  const [saving,   setSaving]   = useState(false);
  const [copied,   setCopied]   = useState<string | null>(null);

  const cargar = () => {
    api.get('/cuentas-transferencia', { params: { contactoTipo, contactoId } })
      .then(r => setCuentas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    panelGlobalApi.getBancosActivos().then(setBancos).catch(() => {});
  }, [contactoId]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const payload = { ...form, contactoTipo, contactoId };
      if (editId) await api.put(`/cuentas-transferencia/${editId}`, payload);
      else        await api.post('/cuentas-transferencia', payload);
      setShowForm(false); setEditId(null); setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleEditar = (c: any) => {
    setEditId(c.id);
    setForm({
      banco: c.banco ?? '', numeroCuenta: c.numeroCuenta ?? '', titular: c.titular ?? '',
      alias: c.alias ?? '', tipoCuenta: c.tipoCuenta ?? 'CTA_AHO',
      esPrincipal: c.esPrincipal, activo: c.activo, observaciones: c.observaciones ?? '',
    });
    setShowForm(true);
  };

  const handleSetPrincipal = async (c: any) => {
    await api.put(`/cuentas-transferencia/${c.id}`, { esPrincipal: true });
    cargar();
  };

  const handleToggleActivo = async (c: any) => {
    await api.put(`/cuentas-transferencia/${c.id}`, { activo: !c.activo });
    cargar();
  };

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const inputCls  = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls = inputCls + ' bg-white';

  const tipoLabel = (v: string) => TIPOS_CUENTA.find(t => t.value === v)?.label ?? v;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={17} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-700">Cuentas para Transferencia</h3>
          <span className="text-xs text-gray-400">{cuentas.filter(c => c.activo).length} activa{cuentas.filter(c=>c.activo).length!==1?'s':''}</span>
        </div>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          <Plus size={13} /> Agregar cuenta
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">
            {editId ? 'Editar cuenta' : 'Nueva cuenta'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Banco</label>
              <select value={form.banco} onChange={e => set('banco', e.target.value)} className={selectCls}>
                <option value="">— Sin banco —</option>
                {bancos.map((b: any) => (
                  <option key={b.id} value={b.abreviatura || b.nombre}>{b.abreviatura || b.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de cuenta</label>
              <select value={form.tipoCuenta} onChange={e => set('tipoCuenta', e.target.value)} className={selectCls}>
                {TIPOS_CUENTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">N° de cuenta</label>
              <input value={form.numeroCuenta} onChange={e => set('numeroCuenta', e.target.value)}
                className={inputCls} placeholder="Opcional si es solo alias" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium text-blue-700">Alias ★</label>
              <input value={form.alias} onChange={e => set('alias', e.target.value)}
                className={inputCls + ' border-blue-300 focus:ring-blue-500'} placeholder="Ej: juan.perez.pagomovil" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Titular de la cuenta</label>
              <input value={form.titular} onChange={e => set('titular', e.target.value)}
                className={inputCls} placeholder="Nombre completo del titular" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
              <input value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
                className={inputCls} placeholder="Ej: cuenta personal, uso preferido..." />
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.esPrincipal} onChange={e => set('esPrincipal', e.target.checked)} className="w-4 h-4 accent-amber-500" />
                <Star size={13} className="text-amber-500" /> Cuenta principal
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                Activa
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              <Check size={13} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50">
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de cuentas */}
      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Cargando...</div>
      ) : cuentas.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
          Sin cuentas registradas — agregá la primera
        </div>
      ) : (
        <div className="space-y-2">
          {cuentas.map((c: any) => (
            <div key={c.id}
              className={`border rounded-xl p-4 transition-all ${c.esPrincipal ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'} ${!c.activo ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Línea 1: banco + tipo + principal badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {c.esPrincipal && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Star size={10} /> Principal
                      </span>
                    )}
                    {c.banco && (
                      <span className="text-sm font-semibold text-gray-800">{c.banco}</span>
                    )}
                    {c.tipoCuenta && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{tipoLabel(c.tipoCuenta)}</span>
                    )}
                    {!c.activo && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactiva</span>
                    )}
                  </div>

                  {/* Alias — protagonista */}
                  {c.alias && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-blue-700 font-mono">{c.alias}</span>
                      <button onClick={() => copiar(c.alias, c.id + '_alias')}
                        className="text-gray-400 hover:text-blue-600 transition-colors" title="Copiar alias">
                        {copied === c.id + '_alias'
                          ? <Check size={13} className="text-green-500" />
                          : <Copy size={13} />}
                      </button>
                    </div>
                  )}

                  {/* N° cuenta + titular */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    {c.numeroCuenta && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">N°</span>
                        <span className="font-mono">{c.numeroCuenta}</span>
                        <button onClick={() => copiar(c.numeroCuenta, c.id + '_nro')}
                          className="text-gray-300 hover:text-blue-500 ml-0.5" title="Copiar">
                          {copied === c.id + '_nro' ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                        </button>
                      </span>
                    )}
                    {c.titular && <span>Titular: <span className="text-gray-700">{c.titular}</span></span>}
                    {c.observaciones && <span className="italic text-gray-400">{c.observaciones}</span>}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {!c.esPrincipal && c.activo && (
                    <button onClick={() => handleSetPrincipal(c)} title="Marcar como principal"
                      className="p-1.5 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <Star size={14} />
                    </button>
                  )}
                  <button onClick={() => handleEditar(c)} title="Editar"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleToggleActivo(c)} title={c.activo ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors text-xs font-medium ${c.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                    {c.activo ? <X size={14} /> : <Check size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
