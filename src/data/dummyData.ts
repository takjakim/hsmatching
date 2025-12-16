import { Student, Course, StudentGrades, MajorCompetencyResult } from "../types/student";

// 더미 학생 정보 - 경영학과 3학년 (수강 이력 풍부)
export const DUMMY_STUDENT: Student = {
  studentId: "2301001",
  password: "business123",
  name: "김경영",
  nameEng: "KIM KYUNG-YOUNG",
  department: "경영학과",
  grade: 3,
  phoneNumber: "010-1234-5678",
  email: "business2301@university.ac.kr",
  address: {
    zipCode: "06234",
    basic: "서울특별시 강남구 테헤란로 123",
    detail: "(역삼동, 비즈니스타워) 15층 1502호"
  },
  birthDate: "2004-03-15",
  registrationNumber: "040315-3******"
};

// 더미 학생 정보 - 무전공 1학년 신입생 (수강 이력 거의 없음)
export const FRESHMAN_STUDENT: Student = {
  studentId: "2501001",
  password: "freshman123",
  name: "이신입",
  nameEng: "LEE SHIN-IP",
  department: "무전공",
  grade: 1,
  phoneNumber: "010-9876-5432",
  email: "freshman2501@university.ac.kr",
  address: {
    zipCode: "03722",
    basic: "서울특별시 서대문구 신촌로 134",
    detail: "(신촌동, 대학빌) 3층 302호"
  },
  birthDate: "2007-09-03",
  registrationNumber: "070903-4******"
};

// 경영정보전공 학생 (무전공 입학 → 2학년에 경영정보학과 선택)
// 1학년부터 4학년까지 전주기 커리큘럼 시뮬레이션 대상
export const MIS_STUDENT: Student = {
  studentId: "2501002",
  password: "mis123",
  name: "김명지",
  nameEng: "PARK DATA",
  department: "경영정보학과",
  grade: 2, // 현재 2학년 (전공 선택 후)
  phoneNumber: "010-5555-1234",
  email: "misdata2501@mju.ac.kr",
  address: {
    zipCode: "17058",
    basic: "경기도 용인시 처인구 명지로 116",
    detail: "(남동, 명지대학교) 학생회관 201호"
  },
  birthDate: "2006-05-20",
  registrationNumber: "060520-3******"
};

// 관리자 계정 정보
export const ADMIN_ACCOUNT = {
  studentId: "admin",
  password: "admin123",
  name: "관리자",
  isAdmin: true
};

// 현재 로그인한 학생 정보 (기본값)
export let CURRENT_STUDENT: Student = DUMMY_STUDENT;

// ============================================
// 경영정보학과 전주기 커리큘럼 (1~4학년)
// ============================================

// 경영정보학과 1학년 교과목 (무전공 입학 시기)
export const MIS_YEAR1_COURSES: Course[] = [
  // 학문기초교양 (필수) - 2025학년도 입학생부터
  {
    year: 2025,
    semester: 1,
    courseNumber: "GEN101-A01",
    courseName: "경영학입문",
    completionType: "학문기초",
    credits: 3,
    timeAndRoom: "월2,3,4 (경영관 101)",
    retake: false,
    professor: "김경영"
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "GEN102-A01",
    courseName: "경제학원론",
    completionType: "학문기초",
    credits: 3,
    timeAndRoom: "화3,4,5 (경영관 102)",
    retake: false,
    professor: "이경제"
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "GEN103-A01",
    courseName: "경상통계학",
    completionType: "학문기초",
    credits: 3,
    timeAndRoom: "수1,2,3 (경영관 103)",
    retake: false,
    professor: "박통계"
  },
  // 전공필수
  {
    year: 2025,
    semester: 1,
    courseNumber: "MIS101-A01",
    courseName: "경영정보",
    completionType: "전공필수",
    credits: 3,
    timeAndRoom: "목2,3,4 (정보관 201)",
    retake: false,
    professor: "최정보",
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "MIS102-A01",
    courseName: "프로그래밍기초(파이썬)",
    completionType: "전공필수",
    credits: 3,
    timeAndRoom: "금1,2,3 (정보관 301)",
    retake: false,
    professor: "정파이썬"
  },
  // 무전공 입학생 전용
  {
    year: 2025,
    semester: 2,
    courseNumber: "MIS100-A01",
    courseName: "경영및경영정보전공탐색세미나",
    completionType: "전공필수",
    credits: 1,
    timeAndRoom: "월6,7 (경영관 세미나실)",
    retake: false,
    professor: "한진로"
  }
];

// 경영정보학과 2학년 교과목
export const MIS_YEAR2_COURSES: Course[] = [
  // 2학년 1학기
  {
    year: 2026,
    semester: 1,
    courseNumber: "MIS5864",
    courseName: "데이터분석프로그래밍",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월2,3,4 (정보관 401)",
    retake: false,
    professor: "최한별"
  },
  {
    year: 2026,
    semester: 1,
    courseNumber: "MIS6244",
    courseName: "데이터베이스활용",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (정보관 402)",
    retake: false,
    professor: "남호헌"
  },
  {
    year: 2026,
    semester: 1,
    courseNumber: "경과104",
    courseName: "회계원리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수2,3,4 (경영관 201)",
    retake: false,
    professor: "이회계"
  },
  {
    year: 2026,
    semester: 1,
    courseNumber: "경과106",
    courseName: "마케팅원론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목3,4,5 (경영관 202)",
    retake: false,
    professor: "박마케팅"
  },
  {
    year: 2026,
    semester: 1,
    courseNumber: "경과120",
    courseName: "ERP개론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금2,3,4 (정보관 403)",
    retake: false,
    professor: "강성구"
  },
  // 2학년 2학기
  {
    year: 2026,
    semester: 2,
    courseNumber: "경과135",
    courseName: "컴퓨터프로그래밍",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월2,3,4 (정보관 404)",
    retake: false,
    professor: "정프로그래밍"
  },
  {
    year: 2026,
    semester: 2,
    courseNumber: "경과141",
    courseName: "데이터베이스분석",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (정보관 405)",
    retake: false,
    professor: "남호헌"
  },
  {
    year: 2026,
    semester: 2,
    courseNumber: "경과143",
    courseName: "운영관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수2,3,4 (경영관 203)",
    retake: false,
    professor: "윤운영"
  },
  {
    year: 2026,
    semester: 2,
    courseNumber: "경과145",
    courseName: "데이터분석",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목3,4,5 (정보관 406)",
    retake: false,
    professor: "최한별"
  },
  {
    year: 2026,
    semester: 2,
    courseNumber: "경과147",
    courseName: "재무관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금2,3,4 (경영관 204)",
    retake: false,
    professor: "최재무"
  },
  {
    year: 2026,
    semester: 2,
    courseNumber: "경정262",
    courseName: "시스템분석과 설계",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월5,6,7 (정보관 407)",
    retake: false,
    professor: "김시스템"
  }
];

// 경영정보학과 3학년 교과목
export const MIS_YEAR3_COURSES: Course[] = [
  // 3학년 1학기
  {
    year: 2027,
    semester: 1,
    courseNumber: "MIS5867",
    courseName: "ERP프로그래밍실습",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월2,3,4 (정보관 501)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2027,
    semester: 1,
    courseNumber: "MIS5866",
    courseName: "머신러닝",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (정보관 502)",
    retake: false,
    professor: "이한준"
  },
  {
    year: 2027,
    semester: 1,
    courseNumber: "경과113",
    courseName: "인적자원관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수2,3,4 (경영관 301)",
    retake: false,
    professor: "홍인사"
  },
  {
    year: 2027,
    semester: 1,
    courseNumber: "경과119",
    courseName: "SAP모듈",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목3,4,5 (정보관 503)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2027,
    semester: 1,
    courseNumber: "경과122",
    courseName: "비즈니스프로세스애널리틱스",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금2,3,4 (정보관 504)",
    retake: false,
    professor: "박비즈니스"
  },
  // 3학년 2학기
  {
    year: 2027,
    semester: 2,
    courseNumber: "MIS5865",
    courseName: "머신러닝",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월2,3,4 (정보관 505)",
    retake: false,
    professor: "이한준"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경과144",
    courseName: "ERP경영시뮬레이션게임",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (정보관 506)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정332",
    courseName: "정보공학",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수2,3,4 (정보관 507)",
    retake: false,
    professor: "정정보"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정341",
    courseName: "정보시스템관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목3,4,5 (정보관 508)",
    retake: false,
    professor: "김정보시스템"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정377",
    courseName: "ERP개발",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금2,3,4 (정보관 509)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정378",
    courseName: "모바일앱개발",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월5,6,7 (정보관 510)",
    retake: false,
    professor: "김환선"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정381",
    courseName: "데이터마이닝",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화5,6,7 (정보관 511)",
    retake: false,
    professor: "이한준"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정384",
    courseName: "객체지향언어",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수5,6,7 (정보관 512)",
    retake: false,
    professor: "정객체지향"
  },
  {
    year: 2027,
    semester: 2,
    courseNumber: "경정385",
    courseName: "로보틱프로세스자동화",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목5,6,7 (정보관 513)",
    retake: false,
    professor: "강영식"
  }
];

// 경영정보학과 4학년 교과목
export const MIS_YEAR4_COURSES: Course[] = [
  {
    year: 2028,
    semester: 1,
    courseNumber: "MIS5872",
    courseName: "캡스톤디자인(ERP)",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월2,3,4 (정보관 601)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2028,
    semester: 1,
    courseNumber: "MIS5871",
    courseName: "클라우드프로그래밍",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (정보관 602)",
    retake: false,
    professor: "최한별"
  },
  {
    year: 2028,
    semester: 1,
    courseNumber: "MIS5868",
    courseName: "회계정보시스템",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수1,2,3 (정보관 603)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2028,
    semester: 2,
    courseNumber: "MIS5873",
    courseName: "캡스톤디자인(AI)",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목2,3,4 (정보관 604)",
    retake: false,
    professor: "이한준"
  },
  {
    year: 2028,
    semester: 2,
    courseNumber: "MIS5870",
    courseName: "모바일앱프로그래밍",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금1,2,3 (정보관 605)",
    retake: false,
    professor: "김환선"
  },
  {
    year: 2028,
    semester: 2,
    courseNumber: "MIS5869",
    courseName: "경영정보취업세미나",
    completionType: "전공",
    credits: 2,
    timeAndRoom: "월6,7 (정보관 세미나실)",
    retake: false,
    professor: "강성구"
  },
  {
    year: 2028,
    semester: 2,
    courseNumber: "MIS5874",
    courseName: "지능형자동화실습",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (정보관 606)",
    retake: false,
    professor: "강영식"
  }
];

// 경영정보학과 전체 커리큘럼 (1~4학년 통합)
export const MIS_ALL_COURSES: Course[] = [
  ...MIS_YEAR1_COURSES,
  ...MIS_YEAR2_COURSES,
  ...MIS_YEAR3_COURSES,
  ...MIS_YEAR4_COURSES
];

// 경영정보학과 학년별 추천 진로 로드맵
export interface CareerRoadmap {
  year: number;
  semester: number;
  title: string;
  description: string;
  skills: string[];
  recommendedCourses: string[];
  careerGoals: string[];
  certifications?: string[];
}

export const MIS_CAREER_ROADMAP: CareerRoadmap[] = [
  {
    year: 1,
    semester: 1,
    title: "전공 탐색 및 기초 역량 형성",
    description: "경영과 IT의 기초를 다지고, 적성검사를 통해 진로 방향을 탐색합니다.",
    skills: ["Python 기초", "경영 기초 이론", "통계 기초"],
    recommendedCourses: ["경영학입문", "경제학원론", "경영정보", "프로그래밍기초(파이썬)"],
    careerGoals: ["전공 적합성 확인", "기초 프로그래밍 역량 습득"],
    certifications: ["ITQ 정보기술자격"]
  },
  {
    year: 1,
    semester: 2,
    title: "전공 선택 준비",
    description: "전공탐색세미나를 통해 경영정보학과의 세부 트랙을 이해합니다.",
    skills: ["데이터 분석 입문", "경영 통계"],
    recommendedCourses: ["경상통계학", "경영및경영정보전공탐색세미나"],
    careerGoals: ["경영정보학과 전공 확정", "관심 분야 트랙 탐색"],
    certifications: ["컴퓨터활용능력 2급"]
  },
  {
    year: 2,
    semester: 1,
    title: "데이터 분석 역량 강화",
    description: "데이터 분석 프로그래밍과 데이터베이스 기초를 학습합니다.",
    skills: ["Python 데이터 분석", "SQL", "데이터베이스 설계"],
    recommendedCourses: ["데이터분석프로그래밍", "데이터베이스활용"],
    careerGoals: ["데이터 분석가 기초 역량", "DB 설계 능력"],
    certifications: ["SQLD", "ADsP"]
  },
  {
    year: 2,
    semester: 2,
    title: "심화 데이터 역량 및 현장 이해",
    description: "데이터 분석 심화와 기업 현장 이해를 확장합니다.",
    skills: ["데이터 시각화", "비즈니스 분석"],
    recommendedCourses: ["데이터분석프로그래밍 심화"],
    careerGoals: ["인턴십 준비", "포트폴리오 구축 시작"]
  },
  {
    year: 3,
    semester: 1,
    title: "ERP 및 머신러닝 입문",
    description: "기업 정보시스템(ERP)과 인공지능/머신러닝의 기초를 학습합니다.",
    skills: ["ERP 시스템", "머신러닝 기초", "데이터 전처리"],
    recommendedCourses: ["ERP프로그래밍실습", "머신러닝"],
    careerGoals: ["ERP 컨설턴트 또는 AI 엔지니어 트랙 선택"],
    certifications: ["SAP 자격증", "TensorFlow Developer Certificate"]
  },
  {
    year: 3,
    semester: 2,
    title: "머신러닝 심화 및 프로젝트 경험",
    description: "머신러닝 심화 학습과 실무 프로젝트 경험을 쌓습니다.",
    skills: ["딥러닝", "모델 최적화", "팀 프로젝트"],
    recommendedCourses: ["머신러닝 심화"],
    careerGoals: ["캡스톤 프로젝트 준비", "하계/동계 인턴십"]
  },
  {
    year: 4,
    semester: 1,
    title: "캡스톤 프로젝트 및 취업 준비",
    description: "ERP 또는 AI 트랙 캡스톤 프로젝트를 수행하고, 취업 역량을 완성합니다.",
    skills: ["프로젝트 관리", "클라우드 서비스", "회계정보시스템"],
    recommendedCourses: ["캡스톤디자인(ERP)", "클라우드프로그래밍", "회계정보시스템"],
    careerGoals: ["캡스톤 프로젝트 완성", "취업 포트폴리오 완성"],
    certifications: ["AWS/Azure 자격증", "정보처리기사"]
  },
  {
    year: 4,
    semester: 2,
    title: "취업 및 진로 확정",
    description: "취업세미나와 최종 프로젝트를 통해 사회 진출을 준비합니다.",
    skills: ["AI 시스템 설계", "모바일 개발", "자동화 시스템"],
    recommendedCourses: ["캡스톤디자인(AI)", "모바일앱프로그래밍", "경영정보취업세미나", "지능형자동화실습"],
    careerGoals: ["취업 또는 대학원 진학 확정", "실무 프로젝트 경험 완성"]
  }
];

// 경영정보학과 추천 직무
export const MIS_RECOMMENDED_CAREERS = [
  {
    title: "데이터 분석가",
    description: "비즈니스 데이터를 분석하여 인사이트를 도출하고 의사결정을 지원",
    riasecMatch: { I: 0.9, C: 0.7, E: 0.5 },
    requiredSkills: ["Python", "SQL", "통계분석", "시각화"],
    relatedCourses: ["데이터분석프로그래밍", "데이터베이스활용", "머신러닝"]
  },
  {
    title: "ERP 컨설턴트",
    description: "기업 정보시스템 구축 및 운영을 컨설팅하고 최적화",
    riasecMatch: { C: 0.8, E: 0.7, I: 0.6, S: 0.5 },
    requiredSkills: ["SAP", "ERP 시스템", "비즈니스 프로세스", "프로젝트 관리"],
    relatedCourses: ["ERP프로그래밍실습", "회계정보시스템", "캡스톤디자인(ERP)"]
  },
  {
    title: "AI/ML 엔지니어",
    description: "머신러닝 모델을 개발하고 프로덕션 환경에 배포",
    riasecMatch: { I: 0.95, R: 0.7, C: 0.5 },
    requiredSkills: ["Python", "TensorFlow/PyTorch", "클라우드", "MLOps"],
    relatedCourses: ["머신러닝", "캡스톤디자인(AI)", "클라우드프로그래밍"]
  },
  {
    title: "비즈니스 인텔리전스 전문가",
    description: "BI 도구를 활용하여 대시보드 구축 및 리포팅 시스템 운영",
    riasecMatch: { I: 0.8, C: 0.8, E: 0.6 },
    requiredSkills: ["Tableau/Power BI", "SQL", "데이터 모델링"],
    relatedCourses: ["데이터분석프로그래밍", "데이터베이스활용"]
  },
  {
    title: "IT 기획/PM",
    description: "IT 프로젝트 기획, 관리 및 이해관계자 조율",
    riasecMatch: { E: 0.8, I: 0.6, C: 0.6, S: 0.5 },
    requiredSkills: ["프로젝트 관리", "요구사항 분석", "커뮤니케이션"],
    relatedCourses: ["경영정보취업세미나", "캡스톤디자인(ERP)", "캡스톤디자인(AI)"]
  }
];

// ============================================
// 모듈 및 마이크로디그리 시스템
// ============================================

// 모듈 타입 정의
export interface CourseModule {
  id: string;
  name: string;
  description: string;
  courses: string[]; // courseNumber 배열
  color: string;
}

// 마이크로디그리 타입 정의
export interface MicroDegree {
  id: string;
  name: string;
  description: string;
  modules: string[]; // module id 배열
  icon: string;
  color: string;
}

// 모듈 정의
export const MIS_MODULES: CourseModule[] = [
  {
    id: "module-1",
    name: "AI 데이터 분석",
    description: "데이터 처리 기초부터 머신러닝 핵심 알고리즘 및 자동화 기술 습득",
    courses: ["MIS5864", "MIS5865", "MIS5874"], // 데이터분석프로그래밍, 머신러닝, 지능형자동화실습
    color: "#3b82f6" // blue
  },
  {
    id: "module-2",
    name: "클라우드&앱 솔루션",
    description: "모바일 앱 개발 능력과 클라우드 컴퓨팅 기술을 결합하여 AI 서비스 구현",
    courses: ["MIS5870", "MIS5871", "MIS5873"], // 모바일앱프로그래밍, 클라우드프로그래밍, 캡스톤디자인(AI)
    color: "#8b5cf6" // purple
  },
  {
    id: "module-3",
    name: "ERP 시스템 코어",
    description: "데이터베이스와 회계 도메인 지식, ERP 개발 방법론 학습",
    courses: ["MIS6244", "MIS5867", "MIS5868"], // 데이터베이스활용, ERP프로그래밍실습, 회계정보시스템
    color: "#10b981" // emerald
  },
  {
    id: "module-4",
    name: "비즈니스 실무 프로젝트",
    description: "ERP 지식 기반 시스템 구축(Capstone) 및 취업 역량 점검",
    courses: ["MIS5872", "MIS5869"], // 캡스톤디자인(ERP), 경영정보취업세미나
    color: "#f59e0b" // amber
  }
];

// 마이크로디그리 정의
export const MIS_MICRO_DEGREES: MicroDegree[] = [
  {
    id: "micro-1",
    name: "AI 융합 소프트웨어",
    description: "데이터 분석 및 AI 이론을 바탕으로 클라우드 환경에서 지능형 애플리케이션을 개발·배포하는 풀스택 AI 개발자 양성",
    modules: ["module-1", "module-2"],
    icon: "🤖",
    color: "#6366f1" // indigo
  },
  {
    id: "micro-2",
    name: "엔터프라이즈 시스템 컨설턴트",
    description: "기업의 데이터와 회계 정보를 관리하는 ERP 시스템 구축·운영 및 컨설팅 역량을 갖춘 전문가 양성",
    modules: ["module-3", "module-4"],
    icon: "💼",
    color: "#059669" // emerald
  }
];

// 교과목 번호로 학년 정보 가져오기
export function getCourseGrade(courseNumber: string): number {
  // 강좌번호 기반 학년 매핑
  const gradeMap: Record<string, number> = {
    // 1학년
    "GEN101-A01": 1, "GEN102-A01": 1, "GEN103-A01": 1,
    "MIS101-A01": 1, "MIS102-A01": 1, "MIS100-A01": 1,
    // 2학년
    "MIS5864": 2, "MIS6244": 2, "경과104": 2, "경과106": 2, "경과120": 2,
    "경과135": 2, "경과141": 2, "경과143": 2, "경과145": 2, "경과147": 2, "경정262": 2,
    // 3학년
    "MIS5867": 3, "MIS5866": 3, "MIS5865": 3,
    "경과113": 3, "경과119": 3, "경과122": 3, "경과144": 3,
    "경정332": 3, "경정341": 3, "경정377": 3, "경정378": 3, "경정381": 3, "경정384": 3, "경정385": 3,
    // 4학년
    "MIS5872": 4, "MIS5871": 4, "MIS5868": 4,
    "MIS5873": 4, "MIS5870": 4, "MIS5869": 4, "MIS5874": 4
  };
  return gradeMap[courseNumber] || 0;
}

// 교과목이 속한 모듈 찾기
export function getModuleForCourse(courseNumber: string): CourseModule | null {
  return MIS_MODULES.find(m => m.courses.includes(courseNumber)) || null;
}

// 모듈이 속한 마이크로디그리 찾기
export function getMicroDegreeForModule(moduleId: string): MicroDegree | null {
  return MIS_MICRO_DEGREES.find(md => md.modules.includes(moduleId)) || null;
}

// 이수한 과목으로 모듈 완료 여부 확인
export function getModuleProgress(completedCourseNumbers: string[]): {
  module: CourseModule;
  completed: number;
  total: number;
  isComplete: boolean;
}[] {
  return MIS_MODULES.map(module => {
    const completed = module.courses.filter(cn => completedCourseNumbers.includes(cn)).length;
    return {
      module,
      completed,
      total: module.courses.length,
      isComplete: completed === module.courses.length
    };
  });
}

// 마이크로디그리 획득 여부 확인
export function getMicroDegreeProgress(completedCourseNumbers: string[]): {
  microDegree: MicroDegree;
  modulesCompleted: number;
  totalModules: number;
  isComplete: boolean;
  modules: { module: CourseModule; completed: number; total: number; isComplete: boolean }[];
}[] {
  const moduleProgress = getModuleProgress(completedCourseNumbers);
  
  return MIS_MICRO_DEGREES.map(md => {
    const relatedModules = moduleProgress.filter(mp => md.modules.includes(mp.module.id));
    const modulesCompleted = relatedModules.filter(m => m.isComplete).length;
    
    return {
      microDegree: md,
      modulesCompleted,
      totalModules: md.modules.length,
      isComplete: modulesCompleted === md.modules.length,
      modules: relatedModules
    };
  });
}

// 신입생 수강 현황 (교양 위주, 전공 미선택)
export const FRESHMAN_COURSES: Course[] = [
  {
    year: 2025,
    semester: 1,
    courseNumber: "GEN001-A01",
    courseName: "대학생활과 진로설계",
    completionType: "기초교양",
    credits: 2,
    timeAndRoom: "월1,2 (본관 101)",
    retake: false,
    professor: "김진로"
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "GEN002-B01",
    courseName: "글쓰기와 의사소통",
    completionType: "기초교양",
    credits: 3,
    timeAndRoom: "화3,4,5 (본관 203)",
    retake: false,
    professor: "박작문"
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "GEN003-C01",
    courseName: "컴퓨터활용",
    completionType: "기초교양",
    credits: 3,
    timeAndRoom: "수2,3,4 (정보관 301)",
    retake: false,
    professor: "정컴퓨터"
  }
];

// 기존 학생 수강 현황 (경영학과, 수강 이력 풍부)
export const DUMMY_COURSES: Course[] = [
  // 2025년 2학기
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS301-A01",
    courseName: "전략경영론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월2,3,4 (경영관 301)",
    retake: false,
    professor: "박전략",
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS302-B01",
    courseName: "마케팅관리론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화5,6,7 (경영관 405)",
    retake: false,
    professor: "이마케팅",
    // riasecProfile: { E: 0.9, A: 0.7, S: 0.6 } // 설득, 창의, 소비자 이해
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS303-A01",
    courseName: "재무관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수3,4,5 (경영관 201)",
    retake: false,
    professor: "최재무",
    // riasecProfile: { I: 0.9, C: 0.8 } // 분석, 체계적 계산
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS304-C01",
    courseName: "조직행동론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목2,3,4 (경영관 302)",
    retake: false,
    professor: "정조직",
    // riasecProfile: { S: 0.9, I: 0.6, E: 0.5 } // 사람 이해, 분석, 관리
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS305-A01",
    courseName: "경영정보시스템",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금1,2,3 (정보관 501)",
    retake: false,
    professor: "김정보",
    // riasecProfile: { I: 0.8, C: 0.7, R: 0.4 } // 분석, 시스템 설계, 실무
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "GEN201-E01",
    courseName: "데이터분석과 의사결정",
    completionType: "핵심교양",
    credits: 3,
    timeAndRoom: "온1,2,3",
    retake: false,
    professor: "안데이터",
    // riasecProfile: { I: 0.9, C: 0.6 } // 데이터 분석, 논리적 사고
  },
  
  // 2025년 1학기
  {
    year: 2025,
    semester: 1,
    courseNumber: "BUS201-A01",
    courseName: "인적자원관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월3,4,5 (경영관 303)",
    retake: false,
    professor: "홍인사",
    // riasecProfile: { S: 0.8, C: 0.7, E: 0.5 } // 사람 관리, 체계, 조정
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "BUS202-B01",
    courseName: "생산운영관리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화2,3,4 (경영관 401)",
    retake: false,
    professor: "윤생산",
    // riasecProfile: { C: 0.8, I: 0.7, R: 0.6 } // 프로세스 관리, 분석, 실무
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "BUS203-A01",
    courseName: "소비자행동론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수6,7,8 (경영관 202)",
    retake: false,
    professor: "강소비자",
    // riasecProfile: { S: 0.8, I: 0.7, A: 0.5 } // 소비자 이해, 분석, 창의적 접근
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "BUS204-C01",
    courseName: "국제경영론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목5,6,7 (경영관 304)",
    retake: false,
    professor: "서국제",
    // riasecProfile: { E: 0.7, I: 0.6, S: 0.6 } // 글로벌 커뮤니케이션, 분석, 문화 이해
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "BUS205-A01",
    courseName: "경영통계학",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금3,4,5 (경영관 501)",
    retake: false,
    professor: "조통계",
    // riasecProfile: { I: 0.9, C: 0.7 } // 데이터 분석, 정량적 사고
  },
  {
    year: 2025,
    semester: 1,
    courseNumber: "GEN101-A01",
    courseName: "기업가정신과 혁신",
    completionType: "핵심교양",
    credits: 2,
    timeAndRoom: "온1,2",
    retake: false,
    professor: "한혁신",
    // riasecProfile: { E: 0.8, A: 0.7, V: 0.6 } // 창업가 정신, 혁신, 가치 창출
  },

  // 2024년 2학기
  {
    year: 2024,
    semester: 2,
    courseNumber: "BUS101-A01",
    courseName: "경영학원론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월1,2,3 (경영관 101)",
    retake: false,
    professor: "김원론",
    // riasecProfile: { E: 0.6, I: 0.6, C: 0.5 } // 전반적 경영 이해
  },
  {
    year: 2024,
    semester: 2,
    courseNumber: "BUS102-B01",
    courseName: "회계원리",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화4,5,6 (경영관 102)",
    retake: false,
    professor: "이회계",
    // riasecProfile: { C: 0.9, I: 0.7 } // 체계적 기록, 분석
  },
  {
    year: 2024,
    semester: 2,
    courseNumber: "ECO101-A01",
    courseName: "미시경제학",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수1,2,3 (경영관 201)",
    retake: false,
    professor: "박경제",
    // riasecProfile: { I: 0.9, C: 0.6 } // 경제 분석, 이론적 사고
  }
];

// 추천 과목 풀 (미수강 과목)
export const AVAILABLE_COURSES: Course[] = [
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS306-A01",
    courseName: "창업론",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화3,4,5 (경영관 303)",
    retake: false,
    professor: "김창업",
    // riasecProfile: { E: 0.9, A: 0.7, R: 0.5, V: 0.4 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS307-B01",
    courseName: "소셜미디어마케팅",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "목6,7,8 (경영관 404)",
    retake: false,
    professor: "박소셜",
    // riasecProfile: { A: 0.9, E: 0.8, S: 0.6 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS308-C01",
    courseName: "빅데이터경영",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "수1,2,3 (정보관 502)",
    retake: false,
    professor: "최빅데이터",
    // riasecProfile: { I: 0.9, C: 0.7, R: 0.4 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS309-A01",
    courseName: "글로벌비즈니스커뮤니케이션",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "금4,5,6 (경영관 305)",
    retake: false,
    professor: "이글로벌",
    // riasecProfile: { E: 0.8, S: 0.8, A: 0.5 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS310-B01",
    courseName: "사회적기업경영",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "월6,7,8 (경영관 306)",
    retake: false,
    professor: "정사회적",
    // riasecProfile: { V: 0.9, S: 0.7, E: 0.6 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "BUS311-A01",
    courseName: "경영시뮬레이션",
    completionType: "전공",
    credits: 3,
    timeAndRoom: "화1,2,3 (정보관 503)",
    retake: false,
    professor: "한시뮬",
    // riasecProfile: { I: 0.8, R: 0.7, C: 0.6 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "GEN301-E01",
    courseName: "디자인씽킹",
    completionType: "핵심교양",
    credits: 3,
    timeAndRoom: "온2,3,4",
    retake: false,
    professor: "임디자인",
    // riasecProfile: { A: 0.9, S: 0.6, E: 0.5 }
  },
  {
    year: 2025,
    semester: 2,
    courseNumber: "GEN302-E01",
    courseName: "AI와 비즈니스",
    completionType: "핵심교양",
    credits: 2,
    timeAndRoom: "온1,2",
    retake: false,
    professor: "오AI",
    // riasecProfile: { I: 0.8, C: 0.5, R: 0.4 }
  }
];

// 신입생 학점 이수 정보 (1학기만)
export const FRESHMAN_GRADES: StudentGrades = {
  averageGpa: 3.2,
  percentileScore: 78.5,
  totalRegisteredCredits: 8,
  totalAcquiredCredits: 8,
  records: [
    {
      year: 2025,
      semester: 1,
      grade: 1,
      registeredCredits: 8,
      acquiredCredits: 8,
      generalCredits: 8,
      majorCredits: 0,
      teachingCredits: 0,
      gpa: 3.2,
      percentile: 78.5,
      academicWarning: false,
      semesterRank: "156/320",
      overallRank: "3245/6890",
      semesterWithdrawal: false
    }
  ]
};

// 기존 학생 학점 이수 정보 (경영학과, 5학기)
export const DUMMY_GRADES: StudentGrades = {
  averageGpa: 3.65,
  percentileScore: 89.2,
  totalRegisteredCredits: 89,
  totalAcquiredCredits: 89,
  records: [
    {
      year: 2023,
      semester: 1,
      grade: 1,
      registeredCredits: 18,
      acquiredCredits: 18,
      generalCredits: 6,
      majorCredits: 12,
      teachingCredits: 0,
      gpa: 3.4,
      percentile: 86.2,
      academicWarning: false,
      semesterRank: "38/72",
      overallRank: "2845/6532",
      semesterWithdrawal: false
    },
    {
      year: 2023,
      semester: 2,
      grade: 1,
      registeredCredits: 18,
      acquiredCredits: 18,
      generalCredits: 3,
      majorCredits: 15,
      teachingCredits: 0,
      gpa: 3.5,
      percentile: 87.8,
      academicWarning: false,
      semesterRank: "35/68",
      overallRank: "2654/6321",
      semesterWithdrawal: false
    },
    {
      year: 2024,
      semester: 1,
      grade: 2,
      registeredCredits: 18,
      acquiredCredits: 18,
      generalCredits: 3,
      majorCredits: 15,
      teachingCredits: 0,
      gpa: 3.68,
      percentile: 88.9,
      academicWarning: false,
      semesterRank: "28/65",
      overallRank: "2412/6198",
      semesterWithdrawal: false
    },
    {
      year: 2024,
      semester: 2,
      grade: 2,
      registeredCredits: 18,
      acquiredCredits: 18,
      generalCredits: 4,
      majorCredits: 14,
      teachingCredits: 0,
      gpa: 4.05,
      percentile: 93.5,
      academicWarning: false,
      semesterRank: "12/58",
      overallRank: "1256/5876",
      semesterWithdrawal: false
    },
    {
      year: 2025,
      semester: 1,
      grade: 3,
      registeredCredits: 17,
      acquiredCredits: 17,
      generalCredits: 2,
      majorCredits: 15,
      teachingCredits: 0,
      gpa: 3.72,
      percentile: 89.8,
      academicWarning: false,
      semesterRank: "32/62",
      overallRank: "2187/6024",
      semesterWithdrawal: false
    }
  ]
};

// 경영학과 3학년 전공능력진단 결과
export const SENIOR_COMPETENCY: MajorCompetencyResult = {
  testDate: "2025-06-15",
  department: "경영학과",
  overallScore: 82.5,
  overallPercentile: 88.3,
  competencies: [
    {
      competencyName: "경영 전문지식",
      score: 85,
      percentile: 90,
      level: "high",
      description: "경영학 이론과 실무 지식에 대한 이해도"
    },
    {
      competencyName: "문제해결능력",
      score: 88,
      percentile: 92,
      level: "high",
      description: "복잡한 경영 문제를 분석하고 해결하는 능력"
    },
    {
      competencyName: "의사소통능력",
      score: 90,
      percentile: 94,
      level: "high",
      description: "효과적인 의사소통 및 프레젠테이션 능력"
    },
    {
      competencyName: "리더십",
      score: 78,
      percentile: 82,
      level: "medium",
      description: "팀을 이끌고 동기부여하는 능력"
    },
    {
      competencyName: "글로벌역량",
      score: 75,
      percentile: 80,
      level: "medium",
      description: "국제 비즈니스 환경에 대한 이해와 적응력"
    },
    {
      competencyName: "윤리의식",
      score: 92,
      percentile: 95,
      level: "high",
      description: "경영 윤리와 사회적 책임에 대한 의식"
    }
  ],
  strengths: [
    "의사소통능력과 윤리의식이 특히 우수함",
    "문제해결능력이 뛰어나 분석 중심 직무에 적합",
    "경영 전문지식 기반이 탄탄함"
  ],
  improvements: [
    "리더십 역량을 더 개발하면 관리자 역할에 유리",
    "글로벌 역량 강화를 위해 국제경영 관련 경험 확대 권장"
  ]
};

// 무전공 1학년 전공능력진단 결과 (기초 수준)
export const FRESHMAN_COMPETENCY: MajorCompetencyResult = {
  testDate: "2025-03-10",
  department: "무전공",
  overallScore: 65.2,
  overallPercentile: 68.5,
  competencies: [
    {
      competencyName: "자기주도학습",
      score: 70,
      percentile: 72,
      level: "medium",
      description: "스스로 학습 계획을 세우고 실행하는 능력"
    },
    {
      competencyName: "기초학업능력",
      score: 68,
      percentile: 70,
      level: "medium",
      description: "대학 수준의 읽기, 쓰기, 계산 능력"
    },
    {
      competencyName: "창의적사고",
      score: 72,
      percentile: 75,
      level: "medium",
      description: "새로운 아이디어를 생성하고 문제를 창의적으로 해결"
    },
    {
      competencyName: "협업능력",
      score: 65,
      percentile: 67,
      level: "medium",
      description: "팀 프로젝트에서 효과적으로 협력하는 능력"
    },
    {
      competencyName: "디지털리터러시",
      score: 58,
      percentile: 62,
      level: "low",
      description: "디지털 도구와 정보를 효과적으로 활용하는 능력"
    },
    {
      competencyName: "진로탐색역량",
      score: 62,
      percentile: 65,
      level: "medium",
      description: "자신의 진로를 탐색하고 설계하는 능력"
    }
  ],
  strengths: [
    "창의적 사고력이 좋아 다양한 전공 탐색 가능",
    "자기주도학습 능력이 양호함"
  ],
  improvements: [
    "디지털 리터러시 향상을 위한 컴퓨터 활용 교육 필요",
    "협업 능력 개발을 위해 팀 프로젝트 활동 권장",
    "다양한 전공 탐색을 통해 진로 방향 설정 필요"
  ]
};

// 경영정보학과 학생 성적 정보 (2학년, 진행중)
export const MIS_GRADES: StudentGrades = {
  averageGpa: 3.75,
  percentileScore: 85.2,
  totalRegisteredCredits: 34,
  totalAcquiredCredits: 34,
  records: [
    {
      year: 2025,
      semester: 1,
      grade: 1,
      registeredCredits: 18,
      acquiredCredits: 18,
      generalCredits: 9,
      majorCredits: 9,
      teachingCredits: 0,
      gpa: 3.6,
      percentile: 82.5,
      academicWarning: false,
      semesterRank: "45/120",
      overallRank: "1256/5230",
      semesterWithdrawal: false
    },
    {
      year: 2025,
      semester: 2,
      grade: 1,
      registeredCredits: 16,
      acquiredCredits: 16,
      generalCredits: 4,
      majorCredits: 12,
      teachingCredits: 0,
      gpa: 3.9,
      percentile: 88.3,
      academicWarning: false,
      semesterRank: "28/115",
      overallRank: "985/5120",
      semesterWithdrawal: false
    }
  ]
};

// 경영정보학과 학생 전공능력진단 결과
export const MIS_COMPETENCY: MajorCompetencyResult = {
  testDate: "2026-03-15",
  department: "경영정보학과",
  overallScore: 78.5,
  overallPercentile: 82.1,
  competencies: [
    {
      competencyName: "프로그래밍 역량",
      score: 85,
      percentile: 88,
      level: "high",
      description: "Python, SQL 등 프로그래밍 언어 활용 능력"
    },
    {
      competencyName: "데이터 분석 역량",
      score: 82,
      percentile: 85,
      level: "high",
      description: "데이터 수집, 정제, 분석 및 시각화 능력"
    },
    {
      competencyName: "비즈니스 이해도",
      score: 75,
      percentile: 78,
      level: "medium",
      description: "경영 환경과 비즈니스 프로세스에 대한 이해"
    },
    {
      competencyName: "문제해결능력",
      score: 80,
      percentile: 82,
      level: "high",
      description: "복잡한 문제를 분석하고 해결책을 도출하는 능력"
    },
    {
      competencyName: "커뮤니케이션",
      score: 72,
      percentile: 75,
      level: "medium",
      description: "기술적 내용을 비전문가에게 설명하는 능력"
    },
    {
      competencyName: "팀워크",
      score: 78,
      percentile: 80,
      level: "medium",
      description: "팀 프로젝트에서 협력하고 기여하는 능력"
    }
  ],
  strengths: [
    "프로그래밍과 데이터 분석 역량이 우수함",
    "문제해결능력이 뛰어나 기술 직무에 적합",
    "논리적 사고력이 강점"
  ],
  improvements: [
    "비즈니스 이해도를 높여 기술과 비즈니스를 연결하는 역량 강화 필요",
    "커뮤니케이션 역량 개발로 IT 기획/컨설팅 역할에 대비",
    "팀 프로젝트 경험을 통한 협업 역량 향상 권장"
  ]
};

// 학생 데이터 선택 함수
export function setCurrentStudent(studentId: string) {
  if (studentId === FRESHMAN_STUDENT.studentId) {
    CURRENT_STUDENT = FRESHMAN_STUDENT;
  } else if (studentId === MIS_STUDENT.studentId) {
    CURRENT_STUDENT = MIS_STUDENT;
  } else {
    CURRENT_STUDENT = DUMMY_STUDENT;
  }
}

export function getCurrentCourses() {
  if (CURRENT_STUDENT.studentId === FRESHMAN_STUDENT.studentId) {
    return FRESHMAN_COURSES;
  } else if (CURRENT_STUDENT.studentId === MIS_STUDENT.studentId) {
    // 경영정보학과 학생은 현재 학년에 맞는 과목 + 이전 학년 수강 완료 과목 반환
    const currentGrade = CURRENT_STUDENT.grade;
    let courses: Course[] = [];
    if (currentGrade >= 1) courses = [...courses, ...MIS_YEAR1_COURSES];
    if (currentGrade >= 2) courses = [...courses, ...MIS_YEAR2_COURSES];
    if (currentGrade >= 3) courses = [...courses, ...MIS_YEAR3_COURSES];
    if (currentGrade >= 4) courses = [...courses, ...MIS_YEAR4_COURSES];
    return courses;
  }
  return DUMMY_COURSES;
}

export function getCurrentGrades() {
  if (CURRENT_STUDENT.studentId === FRESHMAN_STUDENT.studentId) {
    return FRESHMAN_GRADES;
  } else if (CURRENT_STUDENT.studentId === MIS_STUDENT.studentId) {
    return MIS_GRADES;
  }
  return DUMMY_GRADES;
}

export function getCurrentCompetency() {
  if (CURRENT_STUDENT.studentId === FRESHMAN_STUDENT.studentId) {
    return FRESHMAN_COMPETENCY;
  } else if (CURRENT_STUDENT.studentId === MIS_STUDENT.studentId) {
    return MIS_COMPETENCY;
  }
  return SENIOR_COMPETENCY;
}

// 경영정보학과 커리큘럼 조회 함수
export function getMISCurriculum(year?: number) {
  if (!year) return MIS_ALL_COURSES;
  switch (year) {
    case 1: return MIS_YEAR1_COURSES;
    case 2: return MIS_YEAR2_COURSES;
    case 3: return MIS_YEAR3_COURSES;
    case 4: return MIS_YEAR4_COURSES;
    default: return [];
  }
}

// 경영정보학과 진로 로드맵 조회 함수
export function getMISCareerRoadmap(year?: number, semester?: number) {
  if (!year) return MIS_CAREER_ROADMAP;
  return MIS_CAREER_ROADMAP.filter(r => 
    r.year === year && (semester === undefined || r.semester === semester)
  );
}

// 경영정보학과 추천 직무 조회 함수
export function getMISRecommendedCareers() {
  return MIS_RECOMMENDED_CAREERS;
}

// 학년별로 수강한 교과목 조회 (누적)
export function getCoursesByGradeUpTo(targetGrade: number): Course[] {
  if (CURRENT_STUDENT.studentId !== MIS_STUDENT.studentId) {
    return getCurrentCourses();
  }
  
  let courses: Course[] = [];
  if (targetGrade >= 1) courses = [...courses, ...MIS_YEAR1_COURSES];
  if (targetGrade >= 2) courses = [...courses, ...MIS_YEAR2_COURSES];
  if (targetGrade >= 3) courses = [...courses, ...MIS_YEAR3_COURSES];
  if (targetGrade >= 4) courses = [...courses, ...MIS_YEAR4_COURSES];
  return courses;
}

