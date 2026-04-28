import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { contactosApi, panelGlobalApi } from '../../services/contactosApi';

export default function NuevaPersonaFisica() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tiposDoc, setTiposDoc] = useState<any[]>([]);
  const [paises, setPaises] = useState<any[]>([]);

  const [form, setForm] = useState({
    tipoDocumento: 'CI', numeroDoc: params.get('doc') ?? '',
    primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '',
    fechaNacimiento: '', sexo: '', estadoCivil: '',
    paisNacionalidad: 'PY', paisResidencia: 'PY',
    direccion: '', barrio: '', ciudad: '', departamento: '',
    telefono: '', celular: '', email: '',
    profesion: '', empleador: '', cargoOcupacion: '',
    esPep: false, esFatca: false,
  });

  useEffect(() => {
    Promise.all([panelGlobalApi.getTiposDocumento(), panelGlobalApi.getPaises()])
      .then(([td, p]) => { setTiposDoc(td); setPaises(p); })
      .catch(() => {});
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleGuardar = async () => {
    if (!form.primerNombre || !form.primerApellido || !form.numeroDoc) {
      setError('Nombre, apellido y documento son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const pf = await contactosApi.crearPersonaFisica(form);
      navigate(`/contactos/personas/${pf.id}`);
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

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/contactos')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Volver a contactos
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Persona Física</h1>

      {/* Identificación */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identificación</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de documento">
            <select value={form.tipoDocumento} onChange={e => set('tipoDocumento', e.target.value)} className={inputCls}>
              {tiposDoc.map((t: any) => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
            </select>
          </Field>
          <Field label="N° Documento">
            <input value={form.numeroDoc} onChange={e => set('numeroDoc', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Primer Nombre">
            <input value={form.primerNombre} onChange={e => set('primerNombre', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Segundo Nombre">
            <input value={form.segundoNombre} onChange={e => set('segundoNombre', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Primer Apellido">
            <input value={form.primerApellido} onChange={e => set('primerApellido', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Segundo Apellido">
            <input value={form.segundoApellido} onChange={e => set('segundoApellido', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Fecha de nacimiento">
            <input type="date" value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Sexo">
            <select value={form.sexo} onChange={e => set('sexo', e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </Field>
          <Field label="Estado Civil">
            <select value={form.estadoCivil} onChange={e => set('estadoCivil', e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {['Soltero/a','Casado/a','Divorciado/a','Viudo/a','Unión de hecho'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Nacionalidad">
            <select value={form.paisNacionalidad} onChange={e => set('paisNacionalidad', e.target.value)} className={inputCls}>
              {paises.map((p: any) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Domicilio */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Domicilio</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Dirección">
              <input value={form.direccion} onChange={e => set('direccion', e.target.value)} className={inputCls} placeholder="Calle, número" />
            </Field>
          </div>
          <Field label="Barrio">
            <input value={form.barrio} onChange={e => set('barrio', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ciudad">
            <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Departamento">
            <input value={form.departamento} onChange={e => set('departamento', e.target.value)} className={inputCls} />
          </Field>
          <Field label="País de residencia">
            <select value={form.paisResidencia} onChange={e => set('paisResidencia', e.target.value)} className={inputCls}>
              {paises.map((p: any) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Datos de contacto</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Teléfono">
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Celular">
            <input value={form.celular} onChange={e => set('celular', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Laboral */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Datos laborales</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Profesión/Ocupación">
            <input value={form.profesion} onChange={e => set('profesion', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Empleador">
            <input value={form.empleador} onChange={e => set('empleador', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Cargo">
            <input value={form.cargoOcupacion} onChange={e => set('cargoOcupacion', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Compliance</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.esPep} onChange={e => set('esPep', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">PEP</p>
              <p className="text-xs text-gray-500">Persona Expuesta Políticamente</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.esFatca} onChange={e => set('esFatca', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">FATCA</p>
              <p className="text-xs text-gray-500">Contribuyente fiscal EEUU</p>
            </div>
          </label>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => navigate('/contactos')} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
        <button onClick={handleGuardar} disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
