import api from './api';

export const empleadosApi = {
  getAll:          (q?: string)              => api.get('/empleados', { params: q ? { q } : {} }).then(r => r.data),
  getCobradores:   ()                        => api.get('/empleados/cobradores').then(r => r.data),
  getById:         (id: string)              => api.get(`/empleados/${id}`).then(r => r.data),
  create:          (b: any)                  => api.post('/empleados', b).then(r => r.data),
  update:          (id: string, b: any)      => api.put(`/empleados/${id}`, b).then(r => r.data),
  addDocumento:    (id: string, b: any)      => api.post(`/empleados/${id}/documentos`, b).then(r => r.data),
  deleteDocumento: (docId: string)           => api.delete(`/empleados/documentos/${docId}`).then(r => r.data),
};

export const talonariosApi = {
  getByEmpleado:     (empleadoId: string)                                    => api.get(`/talonarios/internos/empleado/${empleadoId}`).then(r => r.data),
  asignar:           (b: { empleadoId: string; observaciones?: string })     => api.post('/talonarios/internos/asignar', b).then(r => r.data),
  getTimbrados:      ()                                                       => api.get('/talonarios/timbrados').then(r => r.data),
  getTimbradoActivo: ()                                                       => api.get('/talonarios/timbrados/activo').then(r => r.data),
  createTimbrado:    (b: any)                                                 => api.post('/talonarios/timbrados', b).then(r => r.data),
  updateTimbrado:    (id: string, b: any)                                     => api.put(`/talonarios/timbrados/${id}`, b).then(r => r.data),
};

export const scoringClientesApi = {
  getAll:  (ci?: string) => api.get('/scoring-clientes', { params: ci ? { ci } : {} }).then(r => r.data),
  getByCi: (ci: string)  => api.get(`/scoring-clientes/ci/${ci}`).then(r => r.data),
  create:  (b: any)      => api.post('/scoring-clientes', b).then(r => r.data),
};
