import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { GraduateRoleModel } from '../types/graduate';

/**
 * 이름을 익명화합니다. 예: "강건구" → "강○○"
 */
function anonymizeName(name: string): string {
  if (!name || name.trim().length === 0) {
    return '정보없음';
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 1) {
    return trimmedName;
  }

  const firstChar = trimmedName[0];
  const circles = '○'.repeat(trimmedName.length - 1);
  return `${firstChar}${circles}`;
}

/**
 * 멘토 의향 문자열을 boolean으로 변환합니다.
 */
function parseMentorWillingness(value: string): boolean {
  return value?.trim() === '네';
}

/**
 * 빈 문자열 또는 undefined를 "정보없음"으로 변환합니다.
 */
function normalizeEmpty(value: string | undefined): string {
  return value && value.trim().length > 0 ? value.trim() : '정보없음';
}

/**
 * 졸업년도를 추출합니다. 예: "2024년_졸업생..." → "2024년 2월"
 * CSV 파일명이나 데이터에서 추출
 */
function extractGraduationYear(fileName: string): string {
  const match = fileName.match(/(\d{4})년/);
  if (match) {
    return `${match[1]}년 2월`;
  }
  return '정보없음';
}

/**
 * CSV 행 데이터를 GraduateRoleModel로 변환합니다.
 */
function parseGraduateRow(row: any, graduationYear: string, index: number): GraduateRoleModel | null {
  try {
    // 필수 필드 확인
    const name = row['1-1  귀하의 이름을 작성해주세요'];
    const college = row['2. 귀하의 졸업 단과대학을 선택해주세요.'];
    const major = row['3. 귀하의 학과를 적어주십시오.'];
    const currentStatus = row['2024년 현재 졸업 상태를 선택하여 주세요'];
    const mentorWillingness = row['4. 추후 동문 취업멘토링, 학과 특강 등 동문 멘토로써 활동하실 의향이 있습니까? \n *  동문 멘토 Pool 등록(동문 멘토링 참여시 소정의 활동비 지급)'];

    if (!name || !college || !major || !currentStatus) {
      return null;
    }

    // 직무와 회사 정보는 취업 상태에 따라 다른 컬럼에서 추출
    let jobCategory = '';
    let company = '';
    let region = '';
    let department = '';

    if (currentStatus.includes('기업(관) 취업자')) {
      jobCategory = row['나. 귀하의 취업 직무를 선택 주시기 바랍니다.'] || '';
      company = row['다. 기업명을 입력하여 주시기 바랍니다.'] || '';
      region = row['라. 귀하의 근무지역을 작성하여 주시기 바랍니다. (시/군 단위까지)'] || '';
      department = row['마. 귀하의 근무 부서를 작성하여 주시기 바랍니다.'] || '';
    } else if (currentStatus.includes('프리랜서')) {
      jobCategory = row['나. 귀하의 활동 직무를 선택 주시기 바랍니다.'] || '';
      company = '프리랜서';
      region = '정보없음';
      department = '정보없음';
    } else if (currentStatus.includes('창(사)업자')) {
      jobCategory = row['다. 귀하의 창(사)업 분야를 작성하여 주시기 바랍니다.'] || '';
      company = row['마. 귀하가 대표로 있는 기업명을 입력하여 주시기 바랍니다.'] || '';
      region = row['바. 귀하의 창(사)업 지역을 작성하여 주시기 바랍니다.(시/군 단위까지 작성)'] || '';
      department = '대표';
    } else if (currentStatus.includes('진학자')) {
      jobCategory = '진학';
      company = row['나. 귀하가 진학한 학교명을 작성하여 주시기 바랍니다.(본/분교 여부, 캠퍼스까지 작성)'] || '';
      region = '정보없음';
      department = '정보없음';
    }

    return {
      id: `graduate_${graduationYear}_${index}`,
      nameAnonymized: anonymizeName(name),
      graduationYear,
      college: college.trim(),
      major: major.trim(),
      currentStatus: currentStatus.trim(),
      jobCategory: normalizeEmpty(jobCategory),
      company: normalizeEmpty(company),
      region: normalizeEmpty(region),
      department: normalizeEmpty(department),
      isMentor: parseMentorWillingness(mentorWillingness),
    };
  } catch (error) {
    console.error(`Error parsing row ${index}:`, error);
    return null;
  }
}

/**
 * CSV 파일을 읽어서 GraduateRoleModel 배열로 파싱합니다.
 */
export function parseGraduateCSV(csvFilePath: string): GraduateRoleModel[] {
  try {
    // 파일 읽기
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    // BOM 제거
    const cleanContent = fileContent.replace(/^\uFEFF/, '');

    // CSV 파싱
    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    // 파일명에서 졸업년도 추출
    const fileName = path.basename(csvFilePath);
    const graduationYear = extractGraduationYear(fileName);

    // 각 행을 GraduateRoleModel로 변환
    const graduates: GraduateRoleModel[] = [];
    records.forEach((row: any, index: number) => {
      const graduate = parseGraduateRow(row, graduationYear, index + 1);
      if (graduate) {
        graduates.push(graduate);
      }
    });

    return graduates;
  } catch (error) {
    console.error(`Error reading CSV file ${csvFilePath}:`, error);
    throw error;
  }
}

/**
 * 여러 CSV 파일을 한 번에 파싱합니다.
 */
export function parseMultipleGraduateCSVs(csvFilePaths: string[]): GraduateRoleModel[] {
  const allGraduates: GraduateRoleModel[] = [];

  csvFilePaths.forEach((filePath) => {
    try {
      const graduates = parseGraduateCSV(filePath);
      allGraduates.push(...graduates);
      console.log(`Parsed ${graduates.length} graduates from ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);
    }
  });

  return allGraduates;
}

/**
 * 졸업생 데이터를 JSON 파일로 저장합니다.
 */
export function saveGraduatesAsJSON(graduates: GraduateRoleModel[], outputPath: string): void {
  try {
    const jsonContent = JSON.stringify(graduates, null, 2);
    fs.writeFileSync(outputPath, jsonContent, 'utf-8');
    console.log(`Saved ${graduates.length} graduates to ${outputPath}`);
  } catch (error) {
    console.error(`Error saving JSON file ${outputPath}:`, error);
    throw error;
  }
}

// 사용 예시
if (require.main === module) {
  const csvFiles = [
    '/Users/takjakim_mbp/Downloads/hsmatching-main/★2024년_졸업생 취업현황 자체조사_온라인(응답)최종_pw.csv',
    '/Users/takjakim_mbp/Downloads/hsmatching-main/★2025년_졸업생 취업현황 자체조사_온라인(응답)최종_pw.csv',
  ];

  const graduates = parseMultipleGraduateCSVs(csvFiles);
  const outputPath = path.join(__dirname, '../../data/graduates.json');

  // 출력 디렉토리 생성
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  saveGraduatesAsJSON(graduates, outputPath);

  console.log('\n=== Parsing Summary ===');
  console.log(`Total graduates: ${graduates.length}`);
  console.log(`Mentors willing: ${graduates.filter(g => g.isMentor).length}`);
  console.log(`By status:`);
  const statusGroups = graduates.reduce((acc, g) => {
    acc[g.currentStatus] = (acc[g.currentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(statusGroups).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}
