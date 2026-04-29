import api from './api';

export const contactosApi = {
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

  getTiposDocumento:       ()                  => api.get('/tipos-documento').then(r => r.data),
  createTipoDocumento:     (b: any)            => api.post('/tipos-documento', b).then(r => r.data),
  updateTipoDocumento:     (id: string, b: any) => api.put(`/tipos-documento/${id}`, b).then(r => r.data),

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
  getProductos:      ()                        => api.get('/productos-financieros').then(r => r.data),
  getProductosActivos: ()                      => api.get('/productos-financieros/activos').then(r => r.data),
  createProducto:    (b: any)                  => api.post('/productos-financieros', b).then(r => r.data),
  updateProducto:    (id: string, b: any)      => api.put(`/productos-financieros/${id}`, b).then(r => r.data),

  getFrases:         ()                        => api.get('/frases').then(r => r.data),
  getFraseDelDia:    ()                        => api.get('/frases/del-dia').then(r => r.data),
  createFrase:       (b: any)                  => api.post('/frases', b).then(r => r.data),
  updateFrase:       (id: string, b: any)      => api.put(`/frases/${id}`, b).then(r => r.data),
  deleteFrase:       (id: string)              => api.delete(`/frases/${id}`).then(r => r.data),
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

export const bitacoraApi = {
  getAll: (params?: any) => api.get('/bitacora', { params }).then(r => r.data),
};
