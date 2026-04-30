import { createContext, useContext, useEffect, useState } from 'react';
import { panelGlobalApi } from '../services/contactosApi';

export interface EstadoInfo {
  codigo:      string;
  nombre:      string;
  color:       string;   // hex, ej: '#3b82f6'
  esTerminal?: boolean;
  esInicial?:  boolean;
}

type EstadosMap = Record<string, EstadoInfo>;

const EstadosCtx = createContext<EstadosMap>({});

export const useEstados = () => useContext(EstadosCtx);

export function EstadosProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<EstadosMap>({});

  useEffect(() => {
    panelGlobalApi.getEstadosOperacion()
      .then((list: any[]) => {
        const m: EstadosMap = {};
        list.forEach(e => {
          m[e.codigo] = {
            codigo:      e.codigo,
            nombre:      e.nombre,
            color:       e.color ?? '',
            esTerminal:  e.esTerminal,
            esInicial:   e.esInicial,
          };
        });
        setMap(m);
      })
      .catch(() => {/* sin token o sin estados configurados — fallback a COLORS */});
  }, []);

  return <EstadosCtx.Provider value={map}>{children}</EstadosCtx.Provider>;
}
