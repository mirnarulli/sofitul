import { useEstados } from '../context/EstadosContext';

// Fallback para estados que no estén en la tabla estados_operacion
// (cuotas, estados legacy, etc.)
const COLORS: Record<string, string> = {
  FORMULARIO_CARGADO:     'bg-gray-100 text-gray-600',
  DATOS_PENDIENTES:       'bg-amber-100 text-amber-700',
  REFERENCIAS_PENDIENTES: 'bg-amber-100 text-amber-700',
  EN_ANALISIS:            'bg-blue-100 text-blue-700',
  OBSERVADO:              'bg-red-100 text-red-700',
  APROBADO:               'bg-green-100 text-green-700',
  RECHAZADO:              'bg-red-100 text-red-700',
  EN_LEGAJO:              'bg-purple-100 text-purple-700',
  DOCUMENTOS_GENERADOS:   'bg-purple-100 text-purple-700',
  PENDIENTE_PAGARE:       'bg-amber-100 text-amber-700',
  EN_TESORERIA:           'bg-indigo-100 text-indigo-700',
  DESEMBOLSO_PENDIENTE:   'bg-amber-100 text-amber-700',
  DESEMBOLSADO:           'bg-emerald-100 text-emerald-700',
  EN_COBRANZA:            'bg-blue-100 text-blue-700',
  COBRADO:                'bg-green-100 text-green-700',
  MORA:                   'bg-red-100 text-red-700',
  PRORROGADO:             'bg-orange-100 text-orange-700',
  RENOVADO:               'bg-sky-100 text-sky-700',
  CERRADO:                'bg-gray-100 text-gray-500',
  VIGENTE:                'bg-green-100 text-green-700',
  VENCIDO:                'bg-red-100 text-red-700',
  PROXIMO:                'bg-amber-100 text-amber-700',
  PENDIENTE:              'bg-gray-100 text-gray-600',
  PAGADO:                 'bg-green-100 text-green-700',
};

/**
 * Convierte un color hex a un inline style para el badge.
 * Fondo: hex con 15 % de opacidad (#rrggbb25)
 * Texto: el mismo hex (readable sobre fondo muy claro)
 */
function hexToStyle(hex: string): React.CSSProperties {
  return {
    backgroundColor: hex + '25', // ~15 % opacidad — equivale a bg-blue-100
    color:           hex,
  };
}

interface Props {
  estado:  string;
  label?:  string;  // sobreescribe tanto el nombre del DB como el código
}

export default function StatusBadge({ estado, label }: Props) {
  const estadosMap = useEstados();
  const info       = estadosMap[estado];

  // Prioridad: label prop > nombre del DB > código formateado
  const texto = label ?? info?.nombre ?? estado.replace(/_/g, ' ');

  // Si el DB tiene un color configurado y no está vacío → inline style dinámico
  if (info?.color) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={hexToStyle(info.color)}
      >
        {texto}
      </span>
    );
  }

  // Fallback: clase Tailwind hardcodeada (estados de cuota, legacy, sin color DB)
  const cls = COLORS[estado] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {texto}
    </span>
  );
}
