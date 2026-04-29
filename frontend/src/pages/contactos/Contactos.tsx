import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, User } from 'lucide-react';
import { contactosApi } from '../../services/contactosApi';
import { formatDate } from '../../utils/formatters';

export default function Contactos() {
  const [tab, setTab] = useState<'pf' | 'pj'>('pf');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    const promise = tab === 'pf'
      ? contactosApi.getPersonasFisicas(q || undefined)
      : contactosApi.getEmpresas({ q: q || undefined });
    promise
      .then(r => setData(r.data ?? r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, q]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
          <p className="text-sm text-gray-500">{data.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Link to="/contactos/personas/nuevo"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={15} /> Persona Física
          </Link>
          <Link to="/contactos/empresas/nuevo"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus size={15} /> Empresa
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('pf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'pf' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <User size={14} /> Personas Físicas
        </button>
        <button onClick={() => setTab('pj')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'pj' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Building2 size={14} /> Empresas
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-2">
        <Search size={15} className="text-gray-400" />
        <input type="text" placeholder={tab === 'pf' ? 'Buscar por nombre o cédula...' : 'Buscar por razón social o RUC...'}
          value={q} onChange={e => setQ(e.target.value)}
          className="flex-1 text-sm border-0 outline-none bg-transparent" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay registros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                {tab === 'pf' ? (
                  <tr>{['Nombre','Documento','Teléfono','Email','Registrado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                ) : (
                  <tr>{['Razón Social','RUC','Rep. Legal','Teléfono','Registrado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((c: any) => tab === 'pf' ? (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.primerNombre} {c.primerApellido}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.numeroDoc}</td>
                    <td className="px-4 py-3 text-gray-600">{c.celular ?? c.telefono ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/contactos/personas/${c.id}`} className="text-blue-600 hover:underline text-xs font-medium">Ver</Link>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.razonSocial}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.ruc}</td>
                    <td className="px-4 py-3 text-gray-600">{c.repLegalNombre ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.telefono ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/contactos/empresas/${c.id}`} className="text-indigo-600 hover:underline text-xs font-medium">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
