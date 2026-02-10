export interface GraduateRoleModel {
  id: string;
  nameAnonymized: string;      // 강○○
  graduationYear: string;       // "2024년 2월"
  college: string;              // "경영대학"
  major: string;                // "경영학과"
  currentStatus: string;        // "기업(관) 취업자", "진학자" 등
  jobCategory: string;          // "IT 개발/운영"
  company: string;              // "네오위즈" 또는 "정보없음"
  region: string;               // "성남시"
  department: string;           // "사운드팀"
  isMentor: boolean;            // 멘토 활동 의향
}
