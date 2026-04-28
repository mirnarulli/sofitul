export function formatGs(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  return 'Gs. ' + num.toLocaleString('es-PY', { maximumFractionDigits: 0 });
}

export function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function diasHasta(fechaVencimiento: string): number {
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento + 'T00:00:00');
  return Math.round((venc.getTime() - hoy.getTime()) / 86400000);
}

export function calcularInteres(monto: number, tasaMensual: number, dias: number): number {
  return Math.round(monto * (tasaMensual / 100) * (dias / 30));
}

export function calcularDias(fechaInicio: string, fechaFin: string): number {
  const a = new Date(fechaInicio + 'T00:00:00');
  const b = new Date(fechaFin   + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
