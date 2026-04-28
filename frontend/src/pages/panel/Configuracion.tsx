import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

export default function Configuracion() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cambios, setCambios] = useState<Record<string, string>>({});

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
    } catch { alert('Error al guardar configuraciones.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Parámetros generales del sistema</p>
        </div>
        {Object.keys(cambios).length > 0 && (
          <button onClick={handleGuardar} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {configs.map((c: any) => (
          <div key={c.clave} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{c.descripcion ?? c.clave}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{c.clave}</p>
            </div>
            <div className="w-56">
              <input
                value={cambios[c.clave] ?? c.valor}
                onChange={e => handleChange(c.clave, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
        {configs.length === 0 && (
          <div className="p-8 text-center text-gray-400">No hay parámetros configurados.</div>
        )}
      </div>
    </div>
  );
}
