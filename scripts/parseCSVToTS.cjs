const fs = require('fs');
const path = require('path');

// CSV 파일 읽기
const csvPath = path.join(__dirname, '../src/data/majorcapacity.csv');
const outputPath = path.join(__dirname, '../src/data/majorCompetencyData.ts');

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

const majorMap = {};

// 첫 4줄은 헤더이므로 건너뜀
for (let i = 4; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // CSV 파싱 (쉼표로 분리, 쌍따옴표 안의 쉼표는 무시)
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  
  const [college, dept, major, majorCode, compNum, compName, qNum, question] = parts;
  
  if (!major || !compName || !question) continue;
  
  const majorName = major.replace(/"/g, '').trim();
  const competencyNumber = parseInt(compNum) || 1;
  const competencyName = compName.replace(/"/g, '').trim();
  const questionNumber = parseInt(qNum) || 1;
  const questionText = question.replace(/"/g, '').trim();
  
  if (!majorMap[majorName]) {
    majorMap[majorName] = {
      majorName,
      college: college.replace(/"/g, '').trim() || '미분류',
      majorCode: majorCode.replace(/"/g, '').trim() || '00000',
      competencies: {}
    };
  }
  
  if (!majorMap[majorName].competencies[competencyNumber]) {
    majorMap[majorName].competencies[competencyNumber] = {
      competencyNumber,
      competencyName,
      questions: []
    };
  }
  
  majorMap[majorName].competencies[competencyNumber].questions.push({
    questionNumber,
    question: questionText
  });
}

// TypeScript 파일 생성
let tsContent = `// 전공능력진단 데이터 - majorcapacity.csv 기반 (자동 생성)
// 리커트 5점 척도: 1(전혀 그렇지 않다) ~ 5(매우 그렇다)

export interface CompetencyQuestion {
  questionNumber: number;
  question: string;
}

export interface MajorCompetency {
  competencyNumber: number;
  competencyName: string;
  questions: CompetencyQuestion[];
}

export interface MajorCompetencyData {
  majorName: string;
  college: string;
  majorCode: string;
  competencies: MajorCompetency[];
}

// CSV에서 파싱한 전공능력진단 데이터
export const MAJOR_COMPETENCY_MAP: Record<string, MajorCompetencyData> = {\n`;

for (const majorName of Object.keys(majorMap)) {
  const major = majorMap[majorName];
  const competencies = Object.values(major.competencies).sort((a, b) => a.competencyNumber - b.competencyNumber);
  
  tsContent += `  "${majorName}": {\n`;
  tsContent += `    majorName: "${majorName}",\n`;
  tsContent += `    college: "${major.college}",\n`;
  tsContent += `    majorCode: "${major.majorCode}",\n`;
  tsContent += `    competencies: [\n`;
  
  for (const comp of competencies) {
    tsContent += `      {\n`;
    tsContent += `        competencyNumber: ${comp.competencyNumber},\n`;
    tsContent += `        competencyName: "${comp.competencyName.replace(/"/g, '\\"')}",\n`;
    tsContent += `        questions: [\n`;
    
    for (const q of comp.questions) {
      const escapedQuestion = q.question.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
      tsContent += `          { questionNumber: ${q.questionNumber}, question: "${escapedQuestion}" },\n`;
    }
    
    tsContent += `        ]\n`;
    tsContent += `      },\n`;
  }
  
  tsContent += `    ]\n`;
  tsContent += `  },\n`;
}

tsContent += `};

// 전공명으로 전공능력 데이터 가져오기 (부분 매칭 지원)
export function getMajorCompetencyData(majorName: string): MajorCompetencyData | null {
  // 정확한 매칭 먼저 시도
  if (MAJOR_COMPETENCY_MAP[majorName]) {
    return MAJOR_COMPETENCY_MAP[majorName];
  }

  // 부분 매칭 시도
  const keys = Object.keys(MAJOR_COMPETENCY_MAP);
  for (const key of keys) {
    if (majorName.includes(key) || key.includes(majorName)) {
      return MAJOR_COMPETENCY_MAP[key];
    }
  }

  // 기본 데이터 반환
  return null;
}

// 기본 전공능력 데이터 (데이터가 없는 전공용)
export const DEFAULT_COMPETENCY_DATA: MajorCompetency[] = [
  {
    competencyNumber: 1,
    competencyName: "전공 기초 지식",
    questions: [
      { questionNumber: 1, question: "나는 해당 전공의 기초 개념과 이론을 이해할 수 있다." },
      { questionNumber: 2, question: "나는 전공 관련 용어를 정확히 이해하고 사용할 수 있다." },
      { questionNumber: 3, question: "나는 전공 분야의 최신 동향과 기술을 파악하고 있다." }
    ]
  },
  {
    competencyNumber: 2,
    competencyName: "실무 적용 능력",
    questions: [
      { questionNumber: 1, question: "나는 배운 이론을 실제 현장에 적용할 수 있다." },
      { questionNumber: 2, question: "나는 전공 관련 도구와 기술을 활용할 수 있다." },
      { questionNumber: 3, question: "나는 현장에서 발생하는 문제를 분석하고 해결할 수 있다." }
    ]
  },
  {
    competencyNumber: 3,
    competencyName: "융합적 사고",
    questions: [
      { questionNumber: 1, question: "나는 다양한 분야의 지식을 연결하여 사고할 수 있다." },
      { questionNumber: 2, question: "나는 창의적이고 혁신적인 해결책을 제시할 수 있다." },
      { questionNumber: 3, question: "나는 팀원들과 협력하여 시너지를 창출할 수 있다." }
    ]
  }
];
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`Generated ${outputPath}`);
console.log(`Total majors: ${Object.keys(majorMap).length}`);
