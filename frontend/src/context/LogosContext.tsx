import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface Logos { logo_barra_menu_claro?: string; logo_iso?: string; }

const LogosCtx = createContext<{ logos: Logos }>({ logos: {} });
export const useLogos = () => useContext(LogosCtx);

export function LogosProvider({ children }: { children: React.ReactNode }) {
  const [logos, setLogos] = useState<Logos>({});

  useEffect(() => {
    api.get('/configuracion/logos')
      .then(r => setLogos(r.data))
      .catch(() => {/* silenciar si no hay config */});
  }, []);

  return <LogosCtx.Provider value={{ logos }}>{children}</LogosCtx.Provider>;
}
