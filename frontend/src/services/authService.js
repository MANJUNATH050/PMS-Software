import api from './api'

export const login = (identifier, password) => api.post('/auth/login', { identifier, password })
