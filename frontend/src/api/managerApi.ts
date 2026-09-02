import apiClient from './apiClient';
import {
  ManagerDashboardData,
  ManagerEmployeeItem,
  ManagerEmployeeReviewData,
  ManagerReviewPayload,
  ManagerReportData
} from '../types';

export const managerApi = {
  getDashboard: async (): Promise<ManagerDashboardData> => {
    const response = await apiClient.get<ManagerDashboardData>('/api/manager/dashboard');
    return response.data;
  },

  getAssignedEmployees: async (): Promise<ManagerEmployeeItem[]> => {
    const response = await apiClient.get<ManagerEmployeeItem[]>('/api/manager/employees');
    return response.data;
  },

  getEmployeeKpiReview: async (employeeId: number): Promise<ManagerEmployeeReviewData> => {
    const response = await apiClient.get<ManagerEmployeeReviewData>(`/api/manager/employees/${employeeId}/pms`);
    return response.data;
  },

  submitManagerReview: async (assignmentId: number, data: ManagerReviewPayload): Promise<{ message: string; assignmentId: number; status: string }> => {
    const response = await apiClient.post<{ message: string; assignmentId: number; status: string }>(`/api/manager/pms/${assignmentId}/submit`, data);
    return response.data;
  },

  getReports: async (): Promise<ManagerReportData> => {
    const response = await apiClient.get<ManagerReportData>('/api/manager/reports');
    return response.data;
  },

  downloadReport: async (assignmentId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await apiClient.get('/api/manager/reports/download', {
      params: { assignmentId, format },
      responseType: 'blob'
    });
    return response.data;
  },

  getEmployeeFullReport: async (employeeId: number): Promise<any> => {
    const response = await apiClient.get<any>(`/api/manager/employees/${employeeId}/full-report`);
    return response.data;
  },

  downloadManagerReport: async (assignmentId: number, employeeName: string, format: 'pdf' | 'excel' = 'pdf'): Promise<void> => {
    const response = await apiClient.get('/api/manager/reports/download', {
      params: { assignmentId, format },
      responseType: 'blob'
    });
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PMS_Report_${employeeName.replace(/\s+/g, '_')}_${assignmentId}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
