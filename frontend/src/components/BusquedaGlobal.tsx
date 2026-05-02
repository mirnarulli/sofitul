/**
 * BusquedaGlobal — barra de búsqueda unificada en el header.
 * Busca operaciones, personas físicas y personas jurídicas.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Building2, X } from 'lucide-react';
import { operacionesApi } from '../services/operacionesApi';

type ResultItem = { tipo: string; id: string; titulo: string; subtitulo: string; url: string };

const TIPO_ICON: Record<string, React.ElementType> = {
  operacion: FileText,
  persona:   User,
  empresa:   Building2,
};

const TIPO_LABEL: Record<string, string> = {
  operacion: 'Operación',
  persona:   'Persona',
  empresa:   'Empresa',
};

const TIPO_COLOR: Record<string, string> = {
  operacion: 'text-blue-600 bg-blue-50',
  persona:   'text-teal-600 bg-teal-50',
  empresa:   'text-violet-600 bg-violet-50',
};

export default function BusquedaGlobal() {
  const navigate = useNavigate();
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<ResultItem[]>([]);
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(-1);
  const inputRef  = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await operacionesApi.busquedaGlobal(q.trim());
        setResults(data);
        setOpen(true);
        setSelected(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goTo = (url: string) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(p => Math.min(p + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(p => Math.max(p - 1, 0));
    } else if (e.key === 'Enter' && selected >= 0) {
      e.preventDefault();
      goTo(results[selected].url);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative hidden sm:block w-56 lg:w-72">
      {/* Input */}
      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-colors">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar operación, cliente..."
          className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800 min-w-0"
        />
        {loading && (
          <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="shrink-0 text-gray-300 hover:text-gray-500">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.map((r, i) => {
            const Icon     = TIPO_ICON[r.tipo] ?? FileText;
            const colorCls = TIPO_COLOR[r.tipo] ?? 'text-gray-600 bg-gray-50';
            const isActive = selected === i;
            return (
              <button
                key={r.id}
                onMouseDown={() => goTo(r.url)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <span className={`p-1 rounded-md shrink-0 ${colorCls}`}>
                  <Icon size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.titulo}</p>
                  <p className="text-xs text-gray-400 truncate">{r.subtitulo}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded ${colorCls}`}>
                  {TIPO_LABEL[r.tipo] ?? r.tipo}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-4 py-5 text-center">
          <p className="text-sm text-gray-400">Sin resultados para <span className="font-medium text-gray-600">"{query}"</span></p>
        </div>
      )}
    </div>
  );
}
