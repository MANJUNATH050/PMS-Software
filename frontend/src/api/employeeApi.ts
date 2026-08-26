import apiClient from './apiClient';
import { Employee } from '../types';

export const employeeApi = {
  getProfile: async (): Promise<Employee> => {
    const response = await apiClient.get<Employee>('/employee/profile');
    return response.data;
  }
};
