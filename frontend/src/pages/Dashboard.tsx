import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const rol = usuario.rolCodigo ?? '';
    const permisos = usuario.permisos ?? {};

    if (rol === 'COBRADOR')    { navigate('/cobranzas', { replace: true }); return; }
    if (rol === 'TESORERIA')   { navigate('/tesoreria', { replace: true }); return; }
    if (permisos.operaciones)  { navigate('/operaciones', { replace: true }); return; }
    if (permisos.cobranzas)    { navigate('/cobranzas', { replace: true }); return; }
    if (permisos.tesoreria)    { navigate('/tesoreria', { replace: true }); return; }
    if (permisos.admin)        { navigate('/admin/usuarios', { replace: true }); return; }
    navigate('/operaciones', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Redirigiendo...</p>
    </div>
  );
}
