/**
 * 졸업생 성공 인사이트 생성 스크립트
 *
 * 사용법: node scripts/generateGraduateInsights.mjs
 *
 * 먼저 graduates 테이블에 success_insight 컬럼 추가 필요:
 * ALTER TABLE graduates ADD COLUMN success_insight TEXT;
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 파일 수동 파싱
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // 따옴표 제거
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key.trim()] = value;
      }
    });
    return env;
  } catch (e) {
    console.error('.env 파일을 읽을 수 없습니다:', e.message);
    process.exit(1);
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 비교과 프로그램 중요도 키워드
const IMPORTANT_PROGRAM_KEYWORDS = [
  '인턴', '현장실습', '공모전', '경진대회', '해외', '글로벌', '창업',
  '멘토링', 'SW', '코딩', '프로젝트', '캠프', '아카데미', '특강',
  '취업', '채용', '기업', '산학', '연수', '봉사', '리더십'
];

// 직무별 관련 교과목 키워드
const JOB_COURSE_KEYWORDS = {
  'IT': ['프로그래밍', '데이터', '소프트웨어', '시스템', '네트워크', '보안', '알고리즘', '웹', '앱', '코딩', '데이터베이스', 'AI', '인공지능'],
  '개발': ['프로그래밍', '데이터', '소프트웨어', '웹', '앱', '코딩', '알고리즘'],
  '금융': ['회계', '재무', '경제', '금융', '투자', '세무', '원가', '예산'],
  '회계': ['회계', '재무', '세무', '원가', '감사'],
  '기획': ['경영', '마케팅', '전략', '기획', '조직', '인사'],
  '사무': ['경영', '조직', '인사', '행정', '문서'],
  '영업': ['마케팅', '소비자', '광고', '브랜드', '서비스', '고객'],
  '마케팅': ['마케팅', '브랜드', '광고', '소비자', '커뮤니케이션', 'SNS'],
  '연구': ['통계', '분석', '연구방법론', '조사', '실험'],
  '생산': ['생산', '품질', '공정', '제조', 'SCM', '물류'],
  '품질': ['품질', 'QC', '검사', '인증', '표준'],
};

/**
 * 프로그램 이름 정리 (태그, 연도 제거)
 */
function cleanProgramName(name) {
  let cleaned = name
    .replace(/^\[.*?\]\s*/, '')  // [태그] 제거
    .replace(/\d{4}년도?\s*/g, '')  // 연도 제거
    .replace(/\d{1,2}학기\s*/g, '')  // 학기 제거
    .replace(/\d{1,2}차\s*/g, '')  // 차수 제거
    .replace(/\(\d+월.*?\)/g, '')  // (월일) 제거
    .replace(/_+/g, ' ')  // 언더스코어 제거
    .replace(/\s+/g, ' ')  // 연속 공백 제거
    .trim();

  // 너무 길면 적당히 자르기
  if (cleaned.length > 30) {
    cleaned = cleaned.substring(0, 30).trim();
    // 단어 중간에 잘리지 않게
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > 20) cleaned = cleaned.substring(0, lastSpace);
  }
  return cleaned;
}

/**
 * 졸업생의 성공 인사이트 생성 (신입생 친화적 버전)
 */
function generateInsight(graduate, programs, courses) {
  const parts = [];
  const company = graduate.company_name || '기업';
  const jobType = graduate.job_type || '';

  // 1. 수강 교과목 분석 (풍부하게)
  if (courses.length > 0) {
    // 직무 관련 과목 찾기
    let relevantKeywords = [];
    for (const [key, keywords] of Object.entries(JOB_COURSE_KEYWORDS)) {
      if (jobType.includes(key)) {
        relevantKeywords = keywords;
        break;
      }
    }

    let relevantCourses = [];
    if (relevantKeywords.length > 0) {
      relevantCourses = courses.filter(c =>
        relevantKeywords.some(kw => c.course_name.includes(kw))
      );
    }

    // 직무 관련 과목이 없으면 전체에서 선택
    const targetCourses = relevantCourses.length >= 2 ? relevantCourses : courses;
    const courseNames = [...new Set(targetCourses.slice(0, 4).map(c => c.course_name))];

    if (courseNames.length >= 2) {
      parts.push(`📚 수강 과목: ${courseNames.join(', ')}`);
    } else if (courseNames.length === 1) {
      parts.push(`📚 수강 과목: ${courseNames[0]}`);
    }
  }

  // 2. 비교과 활동 분석 (여러 개 표시)
  if (programs.length > 0) {
    // 중요 프로그램 우선 선택
    const importantPrograms = programs.filter(p =>
      IMPORTANT_PROGRAM_KEYWORDS.some(kw => p.program_name.includes(kw))
    );

    const targetPrograms = importantPrograms.length >= 2 ? importantPrograms : programs;
    const programNames = [...new Set(targetPrograms.slice(0, 3).map(p => cleanProgramName(p.program_name)))];

    if (programNames.length >= 1) {
      const validNames = programNames.filter(n => n.length > 3);
      if (validNames.length >= 1) {
        parts.push(`🎯 비교과 활동: ${validNames.join(', ')}${programs.length > 3 ? ` 외 ${programs.length - 3}개` : ''}`);
      }
    }
  }

  // 3. 자격증 (모두 표시)
  const certs = [graduate.cert1, graduate.cert2, graduate.cert3]
    .filter(c => c && c !== '-' && c.trim() !== '');

  if (certs.length > 0) {
    parts.push(`📜 자격증: ${certs.join(', ')}`);
  }

  // 4. 어학 성적
  const langScores = [];
  if (graduate.toeic && graduate.toeic >= 600) {
    langScores.push(`TOEIC ${graduate.toeic}점`);
  }
  if (graduate.opic && graduate.opic !== '-') {
    langScores.push(`OPIc ${graduate.opic}`);
  }
  if (graduate.toeic_s && graduate.toeic_s !== '-') {
    langScores.push(`TOEIC Speaking ${graduate.toeic_s}`);
  }
  if (langScores.length > 0) {
    parts.push(`🌏 어학: ${langScores.join(', ')}`);
  }

  // 5. 학점 (괜찮은 경우)
  if (graduate.gpa && graduate.gpa >= 3.5) {
    parts.push(`📊 학점: ${graduate.gpa.toFixed(2)}/4.5`);
  }

  // 최종 문장 생성
  if (parts.length === 0) {
    return `${graduate.department || '전공'} 전공 역량을 바탕으로 ${company}에서 ${jobType || '직무'} 업무를 담당하게 되었어요.`;
  }

  // 친근한 마무리 문장
  const closings = [
    `이런 준비를 통해 ${company}에 입사했어요!`,
    `꾸준한 노력으로 ${company} ${jobType} 직무에 합격했어요!`,
    `차근차근 준비해서 ${company}에서 ${jobType} 업무를 시작했어요!`,
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return parts.join('\n') + `\n✨ ${closing}`;
}

async function main() {
  const mode = process.argv[2] || 'update'; // 'update' 또는 'sql'

  console.log('=== 졸업생 성공 인사이트 생성 시작 ===\n');
  console.log(`모드: ${mode === 'sql' ? 'SQL 파일 생성' : 'DB 직접 업데이트'}\n`);

  // 1. 모든 졸업생 조회
  console.log('1. 졸업생 데이터 조회 중...');
  const { data: graduates, error: gradError } = await supabase
    .from('graduates')
    .select('*')
    .order('graduateno');

  if (gradError || !graduates) {
    console.error('졸업생 조회 실패:', gradError);
    return;
  }
  console.log(`   - ${graduates.length}명의 졸업생 조회됨\n`);

  // 2. 모든 비교과 프로그램 조회 (전체 데이터)
  console.log('2. 비교과 프로그램 조회 중...');
  let allPrograms = [];
  let progOffset = 0;
  const BATCH_SIZE = 1000;

  while (true) {
    const { data: batch, error: progError } = await supabase
      .from('graduate_programs')
      .select('*')
      .range(progOffset, progOffset + BATCH_SIZE - 1);

    if (progError) {
      console.error('비교과 프로그램 조회 실패:', progError);
      return;
    }
    if (!batch || batch.length === 0) break;
    allPrograms = allPrograms.concat(batch);
    progOffset += BATCH_SIZE;
    if (batch.length < BATCH_SIZE) break;
  }
  console.log(`   - ${allPrograms.length}개의 비교과 활동 조회됨\n`);

  // 3. 모든 수강 과목 조회 (전체 데이터)
  console.log('3. 수강 과목 조회 중...');
  let allCourses = [];
  let courseOffset = 0;

  while (true) {
    const { data: batch, error: courseError } = await supabase
      .from('graduate_courses')
      .select('*')
      .range(courseOffset, courseOffset + BATCH_SIZE - 1);

    if (courseError) {
      console.error('수강 과목 조회 실패:', courseError);
      return;
    }
    if (!batch || batch.length === 0) break;
    allCourses = allCourses.concat(batch);
    courseOffset += BATCH_SIZE;
    if (batch.length < BATCH_SIZE) break;
  }
  console.log(`   - ${allCourses.length}개의 수강 과목 조회됨\n`);

  // 졸업생별 데이터 매핑
  const programsByGrad = {};
  const coursesByGrad = {};

  allPrograms?.forEach(p => {
    if (!programsByGrad[p.graduateno]) programsByGrad[p.graduateno] = [];
    programsByGrad[p.graduateno].push(p);
  });

  allCourses?.forEach(c => {
    if (!coursesByGrad[c.graduateno]) coursesByGrad[c.graduateno] = [];
    coursesByGrad[c.graduateno].push(c);
  });

  if (mode === 'sql') {
    // SQL 파일 생성 모드
    console.log('4. SQL 파일 생성 중...\n');

    let sql = '-- 졸업생 성공 인사이트 업데이트 SQL\n';
    sql += '-- 생성일: ' + new Date().toISOString() + '\n\n';
    sql += '-- 먼저 컬럼이 없으면 추가\n';
    sql += 'ALTER TABLE graduates ADD COLUMN IF NOT EXISTS success_insight TEXT;\n\n';
    sql += '-- 인사이트 업데이트\n';

    for (const grad of graduates) {
      const programs = programsByGrad[grad.graduateno] || [];
      const courses = coursesByGrad[grad.graduateno] || [];
      const insight = generateInsight(grad, programs, courses);

      // SQL 이스케이프
      const escapedInsight = insight.replace(/'/g, "''");
      sql += `UPDATE graduates SET success_insight = '${escapedInsight}' WHERE graduateno = ${grad.graduateno};\n`;
    }

    // 파일로 저장
    const { writeFileSync } = await import('fs');
    const outputPath = resolve(__dirname, 'update_insights.sql');
    writeFileSync(outputPath, sql);

    console.log(`SQL 파일 생성 완료: ${outputPath}`);
    console.log(`총 ${graduates.length}개의 UPDATE 문 생성됨`);
    console.log('\nSupabase SQL Editor에서 이 파일의 내용을 실행하세요.');
    return;
  }

  // DB 직접 업데이트 모드
  console.log('4. 인사이트 생성 및 DB 업데이트 중...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const grad of graduates) {
    const programs = programsByGrad[grad.graduateno] || [];
    const courses = coursesByGrad[grad.graduateno] || [];

    const insight = generateInsight(grad, programs, courses);

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('graduates')
      .update({ success_insight: insight })
      .eq('graduateno', grad.graduateno);

    if (updateError) {
      console.error(`   [ERROR] ${grad.graduateno}: ${updateError.message}`);
      errorCount++;
    } else {
      const shortInsight = insight.length > 60 ? insight.substring(0, 60) + '...' : insight;
      console.log(`   [OK] ${grad.graduateno} (${grad.company_name || 'N/A'}): ${shortInsight}`);
      successCount++;
    }
  }

  console.log('\n=== 완료 ===');
  console.log(`성공: ${successCount}건`);
  console.log(`실패: ${errorCount}건`);
}

main().catch(console.error);
