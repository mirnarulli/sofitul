/**
 * Field — wrapper label + children para formularios de contacto.
 * Info  — par label/valor en modo lectura (dt/dd).
 * Extraídos de ContactoPFDetalle y ContactoPJDetalle donde eran idénticos.
 */

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
      {children}
    </div>
  );
}

export function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800 font-medium">{value || '—'}</dd>
    </div>
  );
}
