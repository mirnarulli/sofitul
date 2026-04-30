import { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Users, Wallet, Settings, Coins, Globe, UserCog, LogOut,
  ChevronDown, ChevronRight, Menu, X, Landmark, BarChart2, TrendingUp,
  ClipboardList, Bell, LayoutDashboard, Plus, Tag, Briefcase, Calculator, Package, ShieldOff, CalendarDays,
} from 'lucide-react';
import { useLogos } from '../context/LogosContext';
import { canView, type Modulo } from '../utils/permisos';

const LayoutMountedCtx = createContext(false);

type NavItem    = { icon: React.ElementType; label: string; path: string; disabled?: boolean };
type NavSection = { label?: string; items: NavItem[] };
type NavModule  = { id: string; label: string; icon: React.ElementType; pathPrefix: string; moduloPermiso?: Modulo; sections: NavSection[] };

const MODULES: NavModule[] = [
  {
    id: 'operaciones', label: 'Operaciones', icon: FileText, pathPrefix: '/operaciones',
    moduloPermiso: 'operaciones',
    sections: [{
      items: [
        { icon: BarChart2,   label: 'Dashboard',            path: '/operaciones/dashboard' },
        { icon: Calculator,  label: 'Simulador Dto. Cheques', path: '/operaciones/simulador' },
        { icon: Plus,        label: 'Nueva Operación',       path: '/operaciones/nueva' },
        { icon: FileText,    label: 'Todas las Operaciones', path: '/operaciones' },
      ],
    }],
  },
  {
    id: 'contactos', label: 'Contactos', icon: Users, pathPrefix: '/contactos',
    moduloPermiso: 'contactos',
    sections: [{
      items: [
        { icon: Users,    label: 'Personas Físicas', path: '/contactos/personas' },
        { icon: Briefcase, label: 'Personas Jurídicas', path: '/contactos/empresas' },
      ],
    }],
  },
  {
    id: 'cobranzas', label: 'Cobranzas', icon: ClipboardList, pathPrefix: '/cobranzas',
    moduloPermiso: 'cobranzas',
    sections: [{
      items: [
        { icon: ClipboardList, label: 'Cartera', path: '/cobranzas' },
        { icon: BarChart2,     label: 'Dashboard Recupero', path: '/dashboards/recupero' },
      ],
    }],
  },
  {
    id: 'tesoreria', label: 'Tesorería', icon: Wallet, pathPrefix: '/tesoreria',
    moduloPermiso: 'tesoreria',
    sections: [{
      items: [
        { icon: Wallet,     label: 'Desembolsos', path: '/tesoreria' },
        { icon: BarChart2,  label: 'Dashboard Desembolsos', path: '/dashboards/desembolsos' },
        { icon: TrendingUp, label: 'Inventario Capital', path: '/tesoreria/inventario' },
      ],
    }],
  },
  {
    id: 'admin', label: 'Administración', icon: UserCog, pathPrefix: '/admin',
    moduloPermiso: 'admin',
    sections: [{
      items: [
        { icon: Users,         label: 'Usuarios', path: '/admin/usuarios' },
        { icon: Tag,           label: 'Roles', path: '/admin/roles' },
        { icon: ClipboardList, label: 'Bitácora', path: '/admin/bitacora' },
      ],
    }],
  },
  {
    id: 'panel', label: 'Panel Global', icon: Settings, pathPrefix: '/panel',
    moduloPermiso: 'panel_global',
    sections: [{
      items: [
        { icon: Coins,          label: 'Monedas',              path: '/panel/monedas' },
        { icon: Landmark,       label: 'Cajas',                path: '/panel/cajas' },
        { icon: Globe,          label: 'Países',               path: '/panel/paises' },
        { icon: FileText,       label: 'Tipos de documento',   path: '/panel/tipos-documento' },
        { icon: Package,        label: 'Productos Financieros', path: '/panel/productos-financieros' },
        { icon: ClipboardList,  label: 'Servicios Datos',       path: '/panel/informes-rigor' },
        { icon: FileText,       label: 'Tipos Doc. Adjunto',   path: '/panel/tipos-doc-adjunto' },
        { icon: Landmark,       label: 'Bancos',               path: '/panel/bancos' },
        { icon: CalendarDays,   label: 'Feriados',             path: '/panel/feriados' },
        { icon: ShieldOff,      label: 'Clientes Vetados',     path: '/panel/clientes-vetados' },
        { icon: LayoutDashboard, label: 'Configuración',       path: '/panel/configuracion' },
      ],
    }],
  },
];

const SIDEBAR_KEY = 'sofitul_sidebar_collapsed';

export default function Layout({ children }: { children: React.ReactNode }) {
  const already = useContext(LayoutMountedCtx);
  if (already) return <>{children}</>;
  return <LayoutInner>{children}</LayoutInner>;
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logos } = useLogos();

  const [collapsed,    setCollapsed]    = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');
  const [openModuleId, setOpenModuleId] = useState<string | null>(() => detectModule(location.pathname));
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [alertasPagare, setAlertasPagare] = useState(0);

  const usuario   = JSON.parse(localStorage.getItem('usuario') || '{}');
  const rolCodigo = usuario.rolCodigo ?? '';

  useEffect(() => {
    const m = detectModule(location.pathname);
    if (m) setOpenModuleId(m);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    import('../services/operacionesApi').then(({ tesoreriaApi }) => {
      tesoreriaApi.getAlertasPagare()
        .then((data: any[]) => setAlertasPagare(data.length))
        .catch(() => {});
    });
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const toggleModule = (id: string) => {
    if (collapsed) { setCollapsed(false); localStorage.setItem(SIDEBAR_KEY, 'false'); setOpenModuleId(id); }
    else setOpenModuleId(p => p === id ? null : id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path.length > 1 && location.pathname.startsWith(path + '/'));

  const canAccess = (m: Modulo | undefined) => !m || canView(m);

  const SidebarContent = () => (
    <div className={`flex flex-col h-full py-3 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2'}`}>
      {MODULES.filter(m => canAccess(m.moduloPermiso)).map(module => {
        const Icon    = module.icon;
        const isOpen  = openModuleId === module.id;
        const isCurr  = location.pathname.startsWith(module.pathPrefix);

        if (collapsed) {
          return (
            <button key={module.id} onClick={() => toggleModule(module.id)} title={module.label}
              className={`flex items-center justify-center w-full p-2.5 rounded-lg transition-colors ${isCurr ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Icon size={19} />
            </button>
          );
        }

        return (
          <div key={module.id}>
            <button onClick={() => toggleModule(module.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${isCurr ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Icon size={17} className="shrink-0" />
              <span className="text-sm font-semibold flex-1 text-left">{module.label}</span>
              {isOpen ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
            </button>
            {isOpen && (
              <div className="ml-1.5 mt-0.5 mb-1 space-y-0.5">
                {module.sections.flatMap(s => s.items).map(item => {
                  const IIcon  = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                      <IIcon size={15} className="shrink-0" />
                      <span className="text-sm truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button onClick={toggleCollapsed} className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <Menu size={20} />
        </button>

        <Link to="/dashboard" className="flex items-center shrink-0">
          {logos.logo_barra_menu_claro
            ? <img src={logos.logo_barra_menu_claro} alt="Logo" className="h-8 max-w-[160px] object-contain" />
            : <span className="text-lg font-bold text-blue-700 tracking-tight">SOFITUL</span>
          }
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {alertasPagare > 0 && (
            <Link to="/tesoreria" className="relative p-2 rounded-lg text-amber-500 hover:bg-amber-50">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {alertasPagare}
              </span>
            </Link>
          )}

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm text-gray-700 font-medium leading-tight">
              {usuario.primerNombre} {usuario.primerApellido}
            </span>
            {rolCodigo && <span className="text-xs text-gray-400 leading-tight">{rolCodigo}</span>}
          </div>

          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={16} />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <div className={`hidden lg:block shrink-0 transition-[width] duration-200 ${collapsed ? 'w-14' : 'w-52'}`} aria-hidden />

        <aside className={`hidden lg:flex flex-col fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 overflow-y-auto z-20 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
          <SidebarContent />
        </aside>

        {mobileOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside className={`fixed top-16 left-0 bottom-0 w-52 bg-white border-r border-gray-200 overflow-y-auto z-30 lg:hidden transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </aside>

        <main className="flex-1 min-w-0">
          <LayoutMountedCtx.Provider value={true}>
            {children}
          </LayoutMountedCtx.Provider>
        </main>
      </div>
    </div>
  );
}

function detectModule(pathname: string): string | null {
  if (pathname.startsWith('/operaciones'))   return 'operaciones';
  if (pathname.startsWith('/contactos'))     return 'contactos';
  if (pathname.startsWith('/cobranzas'))     return 'cobranzas';
  if (pathname.startsWith('/tesoreria'))     return 'tesoreria';
  if (pathname.startsWith('/dashboards'))    return 'cobranzas';
  if (pathname.startsWith('/admin'))         return 'admin';
  if (pathname.startsWith('/panel'))         return 'panel';
  return null;
}
