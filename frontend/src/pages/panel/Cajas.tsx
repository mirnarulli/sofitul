import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';
import { formatGs } from '../../utils/formatters';

const VACIO = { nombre: '', monedaId: '', banco: '', numeroCuenta: '', tipoCuenta: '', saldo: '0', activo: true };

export default function Cajas() {
  const [cajas, setCajas] = useState<any[]>([]);
  const [monedas, setMonedas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...VACIO });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    Promise.all([panelGlobalApi.getCajas(), panelGlobalApi.getMonedas()])
      .then(([c, m]) => { setCajas(c); setMonedas(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const payload = { ...form, saldo: parseFloat(form.saldo) || 0 };
      if (editId) await panelGlobalApi.updateCaja(editId, payload);
      else await panelGlobalApi.createCaja(payload);
      setShowForm(false);
      setEditId(null);
      setForm({ ...VACIO });
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error.');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cajas y Cuentas</h1>
        <button onClick={() => { setEditId(null); setForm({ ...VACIO }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Nueva caja
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editId ? 'Editar caja' : 'Nueva caja'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <select value={form.monedaId} onChange={e => set('monedaId', e.target.value)} className={inputCls}>
                <option value="">Seleccionar...</option>
                {monedas.filter((m: any) => m.activo).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
              <input value={form.banco} onChange={e => set('banco', e.target.value)} className={inputCls} placeholder="Efectivo si no aplica" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Cuenta</label>
              <input value={form.numeroCuenta} onChange={e => set('numeroCuenta', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de cuenta</label>
              <select value={form.tipoCuenta} onChange={e => set('tipoCuenta', e.target.value)} className={inputCls}>
                <option value="">Efectivo</option>
                <option value="CTA_CTE">Cuenta Corriente</option>
                <option value="CTA_AHO">Caja de Ahorro</option>
              </select>
            </div>
            {!editId && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Saldo inicial</label>
                <input type="number" value={form.saldo} onChange={e => set('saldo', e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4" />
            Activa
          </label>
          <div className="flex gap-2">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Nombre','Moneda','Banco','Tipo','Saldo','Estado',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cajas.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.moneda?.codigo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.banco ?? 'Efectivo'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.tipoCuenta ?? '—'}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatGs(c.saldo)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditId(c.id); setForm({ nombre: c.nombre, monedaId: c.monedaId, banco: c.banco ?? '', numeroCuenta: c.numeroCuenta ?? '', tipoCuenta: c.tipoCuenta ?? '', saldo: c.saldo, activo: c.activo }); setShowForm(true); }}
                      className="text-blue-600 hover:text-blue-700">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
