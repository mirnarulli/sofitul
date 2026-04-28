import { useEffect, useState } from 'react';
import { usuariosApi } from '../../services/contactosApi';

const PERMISOS_LISTA = [
  { key: 'verOperaciones', label: 'Ver operaciones' },
  { key: 'crearOperaciones', label: 'Crear operaciones' },
  { key: 'cambiarEstadoOperaciones', label: 'Cambiar estado de operaciones' },
  { key: 'verContactos', label: 'Ver contactos' },
  { key: 'crearContactos', label: 'Crear/editar contactos' },
  { key: 'verCobranzas', label: 'Ver cobranzas' },
  { key: 'gestionarCobranzas', label: 'Gestionar cobranzas' },
  { key: 'verTesoreria', label: 'Ver tesorería' },
  { key: 'gestionarTesoreria', label: 'Gestionar desembolsos' },
  { key: 'verDashboards', label: 'Ver dashboards' },
  { key: 'adminUsuarios', label: 'Administrar usuarios' },
  { key: 'panelGlobal', label: 'Panel Global (configuración)' },
];

export default function GestionRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    usuariosApi.getRoles()
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (rolId: string, permiso: string, valor: boolean) => {
    setSaving(rolId);
    const rol = roles.find(r => r.id === rolId);
    const nuevosPermisos = { ...rol.permisos, [permiso]: valor };
    try {
      const updated = await usuariosApi.updatePermisos(rolId, nuevosPermisos);
      setRoles(rs => rs.map(r => r.id === rolId ? { ...r, permisos: updated.permisos } : r));
    } catch { alert('Error al actualizar permisos.'); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
        <p className="text-sm text-gray-500">Configurá los permisos por rol</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Permiso</th>
                {roles.map(r => (
                  <th key={r.id} className="px-4 py-3 text-center text-xs font-semibold text-blue-700 uppercase">{r.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PERMISOS_LISTA.map(p => (
                <tr key={p.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{p.label}</td>
                  {roles.map(r => (
                    <td key={r.id} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!r.permisos?.[p.key]}
                        disabled={saving === r.id || r.codigo === 'SUPER_ADMIN'}
                        onChange={e => handleToggle(r.id, p.key, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-400">* El rol SUPER_ADMIN tiene acceso total y no puede modificarse.</p>
        </div>
      </div>
    </div>
  );
}
