import apiClient from './apiClient';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export interface LockStatusResponse {
  locked: boolean;
  lockedUntil?: string;
  remainingSeconds?: number;
  message?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post<User>('/auth/login', credentials);
    return response.data;
  },
  getLockStatus: async (email: string): Promise<LockStatusResponse> => {
    const response = await apiClient.get<LockStatusResponse>('/auth/lock-status', {
      params: { email }
    });
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  }
};
