import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authApi from '../services/authApi';

export default function CompletarPerfil() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token') ?? '';
  const [info,    setInfo]    = useState<{ email?: string; primerNombre?: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    authApi.validarToken(token)
      .then(setInfo)
      .catch(() => { setError('Token inválido o expirado.'); });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const data = await authApi.activarCuenta(token, password);
      localStorage.setItem('token',         data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al activar cuenta');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Activar cuenta</h1>
        {info && <p className="text-sm text-gray-500 mb-6">Bienvenido/a {info.primerNombre} — {info.email}</p>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading || !info}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Activando...' : 'Activar cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
