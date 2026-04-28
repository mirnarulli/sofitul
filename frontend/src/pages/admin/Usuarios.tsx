import { useEffect, useState } from 'react';
import { Plus, Mail } from 'lucide-react';
import { usuariosApi } from '../../services/contactosApi';
import Modal from '../../components/Modal';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRol, setInviteRol] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    setLoading(true);
    Promise.all([usuariosApi.getAll(), usuariosApi.getRoles()])
      .then(([u, r]) => { setUsuarios(u); setRoles(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleInvitar = async () => {
    if (!inviteEmail || !inviteRol) { setError('Email y rol son obligatorios.'); return; }
    setSaving(true);
    setError('');
    try {
      await usuariosApi.invitar({ email: inviteEmail, rolId: inviteRol });
      setShowModal(false);
      setInviteEmail('');
      setInviteRol('');
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al invitar.');
    } finally { setSaving(false); }
  };

  const handleToggleBloqueo = async (id: string, bloqueado: boolean) => {
    try {
      await usuariosApi.toggleBloqueo(id, !bloqueado);
      setUsuarios(u => u.map(x => x.id === id ? { ...x, bloqueado: !bloqueado } : x));
    } catch { alert('Error al cambiar estado.'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={15} /> Invitar usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Nombre','Email','Rol','Estado','Último acceso','Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {u.rol?.nombre ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.bloqueado
                      ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Bloqueado</span>
                      : u.activadoAt
                        ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Activo</span>
                        : <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Invitado</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-PY') : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleBloqueo(u.id, u.bloqueado)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium ${u.bloqueado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                      {u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} title="Invitar usuario">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
            <select value={inviteRol} onChange={e => setInviteRol(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar rol...</option>
              {roles.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleInvitar} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Mail size={14} /> {saving ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
