import { Student, Course, StudentGrades } from "../types/student";

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

// 현재 로그인한 학생 정보 (기본값)
export let CURRENT_STUDENT: Student = DUMMY_STUDENT;

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
    professor: "김진로",
    riasecProfile: { S: 0.6, E: 0.5, V: 0.4 } // 자기탐색, 진로 설계
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
    professor: "박작문",
    riasecProfile: { A: 0.7, E: 0.5, S: 0.4 } // 창의적 표현, 소통
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
    professor: "정컴퓨터",
    riasecProfile: { R: 0.5, C: 0.6, I: 0.4 } // 실무 기술, 체계
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
    riasecProfile: { E: 0.8, I: 0.7, C: 0.5 } // 리더십, 분석, 체계
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
    riasecProfile: { E: 0.9, A: 0.7, S: 0.6 } // 설득, 창의, 소비자 이해
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
    riasecProfile: { I: 0.9, C: 0.8 } // 분석, 체계적 계산
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
    riasecProfile: { S: 0.9, I: 0.6, E: 0.5 } // 사람 이해, 분석, 관리
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
    riasecProfile: { I: 0.8, C: 0.7, R: 0.4 } // 분석, 시스템 설계, 실무
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
    riasecProfile: { I: 0.9, C: 0.6 } // 데이터 분석, 논리적 사고
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
    riasecProfile: { S: 0.8, C: 0.7, E: 0.5 } // 사람 관리, 체계, 조정
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
    riasecProfile: { C: 0.8, I: 0.7, R: 0.6 } // 프로세스 관리, 분석, 실무
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
    riasecProfile: { S: 0.8, I: 0.7, A: 0.5 } // 소비자 이해, 분석, 창의적 접근
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
    riasecProfile: { E: 0.7, I: 0.6, S: 0.6 } // 글로벌 커뮤니케이션, 분석, 문화 이해
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
    riasecProfile: { I: 0.9, C: 0.7 } // 데이터 분석, 정량적 사고
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
    riasecProfile: { E: 0.8, A: 0.7, V: 0.6 } // 창업가 정신, 혁신, 가치 창출
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
    riasecProfile: { E: 0.6, I: 0.6, C: 0.5 } // 전반적 경영 이해
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
    riasecProfile: { C: 0.9, I: 0.7 } // 체계적 기록, 분석
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
    riasecProfile: { I: 0.9, C: 0.6 } // 경제 분석, 이론적 사고
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
    riasecProfile: { E: 0.9, A: 0.7, R: 0.5, V: 0.4 }
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
    riasecProfile: { A: 0.9, E: 0.8, S: 0.6 }
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
    riasecProfile: { I: 0.9, C: 0.7, R: 0.4 }
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
    riasecProfile: { E: 0.8, S: 0.8, A: 0.5 }
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
    riasecProfile: { V: 0.9, S: 0.7, E: 0.6 }
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
    riasecProfile: { I: 0.8, R: 0.7, C: 0.6 }
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
    riasecProfile: { A: 0.9, S: 0.6, E: 0.5 }
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
    riasecProfile: { I: 0.8, C: 0.5, R: 0.4 }
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

// 학생 데이터 선택 함수
export function setCurrentStudent(studentId: string) {
  if (studentId === FRESHMAN_STUDENT.studentId) {
    CURRENT_STUDENT = FRESHMAN_STUDENT;
  } else {
    CURRENT_STUDENT = DUMMY_STUDENT;
  }
}

export function getCurrentCourses() {
  return CURRENT_STUDENT.studentId === FRESHMAN_STUDENT.studentId 
    ? FRESHMAN_COURSES 
    : DUMMY_COURSES;
}

export function getCurrentGrades() {
  return CURRENT_STUDENT.studentId === FRESHMAN_STUDENT.studentId 
    ? FRESHMAN_GRADES 
    : DUMMY_GRADES;
}

