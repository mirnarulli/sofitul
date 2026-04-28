import { Navigate } from 'react-router-dom';
import Layout from './Layout';
import { canView, type Modulo } from '../utils/permisos';

interface Props {
  children: React.ReactNode;
  modulo?: Modulo | Modulo[];
}

export default function ProtectedRoute({ children, modulo }: Props) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  if (modulo && !canView(modulo)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-300">403</p>
            <p className="text-gray-500 mt-2">No tenés permiso para acceder a esta sección.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}
