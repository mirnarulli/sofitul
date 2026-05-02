/**
 * CalBadge — badge de calificación de cliente (A/B/C/D).
 * CALIFICACIONES se exporta para que los <select> de edición inline
 * también puedan iterar sobre la misma fuente de verdad.
 */
export const CALIFICACIONES = [
  { value: 'A', label: 'A — Excelente', color: 'bg-green-100 text-green-800'  },
  { value: 'B', label: 'B — Bueno',     color: 'bg-blue-100 text-blue-800'   },
  { value: 'C', label: 'C — Regular',   color: 'bg-yellow-100 text-yellow-800' },
  { value: 'D', label: 'D — Malo',      color: 'bg-red-100 text-red-800'     },
];

export function CalBadge({ cal }: { cal?: string }) {
  const c = CALIFICACIONES.find(q => q.value === cal);
  if (!c) return <span className="text-gray-400 text-xs">Sin calificación</span>;
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c.color}`}>{c.label}</span>;
}
