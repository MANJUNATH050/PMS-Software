import { apiClient } from '../api/apiClient';

export const authApi = {
  login: async (credentials: { email: string; password: string; role?: string }) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },
  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },
  resetPassword: async (payload: { token?: string; email?: string; newPassword: string; confirmPassword: string }) => {
    const { data } = await apiClient.post('/auth/reset-password', payload);
    return data;
  },
  lockStatus: async (email: string) => {
    const { data } = await apiClient.get('/auth/lock-status', { params: { email } });
    return data;
  },
  getLockStatus: async (email: string) => {
    const { data } = await apiClient.get('/auth/lock-status', { params: { email } });
    return data;
  },
};

export type LoginCredentials = {
  email: string;
  password: string;
  role?: string;
};
