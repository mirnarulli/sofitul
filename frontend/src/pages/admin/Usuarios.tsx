import { useEffect, useState } from 'react';
import {
  Search, UserPlus, Pencil, Lock, Unlock, ToggleRight, ToggleLeft,
  Mail, Users, Shield, Share2, Copy, Check, ExternalLink, RotateCcw,
} from 'lucide-react';
import { usuariosApi, type LinkInvitacion } from '../../services/contactosApi';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UsuarioRow {
  id: string;
  email: string;
  primerNombre: string;
  primerApellido: string;
  telefono: string | null;
  rolId: string | null;
  rolNombre: string | null;
  rolCodigo: string | null;
  activo: boolean;
  bloqueado: boolean;
  emailVerificado: boolean;
  ultimoLogin: string | null;
  activadoAt: string | null;
  createdAt: string;
}

type EstadoUsuario = 'PENDIENTE' | 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

function getEstado(u: UsuarioRow): EstadoUsuario {
  if (u.bloqueado)   return 'BLOQUEADO';
  if (!u.activo)     return 'INACTIVO';
  if (!u.activadoAt) return 'PENDIENTE';
  return 'ACTIVO';
}

function getInitials(u: UsuarioRow) {
  return `${u.primerNombre?.[0] ?? ''}${u.primerApellido?.[0] ?? ''}`.toUpperCase();
}

function fmtFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const ESTADO_STYLE: Record<EstadoUsuario, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  ACTIVO:    'bg-green-100  text-green-800',
  INACTIVO:  'bg-gray-100   text-gray-600',
  BLOQUEADO: 'bg-red-100    text-red-700',
};

const ESTADO_LABEL: Record<EstadoUsuario, string> = {
  PENDIENTE: 'Pendiente',
  ACTIVO:    'Activo',
  INACTIVO:  'Inactivo',
  BLOQUEADO: 'Bloqueado',
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Usuarios() {
  const [usuarios,     setUsuarios]     = useState<UsuarioRow[]>([]);
  const [roles,        setRoles]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  // Modales
  const [showInvite,   setShowInvite]   = useState(false);
  const [editingUser,  setEditingUser]  = useState<UsuarioRow | null>(null);
  const [shareUser,    setShareUser]    = useState<UsuarioRow | null>(null);
  const [shareData,    setShareData]    = useState<LinkInvitacion | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied,       setCopied]       = useState<'link' | 'mensaje' | null>(null);

  // Formulario invitar
  const [invEmail,   setInvEmail]   = useState('');
  const [invNombre,  setInvNombre]  = useState('');
  const [invApel,    setInvApel]    = useState('');
  const [invRolId,   setInvRolId]   = useState('');
  const [invEmail2,  setInvEmail2]  = useState(true); // enviar email

  // Formulario editar
  const [editEmail,  setEditEmail]  = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editApel,   setEditApel]   = useState('');
  const [editRolId,  setEditRolId]  = useState('');
  const [editTel,    setEditTel]    = useState('');
  const [editActivo, setEditActivo] = useState(true);

  // Filtros
  const [fSearch, setFSearch] = useState('');
  const [fRol,    setFRol]    = useState('');
  const [fEstado, setFEstado] = useState('');

  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('usuario') || '{}').id as string; } catch { return ''; }
  })();

  // ── Carga ─────────────────────────────────────────────────────────────────

  const cargar = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([usuariosApi.getAll(), usuariosApi.getRoles()]);
      setUsuarios(u);
      setRoles(r);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ── Acciones ──────────────────────────────────────────────────────────────

  const openInvite = () => {
    setInvEmail(''); setInvNombre(''); setInvApel(''); setInvRolId(''); setInvEmail2(true);
    setError(null);
    setShowInvite(true);
  };

  const openEdit = (u: UsuarioRow) => {
    setEditEmail(u.email);
    setEditNombre(u.primerNombre);
    setEditApel(u.primerApellido);
    setEditRolId(u.rolId ?? '');
    setEditTel(u.telefono ?? '');
    setEditActivo(u.activo);
    setError(null);
    setEditingUser(u);
  };

  const handleInvitar = async () => {
    if (!invEmail || !invNombre || !invApel || !invRolId) {
      setError('Completá todos los campos obligatorios.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await usuariosApi.invitar({
        email: invEmail, primerNombre: invNombre, primerApellido: invApel,
        rolId: invRolId, enviarEmail: invEmail2,
      });
      setSuccess(invEmail2 ? `Invitación enviada a ${invEmail}` : `Usuario ${invNombre} ${invApel} creado sin email.`);
      setShowInvite(false);
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al invitar.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async () => {
    if (!editingUser || !editEmail || !editNombre || !editApel || !editRolId) {
      setError('Completá todos los campos obligatorios.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await usuariosApi.update(editingUser.id, {
        email: editEmail, primerNombre: editNombre, primerApellido: editApel,
        rolId: editRolId, telefono: editTel || null, activo: editActivo,
      });
      setSuccess('Usuario actualizado');
      setEditingUser(null);
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBloqueado = async (u: UsuarioRow) => {
    const accion = u.bloqueado ? 'desbloquear' : 'bloquear';
    if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${u.primerNombre} ${u.primerApellido}?`)) return;
    try {
      setActionId(u.id);
      await usuariosApi.toggleBloqueo(u.id, !u.bloqueado);
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cambiar estado');
    } finally { setActionId(null); }
  };

  const handleToggleActivo = async (u: UsuarioRow) => {
    try {
      setActionId(u.id);
      await usuariosApi.update(u.id, { activo: !u.activo });
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cambiar estado');
    } finally { setActionId(null); }
  };

  const handleReenviar = async (u: UsuarioRow) => {
    if (!window.confirm(`¿Reenviar invitación por email a ${u.email}?`)) return;
    try {
      setActionId(u.id);
      await usuariosApi.reenviarInvitacion(u.id);
      setSuccess('Invitación reenviada');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al reenviar');
    } finally { setActionId(null); }
  };

  const openShare = async (u: UsuarioRow, tipo: 'invitacion' | 'reset' = 'invitacion') => {
    setShareUser(u);
    setShareData(null);
    setCopied(null);
    try {
      setShareLoading(true);
      const data = tipo === 'invitacion'
        ? await usuariosApi.getLinkInvitacion(u.id)
        : await usuariosApi.getLinkReset(u.id);
      setShareData(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al generar el link');
      setShareUser(null);
    } finally { setShareLoading(false); }
  };

  const handleResetearPendiente = async (u: UsuarioRow) => {
    if (!window.confirm(
      `¿Poner a ${u.primerNombre} ${u.primerApellido} en PENDIENTE?\n\nNo se enviará email. Después podés compartir el link de activación por WhatsApp.`
    )) return;
    try {
      setActionId(u.id);
      await usuariosApi.resetearAPendiente(u.id);
      setSuccess('Usuario puesto en PENDIENTE');
      await cargar();
      openShare(u, 'invitacion');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al resetear');
    } finally { setActionId(null); }
  };

  const handleCopy = async (text: string, kind: 'link' | 'mensaje') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(p => p === kind ? null : p), 2000);
    } catch { setError('No se pudo copiar al portapapeles'); }
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const filtrados = usuarios
    .filter(u => {
      const estado = getEstado(u);
      if (fEstado && estado !== fEstado) return false;
      if (fRol && u.rolCodigo !== fRol) return false;
      if (fSearch) {
        const q = fSearch.toLowerCase();
        const n = `${u.primerNombre} ${u.primerApellido}`.toLowerCase();
        if (!n.includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ta = a.ultimoLogin ? new Date(a.ultimoLogin).getTime() : 0;
      const tb = b.ultimoLogin ? new Date(b.ultimoLogin).getTime() : 0;
      return tb - ta;
    });

  const hayFiltros = fSearch || fRol || fEstado;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Título */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en el sistema
          </p>
        </div>
        <button onClick={openInvite}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <UserPlus size={16} /> Invitar usuario
        </button>
      </div>

      {/* Notificaciones */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xl ml-3">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
          <span className="text-sm">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600 text-xl ml-3">×</button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Buscar</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" value={fSearch} onChange={e => setFSearch(e.target.value)}
                placeholder="Nombre, email..."
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rol</label>
            <select value={fRol} onChange={e => setFRol(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los roles</option>
              {roles.map(r => <option key={r.id} value={r.codigo}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Estado</label>
            <div className="flex gap-2">
              <select value={fEstado} onChange={e => setFEstado(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
              {hayFiltros && (
                <button onClick={() => { setFSearch(''); setFRol(''); setFEstado(''); }}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300" title="Limpiar filtros">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        {hayFiltros && (
          <p className="text-xs text-gray-400 mt-2">Mostrando {filtrados.length} de {usuarios.length} usuarios</p>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700">
              <tr>
                {['Usuario', 'Rol', 'Estado', 'Último acceso', 'Invitado', 'Acciones'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Users size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 text-sm">
                      {hayFiltros ? 'Sin resultados para los filtros seleccionados.' : 'No hay usuarios.'}
                    </p>
                  </td>
                </tr>
              ) : filtrados.map(u => {
                const estado  = getEstado(u);
                const esSelf  = u.id === currentUserId;
                const pending = estado === 'PENDIENTE';

                return (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.activo && !u.bloqueado ? 'opacity-60' : ''}`}>

                    {/* Usuario */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-600">{getInitials(u)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-800">{u.primerNombre} {u.primerApellido}</span>
                            {esSelf && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Tú</span>}
                          </div>
                          <span className="text-xs text-gray-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {u.rolNombre
                        ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit bg-blue-100 text-blue-700">
                            <Shield size={10} /> {u.rolNombre}
                          </span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Estado */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLE[estado]}`}>
                        {ESTADO_LABEL[estado]}
                      </span>
                    </td>

                    {/* Último acceso */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {fmtFecha(u.ultimoLogin)}
                    </td>

                    {/* Invitado */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {fmtFecha(u.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">

                        {/* Editar */}
                        <button onClick={() => openEdit(u)}
                          className="text-blue-600 hover:text-blue-800 transition-colors" title="Editar usuario">
                          <Pencil size={15} />
                        </button>

                        {/* Toggle activo (solo activados y no bloqueados) */}
                        {u.activadoAt && !u.bloqueado && (
                          <button onClick={() => handleToggleActivo(u)} disabled={actionId === u.id || esSelf}
                            className={`transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                              ${u.activo ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                            title={u.activo ? 'Desactivar' : 'Activar'}>
                            {u.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        )}

                        {/* Bloquear / Desbloquear */}
                        {u.activadoAt && (
                          <button onClick={() => handleToggleBloqueado(u)} disabled={actionId === u.id || esSelf}
                            className={`transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                              ${u.bloqueado ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-gray-600'}`}
                            title={u.bloqueado ? 'Desbloquear' : 'Bloquear'}>
                            {u.bloqueado ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                        )}

                        {/* Reenviar invitación por email (solo PENDIENTE) */}
                        {pending && (
                          <button onClick={() => handleReenviar(u)} disabled={actionId === u.id}
                            className="text-amber-500 hover:text-amber-700 transition-colors disabled:opacity-30"
                            title="Reenviar invitación por email">
                            <Mail size={15} />
                          </button>
                        )}

                        {/* Compartir link (PENDIENTE → invitación / ACTIVO → reset) */}
                        <button
                          onClick={() => openShare(u, pending ? 'invitacion' : 'reset')}
                          disabled={actionId === u.id}
                          className="text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-30"
                          title={pending ? 'Compartir link de invitación por WhatsApp' : 'Compartir link para crear/restablecer contraseña'}>
                          <Share2 size={15} />
                        </button>

                        {/* Resetear a PENDIENTE (solo ACTIVOS, no para uno mismo) */}
                        {estado === 'ACTIVO' && !esSelf && (
                          <button onClick={() => handleResetearPendiente(u)} disabled={actionId === u.id}
                            className="text-amber-500 hover:text-amber-700 transition-colors disabled:opacity-30"
                            title="Poner en PENDIENTE (sin mail — compartir por WhatsApp)">
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Invitar ── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Invitar usuario</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                  className={inputCls} placeholder="usuario@empresa.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer nombre *</label>
                  <input value={invNombre} onChange={e => setInvNombre(e.target.value)} className={inputCls} placeholder="Juan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer apellido *</label>
                  <input value={invApel} onChange={e => setInvApel(e.target.value)} className={inputCls} placeholder="Pérez" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select value={invRolId} onChange={e => setInvRolId(e.target.value)} className={inputCls}>
                  <option value="">Seleccioná un rol...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>

              {/* Checkbox enviar email */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100">
                <input type="checkbox" checked={invEmail2} onChange={e => setInvEmail2(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Enviar email de invitación</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {invEmail2
                      ? 'Se enviará un link de activación válido por 48 hs.'
                      : 'El usuario se crea sin email. Podés enviarle el link desde la tabla cuando quieras.'}
                  </p>
                </div>
              </label>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button onClick={() => setShowInvite(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleInvitar} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  <Mail size={15} />
                  {saving ? 'Guardando...' : (invEmail2 ? 'Crear y enviar invitación' : 'Crear usuario')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Editar usuario</h3>
                <p className="text-xs text-gray-400">ID: {editingUser.id.slice(0, 8)}…</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  className={inputCls} placeholder="usuario@ejemplo.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer nombre *</label>
                  <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer apellido *</label>
                  <input value={editApel} onChange={e => setEditApel(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select value={editRolId} onChange={e => setEditRolId(e.target.value)} className={inputCls}>
                  <option value="">Seleccioná un rol...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📱 Teléfono / WhatsApp
                  <span className="ml-1 text-xs font-normal text-gray-400">(con código de país, ej: +595981…)</span>
                </label>
                <input type="tel" value={editTel} onChange={e => setEditTel(e.target.value)}
                  className={inputCls} placeholder="+595981000000" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={editActivo} onChange={e => setEditActivo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Usuario activo</span>
              </label>
              {editingUser.id === currentUserId && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Estás editando tu propia cuenta. Los cambios de rol tendrán efecto en el próximo inicio de sesión.
                </p>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleEditar} disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Compartir Link ── */}
      {shareUser && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Share2 size={18} className="text-emerald-600" />
                  {shareData?.tipo === 'reset' ? 'Compartir link para crear contraseña' : 'Compartir invitación'}
                </h3>
                <p className="text-xs text-gray-400">
                  {shareUser.primerNombre} {shareUser.primerApellido} · {shareUser.email}
                </p>
              </div>
              <button onClick={() => { setShareUser(null); setShareData(null); setCopied(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              {shareLoading && <p className="text-sm text-gray-500 text-center py-6">Generando link...</p>}

              {shareData && (
                <>
                  <p className="text-xs text-gray-500">
                    Si el email no llega (spam, delay, etc), usá este link para enviar la invitación manualmente.
                    {shareData.tipo === 'activacion' ? ' El enlace vence en 48 horas.' : ' El enlace vence en 2 horas.'}
                  </p>

                  {/* Link */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Link de activación</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={shareData.link}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50"
                        onFocus={e => e.currentTarget.select()} />
                      <button onClick={() => handleCopy(shareData.link, 'link')}
                        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 shrink-0">
                        {copied === 'link' ? <><Check size={13} className="text-green-600" /> Copiado</> : <><Copy size={13} /> Copiar</>}
                      </button>
                    </div>
                  </div>

                  {/* Mensaje sugerido */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Mensaje sugerido</label>
                    <textarea readOnly value={shareData.mensaje} rows={5}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 resize-none"
                      onFocus={e => e.currentTarget.select()} />
                    <button onClick={() => handleCopy(shareData.mensaje, 'mensaje')}
                      className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                      {copied === 'mensaje' ? <><Check size={12} className="text-green-600" /> Mensaje copiado</> : <><Copy size={12} /> Copiar mensaje</>}
                    </button>
                  </div>

                  {!shareData.telefono && (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      El usuario no tiene teléfono registrado. WhatsApp se abrirá para que elijas el contacto manualmente.
                    </div>
                  )}
                  {shareData.telefono && (
                    <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      Teléfono registrado: <span className="font-mono text-gray-700">{shareData.telefono}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                    <button onClick={() => { setShareUser(null); setShareData(null); setCopied(null); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      Cerrar
                    </button>
                    <a href={shareData.whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                      <ExternalLink size={14} /> Abrir WhatsApp
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
