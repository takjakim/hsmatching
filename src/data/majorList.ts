// major_list.csv에서 학과 리스트를 가져와 RIASEC 프로파일과 매핑

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';

interface Major {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
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
스마트시스템 공과대학,스마트인프라공학부,GLOBAL SMART INFRASTRUCTURE ENGINEERING MAJOR
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

// 학과명 생성 (전공이 있으면 전공명, 없으면 학부명)
function generateMajorName(department: string, major: string): string {
  if (major) {
    // 전공명이 있으면 전공명만 표시 (예: "중어중문학전공" -> "중어중문학")
    return major.replace(/전공$/, '');
  }
  // 전공이 없으면 학부명 (예: "문예창작학과" -> "문예창작")
  return department.replace(/학부$|학과$/, '');
}

// 학과 키 생성 (URL-safe key)
function generateMajorKey(department: string, major: string): string {
  const name = major || department;
  return name
    .replace(/[·\s]/g, '_')
    .replace(/[()]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

// RIASEC 프로파일 매핑 (학과/전공 특성에 따라)
function getRIASECProfile(college: string, department: string, major: string): Partial<Record<Dim, number>> {
  const name = (major || department).toLowerCase();
  
  // 인문대학 계열
  if (college.includes('인문')) {
    if (name.includes('언어') || name.includes('문학') || name.includes('국어') || name.includes('영어') || name.includes('중어') || name.includes('일어') || name.includes('아랍') || name.includes('한국어')) {
      return { A: 0.85, I: 0.7, S: 0.6, C: 0.5, E: 0.4 };
    }
    if (name.includes('문예창작') || name.includes('미술사') || name.includes('문화콘텐츠')) {
      return { A: 0.95, E: 0.7, I: 0.6, S: 0.5 };
    }
    if (name.includes('역사') || name.includes('사학')) {
      return { I: 0.9, C: 0.7, A: 0.5, V: 0.5 };
    }
    if (name.includes('철학')) {
      return { I: 0.85, V: 0.8, A: 0.5, C: 0.4 };
    }
    if (name.includes('문헌정보')) {
      return { C: 0.85, I: 0.8, S: 0.5 };
    }
    return { I: 0.75, A: 0.65, C: 0.6, V: 0.5 };
  }

  // 사회과학대학 계열
  if (college.includes('사회과학')) {
    if (name.includes('행정') || name.includes('법무행정')) {
      return { C: 0.9, S: 0.7, V: 0.7, I: 0.5, E: 0.4 };
    }
    if (name.includes('정치외교') || name.includes('정치')) {
      return { E: 0.85, V: 0.8, S: 0.7, I: 0.6, C: 0.5 };
    }
    if (name.includes('경제') || name.includes('통상') || name.includes('경영')) {
      return { E: 0.9, I: 0.75, C: 0.7, S: 0.4 };
    }
    if (name.includes('통계')) {
      return { I: 0.95, C: 0.85, R: 0.3 };
    }
    if (name.includes('법학') || name.includes('법')) {
      return { C: 0.9, I: 0.75, E: 0.6, V: 0.5 };
    }
    return { I: 0.75, S: 0.7, V: 0.65, E: 0.5 };
  }

  // 경영대학 계열
  if (college.includes('경영')) {
    if (name.includes('경영정보')) {
      return { I: 0.85, C: 0.8, E: 0.7, R: 0.3 };
    }
    if (name.includes('회계세무') || name.includes('회계')) {
      return { C: 0.95, I: 0.7, E: 0.5 };
    }
    return { E: 0.9, I: 0.7, C: 0.75, S: 0.5 };
  }

  // 미디어·휴먼라이프대학 계열
  if (college.includes('미디어')) {
    if (name.includes('디지털미디어')) {
      return { A: 0.85, E: 0.75, I: 0.65, C: 0.5 };
    }
    if (name.includes('청소년') || name.includes('아동') || name.includes('사회복지')) {
      return { S: 0.95, V: 0.8, E: 0.6, I: 0.4 };
    }
    return { S: 0.85, E: 0.7, A: 0.6, I: 0.4 };
  }

  // 인공지능·소프트웨어 계열
  if (college.includes('인공지능') || college.includes('소프트웨어')) {
    if (name.includes('인공지능')) {
      return { I: 0.95, C: 0.75, R: 0.55, E: 0.3 };
    }
    if (name.includes('데이터') || name.includes('소프트웨어')) {
      return { I: 0.9, C: 0.8, R: 0.5, E: 0.4 };
    }
    if (name.includes('디자인')) {
      return { A: 0.85, I: 0.7, E: 0.65, C: 0.5 };
    }
    return { I: 0.85, C: 0.75, R: 0.6, E: 0.4 };
  }

  // 화학·생명과학대학 계열
  if (college.includes('화학') || college.includes('생명과학')) {
    if (name.includes('식품영양')) {
      return { R: 0.75, S: 0.7, I: 0.7, A: 0.5, C: 0.4 };
    }
    if (name.includes('생명과학') || name.includes('바이오')) {
      return { I: 0.9, R: 0.75, C: 0.6 };
    }
    if (name.includes('화학') || name.includes('에너지')) {
      return { I: 0.9, R: 0.75, C: 0.65, E: 0.3 };
    }
    if (name.includes('물리') || name.includes('수학')) {
      return { I: 0.95, C: 0.75, R: 0.4 };
    }
    return { I: 0.85, R: 0.7, C: 0.6 };
  }

  // 공과대학 계열
  if (college.includes('공과') || college.includes('시스템')) {
    if (name.includes('건설') || name.includes('환경') || name.includes('인프라')) {
      return { R: 0.85, I: 0.7, C: 0.75, S: 0.4, E: 0.3 };
    }
    if (name.includes('기계') || name.includes('로봇')) {
      return { R: 0.95, I: 0.8, C: 0.75, E: 0.3 };
    }
    if (name.includes('화학공학') || name.includes('신소재')) {
      return { I: 0.85, R: 0.8, C: 0.75, E: 0.4 };
    }
    if (name.includes('산업경영')) {
      return { I: 0.8, E: 0.75, C: 0.75, R: 0.5 };
    }
    return { R: 0.85, I: 0.75, C: 0.7, E: 0.4 };
  }

  // 반도체·ICT대학 계열
  if (college.includes('반도체') || college.includes('ICT')) {
    if (name.includes('컴퓨터') || name.includes('소프트웨어')) {
      return { I: 0.95, C: 0.8, R: 0.6, E: 0.4 };
    }
    if (name.includes('전기') || name.includes('전자') || name.includes('반도체')) {
      return { I: 0.9, R: 0.85, C: 0.75, E: 0.4 };
    }
    if (name.includes('정보통신')) {
      return { I: 0.9, E: 0.75, C: 0.75, S: 0.4 };
    }
    return { I: 0.9, R: 0.75, C: 0.75, E: 0.4 };
  }

  // 스포츠·예술대학 계열
  if (college.includes('스포츠') || college.includes('예술')) {
    if (name.includes('디자인')) {
      return { A: 0.95, E: 0.75, I: 0.6, C: 0.5 };
    }
    if (name.includes('스포츠') || name.includes('체육')) {
      return { R: 0.95, S: 0.85, E: 0.75, I: 0.3 };
    }
    if (name.includes('음악') || name.includes('작곡') || name.includes('보컬') || name.includes('건반')) {
      return { A: 0.95, S: 0.75, E: 0.75, I: 0.5 };
    }
    if (name.includes('공연') || name.includes('연극') || name.includes('영화') || name.includes('뮤지컬')) {
      return { A: 0.95, S: 0.85, E: 0.8, I: 0.4 };
    }
    if (name.includes('바둑')) {
      return { I: 0.85, C: 0.75, A: 0.6, R: 0.4 };
    }
    return { A: 0.85, S: 0.75, E: 0.65, I: 0.5 };
  }

  // 건축대학 계열
  if (college.includes('건축')) {
    if (name.includes('건축')) {
      return { R: 0.85, A: 0.8, I: 0.7, C: 0.6, E: 0.4 };
    }
    if (name.includes('공간디자인') || name.includes('디자인')) {
      return { A: 0.9, R: 0.75, I: 0.6, E: 0.6, C: 0.5 };
    }
    return { R: 0.8, A: 0.8, I: 0.7, C: 0.6 };
  }

  // 미래융합대학 계열
  if (college.includes('미래융합')) {
    if (name.includes('심리') || name.includes('치료')) {
      return { S: 0.95, I: 0.8, V: 0.75, A: 0.4 };
    }
    if (name.includes('부동산')) {
      return { E: 0.85, C: 0.75, I: 0.6, S: 0.5 };
    }
    if (name.includes('디자인')) {
      return { A: 0.85, E: 0.75, I: 0.65, C: 0.5 };
    }
    return { I: 0.7, E: 0.7, S: 0.65, C: 0.6 };
  }

  // 기본값 (방목기초교육대학 등)
  return { I: 0.7, S: 0.65, C: 0.6, A: 0.5 };
}

// MAJORS 배열 생성
export const MAJORS: Major[] = (() => {
  const csvData = parseCSV(CSV_DATA);
  const majors: Major[] = [];

  csvData.forEach(({ college, department, major }) => {
    const majorName = generateMajorName(department, major);
    const majorKey = generateMajorKey(department, major);
    const riasecProfile = getRIASECProfile(college, department, major);

    majors.push({
      key: majorKey,
      name: majorName,
      vec: riasecProfile
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
