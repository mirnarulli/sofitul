import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface Logos { logo_barra_menu_claro?: string; logo_iso?: string; }
interface Empresa { empresa_nombre: string; empresa_ruc: string; empresa_direccion: string; empresa_ciudad: string; }

const DEFAULT_EMPRESA: Empresa = { empresa_nombre: 'SOFITUL', empresa_ruc: '', empresa_direccion: '', empresa_ciudad: 'Asunción, Paraguay' };

const LogosCtx = createContext<{ logos: Logos; empresa: Empresa }>({ logos: {}, empresa: DEFAULT_EMPRESA });
export const useLogos   = () => useContext(LogosCtx);
export const useEmpresa = () => useContext(LogosCtx).empresa;

export function LogosProvider({ children }: { children: React.ReactNode }) {
  const [logos,   setLogos]   = useState<Logos>({});
  const [empresa, setEmpresa] = useState<Empresa>(DEFAULT_EMPRESA);

  useEffect(() => {
    api.get('/configuracion/logos')
      .then(r => setLogos(r.data))
      .catch(() => {});

    api.get('/configuracion/empresa')
      .then(r => setEmpresa(r.data))
      .catch(() => {});
  }, []);

  return <LogosCtx.Provider value={{ logos, empresa }}>{children}</LogosCtx.Provider>;
}
