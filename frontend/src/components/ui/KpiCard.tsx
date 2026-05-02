/**
 * KpiCard — card de indicador KPI para dashboards.
 *
 * Variantes:
 *   default  — fondo blanco, icono en chip de color arriba-derecha
 *   gradient — fondo emerald-to-teal, texto blanco (Interés Generado)
 *   alert    — fondo blanco en reposo, rojo cuando highlight=true (Mora)
 *
 * Props:
 *   label      texto del indicador (uppercase small)
 *   value      valor principal (grande, bold)
 *   sub?       texto secundario debajo del valor
 *   icon?      nodo React (ícono lucide)
 *   iconBg?    clase Tailwind para el chip del ícono, ej: 'bg-blue-50'
 *   iconColor? clase Tailwind para el color del ícono, ej: 'text-blue-600'
 *   variant?   'default' | 'gradient' | 'alert'   default: 'default'
 *   highlight? para variant=alert: activa colores de alerta
 *   className? override de layout (col-span, hidden, etc.)
 */

interface Props {
  label:       string;
  value:       string | number;
  sub?:        string;
  icon?:       React.ReactNode;
  iconBg?:     string;
  iconColor?:  string;
  variant?:    'default' | 'gradient' | 'alert';
  highlight?:  boolean;
  className?:  string;
}

export function KpiCard({
  label, value, sub,
  icon, iconBg = 'bg-gray-50', iconColor = 'text-gray-400',
  variant = 'default',
  highlight = false,
  className = '',
}: Props) {

  /* ── gradient ─────────��───────────────────────────────────── */
  if (variant === 'gradient') {
    return (
      <div className={`bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-sm p-5 text-white ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">{label}</span>
          {icon && <div className="p-1.5 bg-white/20 rounded-lg">{icon}</div>}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-emerald-100 mt-1">{sub}</p>}
      </div>
    );
  }

  /* ── alert ───────────────────────���─────────────────────────�� */
  if (variant === 'alert') {
    const active = !!highlight;
    return (
      <div className={`rounded-2xl border shadow-sm p-5 transition-colors ${
        active ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
      } ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${active ? 'text-red-400' : 'text-gray-400'}`}>
            {label}
          </span>
          {icon && (
            <div className={`p-1.5 rounded-lg ${active ? 'bg-red-100' : 'bg-gray-50'}`}>
              <span className={active ? 'text-red-500' : 'text-gray-400'}>{icon}</span>
            </div>
          )}
        </div>
        <p className={`text-2xl font-bold ${active ? 'text-red-700' : 'text-gray-300'}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${active ? 'text-red-500' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    );
  }

  /* ── default ───────────────────────────��──────────────────── */
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <div className={`p-1.5 rounded-lg ${iconBg}`}><span className={iconColor}>{icon}</span></div>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
