/**
 * BarH — barra de progreso horizontal CSS-only.
 * Extraída de DashboardOperaciones donde era inline.
 * También usada en AnalisisCredito (barra de legajo).
 */
interface Props {
  value:   number;
  max:     number;
  color?:  string;   // clase Tailwind, ej: 'bg-blue-500'
  height?: string;   // clase Tailwind, ej: 'h-2'
}

export function BarH({ value, max, color = 'bg-blue-500', height = 'h-5' }: Props) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
      <div
        className={`${color} ${height} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
