import api from './api';

export const contactosApi = {
  exportExcel:  ()             => api.get('/contactos/export', { responseType: 'blob' }).then(r => r.data as Blob),
  buscarPorDoc: (doc: string) => api.get(`/contactos/buscar-doc?doc=${doc}`).then(r => r.data),

  // Persona Física
  getPersonasFisicas:    (q?: string)               => api.get('/contactos/pf', { params: { q } }).then(r => r.data),
  getPersonaFisicaById:  (id: string)               => api.get(`/contactos/pf/${id}`).then(r => r.data),
  crearPersonaFisica:    (body: any)                => api.post('/contactos/pf', body).then(r => r.data),
  actualizarPersonaFisica: (id: string, body: any)  => api.put(`/contactos/pf/${id}`, body).then(r => r.data),

  // Persona Jurídica
  getPersonasJuridicas:    (q?: string)             => api.get('/contactos/pj', { params: { q } }).then(r => r.data),
  getPersonaJuridicaById:  (id: string)             => api.get(`/contactos/pj/${id}`).then(r => r.data),
  getEmpresas:    (params?: any)             => api.get('/contactos/pj', { params }).then(r => r.data),
  getEmpresaById: (id: string)               => api.get(`/contactos/pj/${id}`).then(r => r.data),
  crearEmpresa:   (body: any)                => api.post('/contactos/pj', body).then(r => r.data),
  actualizarEmpresa: (id: string, body: any) => api.put(`/contactos/pj/${id}`, body).then(r => r.data),

  // Operaciones por contacto
  getOperacionesByContacto: (tipo: 'pf' | 'pj', id: string) =>
    api.get(`/contactos/${tipo}/${id}/operaciones`).then(r => r.data),

  // Empresas donde esta PF figura como rep. legal
  getEmpresasVinculadas: (id: string) =>
    api.get(`/contactos/pf/${id}/vinculadas`).then(r => r.data),
};

export const panelGlobalApi = {
  getMonedas:        ()                        => api.get('/monedas').then(r => r.data),
  getMonedasActivas: ()                        => api.get('/monedas/activas').then(r => r.data),
  createMoneda:      (b: any)                  => api.post('/monedas', b).then(r => r.data),
  updateMoneda:      (id: string, b: any)      => api.put(`/monedas/${id}`, b).then(r => r.data),

  getCajas:          ()                        => api.get('/cajas').then(r => r.data),
  getCajasActivas:   ()                        => api.get('/cajas/activas').then(r => r.data),
  createCaja:        (b: any)                  => api.post('/cajas', b).then(r => r.data),
  updateCaja:        (id: string, b: any)      => api.put(`/cajas/${id}`, b).then(r => r.data),

  getPaises:         ()                        => api.get('/paises').then(r => r.data),
  getPaisesActivos:  ()                        => api.get('/paises/activos').then(r => r.data),
  createPais:        (b: any)                  => api.post('/paises', b).then(r => r.data),
  updatePais:        (id: string, b: any)      => api.put(`/paises/${id}`, b).then(r => r.data),

  getTiposDocumento:          ()                  => api.get('/tipos-documento').then(r => r.data),
  getTiposDueDiligencia:      ()                  => api.get('/tipos-documento/due-diligencia').then(r => r.data),
  createTipoDocumento:        (b: any)            => api.post('/tipos-documento', b).then(r => r.data),
  updateTipoDocumento:        (id: string, b: any) => api.put(`/tipos-documento/${id}`, b).then(r => r.data),

  getEstadosOperacion:     ()                  => api.get('/operaciones/estados').then(r => r.data),
  createEstadoOperacion:   (b: any)            => api.post('/operaciones/estados', b).then(r => r.data),
  updateEstadoOperacion:   (id: string, b: any) => api.put(`/operaciones/estados/${id}`, b).then(r => r.data),

  getConfiguraciones:      ()                  => api.get('/configuracion').then(r => r.data),
  updateConfiguracion:     (clave: string, b: any) => api.put(`/configuracion/${clave}`, b).then(r => r.data),

  getLogos:          ()                        => api.get('/configuracion/logos').then(r => r.data),

  // Canales
  getCanales:        ()                        => api.get('/canales').then(r => r.data),
  getCanalesActivos: ()                        => api.get('/canales/activos').then(r => r.data),
  createCanal:       (b: any)                  => api.post('/canales', b).then(r => r.data),
  updateCanal:       (id: string, b: any)      => api.put(`/canales/${id}`, b).then(r => r.data),
  deleteCanal:       (id: string)              => api.delete(`/canales/${id}`).then(r => r.data),

  // Productos Financieros
  getProductos:              ()                        => api.get('/productos-financieros').then(r => r.data),
  getProductosActivos:       ()                        => api.get('/productos-financieros/activos').then(r => r.data),
  getProductoById:           (id: string)              => api.get(`/productos-financieros/${id}`).then(r => r.data),
  createProducto:            (b: any)                  => api.post('/productos-financieros', b).then(r => r.data),
  updateProducto:            (id: string, b: any)      => api.put(`/productos-financieros/${id}`, b).then(r => r.data),
  addFormularioProducto:     (id: string, b: any)      => api.post(`/productos-financieros/${id}/formularios`, b).then(r => r.data),
  removeFormularioProducto:  (id: string, fid: string) => api.delete(`/productos-financieros/${id}/formularios/${fid}`).then(r => r.data),

  // Servicios Datos (antes "Informes de Rigor")
  getInformesRigor:          ()                        => api.get('/informes-rigor').then(r => r.data),
  getInformesRigorActivos:   (tipoInforme?: string)    => api.get('/informes-rigor/activos', { params: tipoInforme ? { tipoInforme } : {} }).then(r => r.data),
  createInformeRigor:        (b: any)                  => api.post('/informes-rigor', b).then(r => r.data),
  updateInformeRigor:        (id: string, b: any)      => api.put(`/informes-rigor/${id}`, b).then(r => r.data),

  // Operación Due Diligence
  getOperacionInformes:      (operacionId: string)     => api.get('/operacion-informes-rigor', { params: { operacionId } }).then(r => r.data),
  initOperacionInformes:     (items: any[])            => api.post('/operacion-informes-rigor/init', { items }).then(r => r.data),
  updateOperacionInforme:    (id: string, b: any)      => api.put(`/operacion-informes-rigor/${id}`, b).then(r => r.data),
  deleteOperacionInforme:    (id: string)              => api.delete(`/operacion-informes-rigor/${id}`).then(r => r.data),
  uploadOperacionInforme:    (id: string, file: File)  => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/operacion-informes-rigor/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },

  getFrases:         ()                        => api.get('/frases').then(r => r.data),
  getFraseDelDia:    ()                        => api.get('/frases/del-dia').then(r => r.data),
  createFrase:       (b: any)                  => api.post('/frases', b).then(r => r.data),
  updateFrase:       (id: string, b: any)      => api.put(`/frases/${id}`, b).then(r => r.data),
  deleteFrase:       (id: string)              => api.delete(`/frases/${id}`).then(r => r.data),

  // Bancos
  getBancos:         ()                        => api.get('/bancos').then(r => r.data),
  getBancosActivos:  ()                        => api.get('/bancos/activos').then(r => r.data),
  createBanco:       (b: any)                  => api.post('/bancos', b).then(r => r.data),
  updateBanco:       (id: string, b: any)      => api.put(`/bancos/${id}`, b).then(r => r.data),

  // Clientes vetados
  getClientesVetados:      (q?: string)         => api.get('/clientes-vetados', { params: q ? { q } : {} }).then(r => r.data),
  verificarVeto:            (doc: string)        => api.get(`/clientes-vetados/verificar/${doc}`).then(r => r.data),
  createClienteVetado:      (b: any)             => api.post('/clientes-vetados', b).then(r => r.data),
  updateClienteVetado:      (id: string, b: any) => api.put(`/clientes-vetados/${id}`, b).then(r => r.data),

  // Geo (departamentos / ciudades)
  getDepartamentos:         ()                              => api.get('/geo/departamentos').then(r => r.data),
  getCiudades:              (departamentoId?: number)       => api.get('/geo/ciudades', { params: departamentoId ? { departamentoId } : {} }).then(r => r.data),

  // Feriados
  getFeriados:              (año?: number)                  => api.get('/feriados', { params: año ? { año } : {} }).then(r => r.data),
  createFeriado:            (b: any)                        => api.post('/feriados', b).then(r => r.data),
  updateFeriado:            (id: number, b: any)            => api.put(`/feriados/${id}`, b).then(r => r.data),
  deleteFeriado:            (id: number)                    => api.delete(`/feriados/${id}`).then(r => r.data),
  esHabil:                  (fecha: string)                 => api.get('/feriados/es-habil', { params: { fecha } }).then(r => r.data),
  proximoHabil:             (fecha: string)                 => api.get('/feriados/proximo-habil', { params: { fecha } }).then(r => r.data),
};

export const usuariosApi = {
  getAll:           ()                          => api.get('/usuarios').then(r => r.data),
  update:           (id: string, body: any)     => api.put(`/usuarios/${id}`, body).then(r => r.data),
  invitar:          (body: any)                 => api.post('/auth/invitar', body).then(r => r.data),
  toggleBloqueo:    (id: string, bloqueado: boolean) => api.put(`/usuarios/${id}/bloqueo`, { bloqueado }).then(r => r.data),

  getRoles:         ()                          => api.get('/usuarios/roles').then(r => r.data),
  createRol:        (body: any)                 => api.post('/usuarios/roles', body).then(r => r.data),
  updateRol:        (id: string, body: any)     => api.put(`/usuarios/roles/${id}`, body).then(r => r.data),
  updatePermisos:   (id: string, permisos: any) => api.put(`/usuarios/roles/${id}/permisos`, { permisos }).then(r => r.data),
  deleteRol:        (id: string)                => api.delete(`/usuarios/roles/${id}`).then(r => r.data),
};

export const documentosContactoApi = {
  // ── Tipos documento adjunto (Panel Global) ──
  getTipos:        ()                        => api.get('/tipos-documento-adjunto').then(r => r.data),
  getTiposActivos: ()                        => api.get('/tipos-documento-adjunto/activos').then(r => r.data),
  createTipo:      (b: any)                  => api.post('/tipos-documento-adjunto', b).then(r => r.data),
  updateTipo:      (id: string, b: any)      => api.put(`/tipos-documento-adjunto/${id}`, b).then(r => r.data),

  // ── Documentos del contacto ──
  getByContacto: (contactoTipo: string, contactoId: string) =>
    api.get('/documentos-contacto', { params: { contactoTipo, contactoId } }).then(r => r.data),

  /** Crear con archivo en un solo request */
  createConArchivo: (body: any, file: File) => {
    const fd = new FormData();
    Object.entries(body).forEach(([k, v]) => { if (v != null) fd.append(k, String(v)); });
    fd.append('file', file);
    return api.post('/documentos-contacto', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },

  /** Crear solo metadatos (sin archivo) */
  create: (b: any) => api.post('/documentos-contacto', b).then(r => r.data),

  /** Actualizar metadatos */
  update: (id: string, b: any) => api.put(`/documentos-contacto/${id}`, b).then(r => r.data),

  delete: (id: string) => api.delete(`/documentos-contacto/${id}`).then(r => r.data),

  /** Subir o reemplazar archivo */
  upload: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/documentos-contacto/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
};

export const bitacoraApi = {
  getAll: (params?: { modulo?: string; usuarioId?: string; accion?: string; desde?: string; hasta?: string; page?: number; limit?: number }) =>
    api.get('/bitacora', { params }).then(r => r.data),
  exportExcel: (params?: { modulo?: string; usuarioId?: string; desde?: string; hasta?: string }) =>
    api.get('/bitacora/export', { params, responseType: 'blob' }).then(r => r.data as Blob),
};

export const validataApi = {
  /** Consulta ficha completa + nómina FP + familiares (con flag esCliente).
   *  `origen` se guarda en bitácora para trazabilidad. */
  consultar: (cedula: string, origen?: string) =>
    api.post('/validata/consultar', { cedula, origen }).then(r => r.data),

  /** Historial de consultas (solo ADMIN/SUPERADMIN) */
  getHistorial: (params?: { cedula?: string; page?: number; limit?: number }) =>
    api.get('/validata/consultas', { params }).then(r => r.data),

  /** Detalle completo de una consulta guardada */
  getConsulta: (id: string) =>
    api.get(`/validata/consultas/${id}`).then(r => r.data),

  /** Leer credenciales actuales (pass censurado) — SUPERADMIN */
  getCredenciales: () =>
    api.get('/validata/credenciales').then(r => r.data),

  /** Guardar credenciales — SUPERADMIN */
  setCredenciales: (data: { validata_url?: string; validata_user?: string; validata_pass?: string }) =>
    api.post('/validata/credenciales', data).then(r => r.data),

  /** Test de conexión — SUPERADMIN */
  testConexion: () =>
    api.post('/validata/test-conexion').then(r => r.data),
};
