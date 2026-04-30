import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useVersionCheck } from './hooks/useVersionCheck';
import ProtectedRoute from './components/ProtectedRoute';
import { LogosProvider } from './context/LogosContext';
import { EstadosProvider } from './context/EstadosContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import CompletarPerfil from './pages/CompletarPerfil';
import Dashboard from './pages/Dashboard';

import Operaciones from './pages/operaciones/Operaciones';
import NuevaOperacion from './pages/operaciones/NuevaOperacion';
import OperacionDetalle from './pages/operaciones/OperacionDetalle';
import SimuladorDescuento from './pages/operaciones/SimuladorDescuento';
import PagarePreview      from './pages/operaciones/PagarePreview';
import FichaOperacion     from './pages/operaciones/FichaOperacion';
import AnalisisCredito    from './pages/operaciones/AnalisisCredito';

import Contactos from './pages/contactos/Contactos';
import NuevaPersonaFisica from './pages/contactos/NuevaPersonaFisica';
import ContactoPFDetalle from './pages/contactos/ContactoPFDetalle';
import NuevaEmpresa from './pages/contactos/NuevaEmpresa';
import ContactoPJDetalle from './pages/contactos/ContactoPJDetalle';

import Cobranzas from './pages/cobranzas/Cobranzas';

import Tesoreria from './pages/tesoreria/Tesoreria';

import DashboardRecupero from './pages/dashboards/DashboardRecupero';
import DashboardDesembolsos from './pages/dashboards/DashboardDesembolsos';
import DashboardOperaciones from './pages/operaciones/DashboardOperaciones';

import Usuarios from './pages/admin/Usuarios';
import GestionRoles from './pages/admin/GestionRoles';
import BitacoraAdmin from './pages/admin/BitacoraAdmin';

import Monedas from './pages/panel/Monedas';
import ProductosFinancieros    from './pages/panel/ProductosFinancieros';
import InformesRigor          from './pages/panel/InformesRigor';
import TiposDocumentoAdjunto  from './pages/panel/TiposDocumentoAdjunto';
import Cajas from './pages/panel/Cajas';
import Paises from './pages/panel/Paises';
import TiposDocumento from './pages/panel/TiposDocumento';
import EstadosOperacion from './pages/panel/EstadosOperacion';
import Configuracion from './pages/panel/Configuracion';
import Bancos from './pages/panel/Bancos';
import ClientesVetados from './pages/panel/ClientesVetados';
import Feriados from './pages/panel/Feriados';

export default function App() {
  useVersionCheck();

  return (
    <LogosProvider>
    <EstadosProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/completar-perfil" element={<CompletarPerfil />} />

        {/* Protected */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Operaciones */}
          <Route path="/operaciones/dashboard" element={<DashboardOperaciones />} />
          <Route path="/operaciones" element={<Operaciones />} />
          <Route path="/operaciones/simulador" element={<SimuladorDescuento />} />
          <Route path="/operaciones/:id/pagare" element={<PagarePreview />} />
          <Route path="/operaciones/:id/solicitud" element={<FichaOperacion />} />
          <Route path="/operaciones/:id/analisis" element={<AnalisisCredito />} />
          <Route path="/operaciones/nueva" element={<NuevaOperacion />} />
          <Route path="/operaciones/:id" element={<OperacionDetalle />} />

          {/* Contactos */}
          <Route path="/contactos" element={<Contactos />} />
          <Route path="/contactos/personas" element={<Contactos />} />
          <Route path="/contactos/personas/nuevo" element={<NuevaPersonaFisica />} />
          <Route path="/contactos/personas/:id" element={<ContactoPFDetalle />} />
          <Route path="/contactos/empresas" element={<Contactos />} />
          <Route path="/contactos/empresas/nuevo" element={<NuevaEmpresa />} />
          <Route path="/contactos/empresas/:id" element={<ContactoPJDetalle />} />

          {/* Cobranzas */}
          <Route path="/cobranzas" element={<Cobranzas />} />

          {/* Tesorería */}
          <Route path="/tesoreria" element={<Tesoreria />} />

          {/* Dashboards */}
          <Route path="/dashboards/recupero" element={<DashboardRecupero />} />
          <Route path="/dashboards/desembolsos" element={<DashboardDesembolsos />} />

          {/* Administración */}
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/roles" element={<GestionRoles />} />
          <Route path="/admin/bitacora" element={<BitacoraAdmin />} />

          {/* Panel Global */}
          <Route path="/panel/monedas" element={<Monedas />} />
          <Route path="/panel/cajas" element={<Cajas />} />
          <Route path="/panel/paises" element={<Paises />} />
          <Route path="/panel/tipos-documento" element={<TiposDocumento />} />
          <Route path="/panel/estados-operacion" element={<EstadosOperacion />} />
          <Route path="/panel/productos-financieros" element={<ProductosFinancieros />} />
          <Route path="/panel/informes-rigor"        element={<InformesRigor />} />
          <Route path="/panel/tipos-doc-adjunto"    element={<TiposDocumentoAdjunto />} />
          <Route path="/panel/bancos"               element={<Bancos />} />
          <Route path="/panel/clientes-vetados"     element={<ClientesVetados />} />
          <Route path="/panel/feriados"             element={<Feriados />} />
          <Route path="/panel/configuracion" element={<Configuracion />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </EstadosProvider>
    </LogosProvider>
  );
}
