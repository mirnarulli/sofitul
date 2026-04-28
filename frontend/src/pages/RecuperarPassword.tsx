import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import authApi from '../services/authApi';

export default function RecuperarPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authApi.olvideMiPassword(email);
      setMsg(r.mensaje);
    } catch (err: any) {
      setMsg(err.response?.data?.message ?? 'Error');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authApi.resetPassword(token!, password);
      setMsg(r.mensaje + ' — Podés iniciar sesión.');
    } catch (err: any) {
      setMsg(err.response?.data?.message ?? 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Recuperar contraseña</h1>

        {msg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-3 rounded-lg mb-4">{msg}</div>
        ) : token ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSolicitar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-blue-600 hover:underline">Volver al login</Link>
        </div>
      </div>
    </div>
  );
}
