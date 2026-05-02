/**
 * FinancialTables — editores JSONB para el perfil financiero de un contacto PF.
 *
 * Componentes:
 *   MontoTable  — lista de { concepto, monto }  (ingresos / egresos)
 *   ValorTable  — lista de { descripcion, valor } (activos / pasivos)
 *   RefTable    — lista de { nombre, telefono, relacion } (referencias personales)
 *
 * Todos aceptan `editing: boolean` y llaman `onChange` para actualizar en el padre.
 */

import { Plus, Trash2 } from 'lucide-react';
import { formatGs } from '../../utils/formatters';

const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type MontoRow = { concepto: string; monto: number };
export type ValorRow = { descripcion: string; valor: number };
export type RefRow   = { nombre: string; telefono: string; relacion: string };

// ── MontoTable ────────────────────────────────────────────────────────────────

export function MontoTable({ rows, onChange, editing }: {
  rows: MontoRow[]; onChange: (r: MontoRow[]) => void; editing: boolean;
}) {
  const total = rows.reduce((s, r) => s + (Number(r.monto) || 0), 0);
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin datos cargados</p>;
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2 items-center">
          {editing
            ? <>
                <input value={r.concepto} onChange={e => { const n=[...rows]; n[i]={...n[i],concepto:e.target.value}; onChange(n); }}
                  placeholder="Concepto" className={`${inputCls} flex-1`} />
                <input type="number" value={r.monto} onChange={e => { const n=[...rows]; n[i]={...n[i],monto:Number(e.target.value)}; onChange(n); }}
                  placeholder="Monto Gs." className={`${inputCls} w-36`} />
                <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
              </>
            : <div className="flex justify-between w-full text-sm">
                <span className="text-gray-700">{r.concepto}</span>
                <span className="font-mono">{formatGs(r.monto)}</span>
              </div>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { concepto: '', monto: 0 }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
          <Plus size={12}/> Agregar
        </button>
      )}
      {rows.length > 0 && (
        <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-sm">
          <span>Total</span><span className="font-mono">{formatGs(total)}</span>
        </div>
      )}
    </div>
  );
}

// ── ValorTable ────────────────────────────────────────────────────────────────

export function ValorTable({ rows, onChange, editing }: {
  rows: ValorRow[]; onChange: (r: ValorRow[]) => void; editing: boolean;
}) {
  const total = rows.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin datos cargados</p>;
  return (
    <div className="space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2 items-center">
          {editing
            ? <>
                <input value={r.descripcion} onChange={e => { const n=[...rows]; n[i]={...n[i],descripcion:e.target.value}; onChange(n); }}
                  placeholder="Descripción" className={`${inputCls} flex-1`} />
                <input type="number" value={r.valor} onChange={e => { const n=[...rows]; n[i]={...n[i],valor:Number(e.target.value)}; onChange(n); }}
                  placeholder="Valor Gs." className={`${inputCls} w-36`} />
                <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
              </>
            : <div className="flex justify-between w-full text-sm">
                <span className="text-gray-700">{r.descripcion}</span>
                <span className="font-mono">{formatGs(r.valor)}</span>
              </div>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { descripcion: '', valor: 0 }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
          <Plus size={12}/> Agregar
        </button>
      )}
      {rows.length > 0 && (
        <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-sm">
          <span>Total</span><span className="font-mono">{formatGs(total)}</span>
        </div>
      )}
    </div>
  );
}

// ── RefTable ──────────────────────────────────────────────────────────────────

export function RefTable({ rows, onChange, editing }: {
  rows: RefRow[]; onChange: (r: RefRow[]) => void; editing: boolean;
}) {
  if (!editing && rows.length === 0) return <p className="text-xs text-gray-400 italic">Sin referencias cargadas</p>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className={editing ? 'grid grid-cols-3 gap-2 items-center' : 'flex gap-4 text-sm border-b pb-1'}>
          {editing
            ? <>
                <input value={r.nombre} onChange={e => { const n=[...rows]; n[i]={...n[i],nombre:e.target.value}; onChange(n); }}
                  placeholder="Nombre" className={inputCls} />
                <input value={r.telefono} onChange={e => { const n=[...rows]; n[i]={...n[i],telefono:e.target.value}; onChange(n); }}
                  placeholder="Teléfono" className={inputCls} />
                <div className="flex gap-1">
                  <input value={r.relacion} onChange={e => { const n=[...rows]; n[i]={...n[i],relacion:e.target.value}; onChange(n); }}
                    placeholder="Relación" className={`${inputCls} flex-1`} />
                  <button onClick={() => onChange(rows.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                </div>
              </>
            : <>
                <span className="font-medium text-gray-800 flex-1">{r.nombre}</span>
                <span className="text-gray-500">{r.telefono}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.relacion}</span>
              </>
          }
        </div>
      ))}
      {editing && (
        <button onClick={() => onChange([...rows, { nombre: '', telefono: '', relacion: '' }])}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
          <Plus size={12}/> Agregar referencia
        </button>
      )}
    </div>
  );
}
