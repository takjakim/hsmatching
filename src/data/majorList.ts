// 학과 리스트와 RIASEC 프로파일 매핑
import type { ClusterType } from './questionPool';

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';

interface Major {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
  cluster: ClusterType; // 계열 분류
  college: string; // 단과대학
  url?: string; // 전공 홈페이지 URL
}

// 전공별 홈페이지 URL 매핑 (명지대학교 공식 페이지)
const MAJOR_URL_MAP: Record<string, string> = {
  // 인문대학
  "중어중문학전공": "https://www.mju.ac.kr/mjukr/524/subview.do",
  "일어일문학전공": "https://www.mju.ac.kr/mjukr/531/subview.do",
  "아랍지역학전공": "https://www.mju.ac.kr/mjukr/551/subview.do",
  "글로벌한국어학전공": "https://www.mju.ac.kr/mjukr/5397/subview.do",
  "국어국문학전공": "https://www.mju.ac.kr/mjukr/510/subview.do",
  "영어영문학전공": "https://www.mju.ac.kr/mjukr/517/subview.do",
  "미술사·역사학전공": "https://www.mju.ac.kr/mjukr/9729/subview.do",
  "문헌정보학전공": "https://www.mju.ac.kr/mjukr/544/subview.do",
  "글로벌문화콘텐츠학전공": "https://www.mju.ac.kr/mjukr/5403/subview.do",
  "문예창작학과": "https://www.mju.ac.kr/mjukr/571/subview.do",
  "사학과": "https://www.mju.ac.kr/mjukr/204/subview.do", // 인문대학 메인
  "미술사학과": "https://www.mju.ac.kr/mjukr/9729/subview.do", // 미술사·역사학전공 페이지
  "철학과": "https://www.mju.ac.kr/mjukr/204/subview.do", // 인문대학 메인
  
  // 사회과학대학
  "행정학전공": "https://www.mju.ac.kr/mjukr/578/subview.do",
  "정치외교학전공": "https://www.mju.ac.kr/mjukr/591/subview.do",
  "경제학전공": "https://www.mju.ac.kr/mjukr/584/subview.do",
  "국제통상학전공": "https://www.mju.ac.kr/mjukr/629/subview.do",
  "응용통계학전공": "https://www.mju.ac.kr/mjukr/10194/subview.do",
  "법학과": "https://www.mju.ac.kr/mjukr/615/subview.do",
  
  // 경영대학
  "경영학전공": "https://www.mju.ac.kr/mjukr/622/subview.do",
  "글로벌비즈니스학전공": "https://www.mju.ac.kr/mjukr/4746/subview.do",
  "경영정보학과": "https://www.mju.ac.kr/mjukr/636/subview.do",
  "국제통상학과": "https://www.mju.ac.kr/mjukr/10254/subview.do",
  
  // 미디어·휴먼라이프대학
  "디지털미디어학부": "https://www.mju.ac.kr/mjukr/597/subview.do",
  "청소년지도학전공": "https://www.mju.ac.kr/mjukr/609/subview.do",
  "아동학전공": "https://www.mju.ac.kr/mjukr/603/subview.do",
  
  // 인공지능·소프트웨어융합대학
  "응용소프트웨어전공": "https://www.mju.ac.kr/mjukr/670/subview.do",
  "데이터사이언스전공": "https://www.mju.ac.kr/mjukr/10205/subview.do",
  "인공지능전공": "https://www.mju.ac.kr/mjukr/10210/subview.do",
  "디지털콘텐츠디자인학과": "https://www.mju.ac.kr/mjukr/7844/subview.do",
  
  // 미래융합대학
  "창의융합인재학부": "http://future.mju.ac.kr/default/sub2/sub1.php",
  "사회복지학과": "http://mjwelfare.mju.ac.kr/",
  "부동산학과": "http://real.mju.ac.kr/",
  "법무행정학과": "http://mjlaw.mju.ac.kr/",
  "심리치료학과": "http://psy.mju.ac.kr/",
  "미래융합경영학과": "http://dfba.mju.ac.kr/",
  "멀티디자인학과": "https://multid.mju.ac.kr/default/",
  "회계세무학과": "https://actx.mju.ac.kr/default/",
  "계약학과": "http://bizhrd.mju.ac.kr/",
  
  // 아너칼리지
  "아너칼리지(전공자유대학)": "https://www.mju.ac.kr/mjukr/10216/subview.do",
  "자율전공학부(인문)": "https://www.mju.ac.kr/mjukr/10216/subview.do",
  "자율전공학부(자연)": "https://www.mju.ac.kr/mjukr/10216/subview.do",
  
  // 화학·생명과학대학
  "화학나노학전공": "https://www.mju.ac.kr/mjukr/726/subview.do",
  "융합에너지학전공": "https://www.mju.ac.kr/mjukr/719/subview.do",
  "식품영양학전공": "https://www.mju.ac.kr/mjukr/732/subview.do",
  "시스템생명과학전공": "https://www.mju.ac.kr/mjukr/739/subview.do",
  "물리학과": "https://www.mju.ac.kr/mjukr/10266/subview.do",
  "수학과": "https://www.mju.ac.kr/mjukr/712/subview.do",
  
  // 스마트시스템공과대학
  "화학공학전공": "https://www.mju.ac.kr/mjukr/759/subview.do",
  "신소재공학전공": "https://www.mju.ac.kr/mjukr/766/subview.do",
  "환경시스템공학전공": "https://www.mju.ac.kr/mjukr/773/subview.do",
  "건설환경공학전공": "https://www.mju.ac.kr/mjukr/780/subview.do",
  "스마트모빌리티공학전공": "https://www.mju.ac.kr/mjukr/787/subview.do",
  "기계공학전공": "https://www.mju.ac.kr/mjukr/794/subview.do",
  "로봇공학전공": "https://www.mju.ac.kr/mjukr/10218/subview.do",
  
  // 반도체·ICT대학
  "컴퓨터공학전공": "https://www.mju.ac.kr/mjukr/808/subview.do",
  "정보통신공학전공": "https://www.mju.ac.kr/mjukr/676/subview.do",
  "전기공학전공": "https://www.mju.ac.kr/mjukr/745/subview.do",
  "전자공학전공": "https://www.mju.ac.kr/mjukr/752/subview.do",
  "반도체공학부": "https://www.mju.ac.kr/mjukr/8481/subview.do",
  "산업경영공학과": "https://www.mju.ac.kr/mjukr/801/subview.do",
  
  // 스포츠·예술대학
  "스포츠학부": "https://www.mju.ac.kr/mjukr/821/subview.do",
  "체육학전공": "https://www.mju.ac.kr/mjukr/821/subview.do",
  "스포츠산업학전공": "https://www.mju.ac.kr/mjukr/821/subview.do",
  "스포츠지도학전공": "https://www.mju.ac.kr/mjukr/821/subview.do",
  "아트앤멀티미디어음악학부": "https://www.mju.ac.kr/mjukr/10245/subview.do",
  "건반음악전공": "https://www.mju.ac.kr/mjukr/10245/subview.do",
  "보컬뮤직전공": "https://www.mju.ac.kr/mjukr/10245/subview.do",
  "작곡전공": "https://www.mju.ac.kr/mjukr/10245/subview.do",
  "공연예술학부": "https://www.mju.ac.kr/mjukr/833/subview.do",
  "연극·영화전공": "https://www.mju.ac.kr/mjukr/833/subview.do",
  "뮤지컬공연전공": "https://www.mju.ac.kr/mjukr/833/subview.do",
  "바둑학과": "https://www.mju.ac.kr/mjukr/827/subview.do",
  "디자인학부": "https://www.mju.ac.kr/mjukr/212/subview.do",
  "비주얼커뮤니케이션디자인전공": "https://www.mju.ac.kr/mjukr/212/subview.do",
  "인더스트리얼디자인전공": "https://www.mju.ac.kr/mjukr/212/subview.do",
  "영상애니메이션디자인전공": "https://www.mju.ac.kr/mjukr/212/subview.do",
  "패션디자인전공": "https://www.mju.ac.kr/mjukr/212/subview.do",
  
  // 건축대학
  "건축학전공": "https://www.mju.ac.kr/mjukr/840/subview.do",
  "전통건축전공": "https://www.mju.ac.kr/mjukr/10224/subview.do",
  "공간디자인학과": "https://www.mju.ac.kr/mjukr/10228/subview.do",
};

// 전공명으로 URL 찾기
export function getMajorUrl(majorName: string): string | undefined {
  // 정확한 이름으로 먼저 매칭
  if (MAJOR_URL_MAP[majorName]) {
    return MAJOR_URL_MAP[majorName];
  }
  
  // 부분 매칭 시도
  for (const [key, url] of Object.entries(MAJOR_URL_MAP)) {
    if (majorName.includes(key) || key.includes(majorName)) {
      return url;
    }
  }
  
  return undefined;
}

// CSV 데이터를 직접 배열로 변환
const CSV_DATA = `대학,학부(학과),전공
인문대학,아시아·중동어문학부,중어중문학전공
인문대학,아시아·중동어문학부,일어일문학전공
인문대학,아시아·중동어문학부,아랍지역학전공
인문대학,아시아·중동어문학부,글로벌한국어학전공
인문대학,인문콘텐츠학부,국어국문학전공
인문대학,인문콘텐츠학부,영어영문학전공
인문대학,인문콘텐츠학부,미술사·역사학전공
인문대학,인문콘텐츠학부,문헌정보학전공
인문대학,인문콘텐츠학부,글로벌문화콘텐츠학전공
인문대학,문예창작학과,
인문대학,사학과,
인문대학,미술사학과,
인문대학,철학과,
사회과학대학,공공인재학부,행정학전공
사회과학대학,공공인재학부,정치외교학전공
사회과학대학,경상·통계학부,경제학전공
사회과학대학,경상·통계학부,국제통상학전공
사회과학대학,경상·통계학부,응용통계학전공
사회과학대학,법학과,
경영대학,경영학부,경영학전공
경영대학,경영학부,글로벌비즈니스학전공
경영대학,경영정보학과,
경영대학,국제통상학과,
미디어·휴먼라이프대학,디지털미디어학부,
미디어·휴먼라이프대학,청소년지도·아동학부,청소년지도학전공
미디어·휴먼라이프대학,청소년지도·아동학부,아동학전공
인공지능·소프트웨어융합대학,융합소프트웨어학부,응용소프트웨어전공
인공지능·소프트웨어융합대학,융합소프트웨어학부,데이터사이언스전공
인공지능·소프트웨어융합대학,융합소프트웨어학부,인공지능전공
인공지능·소프트웨어융합대학,디지털콘텐츠디자인학과,
미래융합대학,창의융합인재학부,
미래융합대학,사회복지학과,
미래융합대학,부동산학과,
미래융합대학,법무행정학과,
미래융합대학,심리치료학과,
미래융합대학,미래융합경영학과,
미래융합대학,멀티디자인학과,
미래융합대학,회계세무학과,
미래융합대학,계약학과,
미래융합대학,아너칼리지(전공자유대학),
미래융합대학,자율전공학부(인문),
미래융합대학,자율전공학부(자연),
화학·생명과학대학,화학·에너지융합학부,화학나노학전공
화학·생명과학대학,화학·에너지융합학부,융합에너지학전공
화학·생명과학대학,융합바이오학부,식품영양학전공
화학·생명과학대학,융합바이오학부,시스템생명과학전공
화학·생명과학대학,물리학과,
화학·생명과학대학,수학과,
스마트시스템 공과대학,화공신소재공학부,화학공학전공
스마트시스템 공과대학,화공신소재공학부,신소재공학전공
스마트시스템 공과대학,스마트인프라공학부,환경시스템공학전공
스마트시스템 공과대학,스마트인프라공학부,건설환경공학전공
스마트시스템 공과대학,스마트인프라공학부,스마트모빌리티공학전공
스마트시스템 공과대학,기계시스템공학부,기계공학전공
스마트시스템 공과대학,기계시스템공학부,로봇공학전공
반도체·ICT대학,컴퓨터정보통신공학부,컴퓨터공학전공
반도체·ICT대학,컴퓨터정보통신공학부,정보통신공학전공
반도체·ICT대학,전기전자공학부,전기공학전공
반도체·ICT대학,전기전자공학부,전자공학전공
반도체·ICT대학,반도체공학부,
반도체·ICT대학,산업경영공학과,
스포츠·예술대학,디자인학부,비주얼커뮤니케이션디자인전공
스포츠·예술대학,디자인학부,인더스트리얼디자인전공
스포츠·예술대학,디자인학부,영상애니메이션디자인전공
스포츠·예술대학,디자인학부,패션디자인전공
스포츠·예술대학,스포츠학부,체육학전공
스포츠·예술대학,스포츠학부,스포츠산업학전공
스포츠·예술대학,스포츠학부,스포츠지도학전공
스포츠·예술대학,아트앤멀티미디어음악학부,건반음악전공
스포츠·예술대학,아트앤멀티미디어음악학부,보컬뮤직전공
스포츠·예술대학,아트앤멀티미디어음악학부,작곡전공
스포츠·예술대학,공연예술학부,연극·영화전공
스포츠·예술대학,공연예술학부,뮤지컬공연전공
스포츠·예술대학,바둑학과,
건축대학,건축학부,건축학전공
건축대학,건축학부,전통건축전공
건축대학,공간디자인학과,
방목기초교육대학,,`;

// CSV 파싱 함수
function parseCSV(csvText: string): Array<{ college: string; department: string; major: string }> {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const result: Array<{ college: string; department: string; major: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV 파싱 (쉼표로 분리하되, 빈 값도 허용)
    const values = line.split(',');
    const college = values[0]?.trim() || '';
    const department = values[1]?.trim() || '';
    const major = values[2]?.trim() || '';

    // 방목기초교육대학 같은 빈 줄은 제외
    if (!college || (!department && !major)) continue;

    result.push({ college, department, major });
  }

  return result;
}

// 학과명 생성 (완전한 전공명 표시)
function generateMajorName(department: string, major: string): string {
  if (major) {
    // 전공명이 있으면 전공명 그대로 표시 (예: "중어중문학전공" -> "중어중문학전공")
    return major;
  }
  // 전공이 없으면 학부명 그대로 표시 (예: "문예창작학과" -> "문예창작학과")
  return department;
}

// 학과 키 생성 (한글 포함 고유 키)
function generateMajorKey(department: string, major: string, index: number): string {
  const base = `${department || ''}_${major || department || ''}`.trim();
  const normalized = base
    .normalize('NFKD')
    .replace(/[·\s]+/g, '_')
    .replace(/[()]/g, '')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized) {
    return normalized;
  }

  return `major_${index}`;
}

// RIASEC 프로파일 매핑 (각 전공/학과에 1:1 직접 매핑)
function getRIASECProfile(college: string, department: string, major: string): Partial<Record<Dim, number>> {
  const fullName = (major || department).trim();
  const name = fullName.toLowerCase();
  
  // 전공/학과 이름으로 직접 매핑 (1:1 매칭)
  const profileMap: Record<string, Partial<Record<Dim, number>>> = {
    // 인문대학
    '중어중문학전공': { A: 0.8, I: 0.7, S: 0.75, E: 0.5, C: 0.5 }, // S 강조 (비즈니스/통역 특성)
    '중어중문학': { A: 0.8, I: 0.7, S: 0.75, E: 0.5, C: 0.5 },
    '일어일문학전공': { A: 0.8, I: 0.7, S: 0.75, E: 0.5, C: 0.5 }, // S 강조 (비즈니스/통역 특성)
    '일어일문학': { A: 0.8, I: 0.7, S: 0.75, E: 0.5, C: 0.5 },
    '아랍지역학전공': { A: 0.75, I: 0.8, S: 0.7, E: 0.6, C: 0.5 },
    '아랍지역학': { A: 0.75, I: 0.8, S: 0.7, E: 0.6, C: 0.5 },
    '글로벌한국어학전공': { A: 0.75, I: 0.7, S: 0.75, C: 0.6, E: 0.5 },
    '글로벌한국어학': { A: 0.75, I: 0.7, S: 0.75, C: 0.6, E: 0.5 },
    '국어국문학전공': { A: 0.9, I: 0.75, S: 0.6, C: 0.5, E: 0.4 }, // A 더 강조 (문학 창작/비평 특성)
    '국어국문학': { A: 0.9, I: 0.75, S: 0.6, C: 0.5, E: 0.4 },
    '영어영문학전공': { A: 0.85, I: 0.75, S: 0.7, E: 0.6, C: 0.5 }, // E 약간 강조 (국제 비즈니스 특성)
    '영어영문학': { A: 0.85, I: 0.75, S: 0.7, E: 0.6, C: 0.5 },
    '미술사·역사학전공': { I: 0.85, A: 0.7, C: 0.75, V: 0.6, S: 0.4 }, // 탐구형 중심으로 변경
    '미술사·역사학': { I: 0.85, A: 0.7, C: 0.75, V: 0.6, S: 0.4 },
    '문헌정보학전공': { C: 0.9, I: 0.8, S: 0.6, A: 0.4 },
    '문헌정보학': { C: 0.9, I: 0.8, S: 0.6, A: 0.4 },
    '글로벌문화콘텐츠학전공': { A: 0.85, E: 0.75, I: 0.65, S: 0.6, C: 0.5 },
    '글로벌문화콘텐츠학': { A: 0.85, E: 0.75, I: 0.65, S: 0.6, C: 0.5 },
    '문예창작학과': { A: 0.95, I: 0.7, S: 0.6, E: 0.5, C: 0.4 },
    '문예창작': { A: 0.95, I: 0.7, S: 0.6, E: 0.5, C: 0.4 },
    '사학과': { I: 0.9, C: 0.8, A: 0.6, V: 0.65, S: 0.4 },
    '사학': { I: 0.9, C: 0.8, A: 0.6, V: 0.65, S: 0.4 },
    '미술사학과': { I: 0.85, A: 0.8, C: 0.7, V: 0.65, S: 0.4 }, // 탐구형 중심으로 변경
    '미술사학': { I: 0.85, A: 0.8, C: 0.7, V: 0.65, S: 0.4 },
    '철학과': { I: 0.9, V: 0.85, A: 0.6, C: 0.5, S: 0.4 },
    '철학': { I: 0.9, V: 0.85, A: 0.6, C: 0.5, S: 0.4 },
    
    // 사회과학대학
    '행정학전공': { C: 0.9, S: 0.75, V: 0.7, I: 0.6, E: 0.5 },
    '행정학': { C: 0.9, S: 0.75, V: 0.7, I: 0.6, E: 0.5 },
    '정치외교학전공': { E: 0.85, V: 0.8, S: 0.75, I: 0.65, C: 0.5 },
    '정치외교학': { E: 0.85, V: 0.8, S: 0.75, I: 0.65, C: 0.5 },
    '경제학전공': { E: 0.9, I: 0.8, C: 0.75, S: 0.5, A: 0.3 },
    '경제학': { E: 0.9, I: 0.8, C: 0.75, S: 0.5, A: 0.3 },
    '국제통상학전공': { E: 0.85, I: 0.75, S: 0.7, C: 0.65, A: 0.4 }, // I 강조, E 낮춤
    '국제통상학': { E: 0.85, I: 0.75, S: 0.7, C: 0.65, A: 0.4 },
    '응용통계학전공': { I: 0.95, C: 0.9, R: 0.5, E: 0.4, A: 0.2 },
    '응용통계학': { I: 0.95, C: 0.9, R: 0.5, E: 0.4, A: 0.2 },
    '법학과': { C: 0.95, I: 0.8, E: 0.65, V: 0.6, S: 0.5 },
    '법학': { C: 0.95, I: 0.8, E: 0.65, V: 0.6, S: 0.5 },
    
    // 경영대학
    '경영학전공': { E: 0.95, I: 0.75, C: 0.8, S: 0.7, A: 0.3 }, // S 추가 (직무 데이터 반영)
    '경영학': { E: 0.95, I: 0.75, C: 0.8, S: 0.7, A: 0.3 },
    '글로벌비즈니스학전공': { E: 0.9, S: 0.85, I: 0.7, C: 0.75, A: 0.4 }, // S 강조, E 낮춤
    '글로벌비즈니스학': { E: 0.9, S: 0.85, I: 0.7, C: 0.75, A: 0.4 },
    '경영정보학과': { I: 0.9, C: 0.85, E: 0.75, R: 0.5, A: 0.3 },
    '경영정보학': { I: 0.9, C: 0.85, E: 0.75, R: 0.5, A: 0.3 },
    '국제통상학과': { E: 0.85, I: 0.75, S: 0.7, C: 0.65, A: 0.4 }, // I 강조, E 낮춤
    
    // 미디어·휴먼라이프대학
    '디지털미디어학부': { A: 0.85, E: 0.8, I: 0.75, C: 0.6, S: 0.5 },
    '디지털미디어학': { A: 0.85, E: 0.8, I: 0.75, C: 0.6, S: 0.5 },
    '디지털미디어': { A: 0.85, E: 0.8, I: 0.75, C: 0.6, S: 0.5 },
    '청소년지도학전공': { S: 0.95, V: 0.85, E: 0.7, I: 0.5, A: 0.4 },
    '청소년지도학': { S: 0.95, V: 0.85, E: 0.7, I: 0.5, A: 0.4 },
    '아동학전공': { S: 0.95, V: 0.85, I: 0.6, A: 0.5, C: 0.4 },
    '아동학': { S: 0.95, V: 0.85, I: 0.6, A: 0.5, C: 0.4 },
    
    // 인공지능·소프트웨어융합대학
    '응용소프트웨어전공': { I: 0.95, C: 0.85, R: 0.6, E: 0.5, A: 0.2 },
    '응용소프트웨어': { I: 0.95, C: 0.85, R: 0.6, E: 0.5, A: 0.2 },
    '데이터사이언스전공': { I: 0.95, C: 0.9, R: 0.6, E: 0.5, A: 0.2 },
    '데이터사이언스': { I: 0.95, C: 0.9, R: 0.6, E: 0.5, A: 0.2 },
    '인공지능전공': { I: 0.95, C: 0.85, R: 0.65, E: 0.5, A: 0.2 },
    '인공지능': { I: 0.95, C: 0.85, R: 0.65, E: 0.5, A: 0.2 },
    '디지털콘텐츠디자인학과': { A: 0.9, I: 0.75, E: 0.7, C: 0.6, S: 0.5 },
    '디지털콘텐츠디자인학': { A: 0.9, I: 0.75, E: 0.7, C: 0.6, S: 0.5 },
    '디지털콘텐츠디자인': { A: 0.9, I: 0.75, E: 0.7, C: 0.6, S: 0.5 },
    
    // 미래융합대학
    '창의융합인재학부': { I: 0.8, E: 0.8, A: 0.75, S: 0.7, C: 0.6 },
    '창의융합인재학': { I: 0.8, E: 0.8, A: 0.75, S: 0.7, C: 0.6 },
    '사회복지학과': { S: 0.95, V: 0.9, E: 0.65, I: 0.5, C: 0.4 },
    '사회복지학': { S: 0.95, V: 0.9, E: 0.65, I: 0.5, C: 0.4 },
    '부동산학과': { E: 0.9, C: 0.8, I: 0.65, S: 0.6, A: 0.3 },
    '부동산학': { E: 0.9, C: 0.8, I: 0.65, S: 0.6, A: 0.3 },
    '법무행정학과': { C: 0.9, E: 0.75, S: 0.7, I: 0.6, V: 0.6 },
    '법무행정학': { C: 0.9, E: 0.75, S: 0.7, I: 0.6, V: 0.6 },
    '심리치료학과': { S: 0.95, I: 0.85, V: 0.8, A: 0.5, C: 0.4 },
    '심리치료학': { S: 0.95, I: 0.85, V: 0.8, A: 0.5, C: 0.4 },
    '미래융합경영학과': { E: 0.9, I: 0.8, C: 0.75, S: 0.6, A: 0.4 },
    '미래융합경영학': { E: 0.9, I: 0.8, C: 0.75, S: 0.6, A: 0.4 },
    '멀티디자인학과': { A: 0.9, E: 0.8, I: 0.7, C: 0.6, S: 0.5 },
    '멀티디자인학': { A: 0.9, E: 0.8, I: 0.7, C: 0.6, S: 0.5 },
    '멀티디자인': { A: 0.9, E: 0.8, I: 0.7, C: 0.6, S: 0.5 },
    '회계세무학과': { C: 0.95, E: 0.8, I: 0.75, S: 0.4, A: 0.2 }, // E 추가 (직무 데이터 반영: 진취형 89)
    '회계세무학': { C: 0.95, E: 0.8, I: 0.75, S: 0.4, A: 0.2 },
    '계약학과': { C: 0.9, E: 0.75, I: 0.65, S: 0.6, A: 0.3 },
    '계약학': { C: 0.9, E: 0.75, I: 0.65, S: 0.6, A: 0.3 },
    
    // 화학·생명과학대학
    '화학나노학전공': { I: 0.9, R: 0.8, C: 0.75, E: 0.4, A: 0.2 },
    '화학나노학': { I: 0.9, R: 0.8, C: 0.75, E: 0.4, A: 0.2 },
    '융합에너지학전공': { I: 0.9, R: 0.8, E: 0.7, C: 0.7, A: 0.3 },
    '융합에너지학': { I: 0.9, R: 0.8, E: 0.7, C: 0.7, A: 0.3 },
    '식품영양학전공': { R: 0.8, S: 0.8, I: 0.75, A: 0.5, C: 0.5 },
    '식품영양학': { R: 0.8, S: 0.8, I: 0.75, A: 0.5, C: 0.5 },
    '시스템생명과학전공': { I: 0.95, R: 0.8, C: 0.75, A: 0.4, E: 0.3 },
    '시스템생명과학': { I: 0.95, R: 0.8, C: 0.75, A: 0.4, E: 0.3 },
    '물리학과': { I: 0.95, C: 0.8, R: 0.5, A: 0.2, E: 0.2 },
    '물리학': { I: 0.95, C: 0.8, R: 0.5, A: 0.2, E: 0.2 },
    '수학과': { I: 0.95, C: 0.85, R: 0.4, A: 0.2, E: 0.2 },
    '수학': { I: 0.95, C: 0.85, R: 0.4, A: 0.2, E: 0.2 },
    
    // 스마트시스템 공과대학
    '화학공학전공': { I: 0.9, C: 0.85, R: 0.8, E: 0.5, A: 0.3 }, // C 강조, R 낮춤 (차별화)
    '화학공학': { I: 0.9, C: 0.85, R: 0.8, E: 0.5, A: 0.3 },
    '신소재공학전공': { I: 0.95, R: 0.85, C: 0.8, E: 0.5, A: 0.3 }, // I 더 강조 (차별화)
    '신소재공학': { I: 0.95, R: 0.85, C: 0.8, E: 0.5, A: 0.3 },
    '환경시스템공학전공': { R: 0.85, I: 0.8, C: 0.75, S: 0.6, V: 0.6, E: 0.4 },
    '환경시스템공학': { R: 0.85, I: 0.8, C: 0.75, S: 0.6, V: 0.6, E: 0.4 },
    '건설환경공학전공': { R: 0.9, I: 0.75, C: 0.8, S: 0.5, E: 0.4 },
    '건설환경공학': { R: 0.9, I: 0.75, C: 0.8, S: 0.5, E: 0.4 },
    '스마트모빌리티공학전공': { R: 0.9, I: 0.85, C: 0.8, E: 0.6, A: 0.3 },
    '스마트모빌리티공학': { R: 0.9, I: 0.85, C: 0.8, E: 0.6, A: 0.3 },
    '기계공학전공': { R: 0.95, I: 0.85, C: 0.8, E: 0.4, A: 0.2 },
    '기계공학': { R: 0.95, I: 0.85, C: 0.8, E: 0.4, A: 0.2 },
    '로봇공학전공': { R: 0.95, I: 0.9, C: 0.85, E: 0.5, A: 0.3 },
    '로봇공학': { R: 0.95, I: 0.9, C: 0.85, E: 0.5, A: 0.3 },
    
    // 반도체·ICT대학
    '컴퓨터공학전공': { I: 0.95, C: 0.85, R: 0.75, E: 0.5, A: 0.2 }, // R 추가 (직무 데이터 반영: 현실형 80)
    '컴퓨터공학': { I: 0.95, C: 0.85, R: 0.75, E: 0.5, A: 0.2 },
    '정보통신공학전공': { I: 0.9, E: 0.8, C: 0.8, R: 0.7, S: 0.5 },
    '정보통신공학': { I: 0.9, E: 0.8, C: 0.8, R: 0.7, S: 0.5 },
    '전기공학전공': { I: 0.9, R: 0.9, C: 0.8, E: 0.5, A: 0.2 },
    '전기공학': { I: 0.9, R: 0.9, C: 0.8, E: 0.5, A: 0.2 },
    '전자공학전공': { I: 0.9, R: 0.85, C: 0.8, E: 0.5, A: 0.3 },
    '전자공학': { I: 0.9, R: 0.85, C: 0.8, E: 0.5, A: 0.3 },
    '반도체공학부': { I: 0.95, R: 0.85, C: 0.85, E: 0.5, A: 0.2 },
    '반도체공학': { I: 0.95, R: 0.85, C: 0.85, E: 0.5, A: 0.2 },
    '산업경영공학과': { I: 0.85, E: 0.8, C: 0.8, R: 0.6, S: 0.5 },
    '산업경영공학': { I: 0.85, E: 0.8, C: 0.8, R: 0.6, S: 0.5 },
    
    // 스포츠·예술대학
    '비주얼커뮤니케이션디자인전공': { A: 0.95, E: 0.85, I: 0.65, C: 0.5, S: 0.4 }, // E 강조 (차별화)
    '비주얼커뮤니케이션디자인': { A: 0.95, E: 0.85, I: 0.65, C: 0.5, S: 0.4 },
    '인더스트리얼디자인전공': { A: 0.9, R: 0.8, I: 0.75, E: 0.7, C: 0.6 },
    '인더스트리얼디자인': { A: 0.9, R: 0.8, I: 0.75, E: 0.7, C: 0.6 },
    '영상애니메이션디자인전공': { A: 0.9, I: 0.8, E: 0.7, C: 0.6, S: 0.5 }, // I 강조, A 낮춤 (차별화)
    '영상애니메이션디자인': { A: 0.9, I: 0.8, E: 0.7, C: 0.6, S: 0.5 },
    '패션디자인전공': { A: 0.9, E: 0.8, S: 0.75, I: 0.6, C: 0.5 }, // S 강조, A 낮춤 (차별화)
    '패션디자인': { A: 0.9, E: 0.8, S: 0.75, I: 0.6, C: 0.5 },
    '체육학전공': { R: 0.95, S: 0.9, E: 0.8, I: 0.4, A: 0.3 },
    '체육학': { R: 0.95, S: 0.9, E: 0.8, I: 0.4, A: 0.3 },
    '스포츠산업학전공': { E: 0.9, S: 0.85, R: 0.75, I: 0.5, C: 0.6 },
    '스포츠산업학': { E: 0.9, S: 0.85, R: 0.75, I: 0.5, C: 0.6 },
    '스포츠지도학전공': { S: 0.95, R: 0.9, E: 0.8, I: 0.4, A: 0.3 },
    '스포츠지도학': { S: 0.95, R: 0.9, E: 0.8, I: 0.4, A: 0.3 },
    '건반음악전공': { A: 0.95, S: 0.8, E: 0.75, I: 0.6, C: 0.5 },
    '건반음악': { A: 0.95, S: 0.8, E: 0.75, I: 0.6, C: 0.5 },
    '보컬뮤직전공': { A: 0.95, S: 0.85, E: 0.8, I: 0.5, C: 0.4 },
    '보컬뮤직': { A: 0.95, S: 0.85, E: 0.8, I: 0.5, C: 0.4 },
    '작곡전공': { A: 0.95, I: 0.8, S: 0.7, E: 0.65, C: 0.5 },
    '작곡': { A: 0.95, I: 0.8, S: 0.7, E: 0.65, C: 0.5 },
    '연극·영화전공': { A: 0.95, S: 0.9, E: 0.85, I: 0.5, C: 0.4 },
    '연극·영화': { A: 0.95, S: 0.9, E: 0.85, I: 0.5, C: 0.4 },
    '뮤지컬공연전공': { A: 0.95, S: 0.9, E: 0.85, I: 0.5, C: 0.4 },
    '뮤지컬공연': { A: 0.95, S: 0.9, E: 0.85, I: 0.5, C: 0.4 },
    '바둑학과': { I: 0.9, C: 0.8, A: 0.7, R: 0.5, S: 0.4 },
    '바둑학': { I: 0.9, C: 0.8, A: 0.7, R: 0.5, S: 0.4 },
    
    // 건축대학
    '건축학전공': { R: 0.9, A: 0.85, I: 0.75, C: 0.7, E: 0.5 },
    '건축학': { R: 0.9, A: 0.85, I: 0.75, C: 0.7, E: 0.5 },
    '전통건축전공': { R: 0.9, A: 0.85, I: 0.8, C: 0.75, V: 0.7, E: 0.4 },
    '전통건축': { R: 0.9, A: 0.85, I: 0.8, C: 0.75, V: 0.7, E: 0.4 },
    '공간디자인학과': { A: 0.9, R: 0.8, I: 0.7, E: 0.7, C: 0.6 },
    '공간디자인학': { A: 0.9, R: 0.8, I: 0.7, E: 0.7, C: 0.6 },
    '공간디자인': { A: 0.9, R: 0.8, I: 0.7, E: 0.7, C: 0.6 },
  };
  
  // 정확한 이름으로 먼저 매칭 시도
  if (profileMap[fullName]) {
    return profileMap[fullName];
  }
  
  // 소문자 이름으로 매칭 시도
  if (profileMap[name]) {
    return profileMap[name];
  }
  
  // 전공명만 추출하여 매칭 (예: "중어중문학전공" -> "중어중문학")
  const majorOnly = fullName.replace(/전공$/, '');
  if (profileMap[majorOnly]) {
    return profileMap[majorOnly];
  }
  
  // 학부명만 추출하여 매칭 (예: "문예창작학과" -> "문예창작")
  const deptOnly = department.replace(/학부$|학과$/, '');
  if (profileMap[deptOnly]) {
    return profileMap[deptOnly];
  }
  
  // 패턴 매칭 (fallback - 직접 매핑되지 않은 경우에만 사용)
  // 인문대학 계열
  if (college.includes('인문')) {
    return { I: 0.75, A: 0.65, C: 0.6, V: 0.5, S: 0.4 };
  }
  
  // 사회과학대학 계열
  if (college.includes('사회과학')) {
    return { I: 0.75, S: 0.7, V: 0.65, E: 0.5, C: 0.5 };
  }

  // 경영대학 계열
  if (college.includes('경영')) {
    return { E: 0.9, I: 0.7, C: 0.75, S: 0.5, A: 0.3 };
  }

  // 미디어·휴먼라이프대학 계열
  if (college.includes('미디어')) {
    return { S: 0.85, E: 0.7, A: 0.6, I: 0.4, C: 0.5 };
  }

  // 인공지능·소프트웨어 계열
  if (college.includes('인공지능') || college.includes('소프트웨어')) {
    return { I: 0.85, C: 0.75, R: 0.6, E: 0.4, A: 0.2 };
  }

  // 화학·생명과학대학 계열
  if (college.includes('화학') || college.includes('생명과학')) {
    return { I: 0.85, R: 0.7, C: 0.6, A: 0.3, E: 0.3 };
  }

  // 공과대학 계열
  if (college.includes('공과') || college.includes('시스템')) {
    return { R: 0.85, I: 0.75, C: 0.7, E: 0.4, A: 0.3 };
  }

  // 반도체·ICT대학 계열
  if (college.includes('반도체') || college.includes('ICT')) {
    return { I: 0.9, R: 0.75, C: 0.75, E: 0.4, A: 0.2 };
  }

  // 스포츠·예술대학 계열
  if (college.includes('스포츠') || college.includes('예술')) {
    return { A: 0.85, S: 0.75, E: 0.65, I: 0.5, C: 0.5 };
  }

  // 건축대학 계열
  if (college.includes('건축')) {
    return { R: 0.8, A: 0.8, I: 0.7, C: 0.6, E: 0.5 };
  }

  // 미래융합대학 계열
  if (college.includes('미래융합')) {
    return { I: 0.7, E: 0.7, S: 0.65, C: 0.6, A: 0.5 };
  }

  // 기본값 (방목기초교육대학 등)
  return { I: 0.7, S: 0.65, C: 0.6, A: 0.5 };
}

// 단과대학별 계열 분류 함수 (명지대학교 구조 기반)
function getCluster(college: string, department: string, major: string): ClusterType {
  const fullName = `${college} ${department} ${major}`.toLowerCase();
  
  // 1. 스포츠·예술대학 → 예체능
  if (college.includes('스포츠') || college.includes('예술')) return '예체능';
  
  // 2. 건축대학 → 공학 (공간디자인은 예체능 요소도 있지만 공학으로 분류)
  if (college.includes('건축')) return '공학';
  
  // 3. 인문대학 → 인문
  if (college.includes('인문')) return '인문';
  
  // 4. 사회과학대학 → 사회 또는 경상
  if (college.includes('사회과학')) {
    // 경제, 통계 관련은 경상으로
    if (fullName.includes('경제') || fullName.includes('통계') || fullName.includes('통상')) {
      return '경상';
    }
    return '사회'; // 행정, 정치, 법학 등
  }
  
  // 5. 경영대학 → 경상
  if (college.includes('경영')) return '경상';
  
  // 6. 미디어·휴먼라이프대학 → 사회
  if (college.includes('미디어') || college.includes('휴먼라이프')) return '사회';
  
  // 7. 인공지능·소프트웨어융합대학 → 융합
  if (college.includes('인공지능') || college.includes('소프트웨어')) {
    // 디지털콘텐츠디자인은 예체능 요소가 있지만 융합으로 분류
    return '융합';
  }
  
  // 8. 화학·생명과학대학 → 자연
  if (college.includes('화학') || college.includes('생명과학')) return '자연';
  
  // 9. 스마트시스템공과대학 → 공학
  if (college.includes('공과') || college.includes('시스템')) return '공학';
  
  // 10. 반도체·ICT대학 → 공학
  if (college.includes('반도체') || college.includes('ICT')) return '공학';
  
  // 11. 미래융합대학 → 세부 전공에 따라 분류
  if (college.includes('미래융합')) {
    if (fullName.includes('사회복지') || fullName.includes('심리') || fullName.includes('법무')) {
      return '사회';
    }
    if (fullName.includes('경영') || fullName.includes('회계') || fullName.includes('부동산')) {
      return '경상';
    }
    if (fullName.includes('디자인')) {
      return '예체능';
    }
    return '융합';
  }
  
  // 12. 아너칼리지(전공자유대학) → 융합
  if (college.includes('아너') || college.includes('자율전공')) return '융합';
  
  // 기본값
  return '융합';
}

// MAJORS 배열 생성
export const MAJORS: Major[] = (() => {
  const csvData = parseCSV(CSV_DATA);
  const majors: Major[] = [];

  csvData.forEach(({ college, department, major }, index) => {
    const majorName = generateMajorName(department, major);
    const majorKey = generateMajorKey(department, major, index);
    const riasecProfile = getRIASECProfile(college, department, major);
    const cluster = getCluster(college, department, major);
    const url = getMajorUrl(majorName); // 전공 홈페이지 URL 추가

    majors.push({
      key: majorKey,
      name: majorName,
      vec: riasecProfile,
      cluster: cluster,
      college: college,
      url: url
    });
  });

  // 중복 제거 (같은 key를 가진 항목은 첫 번째만 유지)
  const uniqueMajors = new Map<string, Major>();
  majors.forEach(major => {
    if (!uniqueMajors.has(major.key)) {
      uniqueMajors.set(major.key, major);
    }
  });

  return Array.from(uniqueMajors.values());
})();
