import api from './api';

export const transaccionesApi = {
  getByOperacion:  (operacionId: string)                    => api.get(`/transacciones/operacion/${operacionId}`).then(r => r.data),
  registrarPago:   (b: any)                                 => api.post('/transacciones/pago', b).then(r => r.data),
  reversar:        (id: string, b: { motivo: string })      => api.post(`/transacciones/${id}/reversar`, b).then(r => r.data),
  resumenIngresos: (params: { desde: string; hasta: string }) => api.get('/transacciones/resumen-ingresos', { params }).then(r => r.data),
  resumenMensual:  (año: number) => api.get('/transacciones/resumen-mensual', { params: { año } }).then(r => r.data),
};

export const cargosOperacionApi = {
  getByOperacion: (operacionId: string)              => api.get(`/cargos-operacion/operacion/${operacionId}`).then(r => r.data),
  exonerar:       (id: string, b: { motivo: string }) => api.put(`/cargos-operacion/${id}/exonerar`, b).then(r => r.data),
};

export const conciliacionesApi = {
  getAll:    (params?: any)      => api.get('/conciliaciones', { params }).then(r => r.data),
  getById:   (id: string)        => api.get(`/conciliaciones/${id}`).then(r => r.data),
  create:    (b: any)            => api.post('/conciliaciones', b).then(r => r.data),
  cerrar:    (id: string, b: any) => api.put(`/conciliaciones/${id}/cerrar`, b).then(r => r.data),
  conciliar: (id: string)        => api.put(`/conciliaciones/${id}/conciliar`, {}).then(r => r.data),
  reabrir:   (id: string)        => api.put(`/conciliaciones/${id}/reabrir`, {}).then(r => r.data),
};
