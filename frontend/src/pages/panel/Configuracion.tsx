import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

// ── Parámetros financieros conocidos — sección dedicada con labels y tipos ──
const PARAMS_FIN = [
  {
    clave:       'dias_gracia',
    label:       'Días de gracia',
    tipo:        'number' as const,
    min: 0, max: 90, step: 1,
    descripcion: 'Días que se otorgan antes de aplicar interés de mora',
    sufijo:      'días',
  },
  {
    clave:       'tasa_mora_mensual',
    label:       'Tasa de mora mensual',
    tipo:        'number' as const,
    min: 0, max: 100, step: 0.5,
    descripcion: 'Porcentaje mensual de interés por mora',
    sufijo:      '% / mes',
  },
  {
    clave:       'tasa_descuento_default',
    label:       'Tasa de descuento por defecto',
    tipo:        'number' as const,
    min: 0, max: 100, step: 0.5,
    descripcion: 'Tasa mensual de descuento de cheques (pre-carga en Simulador)',
    sufijo:      '% / mes',
  },
  {
    clave:       'comision_desembolso',
    label:       'Comisión de desembolso por defecto',
    tipo:        'number' as const,
    min: 0, max: 9999999, step: 1000,
    descripcion: 'Importe fijo de comisión en Gs. (editable por operación)',
    sufijo:      'Gs.',
  },
] as const;

const CLAVES_FIN = new Set(PARAMS_FIN.map(p => p.clave));

export default function Configuracion() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [cambios, setCambios]   = useState<Record<string, string>>({});

  useEffect(() => {
    panelGlobalApi.getConfiguraciones()
      .then(setConfigs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (clave: string, valor: string) => {
    setCambios(c => ({ ...c, [clave]: valor }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(cambios).map(([clave, valor]) =>
          panelGlobalApi.updateConfiguracion(clave, { valor })
        )
      );
      setCambios({});
      const updated = await panelGlobalApi.getConfiguraciones();
      setConfigs(updated);
    } catch {
      alert('Error al guardar configuraciones.');
    } finally {
      setSaving(false);
    }
  };

  // Mapa rápido de clave → valor actual (o pending)
  const val = (clave: string) => cambios[clave] ?? configs.find((c: any) => c.clave === clave)?.valor ?? '';

  // Configs que NO son financieras (sección "Otros / Sistema")
  const otrosConfigs = configs.filter((c: any) => !CLAVES_FIN.has(c.clave));

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  const hayPendientes = Object.keys(cambios).length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Parámetros generales del sistema</p>
        </div>
        {hayPendientes && (
          <button onClick={handleGuardar} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            <Save size={15} /> {saving ? 'Guardando...' : `Guardar cambios (${Object.keys(cambios).length})`}
          </button>
        )}
      </div>

      {/* ── Sección: Parámetros Financieros ── */}
      <div className="bg-white rounded-xl border border-blue-200">
        <div className="px-5 py-3 border-b border-blue-100 bg-blue-50 rounded-t-xl">
          <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
            💰 Parámetros Financieros
          </h2>
          <p className="text-xs text-blue-600 mt-0.5">
            Días de gracia, tasas y comisiones utilizadas en operaciones y cálculos
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {PARAMS_FIN.map(p => {
            const editado = p.clave in cambios;
            return (
              <div key={p.clave} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.descripcion}</p>
                  <p className="text-xs text-gray-300 font-mono mt-0.5">{p.clave}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={p.tipo}
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={val(p.clave)}
                    onChange={e => handleChange(p.clave, e.target.value)}
                    className={`w-28 px-3 py-2 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editado ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap w-16">{p.sufijo}</span>
                </div>
              </div>
            );
          })}
          {/* Si algún parámetro no existe aún en BD */}
          {PARAMS_FIN.some(p => !configs.find((c: any) => c.clave === p.clave)) && (
            <div className="px-5 py-3 bg-yellow-50 rounded-b-xl">
              <p className="text-xs text-yellow-700">
                ⚠ Algunos parámetros no existen aún en base de datos. Se crearán al guardar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sección: Otros / Sistema ── */}
      {otrosConfigs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              ⚙️ Sistema y Empresa
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {otrosConfigs.map((c: any) => {
              const editado = c.clave in cambios;
              return (
                <div key={c.clave} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{c.descripcion ?? c.clave}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{c.clave}</p>
                  </div>
                  <div className="w-56">
                    <input
                      value={cambios[c.clave] ?? c.valor}
                      onChange={e => handleChange(c.clave, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editado ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {configs.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No hay parámetros configurados.
        </div>
      )}

    </div>
  );
}
