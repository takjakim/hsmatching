// 학생 정보 시스템 타입 정의

export interface Student {
  studentId: string;
  password: string;
  name: string;
  nameEng: string;
  department: string;
  grade: number;
  phoneNumber: string;
  email: string;
  address: {
    zipCode: string;
    basic: string;
    detail: string;
  };
  birthDate: string;
  registrationNumber: string;
}

export interface Course {
  year: number;
  semester: number;
  courseNumber: string;
  courseName: string;
  completionType: string;
  credits: number;
  timeAndRoom: string;
  retake: boolean;
  professor: string;
  riasecProfile?: Partial<Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V', number>>;
}

export interface GradeRecord {
  year: number;
  semester: number;
  grade: number;
  registeredCredits: number;
  acquiredCredits: number;
  generalCredits: number;
  majorCredits: number;
  teachingCredits: number;
  gpa: number;
  percentile: number;
  academicWarning: boolean;
  semesterRank: string;
  overallRank: string;
  semesterWithdrawal: boolean;
}

export interface StudentGrades {
  averageGpa: number;
  percentileScore: number;
  totalRegisteredCredits: number;
  totalAcquiredCredits: number;
  records: GradeRecord[];
}

// 전공능력진단검사 결과
export interface MajorCompetency {
  competencyName: string;
  score: number;
  percentile: number;
  level: 'high' | 'medium' | 'low';
  description: string;
}

export interface MajorCompetencyResult {
  testDate: string;
  department: string;
  overallScore: number;
  overallPercentile: number;
  competencies: MajorCompetency[];
  strengths: string[];
  improvements: string[];
}

