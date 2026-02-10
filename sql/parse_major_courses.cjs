// 전공별교과목.csv를 파싱하여 학부/전공 분리된 CSV 생성
const fs = require('fs');
const path = require('path');

// majorList.ts의 CSV_DATA 매핑 (단과대학-학부-전공)
const MAJOR_HIERARCHY = [
  { college: '인문대학', department: '아시아·중동어문학부', major: '중어중문학전공' },
  { college: '인문대학', department: '아시아·중동어문학부', major: '일어일문학전공' },
  { college: '인문대학', department: '아시아·중동어문학부', major: '아랍지역학전공' },
  { college: '인문대학', department: '인문콘텐츠학부', major: '국어국문학전공' },
  { college: '인문대학', department: '인문콘텐츠학부', major: '영어영문학전공' },
  { college: '인문대학', department: '인문콘텐츠학부', major: '문헌정보학전공' },
  { college: '인문대학', department: '문예창작학과', major: '' },
  { college: '사회과학대학', department: '공공인재학부', major: '행정학전공' },
  { college: '사회과학대학', department: '공공인재학부', major: '정치외교학전공' },
  { college: '사회과학대학', department: '경상·통계학부', major: '경제학전공' },
  { college: '사회과학대학', department: '법학과', major: '' },
  { college: '경영대학', department: '경영학부', major: '경영학전공' },
  { college: '경영대학', department: '경영정보학과', major: '' },
  { college: '미디어·휴먼라이프대학', department: '디지털미디어학부', major: '' },
  { college: '미디어·휴먼라이프대학', department: '청소년지도·아동학부', major: '청소년지도학전공' },
  { college: '미디어·휴먼라이프대학', department: '청소년지도·아동학부', major: '아동학전공' },
  { college: '인공지능·소프트웨어융합대학', department: '융합소프트웨어학부', major: '응용소프트웨어전공' },
  { college: '인공지능·소프트웨어융합대학', department: '융합소프트웨어학부', major: '데이터사이언스전공' },
  { college: '인공지능·소프트웨어융합대학', department: '디지털콘텐츠디자인학과', major: '' },
  { college: '화학·생명과학대학', department: '화학·에너지융합학부', major: '화학나노학전공' },
  { college: '화학·생명과학대학', department: '융합바이오학부', major: '식품영양학전공' },
  { college: '화학·생명과학대학', department: '융합바이오학부', major: '시스템생명과학전공' },
];

// CSV 원본 "전공" 컬럼에서 학부/전공 분리 (패턴 매칭)
function parseMajorField(majorField) {
  // 패턴: "학부명 전공명" 또는 "학과명" 또는 "학부명"

  // 학부+전공 패턴 (예: "경상·통계학부 경제학전공")
  const patterns = [
    /^(.+학부)\s+(.+)$/,           // "XXX학부 YYY" (띄어쓰기 있음)
    /^(.+학부)(.+전공)$/,          // "XXX학부YYY전공" (띄어쓰기 없음)
    /^(.+학과)$/,                   // "XXX학과" (단독)
    /^(.+학부)$/,                   // "XXX학부" (단독) - 디지털미디어학부 등
  ];

  for (const pattern of patterns) {
    const match = majorField.match(pattern);
    if (match) {
      if (match.length === 3) {
        return { department: match[1].trim(), major: match[2].trim() };
      } else if (match.length === 2) {
        return { department: match[1].trim(), major: '' };
      }
    }
  }

  // 매칭 실패 시 전체를 전공명으로
  return { department: '', major: majorField };
}

// 학부명으로 단과대학 찾기
function findCollege(department, major) {
  const collegeMap = {
    // 인문대학
    '아시아·중동어문학부': '인문대학',
    '인문콘텐츠학부': '인문대학',
    '문예창작학과': '인문대학',
    // 사회과학대학
    '공공인재학부': '사회과학대학',
    '경상·통계학부': '사회과학대학',
    '법학과': '사회과학대학',
    // 경영대학
    '경영학부': '경영대학',
    '경영정보학과': '경영대학',
    // 미디어·휴먼라이프대학
    '디지털미디어학부': '미디어·휴먼라이프대학',
    '청소년지도·아동학부': '미디어·휴먼라이프대학',
    // 인공지능·소프트웨어융합대학
    '융합소프트웨어학부': '인공지능·소프트웨어융합대학',
    '디지털콘텐츠디자인학과': '인공지능·소프트웨어융합대학',
    // 화학·생명과학대학
    '화학·에너지융합학부': '화학·생명과학대학',
    '융합바이오학부': '화학·생명과학대학',
  };

  return collegeMap[department] || '';
}

// 메인 실행
const inputFile = path.join(__dirname, '..', '전공별교과목.csv');
const outputFile = path.join(__dirname, 'supabase_major_courses_v2.csv');

// 파일 읽기
const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.trim().split('\n');

// 헤더 건너뛰고 데이터 처리
const results = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // BOM 제거
  const cleanLine = line.replace(/^\uFEFF/, '');
  const [majorField, courseName] = cleanLine.split(',');

  if (!majorField || !courseName) continue;

  const { department, major } = parseMajorField(majorField.trim());
  const college = findCollege(department, major);

  results.push({
    college: college,
    department: department,
    major: major,
    course_name: courseName.trim()
  });
}

// CSV 출력
const header = 'college,department,major,course_name';
const csvLines = results.map(r =>
  `"${r.college}","${r.department}","${r.major}","${r.course_name}"`
);

fs.writeFileSync(outputFile, header + '\n' + csvLines.join('\n'), 'utf-8');

console.log(`생성 완료: ${outputFile}`);
console.log(`총 ${results.length}개 교과목`);

// 통계 출력
const deptStats = {};
results.forEach(r => {
  const key = r.department || '(미분류)';
  deptStats[key] = (deptStats[key] || 0) + 1;
});
console.log('\n학부별 교과목 수:');
Object.entries(deptStats).sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
  console.log(`  ${dept}: ${count}`);
});
