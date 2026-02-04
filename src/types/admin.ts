// 관리자 권한 타입 정의

export type AdminRole = 'professor' | 'staff' | 'admin';

export interface AdminUser {
  username: string;
  name: string;
  role: AdminRole;
  department?: string; // 전공 교수의 경우 소속 학과
  college?: string;    // 단과대학
  email?: string;
  createdAt?: string;
}

export interface AdminSession {
  user: AdminUser;
  isAuthenticated: boolean;
  loginAt: string;
}

// 권한별 기능 정의
export const ROLE_PERMISSIONS: Record<AdminRole, {
  label: string;
  description: string;
  canViewAllStudents: boolean;
  canViewStatistics: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canViewSystemLogs: boolean;
  canEditSettings: boolean;
}> = {
  professor: {
    label: '전공 교수',
    description: '소속 전공 학생들의 검사 결과를 확인할 수 있습니다.',
    canViewAllStudents: false,
    canViewStatistics: true,
    canExportData: true,
    canManageUsers: false,
    canViewSystemLogs: false,
    canEditSettings: false,
  },
  staff: {
    label: '비교과 담당직원',
    description: '전체 학생 검사 결과 및 통계를 확인할 수 있습니다.',
    canViewAllStudents: true,
    canViewStatistics: true,
    canExportData: true,
    canManageUsers: false,
    canViewSystemLogs: false,
    canEditSettings: false,
  },
  admin: {
    label: '시스템 관리자',
    description: '모든 기능에 접근할 수 있습니다.',
    canViewAllStudents: true,
    canViewStatistics: true,
    canExportData: true,
    canManageUsers: true,
    canViewSystemLogs: true,
    canEditSettings: true,
  },
};

// 통계 데이터 타입
export interface DashboardStats {
  totalTests: number;
  totalPilotSurveys: number;
  todayTests: number;
  weeklyTests: number;
  completionRate: number;
  riasecDistribution: Record<string, number>;
  departmentStats?: DepartmentStat[];
  recentActivity: ActivityLog[];
}

export interface DepartmentStat {
  department: string;
  college: string;
  totalStudents: number;
  completedTests: number;
  avgMatchScore: number;
  topRecommendedMajors: string[];
}

export interface ActivityLog {
  id: string;
  type: 'test_complete' | 'pilot_complete' | 'user_login' | 'export';
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// 필터 옵션
export interface AdminFilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  department?: string;
  college?: string;
  riasecType?: string;
  searchQuery?: string;
}
