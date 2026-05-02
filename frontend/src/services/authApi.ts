import api from './api';

export const authApi = {
  login:           (email: string, password: string)          => api.post('/auth/login',    { email, password }).then(r => r.data),
  refresh:         (refreshToken: string)                     => api.post('/auth/refresh',  { refresh_token: refreshToken }).then(r => r.data),
  getMe:           ()                                         => api.get('/auth/me').then(r => r.data),
  cambiarPassword: (body: { passwordActual: string; passwordNuevo: string }) => api.post('/auth/cambiar-password', body).then(r => r.data),
  activarCuenta:   (token: string, password: string)          => api.post('/auth/activar',  { token, password }).then(r => r.data),
  olvideMiPassword:(email: string)                            => api.post('/auth/olvide-password', { email }).then(r => r.data),
  resetPassword:   (token: string, password: string)          => api.post('/auth/reset-password', { token, password }).then(r => r.data),
  validarToken:    (token: string)                            => api.get(`/auth/validar-token?token=${token}`).then(r => r.data),
  invitar:         (body: { email: string; primerNombre: string; primerApellido: string; rolId: string; enviarEmail?: boolean }) =>
    api.post('/auth/invitar', body).then(r => r.data),
};

export default authApi;
