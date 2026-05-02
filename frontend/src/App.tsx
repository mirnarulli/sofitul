import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useVersionCheck } from './hooks/useVersionCheck';
import ProtectedRoute from './components/ProtectedRoute';
import { LogosProvider } from './context/LogosContext';
import { EstadosProvider } from './context/EstadosContext';
import Layout from './components/Layout';

// ── Rutas estáticas (siempre en el bundle inicial) ───────────────────────────
import Login               from './pages/Login';
import RecuperarPassword   from './pages/RecuperarPassword';
import CompletarPerfil     from './pages/CompletarPerfil';
import Dashboard           from './pages/Dashboard';

// ── Rutas lazy (se cargan solo cuando el usuario navega a ellas) ─────────────
const Operaciones          = lazy(() => import('./pages/operaciones/Operaciones'));
const NuevaOperacion       = lazy(() => import('./pages/operaciones/NuevaOperacion'));
const OperacionDetalle     = lazy(() => import('./pages/operaciones/OperacionDetalle'));
const SimuladorDescuento   = lazy(() => import('./pages/operaciones/SimuladorDescuento'));
const PagarePreview        = lazy(() => import('./pages/operaciones/PagarePreview'));
const FichaOperacion       = lazy(() => import('./pages/operaciones/FichaOperacion'));
const AnalisisCredito      = lazy(() => import('./pages/operaciones/AnalisisCredito'));
const DashboardOperaciones = lazy(() => import('./pages/operaciones/DashboardOperaciones'));

const Contactos            = lazy(() => import('./pages/contactos/Contactos'));
const NuevaPersonaFisica   = lazy(() => import('./pages/contactos/NuevaPersonaFisica'));
const ContactoPFDetalle    = lazy(() => import('./pages/contactos/ContactoPFDetalle'));
const NuevaEmpresa         = lazy(() => import('./pages/contactos/NuevaEmpresa'));
const ContactoPJDetalle    = lazy(() => import('./pages/contactos/ContactoPJDetalle'));

const Cobranzas            = lazy(() => import('./pages/cobranzas/Cobranzas'));
const Tesoreria            = lazy(() => import('./pages/tesoreria/Tesoreria'));

const DashboardRecupero    = lazy(() => import('./pages/dashboards/DashboardRecupero'));
const DashboardDesembolsos = lazy(() => import('./pages/dashboards/DashboardDesembolsos'));

const Usuarios             = lazy(() => import('./pages/admin/Usuarios'));
const GestionRoles         = lazy(() => import('./pages/admin/GestionRoles'));
const BitacoraAdmin        = lazy(() => import('./pages/admin/BitacoraAdmin'));

const Monedas              = lazy(() => import('./pages/panel/Monedas'));
const ProductosFinancieros = lazy(() => import('./pages/panel/ProductosFinancieros'));
const InformesRigor        = lazy(() => import('./pages/panel/InformesRigor'));
const TiposDocumentoAdjunto= lazy(() => import('./pages/panel/TiposDocumentoAdjunto'));
const Cajas                = lazy(() => import('./pages/panel/Cajas'));
const Paises               = lazy(() => import('./pages/panel/Paises'));
const TiposDocumento       = lazy(() => import('./pages/panel/TiposDocumento'));
const EstadosOperacion     = lazy(() => import('./pages/panel/EstadosOperacion'));
const Configuracion        = lazy(() => import('./pages/panel/Configuracion'));
const Bancos               = lazy(() => import('./pages/panel/Bancos'));
const ClientesVetados      = lazy(() => import('./pages/panel/ClientesVetados'));
const Feriados             = lazy(() => import('./pages/panel/Feriados'));
const Integraciones        = lazy(() => import('./pages/panel/Integraciones'));
const Empresa              = lazy(() => import('./pages/panel/Empresa'));

// ── Fallback de carga ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  useVersionCheck();

  return (
    <LogosProvider>
    <EstadosProvider>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login"              element={<Login />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/completar-perfil"   element={<CompletarPerfil />} />

          {/* Protected */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Operaciones */}
            <Route path="/operaciones/dashboard" element={<DashboardOperaciones />} />
            <Route path="/operaciones"           element={<Operaciones />} />
            <Route path="/operaciones/simulador" element={<SimuladorDescuento />} />
            <Route path="/operaciones/:id/pagare"    element={<PagarePreview />} />
            <Route path="/operaciones/:id/solicitud" element={<FichaOperacion />} />
            <Route path="/operaciones/:id/analisis"  element={<AnalisisCredito />} />
            <Route path="/operaciones/nueva"         element={<NuevaOperacion />} />
            <Route path="/operaciones/:id"           element={<OperacionDetalle />} />

            {/* Contactos */}
            <Route path="/contactos"                  element={<Contactos />} />
            <Route path="/contactos/personas"         element={<Contactos />} />
            <Route path="/contactos/personas/nuevo"   element={<NuevaPersonaFisica />} />
            <Route path="/contactos/personas/:id"     element={<ContactoPFDetalle />} />
            <Route path="/contactos/empresas"         element={<Contactos />} />
            <Route path="/contactos/empresas/nuevo"   element={<NuevaEmpresa />} />
            <Route path="/contactos/empresas/:id"     element={<ContactoPJDetalle />} />

            {/* Cobranzas */}
            <Route path="/cobranzas" element={<Cobranzas />} />

            {/* Tesorería */}
            <Route path="/tesoreria" element={<Tesoreria />} />

            {/* Dashboards */}
            <Route path="/dashboards/recupero"    element={<DashboardRecupero />} />
            <Route path="/dashboards/desembolsos" element={<DashboardDesembolsos />} />

            {/* Administración */}
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/roles"    element={<GestionRoles />} />
            <Route path="/admin/bitacora" element={<BitacoraAdmin />} />

            {/* Panel Global */}
            <Route path="/panel/monedas"            element={<Monedas />} />
            <Route path="/panel/cajas"              element={<Cajas />} />
            <Route path="/panel/paises"             element={<Paises />} />
            <Route path="/panel/tipos-documento"    element={<TiposDocumento />} />
            <Route path="/panel/estados-operacion"  element={<EstadosOperacion />} />
            <Route path="/panel/productos-financieros" element={<ProductosFinancieros />} />
            <Route path="/panel/informes-rigor"     element={<InformesRigor />} />
            <Route path="/panel/tipos-doc-adjunto"  element={<TiposDocumentoAdjunto />} />
            <Route path="/panel/bancos"             element={<Bancos />} />
            <Route path="/panel/clientes-vetados"   element={<ClientesVetados />} />
            <Route path="/panel/feriados"           element={<Feriados />} />
            <Route path="/panel/configuracion"      element={<Configuracion />} />
            <Route path="/panel/integraciones"      element={<Integraciones />} />
            <Route path="/panel/empresa"            element={<Empresa />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </EstadosProvider>
    </LogosProvider>
  );
}
