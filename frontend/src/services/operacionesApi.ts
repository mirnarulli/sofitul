import api from './api';

export const operacionesApi = {
  exportExcel: (params?: { estado?: string; tipo?: string; contactoId?: string }) =>
    api.get('/operaciones/export', { params, responseType: 'blob' }).then(r => r.data as Blob),
  getAll:            (params?: any)        => api.get('/operaciones', { params }).then(r => r.data),
  getById:           (id: string)          => api.get(`/operaciones/${id}`).then(r => r.data),
  create:            (body: any)           => api.post('/operaciones', body).then(r => r.data),
  update:            (id: string, b: any)  => api.put(`/operaciones/${id}`, b).then(r => r.data),
  updateFirmantes:   (id: string, firmantes: any[]) => api.put(`/operaciones/${id}`, { firmantes }).then(r => r.data),
  cambiarEstado:     (id: string, b: any)  => api.put(`/operaciones/${id}/estado`, b).then(r => r.data),
  registrarProrroga: (id: string, b: any)  => api.put(`/operaciones/${id}/prorroga`, b).then(r => r.data),
  updateCheque:      (id: string, b: any)  => api.put(`/operaciones/cheques/${id}`, b).then(r => r.data),
  pagarCuota:        (id: string, b: any)  => api.put(`/operaciones/cuotas/${id}/pagar`, b).then(r => r.data),
  getEstados:           ()                     => api.get('/operaciones/estados').then(r => r.data),
  getSiguientesEstados: (codigo: string)       => api.get(`/operaciones/estados-siguientes/${codigo}`).then(r => r.data),
  getTransicionesMatriz: ()                    => api.get('/operaciones/transiciones').then(r => r.data),
  saveMatriz:           (transiciones: any[])  => api.put('/operaciones/transiciones', { transiciones }).then(r => r.data),
  calcularInteres:      (b: any)               => api.post('/operaciones/calcular-interes', b).then(r => r.data),
  actualizarContrato: (id: string, b: { nroContratoTeDescuento?: string }) =>
    api.put(`/operaciones/${id}/contrato`, b).then(r => r.data),
  uploadContrato: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/operaciones/${id}/contrato/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  uploadFichaInformconf: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/operaciones/${id}/ficha-informconf/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  uploadFichaInfocheck: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/operaciones/${id}/ficha-infocheck/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};

export const cobranzasApi = {
  getCartera:        (params?: any)                    => api.get('/cobranzas', { params }).then(r => r.data),
  getResumenCartera: ()                                => api.get('/cobranzas/resumen').then(r => r.data),
  getVencimientos:   ()                                => api.get('/cobranzas/vencimientos').then(r => r.data),
  asignarCobrador:   (id: string, cobradorId: string)  => api.put(`/cobranzas/${id}/cobrador`, { cobradorId }).then(r => r.data),
  registrarPago:     (id: string, b: any)              => api.post(`/cobranzas/${id}/pago`, b).then(r => r.data),
};

export const tesoreriaApi = {
  getPendientesDesembolso: ()                    => api.get('/tesoreria/pendientes').then(r => r.data),
  getAlertasPagare:        ()                    => api.get('/tesoreria/alertas-pagare').then(r => r.data),
  getCobranzas:            ()                    => api.get('/tesoreria/cobranzas').then(r => r.data),
  registrarDesembolso:     (id: string, b: any)  => api.post(`/tesoreria/${id}/desembolso`, b).then(r => r.data),
  registrarPagare:         (id: string, b: any)  => api.put(`/tesoreria/${id}/pagare`, b).then(r => r.data),
  registrarCobro:          (chequeId: string, b: any) => api.post(`/tesoreria/cheques/${chequeId}/cobrar`, b).then(r => r.data),
};

export const inventarioApi = {
  getResumen:         () => api.get('/inventario-capital/resumen').then(r => r.data),
  getChequesDashboard:() => api.get('/inventario-capital/cheques-dashboard').then(r => r.data),
  getCheques:         () => api.get('/inventario-capital/cheques').then(r => r.data),
  getRentabilidad:    () => api.get('/inventario-capital/rentabilidad').then(r => r.data),
};

export const dashboardsApi = {
  getRecupero:       () => api.get('/dashboards/recupero').then(r => r.data),
  getDesembolsos:    () => api.get('/dashboards/desembolsos').then(r => r.data),
  getOperaciones:    () => api.get('/dashboards/operaciones').then(r => r.data),
};
