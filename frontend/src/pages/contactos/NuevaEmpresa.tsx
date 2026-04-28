import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { contactosApi, panelGlobalApi } from '../../services/contactosApi';

export default function NuevaEmpresa() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paises, setPaises] = useState<any[]>([]);

  const [form, setForm] = useState({
    ruc: params.get('ruc') ?? '',
    razonSocial: '', nombreFantasia: '',
    paisConstitucion: 'PY', fechaConstitucion: '',
    actividadPrincipal: '',
    direccion: '', barrio: '', ciudad: '', departamento: '',
    telefono: '', email: '', sitioWeb: '',
    repLegalNombre: '', repLegalDoc: '', repLegalCargo: '',
    esPep: false,
  });

  useEffect(() => {
    panelGlobalApi.getPaises().then(setPaises).catch(() => {});
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.ruc || !form.razonSocial) {
      setError('RUC y razón social son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const pj = await contactosApi.crearEmpresa(form);
      navigate(`/contactos/empresas/${pj.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/contactos')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Empresa</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Datos de la empresa</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="RUC">
            <input value={form.ruc} onChange={e => set('ruc', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Razón Social">
            <input value={form.razonSocial} onChange={e => set('razonSocial', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nombre Fantasía">
            <input value={form.nombreFantasia} onChange={e => set('nombreFantasia', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Actividad principal">
            <input value={form.actividadPrincipal} onChange={e => set('actividadPrincipal', e.target.value)} className={inputCls} />
          </Field>
          <Field label="País de constitución">
            <select value={form.paisConstitucion} onChange={e => set('paisConstitucion', e.target.value)} className={inputCls}>
              {paises.map((p: any) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
            </select>
          </Field>
          <Field label="Fecha de constitución">
            <input type="date" value={form.fechaConstitucion} onChange={e => set('fechaConstitucion', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Domicilio</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Dirección">
              <input value={form.direccion} onChange={e => set('direccion', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Barrio"><input value={form.barrio} onChange={e => set('barrio', e.target.value)} className={inputCls} /></Field>
          <Field label="Ciudad"><input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} /></Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contacto</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Teléfono"><input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} /></Field>
          <Field label="Sitio web"><input value={form.sitioWeb} onChange={e => set('sitioWeb', e.target.value)} className={inputCls} /></Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Representante Legal</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Nombre"><input value={form.repLegalNombre} onChange={e => set('repLegalNombre', e.target.value)} className={inputCls} /></Field>
          <Field label="Documento"><input value={form.repLegalDoc} onChange={e => set('repLegalDoc', e.target.value)} className={inputCls} /></Field>
          <Field label="Cargo"><input value={form.repLegalCargo} onChange={e => set('repLegalCargo', e.target.value)} className={inputCls} /></Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Compliance</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.esPep} onChange={e => set('esPep', e.target.checked)} className="w-4 h-4" />
          <div>
            <p className="text-sm font-medium text-gray-800">PEP</p>
            <p className="text-xs text-gray-500">Empresa vinculada a Persona Expuesta Políticamente</p>
          </div>
        </label>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => navigate('/contactos')} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
        <button onClick={handleGuardar} disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
