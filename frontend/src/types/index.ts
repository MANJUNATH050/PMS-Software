export interface User {
  token: string;
  tokenType: string;
  email: string;
  name: string;
  role: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  team: string;
  designation: string;
  managerName: string;
  joiningDate: string;
  accountStatus: string;
}

export interface Kpi {
  kpiId: number;
  kpiName: string;
  description: string;
  weightage: number;
  selfRating: number | null;
  managerRating: number | null;
  hrRating: number | null;
  comments: string | null;
  ratingStatus: 'DRAFT' | 'SUBMITTED' | 'COMPLETED' | 'PENDING';
}

export interface Review {
  reviewerName: string;
  reviewerRole: string;
  comments: string;
  reviewDate: string;
}

export interface PmsAssignment {
  assignmentId: number;
  cycleMonth: string;
  status: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  overallScore: number | null;
  performanceGrade: string | null;
  finalizedDate: string | null;
  employee: Employee;
  kpis: Kpi[];
  reviews: Review[];
}

export interface PmsHistory {
  id: number;
  assignmentId?: number;
  cycleMonth: string;
  finalScore: number;
  grade: string;
  finalizedDate: string;
  filePath: string | null;
}

export interface DashboardData {
  currentCycle: string;
  pmsStatus: string;
  totalKpis: number;
  completedKpis: number;
  completedWeightage: number;
  latestFinalizedScore: number | null;
  latestFinalizedGrade: string | null;
  managerReviewStatus: string;
  hrReviewStatus: string;
  actionRequired: string;
}
