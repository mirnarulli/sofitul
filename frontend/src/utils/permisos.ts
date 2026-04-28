import type { Modulo } from '../types';

export function getUsuario() {
  try { return JSON.parse(localStorage.getItem('usuario') || '{}'); } catch { return {}; }
}

export function canView(modulo: Modulo | Modulo[]): boolean {
  const u = getUsuario();
  const permisos = u.permisos ?? {};
  const modulos = Array.isArray(modulo) ? modulo : [modulo];
  return modulos.some(m => !!permisos[m] || !!permisos['admin']);
}

export function isAdmin(): boolean {
  const u = getUsuario();
  return ['ADMIN', 'SUPER_ADMIN'].includes(u.rolCodigo ?? '');
}

export { type Modulo };
