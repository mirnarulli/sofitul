import { useEffect, useState } from 'react';
import { Save, Building2, Loader2 } from 'lucide-react';
import { panelGlobalApi } from '../../services/contactosApi';

const CAMPOS = [
  { clave: 'empresa_nombre',     label: 'Razón Social',     placeholder: 'Ej: SOFITUL S.A.',              desc: 'Nombre legal de la empresa' },
  { clave: 'empresa_ruc',        label: 'RUC',              placeholder: 'Ej: 80110918-3',                desc: 'Registro Único del Contribuyente' },
  { clave: 'empresa_direccion',  label: 'Dirección',        placeholder: 'Ej: Av. Mariscal López 1234',   desc: 'Dirección fiscal/comercial' },
  { clave: 'empresa_ciudad',     label: 'Ciudad / País',    placeholder: 'Ej: Asunción, Paraguay',        desc: 'Ciudad y país — aparece en documentos' },
];

const LOGO_CAMPOS = [
  { clave: 'logo_barra_menu_claro', label: 'Logo barra (claro)',  desc: 'Header del sistema, fondo claro' },
  { clave: 'logo_barra_menu_oscuro', label: 'Logo barra (oscuro)', desc: 'Variante oscura (reservado)' },
  { clave: 'logo_iso',              label: 'Isotipo / Ícono',     desc: 'Versión cuadrada pequeña' },
  { clave: 'logo_reporte',          label: 'Logo informes',       desc: 'Encabezado de reportes PDF' },
];

export default function Empresa() {
  const [configs,  setConfigs]  = useState<Record<string, string>>({});
  const [cambios,  setCambios]  = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    panelGlobalApi.getConfiguraciones()
      .then((rows: any[]) => {
        const m: Record<string, string> = {};
        rows.forEach(r => { m[r.clave] = r.valor ?? ''; });
        setConfigs(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const val = (clave: string) => cambios[clave] ?? configs[clave] ?? '';
  const handleChange = (clave: string, v: string) => setCambios(c => ({ ...c, [clave]: v }));

  const handleGuardar = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all(
        Object.entries(cambios).map(([clave, valor]) =>
          panelGlobalApi.updateConfiguracion(clave, { valor })
        )
      );
      setCambios({});
      setSaved(true);
      // Refrescar
      const rows: any[] = await panelGlobalApi.getConfiguraciones();
      const m: Record<string, string> = {};
      rows.forEach(r => { m[r.clave] = r.valor ?? ''; });
      setConfigs(m);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Error al guardar. Intente nuevamente.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-gray-400">
      <Loader2 size={18} className="animate-spin" /> Cargando...
    </div>
  );

  const hayChange = Object.keys(cambios).length > 0;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Datos de la Empresa</h1>
            <p className="text-sm text-gray-500">Razón social, RUC y logos — aparecen en documentos e informes</p>
          </div>
        </div>
        {(hayChange || saved) && (
          <button onClick={handleGuardar} disabled={saving || !hayChange}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors">
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              : saved
              ? '✓ Guardado'
              : <><Save size={14} /> Guardar cambios</>
            }
          </button>
        )}
      </div>

      {/* Datos empresa */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Información Legal</p>
        </div>
        <div className="divide-y divide-gray-100">
          {CAMPOS.map(c => (
            <div key={c.clave} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
              </div>
              <div className="w-64">
                <input
                  value={val(c.clave)}
                  onChange={e => handleChange(c.clave, e.target.value)}
                  placeholder={c.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Logos (URL de imagen)</p>
        </div>
        <div className="divide-y divide-gray-100">
          {LOGO_CAMPOS.map(c => (
            <div key={c.clave} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
              </div>
              <div className="w-64 flex items-center gap-2">
                <input
                  value={val(c.clave)}
                  onChange={e => handleChange(c.clave, e.target.value)}
                  placeholder="https://…"
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
                {val(c.clave) && (
                  <img src={val(c.clave)} alt="" className="h-8 w-8 object-contain rounded border border-gray-200 shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Los cambios se reflejan en todos los documentos e informes al guardar.
        Para logos, ingresar la URL pública de la imagen (Google Drive, CDN, etc.).
      </p>
    </div>
  );
}
