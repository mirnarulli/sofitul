import api from './api';

export const authApi = {
  login:           (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data),
  getMe:           ()                                => api.get('/auth/me').then(r => r.data),
  cambiarPassword: (body: any)                       => api.post('/auth/cambiar-password', body).then(r => r.data),
  activarCuenta:   (token: string, password: string) => api.post('/auth/activar', { token, password }).then(r => r.data),
  olvideMiPassword:(email: string)                   => api.post('/auth/olvide-password', { email }).then(r => r.data),
  resetPassword:   (token: string, password: string) => api.post('/auth/reset-password', { token, password }).then(r => r.data),
  validarToken:    (token: string)                   => api.get(`/auth/validar-token?token=${token}`).then(r => r.data),
  invitar:         (body: any)                       => api.post('/auth/invitar', body).then(r => r.data),
};

export default authApi;
