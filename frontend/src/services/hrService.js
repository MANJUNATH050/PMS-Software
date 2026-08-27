import api from './api'

export const getDashboardSummary = () => api.get('/hr/dashboard/summary')
export const getDashboardActivity = () => api.get('/hr/dashboard/activity')
export const getLookups = () => Promise.all([
  api.get('/hr/departments'),
  api.get('/hr/teams'),
  api.get('/hr/designations'),
  api.get('/hr/managers'),
])
export const createEmployee = (payload) => api.post('/hr/employees', payload)
