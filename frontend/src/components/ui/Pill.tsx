/**
 * Pill — etiqueta redondeada (rounded-full) reutilizable.
 * Cubre: PEP/FATCA en ContactoPF/PJ, rol/estado en Usuarios,
 * canal en DashboardOperaciones.
 *
 * Props:
 *   label     — texto
 *   color     — nombre de color Tailwind sin prefijo ('blue','green','red','violet', etc.)
 *   size      — 'sm' (px-2 py-0.5 text-xs) | 'md' (px-3 py-1 text-xs)  default: 'sm'
 *   bold      — font-bold, default false
 *   className — override adicional
 */

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-100   text-blue-700',
  green:  'bg-green-100  text-green-700',
  red:    'bg-red-100    text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  amber:  'bg-amber-100  text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  violet: 'bg-violet-50  text-violet-700',
  gray:   'bg-gray-100   text-gray-500',
  slate:  'bg-slate-100  text-slate-600',
  teal:   'bg-teal-100   text-teal-700',
  emerald:'bg-emerald-100 text-emerald-700',
};

const SIZE_MAP = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1   text-xs',
};

interface Props {
  label:      string;
  color?:     keyof typeof COLOR_MAP;
  size?:      keyof typeof SIZE_MAP;
  bold?:      boolean;
  className?: string;
}

export function Pill({ label, color = 'gray', size = 'sm', bold = false, className = '' }: Props) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.gray;
  const sizes  = SIZE_MAP[size];
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizes} ${colors} ${bold ? 'font-bold' : ''} ${className}`}>
      {label}
    </span>
  );
}
