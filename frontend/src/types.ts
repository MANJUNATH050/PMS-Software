export type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface AuthUser {
  token: string;
  email: string;
  role: UserRole;
  fullName: string;
  employeeCode: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface Designation {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface ManagerOption {
  id: number;
  fullName: string;
  employeeCode: string;
  email: string;
  designationName: string;
}

export interface EmployeeRecord {
  id: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: number;
  departmentName: string;
  designationId: number;
  designationName: string;
  managerId: number | null;
  managerName: string;
  joiningDate: string;
  status: string;
  createdAt: string;
}
