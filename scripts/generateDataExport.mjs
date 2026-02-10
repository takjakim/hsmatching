/**
 * MJU e-Advisor 데이터 내보내기 스크립트
 * xlsx 파일 생성 (csv 형태로 대체)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 1. 전공 RIASEC 프로파일 추출
function extractMajorProfiles() {
  const majorListPath = path.join(rootDir, 'src/data/majorList.ts');
  const content = fs.readFileSync(majorListPath, 'utf-8');

  // profileMap 객체 추출 (정규식으로 파싱)
  const profileMapMatch = content.match(/const profileMap.*?=\s*\{([\s\S]*?)\n  \};/);
  if (!profileMapMatch) {
    console.log('profileMap not found, extracting from MAJORS array...');
    return extractFromMAJORS(content);
  }

  const profiles = [];
  const lines = profileMapMatch[1].split('\n');

  for (const line of lines) {
    // '전공명': { R: 0.15, I: 0.7, ... } 형태 파싱
    const match = line.match(/'([^']+)':\s*\{\s*R:\s*([\d.]+),\s*I:\s*([\d.]+),\s*A:\s*([\d.]+),\s*S:\s*([\d.]+),\s*E:\s*([\d.]+),\s*C:\s*([\d.]+)/);
    if (match) {
      profiles.push({
        name: match[1],
        R: parseFloat(match[2]),
        I: parseFloat(match[3]),
        A: parseFloat(match[4]),
        S: parseFloat(match[5]),
        E: parseFloat(match[6]),
        C: parseFloat(match[7]),
      });
    }
  }

  // 중복 제거
  const uniqueProfiles = [];
  const seen = new Set();
  for (const p of profiles) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      uniqueProfiles.push(p);
    }
  }

  return uniqueProfiles;
}

function extractFromMAJORS(content) {
  // CSV_DATA에서 전공 정보 추출
  const csvMatch = content.match(/const CSV_DATA = `([\s\S]*?)`;/);
  if (!csvMatch) return [];

  const lines = csvMatch[1].trim().split('\n').slice(1); // 헤더 제외
  const majors = [];

  for (const line of lines) {
    const [college, department, major] = line.split(',').map(s => s.trim());
    if (!college || (!department && !major)) continue;

    const majorName = major || department;
    majors.push({
      college,
      department,
      name: majorName,
    });
  }

  return majors;
}

// 2. RIASEC 문항 추출
function extractRiasecQuestions() {
  const questionPoolPath = path.join(rootDir, 'src/data/questionPool.ts');
  const content = fs.readFileSync(questionPoolPath, 'utf-8');

  const questions = [];

  // QUESTION_POOL 배열에서 문항 추출
  const poolMatch = content.match(/export const QUESTION_POOL: Question\[\] = \[([\s\S]*?)\n\];/);
  if (!poolMatch) return questions;

  // 각 문항 객체 추출
  const questionMatches = poolMatch[1].matchAll(/\{\s*id:\s*(\d+),\s*prompt:\s*"([^"]+)",\s*A:\s*\{\s*text:\s*"([^"]+)",\s*weights:\s*\[([^\]]+)\]\s*\},\s*B:\s*\{\s*text:\s*"([^"]+)",\s*weights:\s*\[([^\]]+)\]\s*\}\s*\}/g);

  for (const match of questionMatches) {
    questions.push({
      id: parseInt(match[1]),
      prompt: match[2],
      textA: match[3],
      weightsA: match[4],
      textB: match[5],
      weightsB: match[6],
    });
  }

  return questions;
}

// 3. 계열 탐색 문항 추출
function extractClusterQuestions() {
  const questionPoolPath = path.join(rootDir, 'src/data/questionPool.ts');
  const content = fs.readFileSync(questionPoolPath, 'utf-8');

  const questions = [];

  // CLUSTER_QUESTIONS 배열에서 문항 추출
  const clusterMatch = content.match(/export const CLUSTER_QUESTIONS: ClusterQuestion\[\] = \[([\s\S]*?)\n\];/);
  if (!clusterMatch) return questions;

  const questionMatches = clusterMatch[1].matchAll(/\{\s*id:\s*(\d+),\s*prompt:\s*"([^"]+)",[\s\S]*?A:\s*\{[\s\S]*?text:\s*"([^"]+)"[\s\S]*?\},[\s\S]*?B:\s*\{[\s\S]*?text:\s*"([^"]+)"/g);

  for (const match of questionMatches) {
    questions.push({
      id: parseInt(match[1]),
      prompt: match[2],
      textA: match[3],
      textB: match[4],
    });
  }

  return questions;
}

// 4. 보완 문항 추출
function extractPilotQuestions() {
  const pilotPath = path.join(rootDir, 'src/data/pilotQuestions.ts');
  const content = fs.readFileSync(pilotPath, 'utf-8');

  const questions = [];

  // PILOT_QUESTIONS 배열에서 문항 추출
  const pilotMatch = content.match(/export const PILOT_QUESTIONS: PilotQuestion\[\] = \[([\s\S]*?)\n\];/);
  if (!pilotMatch) return questions;

  // 간단한 문항 추출 (id, area, type, text)
  const questionMatches = pilotMatch[1].matchAll(/\{\s*id:\s*'([^']+)',\s*area:\s*'([^']+)',\s*type:\s*'([^']+)',\s*text:\s*'([^']+)'/g);

  for (const match of questionMatches) {
    questions.push({
      id: match[1],
      area: match[2],
      type: match[3],
      text: match[4],
    });
  }

  return questions;
}

// CSV 생성 함수
function toCSV(data, headers) {
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

// 메인 실행
async function main() {
  console.log('MJU e-Advisor 데이터 내보내기 시작...\n');

  const outputDir = rootDir;

  // 1. 전공 RIASEC 프로파일
  console.log('1. 전공 RIASEC 프로파일 추출...');
  const profiles = extractMajorProfiles();
  console.log(`   - ${profiles.length}개 전공 추출`);

  // 2. RIASEC 문항
  console.log('2. RIASEC 문항 추출...');
  const riasecQuestions = extractRiasecQuestions();
  console.log(`   - ${riasecQuestions.length}개 문항 추출`);

  // 3. 계열 탐색 문항
  console.log('3. 계열 탐색 문항 추출...');
  const clusterQuestions = extractClusterQuestions();
  console.log(`   - ${clusterQuestions.length}개 문항 추출`);

  // 4. 보완 문항
  console.log('4. 보완 문항 추출...');
  const pilotQuestions = extractPilotQuestions();
  console.log(`   - ${pilotQuestions.length}개 문항 추출`);

  // CSV 파일 생성
  console.log('\nCSV 파일 생성...');

  // 전공 프로파일 CSV
  if (profiles.length > 0 && profiles[0].R !== undefined) {
    const profileCSV = toCSV(profiles, ['name', 'R', 'I', 'A', 'S', 'E', 'C']);
    fs.writeFileSync(path.join(outputDir, 'MJU_전공_RIASEC_프로파일.csv'), '\ufeff' + profileCSV, 'utf-8');
    console.log('   - MJU_전공_RIASEC_프로파일.csv 생성');
  }

  // RIASEC 문항 CSV
  if (riasecQuestions.length > 0) {
    const riasecCSV = toCSV(riasecQuestions, ['id', 'prompt', 'textA', 'weightsA', 'textB', 'weightsB']);
    fs.writeFileSync(path.join(outputDir, 'MJU_RIASEC_문항_가중치.csv'), '\ufeff' + riasecCSV, 'utf-8');
    console.log('   - MJU_RIASEC_문항_가중치.csv 생성');
  }

  // 계열 탐색 문항 CSV
  if (clusterQuestions.length > 0) {
    const clusterCSV = toCSV(clusterQuestions, ['id', 'prompt', 'textA', 'textB']);
    fs.writeFileSync(path.join(outputDir, 'MJU_계열탐색_문항.csv'), '\ufeff' + clusterCSV, 'utf-8');
    console.log('   - MJU_계열탐색_문항.csv 생성');
  }

  // 보완 문항 CSV
  if (pilotQuestions.length > 0) {
    const pilotCSV = toCSV(pilotQuestions, ['id', 'area', 'type', 'text']);
    fs.writeFileSync(path.join(outputDir, 'MJU_보완문항.csv'), '\ufeff' + pilotCSV, 'utf-8');
    console.log('   - MJU_보완문항.csv 생성');
  }

  // 알고리즘 설정값 JSON
  const algorithmSettings = {
    "RIASEC_점수_계산": {
      "가중치_범위": "0.2 ~ 1.0",
      "주차원_가중치": 1.0,
      "부차원_가중치": "0.2 ~ 0.4",
      "점수_범위": "0 ~ 50"
    },
    "전공_추천": {
      "코사인_유사도_비중_계열있음": 0.45,
      "코사인_유사도_비중_계열없음": 0.55,
      "시너지_비중_계열있음": 0.25,
      "시너지_비중_계열없음": 0.35,
      "계열_정확일치_보너스": 0.15,
      "계열_중간관심_보너스": 0.08,
      "계열_인접_보너스": 0.05,
      "부족_페널티_계수": 0.25,
      "과부하_페널티_계수": 0.4,
      "균형_페널티_계수": 0.03
    },
    "진로결정_분류": {
      "decided_기준": "4.0 이상",
      "exploring_기준": "2.5 ~ 3.9",
      "undecided_기준": "2.5 미만"
    },
    "인접_계열_매핑": {
      "인문": ["사회", "예체능"],
      "사회": ["인문", "경상"],
      "경상": ["사회", "융합"],
      "공학": ["자연", "융합"],
      "자연": ["공학", "융합"],
      "예체능": ["인문", "융합"],
      "융합": ["공학", "자연", "경상"]
    }
  };

  fs.writeFileSync(
    path.join(outputDir, 'MJU_알고리즘_설정값.json'),
    JSON.stringify(algorithmSettings, null, 2),
    'utf-8'
  );
  console.log('   - MJU_알고리즘_설정값.json 생성');

  console.log('\n완료!');
}

main().catch(console.error);
