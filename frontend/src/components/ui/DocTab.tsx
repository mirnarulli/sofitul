/**
 * DocTab — panel de gestión de documentos adjuntos a un contacto.
 *
 * Usado en ContactoPFDetalle y (a futuro) ContactoPJDetalle.
 *
 * Props:
 *   contactoTipo  'pf' | 'pj'
 *   contactoId    UUID del contacto
 *   categoria     'documentos' | 'due_diligence'
 *   documentos    lista ya filtrada por categoría
 *   tipos         tipos de doc activos ya filtrados por categoría
 *   apiBase       base URL para construir el href del archivo
 *   onReload      callback para recargar la lista desde el padre
 */

import { useState } from 'react';
import { Plus, Pencil, Save, X, FileText } from 'lucide-react';
import { documentosContactoApi } from '../../services/contactosApi';
import { formatDate } from '../../utils/formatters';

export function DocTab({
  contactoTipo, contactoId, categoria, documentos, tipos, apiBase, onReload,
}: {
  contactoTipo: string; contactoId: string; categoria: string;
  documentos: any[]; tipos: any[]; apiBase: string; onReload: () => void;
}) {
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ tipoId: '', tipoNombre: '', tipoCodigo: '', tipoCategoria: categoria, fechaDocumento: '', observaciones: '' });
  const [file,      setFile]      = useState<File | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState<any>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const labelCat = categoria === 'due_diligence' ? 'Due Diligence' : 'Documentos y Contratos';

  const handleTipoChange = (tipoId: string) => {
    const t = tipos.find((x: any) => x.id === tipoId);
    setForm(f => ({ ...f, tipoId, tipoNombre: t?.nombre ?? '', tipoCodigo: t?.codigo ?? '', tipoCategoria: categoria }));
  };

  const handleAgregar = async () => {
    if (!form.tipoId) { alert('Seleccioná un tipo de documento.'); return; }
    setSaving(true);
    try {
      const body = { ...form, contactoTipo, contactoId };
      if (file) await documentosContactoApi.createConArchivo(body, file);
      else       await documentosContactoApi.create(body);
      setShowForm(false);
      setForm({ tipoId: '', tipoNombre: '', tipoCodigo: '', tipoCategoria: categoria, fechaDocumento: '', observaciones: '' });
      setFile(null);
      onReload();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleGuardarEdicion = async (id: string) => {
    setSaving(true);
    try {
      await documentosContactoApi.update(id, editForm);
      setEditingId(null);
      onReload();
    } catch { alert('Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try { await documentosContactoApi.delete(id); onReload(); } catch { alert('Error.'); }
  };

  const handleSubirArchivo = async (docId: string, f: File) => {
    setUploadingId(docId);
    try { await documentosContactoApi.upload(docId, f); onReload(); }
    catch { alert('Error al subir el archivo.'); }
    finally { setUploadingId(null); }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{labelCat}</h2>
        <button
          onClick={() => { setShowForm(s => !s); setForm({ tipoId: '', tipoNombre: '', tipoCodigo: '', tipoCategoria: categoria, fechaDocumento: '', observaciones: '' }); setFile(null); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700"
        >
          <Plus size={14}/> Agregar documento
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Nuevo documento</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento *</label>
              <select value={form.tipoId} onChange={e => handleTipoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del documento</label>
              <input type="date" value={form.fechaDocumento}
                onChange={e => setForm(f => ({ ...f, fechaDocumento: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Archivo (PDF / imagen)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
              <input value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAgregar} disabled={saving}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={14}/> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
              <X size={14}/> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Listado */}
      {documentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic text-sm">
          Sin documentos cargados.
          {tipos.length === 0 && (
            <p className="text-xs mt-1">
              Primero configurá los tipos en <strong>Panel Global → Tipos Doc. Adjunto</strong>.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc: any) => (
            <div key={doc.id} className={`bg-white rounded-xl border p-4 ${doc.url ? 'border-green-200' : 'border-gray-200'}`}>
              {editingId === doc.id ? (
                /* Modo edición */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-0.5">Fecha documento</label>
                    <input type="date" value={editForm.fechaDocumento ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, fechaDocumento: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-0.5">Observaciones</label>
                    <input value={editForm.observaciones ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, observaciones: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div className="col-span-2 flex gap-2 mt-1">
                    <button onClick={() => handleGuardarEdicion(doc.id)} disabled={saving}
                      className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                      <Save size={12}/> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                      <X size={12}/> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo vista */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.url ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <FileText size={16}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{doc.tipoNombre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {doc.fechaDocumento && (
                          <span className="text-xs text-gray-500">📅 {formatDate(doc.fechaDocumento)}</span>
                        )}
                        {doc.url
                          ? <a href={`${apiBase}${doc.url}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-green-700 hover:underline font-medium flex items-center gap-0.5">
                              ✓ Ver archivo
                            </a>
                          : <span className="text-xs text-gray-400">Sin archivo</span>
                        }
                        {doc.observaciones && <span className="text-xs text-gray-400 truncate">{doc.observaciones}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Upload / Replace */}
                    <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-0.5">
                      {uploadingId === doc.id ? '...' : doc.url ? '↑ Reemplazar' : '↑ Subir'}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleSubirArchivo(doc.id, f); e.target.value = ''; }}/>
                    </label>
                    {/* Edit */}
                    <button
                      onClick={() => { setEditingId(doc.id); setEditForm({ fechaDocumento: doc.fechaDocumento ?? '', observaciones: doc.observaciones ?? '' }); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
                      <Pencil size={14}/>
                    </button>
                    {/* Delete — requiere confirmación inline */}
                    <button onClick={() => handleEliminar(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
