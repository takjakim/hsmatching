import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, '../src/data/job_code_inform.csv');
const outputFilePath = path.join(__dirname, '../src/data/jobInfoMap.ts');

// CSV 라인 파싱 (따옴표 내 콤마 처리)
function parseCsvLine(line) {
  const result = [];
  let inQuote = false;
  let currentField = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField.trim());
  return result;
}

function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
  
  // 헤더: 직업코드,대분류,중분류,소분류,직무개요,수행직무,임금정보,직업만족도,일자리전망,직업명,...
  const headers = parseCsvLine(lines[0]);
  console.log('Headers:', headers.slice(0, 10));
  
  const data = {};
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 10) continue;
    
    const jobCode = values[0]; // 직업코드
    const category = values[1]; // 대분류
    const subCategory = values[2]; // 중분류
    const jobTitle = values[3]; // 소분류 (직업명)
    const jobSummary = values[4]; // 직무개요
    const jobDuties = values[5]; // 수행직무
    const salaryInfo = values[6]; // 임금정보
    const satisfaction = values[7]; // 직업만족도
    const outlook = values[8]; // 일자리전망
    const jobName = values[9]; // 직업명
    
    if (!jobCode || !jobName) continue;
    
    // 직무개요 정리 (너무 길면 자르기)
    let summary = jobSummary || '';
    if (summary.length > 200) {
      summary = summary.substring(0, 200) + '...';
    }
    
    data[jobCode] = {
      code: jobCode,
      name: jobName,
      category: category,
      subCategory: subCategory,
      summary: summary,
      salaryInfo: salaryInfo,
      satisfaction: satisfaction,
      outlook: outlook
    };
    
    // 직업명으로도 매핑 (검색용)
    data[jobName] = data[jobCode];
  }
  
  return data;
}

function generateTypeScriptFile(parsedData, outputPath) {
  // 직업코드 기반 매핑만 추출
  const codeBasedData = {};
  const nameToCode = {};
  
  for (const key in parsedData) {
    if (key.startsWith('K0')) {
      codeBasedData[key] = parsedData[key];
      nameToCode[parsedData[key].name] = key;
    }
  }
  
  let tsContent = `// 워크피디아 직업 정보 매핑
// 출처: job_code_inform.csv (워크피디아 Open API)
// 자동 생성됨 - 수정하지 마세요

export interface JobInfo {
  code: string;
  name: string;
  category: string;
  subCategory: string;
  summary: string;
  salaryInfo: string;
  satisfaction: string;
  outlook: string;
}

// 직업코드 → 직업정보 매핑
export const JOB_INFO_MAP: Record<string, JobInfo> = {\n`;

  for (const code in codeBasedData) {
    const job = codeBasedData[code];
    tsContent += `  "${code}": {\n`;
    tsContent += `    code: "${job.code}",\n`;
    tsContent += `    name: "${job.name.replace(/"/g, '\\"')}",\n`;
    tsContent += `    category: "${job.category.replace(/"/g, '\\"')}",\n`;
    tsContent += `    subCategory: "${job.subCategory.replace(/"/g, '\\"')}",\n`;
    tsContent += `    summary: "${job.summary.replace(/"/g, '\\"').replace(/\n/g, ' ')}",\n`;
    tsContent += `    salaryInfo: "${job.salaryInfo.replace(/"/g, '\\"')}",\n`;
    tsContent += `    satisfaction: "${job.satisfaction}",\n`;
    tsContent += `    outlook: "${job.outlook.replace(/"/g, '\\"')}"\n`;
    tsContent += `  },\n`;
  }

  tsContent += `};

// 직업명 → 직업코드 매핑
export const JOB_NAME_TO_INFO_CODE: Record<string, string> = {\n`;

  for (const name in nameToCode) {
    tsContent += `  "${name.replace(/"/g, '\\"')}": "${nameToCode[name]}",\n`;
  }

  tsContent += `};

/**
 * 직업명 또는 코드로 직업 정보를 가져옵니다.
 */
export function getJobInfo(nameOrCode: string): JobInfo | null {
  // 직접 코드로 검색
  if (JOB_INFO_MAP[nameOrCode]) {
    return JOB_INFO_MAP[nameOrCode];
  }
  
  // 직업명으로 검색
  const code = JOB_NAME_TO_INFO_CODE[nameOrCode];
  if (code && JOB_INFO_MAP[code]) {
    return JOB_INFO_MAP[code];
  }
  
  // 부분 매칭 시도
  for (const jobName in JOB_NAME_TO_INFO_CODE) {
    if (jobName.includes(nameOrCode) || nameOrCode.includes(jobName)) {
      const matchedCode = JOB_NAME_TO_INFO_CODE[jobName];
      return JOB_INFO_MAP[matchedCode];
    }
  }
  
  return null;
}

/**
 * 직업 설명(요약)을 가져옵니다.
 */
export function getJobSummary(nameOrCode: string): string {
  const info = getJobInfo(nameOrCode);
  return info?.summary || "해당 직무에 대한 설명이 없습니다.";
}

/**
 * 직업 임금 정보를 가져옵니다.
 */
export function getJobSalary(nameOrCode: string): string {
  const info = getJobInfo(nameOrCode);
  return info?.salaryInfo || "";
}
`;

  fs.writeFileSync(outputPath, tsContent, 'utf8');
  console.log(`Generated ${outputPath}`);
  console.log(`Total jobs: ${Object.keys(codeBasedData).length}`);
}

const parsedData = parseCSV(csvFilePath);
generateTypeScriptFile(parsedData, outputFilePath);
