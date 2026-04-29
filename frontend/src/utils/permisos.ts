import type { Modulo } from '../types';

export function getUsuario() {
  try { return JSON.parse(localStorage.getItem('usuario') || '{}'); } catch { return {}; }
}

export function canView(modulo: Modulo | Modulo[]): boolean {
  const u = getUsuario();
  const permisos = u.permisos ?? {};
  // Acceso total: flag "all"/"*" o rol SUPERADMIN
  if (permisos['all'] || permisos['*'] || u.rolCodigo === 'SUPERADMIN') return true;
  const modulos = Array.isArray(modulo) ? modulo : [modulo];
  return modulos.some(m => !!permisos[m] || !!permisos['admin']);
}

export function isAdmin(): boolean {
  const u = getUsuario();
  return ['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN'].includes(u.rolCodigo ?? '');
}

export { type Modulo };
