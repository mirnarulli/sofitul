import { useEffect, useState } from 'react';
import { Save, TestTube2, Eye, EyeOff, CheckCircle, XCircle, Loader2, Link2 } from 'lucide-react';
import { validataApi } from '../../services/contactosApi';

interface Credenciales {
  url:     string;
  user:    string;
  pass:    string;  // solo en edición local, nunca viene del backend
  passSet: boolean; // el backend devuelve si la pass está configurada
}

type TestResult = { ok: boolean; mensaje: string } | null;

export default function Integraciones() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);

  const [form, setForm] = useState<Credenciales>({
    url:     '',
    user:    '',
    pass:    '',
    passSet: false,
  });

  // ── Cargar credenciales actuales ──────────────────────────────────────────
  useEffect(() => {
    validataApi.getCredenciales()
      .then((data: any) => {
        setForm(f => ({ ...f, url: data.url ?? '', user: data.user ?? '', passSet: !!data.passSet }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof Credenciales, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const payload: any = {
        validata_url:  form.url.trim(),
        validata_user: form.user.trim(),
      };
      if (form.pass.trim()) payload.validata_pass = form.pass.trim();

      await validataApi.setCredenciales(payload);
      setForm(f => ({ ...f, pass: '', passSet: true }));
      setTestResult({ ok: true, mensaje: 'Credenciales guardadas correctamente.' });
    } catch (err: any) {
      setTestResult({ ok: false, mensaje: 'Error al guardar: ' + (err?.response?.data?.message ?? err.message) });
    } finally {
      setSaving(false);
    }
  };

  // ── Test de conexión ──────────────────────────────────────────────────────
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await validataApi.testConexion();
      setTestResult({ ok: result.ok, mensaje: result.mensaje });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Error desconocido';
      setTestResult({ ok: false, mensaje: msg });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Link2 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
          <p className="text-sm text-gray-500">Configuración de servicios externos</p>
        </div>
      </div>

      {/* Tarjeta VALIDATA */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header de la tarjeta */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">VLD</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">VALIDATA</p>
            <p className="text-xs text-gray-400">Servicio de validación de cédulas e historial crediticio (validpy.com)</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-5 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del API</label>
            <input
              type="url"
              value={form.url}
              onChange={e => handleChange('url', e.target.value)}
              placeholder="https://api-ws.validpy.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario / Email</label>
            <input
              type="text"
              value={form.user}
              onChange={e => handleChange('user', e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
              {form.passSet && (
                <span className="ml-2 text-xs text-green-600 font-normal">✓ configurada</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.pass}
                onChange={e => handleChange('pass', e.target.value)}
                placeholder={form.passSet ? '••••••••• (dejar vacío para no cambiar)' : 'Ingrese la contraseña'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Resultado del test */}
          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              testResult.ok
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.ok
                ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
                : <XCircle    size={16} className="mt-0.5 shrink-0" />
              }
              <span>{testResult.mensaje}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={handleGuardar}
            disabled={saving || testing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
              : <><Save size={15} /> Guardar credenciales</>
            }
          </button>

          <button
            onClick={handleTest}
            disabled={saving || testing}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {testing
              ? <><Loader2 size={15} className="animate-spin" /> Probando...</>
              : <><TestTube2 size={15} /> Probar conexión</>
            }
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <p className="font-medium mb-1">Nota de configuración</p>
        <p>Las credenciales se guardan en la base de datos y tienen precedencia sobre las variables de entorno del servidor. Si la conexión falla, verifique que las credenciales sean correctas en el portal de VALIDATA.</p>
      </div>
    </div>
  );
}
