// Supabase 클라이언트 생성
import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 키 가져오기
// Vite uses import.meta.env, Node uses process.env
const getEnvVar = (key: string): string => {
  // Vite environment (client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string>)[key] || '';
  }
  // Node environment (serverless functions)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Database functions will fail.');
}

// Supabase 클라이언트 생성 (환경변수 없으면 더미 URL 사용 - 로컬 테스트용)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// 타입 정의
export interface TestResult {
  id?: number;
  code: string;
  result: any;
  device_info?: any;
  created_at: string;
  expires_at: string;
}

export interface ResultCode {
  code: string;
  created_at: string;
}

/**
 * 검사 결과 저장
 */
export async function saveTestResult(
  code: string,
  result: any,
  deviceInfo?: any
): Promise<void> {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // test_results 테이블에 저장
    const { error: resultError } = await supabase
      .from('test_results')
      .upsert({
        code,
        result,
        device_info: deviceInfo || {},
        expires_at: expiresAt
      }, {
        onConflict: 'code'
      });

    if (resultError) {
      throw resultError;
    }

    // result_codes 테이블에 저장
    const { error: codeError } = await supabase
      .from('result_codes')
      .upsert({
        code,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'code'
      });

    if (codeError) {
      throw codeError;
    }
  } catch (error) {
    console.error('Failed to save test result:', error);
    throw error;
  }
}

/**
 * 코드로 검사 결과 조회
 */
export async function getTestResultByCode(code: string): Promise<TestResult | null> {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .select('code, result, device_info, created_at, expires_at')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 결과 없음
        return null;
      }
      throw error;
    }

    return {
      code: data.code,
      result: data.result,
      device_info: data.device_info,
      created_at: data.created_at,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error('Failed to get test result:', error);
    return null;
  }
}

/**
 * 코드 목록 조회 (최근 순)
 */
export async function getResultCodeList(limit: number = 100): Promise<ResultCode[]> {
  try {
    const { data, error } = await supabase
      .from('result_codes')
      .select('code, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(row => ({
      code: row.code,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error('Failed to get code list:', error);
    return [];
  }
}

/**
 * 전체 검사 결과 조회 (관리자용)
 */
export async function getAllTestResults(limit: number = 1000): Promise<TestResult[]> {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .select('code, result, device_info, created_at, expires_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(row => ({
      code: row.code,
      result: row.result,
      device_info: row.device_info,
      created_at: row.created_at,
      expires_at: row.expires_at
    }));
  } catch (error) {
    console.error('Failed to get all test results:', error);
    return [];
  }
}

/**
 * 만료된 결과 삭제
 */
export async function deleteExpiredResults(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      throw error;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Failed to delete expired results:', error);
    return 0;
  }
}

// ===== Pilot Survey Types and Functions =====

export interface PilotResult {
  id?: number;
  code: string;
  name?: string;
  student_id?: string;
  email?: string;
  riasec_code?: string;
  raw_answers: any;
  value_scores?: any;
  career_decision?: any;
  self_efficacy?: any;
  preferences?: any;
  device_info?: any;
  riasec_scores?: any;
  riasec_answers?: any;
  skipped_supplementary?: boolean;
  created_at: string;
  expires_at: string;
}

/**
 * 파일럿 설문 결과 저장
 */
export async function savePilotResult(
  code: string,
  rawAnswers: any,
  options?: {
    name?: string;
    studentId?: string;
    email?: string;
    valueScores?: any;
    careerDecision?: any;
    selfEfficacy?: any;
    preferences?: any;
    deviceInfo?: any;
    riasecScores?: any;
    riasecAnswers?: any;
    skippedSupplementary?: boolean;
  }
): Promise<void> {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // pilot_results 테이블에 저장
    const { error: resultError } = await supabase
      .from('pilot_results')
      .upsert({
        code,
        name: options?.name || null,
        student_id: options?.studentId || null,
        email: options?.email || null,
        raw_answers: rawAnswers,
        value_scores: options?.valueScores || null,
        career_decision: options?.careerDecision || null,
        self_efficacy: options?.selfEfficacy || null,
        preferences: options?.preferences || null,
        device_info: options?.deviceInfo || {},
        riasec_scores: options?.riasecScores || null,
        riasec_answers: options?.riasecAnswers || null,
        skipped_supplementary: options?.skippedSupplementary || false,
        expires_at: expiresAt
      }, {
        onConflict: 'code'
      });

    if (resultError) {
      throw resultError;
    }

    // pilot_codes 테이블에 저장
    const { error: codeError } = await supabase
      .from('pilot_codes')
      .upsert({
        code,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'code'
      });

    if (codeError) {
      throw codeError;
    }
  } catch (error) {
    console.error('Failed to save pilot result:', error);
    throw error;
  }
}

/**
 * 코드로 파일럿 설문 결과 조회
 */
export async function getPilotResultByCode(code: string): Promise<PilotResult | null> {
  try {
    const { data, error } = await supabase
      .from('pilot_results')
      .select('*')
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      student_id: data.student_id,
      email: data.email,
      riasec_code: data.riasec_code,
      raw_answers: data.raw_answers,
      value_scores: data.value_scores,
      career_decision: data.career_decision,
      self_efficacy: data.self_efficacy,
      preferences: data.preferences,
      device_info: data.device_info,
      riasec_scores: data.riasec_scores,
      riasec_answers: data.riasec_answers,
      skipped_supplementary: data.skipped_supplementary,
      created_at: data.created_at,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error('Failed to get pilot result:', error);
    return null;
  }
}

/**
 * 학생 ID로 최신 파일럿 설문 결과 조회
 */
export async function getPilotResultByStudentId(studentId: string): Promise<PilotResult | null> {
  console.log('[supabase] getPilotResultByStudentId called with:', studentId);
  try {
    const { data, error } = await supabase
      .from('pilot_results')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('[supabase] Query result - data:', data, 'error:', error);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[supabase] No results found (PGRST116)');
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      student_id: data.student_id,
      email: data.email,
      riasec_code: data.riasec_code,
      raw_answers: data.raw_answers,
      value_scores: data.value_scores,
      career_decision: data.career_decision,
      self_efficacy: data.self_efficacy,
      preferences: data.preferences,
      device_info: data.device_info,
      riasec_scores: data.riasec_scores,
      riasec_answers: data.riasec_answers,
      skipped_supplementary: data.skipped_supplementary,
      created_at: data.created_at,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error('Failed to get pilot result by student_id:', error);
    return null;
  }
}

/**
 * 파일럿 설문 결과 전체 조회 (관리자용)
 */
export async function getAllPilotResults(limit: number = 1000): Promise<PilotResult[]> {
  try {
    const { data, error } = await supabase
      .from('pilot_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      student_id: row.student_id,
      email: row.email,
      riasec_code: row.riasec_code,
      raw_answers: row.raw_answers,
      value_scores: row.value_scores,
      career_decision: row.career_decision,
      self_efficacy: row.self_efficacy,
      preferences: row.preferences,
      device_info: row.device_info,
      // NEW fields
      riasec_scores: row.riasec_scores,
      riasec_answers: row.riasec_answers,
      skipped_supplementary: row.skipped_supplementary,
      created_at: row.created_at,
      expires_at: row.expires_at
    }));
  } catch (error) {
    console.error('Failed to get all pilot results:', error);
    return [];
  }
}

/**
 * 파일럿 코드 생성 (P + 7자리 랜덤)
 */
// ===== Admin Authentication =====

/**
 * SHA-256 해싱 (Web Crypto API)
 */
async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 관리자 인증 (DB 조회 → 해시 비교)
 */
export async function verifyAdmin(username: string, password: string): Promise<{ valid: boolean; name: string }> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('password_hash, name')
      .eq('username', username)
      .single();

    if (error || !data) {
      return { valid: false, name: '' };
    }

    const inputHash = await hashSHA256(password);
    if (inputHash === data.password_hash) {
      return { valid: true, name: data.name };
    }

    return { valid: false, name: '' };
  } catch (error) {
    console.error('Admin verification failed:', error);
    throw error; // caller handles fallback
  }
}

export function generatePilotCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외
  let code = 'P';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ===== Graduate Employment Data Types and Functions =====

export interface Graduate {
  graduateno: number;
  company_name?: string;
  company_type?: string;
  graduation_date?: string;
  employment_year?: number;
  department?: string;
  major?: string;
  job_type?: string;
  gpa?: number;
  toeic?: number;
  toeic_s?: string;
  opic?: string;
  cert1?: string;
  cert2?: string;
  cert3?: string;
  success_insight?: string; // 성공 인사이트 (미리 생성된 문장)
}

export interface GraduateProgram {
  id?: number;
  graduateno: number;
  program_name: string;
  period?: string;
  department?: string;
}

export interface GraduateCourse {
  id?: number;
  graduateno: number;
  category?: string;
  course_name: string;
  credits?: string;
  competency?: string;
}

/**
 * 졸업생 기본정보 조회 (graduateno로)
 */
export async function getGraduateByNo(graduateno: number): Promise<Graduate | null> {
  try {
    const { data, error } = await supabase
      .from('graduates')
      .select('*')
      .eq('graduateno', graduateno)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to get graduate:', error);
    return null;
  }
}

/**
 * 졸업생 목록 조회 (필터링)
 */
export async function getGraduates(filters?: {
  company_name?: string;
  company_type?: string;
  department?: string;
  job_type?: string;
  limit?: number;
}): Promise<Graduate[]> {
  try {
    let query = supabase.from('graduates').select('*');

    if (filters?.company_name) {
      query = query.ilike('company_name', `%${filters.company_name}%`);
    }
    if (filters?.company_type) {
      query = query.eq('company_type', filters.company_type);
    }
    if (filters?.department) {
      query = query.ilike('department', `%${filters.department}%`);
    }
    if (filters?.job_type) {
      query = query.ilike('job_type', `%${filters.job_type}%`);
    }

    const { data, error } = await query
      .order('graduateno', { ascending: true })
      .limit(filters?.limit || 100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get graduates:', error);
    return [];
  }
}

/**
 * 졸업생의 비교과 프로그램 조회
 */
export async function getGraduatePrograms(graduateno: number): Promise<GraduateProgram[]> {
  try {
    const { data, error } = await supabase
      .from('graduate_programs')
      .select('*')
      .eq('graduateno', graduateno)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get graduate programs:', error);
    return [];
  }
}

/**
 * 졸업생의 수강 교과목 조회
 */
export async function getGraduateCourses(graduateno: number): Promise<GraduateCourse[]> {
  try {
    const { data, error } = await supabase
      .from('graduate_courses')
      .select('*')
      .eq('graduateno', graduateno)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get graduate courses:', error);
    return [];
  }
}

/**
 * 졸업생 전체 정보 조회 (기본정보 + 비교과 + 교과목)
 */
export async function getGraduateFullProfile(graduateno: number): Promise<{
  graduate: Graduate | null;
  programs: GraduateProgram[];
  courses: GraduateCourse[];
}> {
  const [graduate, programs, courses] = await Promise.all([
    getGraduateByNo(graduateno),
    getGraduatePrograms(graduateno),
    getGraduateCourses(graduateno)
  ]);

  return { graduate, programs, courses };
}

/**
 * 특정 학과/전공의 졸업생 롤모델 검색
 */
export async function findRoleModels(filters: {
  department?: string;
  major?: string;
  job_type?: string;
  company_type?: string;
  min_gpa?: number;
}): Promise<Graduate[]> {
  try {
    let query = supabase.from('graduates').select('*');

    if (filters.department) {
      query = query.ilike('department', `%${filters.department}%`);
    }
    if (filters.major) {
      query = query.ilike('major', `%${filters.major}%`);
    }
    if (filters.job_type) {
      query = query.ilike('job_type', `%${filters.job_type}%`);
    }
    if (filters.company_type) {
      query = query.eq('company_type', filters.company_type);
    }
    if (filters.min_gpa) {
      query = query.gte('gpa', filters.min_gpa);
    }

    const { data, error } = await query.order('gpa', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to find role models:', error);
    return [];
  }
}

/**
 * 특정 과목을 수강한 졸업생 검색
 */
export async function findGraduatesByCourse(courseName: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('graduate_courses')
      .select('graduateno')
      .ilike('course_name', `%${courseName}%`);

    if (error) throw error;
    return [...new Set(data?.map(d => d.graduateno) || [])];
  } catch (error) {
    console.error('Failed to find graduates by course:', error);
    return [];
  }
}

/**
 * 통계: 기업유형별 졸업생 수
 */
export async function getCompanyTypeStats(): Promise<{ company_type: string; count: number }[]> {
  try {
    const { data, error } = await supabase
      .from('graduates')
      .select('company_type');

    if (error) throw error;

    const counts: Record<string, number> = {};
    data?.forEach(d => {
      const type = d.company_type || '미분류';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([company_type, count]) => ({ company_type, count }));
  } catch (error) {
    console.error('Failed to get company type stats:', error);
    return [];
  }
}

/**
 * 추천 전공 기반 졸업생 롤모델 조회
 * - 학과명으로 매칭 (부분 일치)
 * - 대기업/공공기관 우선, 높은 GPA 순
 */
export interface GraduateRoleModel extends Graduate {
  programs: GraduateProgram[];
  courses: GraduateCourse[];
}

export async function getGraduateRoleModelsByMajor(majorName: string, limit: number = 5): Promise<GraduateRoleModel[]> {
  try {
    // 전공명에서 학과명 추출 (예: "경영정보학과" -> "경영정보")
    const searchTerm = majorName.replace(/학과|학부|전공/g, '').trim();

    // 먼저 해당 학과 졸업생 조회
    const { data: graduates, error } = await supabase
      .from('graduates')
      .select('*')
      .or(`department.ilike.%${searchTerm}%,major.ilike.%${searchTerm}%`)
      .not('company_name', 'is', null)
      .order('company_type', { ascending: true }) // 대기업, 공공기관 우선
      .order('gpa', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    if (!graduates || graduates.length === 0) return [];

    // 각 졸업생의 비교과 프로그램 및 수강 교과목 조회
    const roleModels: GraduateRoleModel[] = await Promise.all(
      graduates.map(async (grad) => {
        const [programs, courses] = await Promise.all([
          getGraduatePrograms(grad.graduateno),
          getGraduateCourses(grad.graduateno)
        ]);
        return { ...grad, programs, courses };
      })
    );

    return roleModels;
  } catch (error) {
    console.error('Failed to get graduate role models:', error);
    return [];
  }
}

/**
 * 전체 졸업생 롤모델 조회 (전공 무관)
 * - 대기업/공공기관 취업자 우선
 * - 높은 GPA 순
 */
export async function getAllGraduateRoleModels(limit: number = 10): Promise<GraduateRoleModel[]> {
  try {
    const { data: graduates, error } = await supabase
      .from('graduates')
      .select('*')
      .not('company_name', 'is', null)
      .in('company_type', ['대기업', '공공기관'])
      .order('gpa', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    if (!graduates || graduates.length === 0) return [];

    // 각 졸업생의 비교과 프로그램 및 수강 교과목 조회
    const roleModels: GraduateRoleModel[] = await Promise.all(
      graduates.map(async (grad) => {
        const [programs, courses] = await Promise.all([
          getGraduatePrograms(grad.graduateno),
          getGraduateCourses(grad.graduateno)
        ]);
        return { ...grad, programs, courses };
      })
    );

    return roleModels;
  } catch (error) {
    console.error('Failed to get all graduate role models:', error);
    return [];
  }
}

/**
 * 여러 졸업생 ID로 롤모델 정보 조회 (비교과 프로그램 및 수강과목 포함)
 */
export async function getGraduateRoleModelsByIds(graduateIds: number[]): Promise<GraduateRoleModel[]> {
  if (graduateIds.length === 0) return [];

  try {
    const { data: graduates, error } = await supabase
      .from('graduates')
      .select('*')
      .in('graduateno', graduateIds);

    if (error) throw error;
    if (!graduates || graduates.length === 0) return [];

    // 각 졸업생의 비교과 프로그램 및 수강 교과목 조회
    const roleModels: GraduateRoleModel[] = await Promise.all(
      graduates.map(async (grad) => {
        const [programs, courses] = await Promise.all([
          getGraduatePrograms(grad.graduateno),
          getGraduateCourses(grad.graduateno)
        ]);
        return { ...grad, programs, courses };
      })
    );

    return roleModels;
  } catch (error) {
    console.error('Failed to get graduate role models by IDs:', error);
    return [];
  }
}

// ===== Student Data Types and Functions =====

export interface StudentData {
  id?: number;
  student_id: string;
  password_hash?: string;
  name: string;
  name_eng?: string;
  department?: string;
  grade?: number;
  phone_number?: string;
  email?: string;
  address_zip?: string;
  address_basic?: string;
  address_detail?: string;
  birth_date?: string;
  admission_year?: number;
  status?: string;
  riasec_code?: string;
  target_career?: string;
}

export interface StudentCourse {
  id?: number;
  student_id: string;
  year: number;
  semester: number;
  course_number: string;
  course_name: string;
  completion_type?: string;
  credits?: number;
  grade?: string;
  professor?: string;
  retake?: boolean;
}

export interface StudentGradeRecord {
  id?: number;
  student_id: string;
  year: number;
  semester: number;
  grade_year?: number;
  registered_credits?: number;
  acquired_credits?: number;
  general_credits?: number;
  major_credits?: number;
  gpa?: number;
  percentile?: number;
  semester_rank?: string;
  overall_rank?: string;
  academic_warning?: boolean;
}

export interface StudentActivity {
  id?: number;
  student_id: string;
  category: string;
  name: string;
  activity_date?: string;
  status?: string;
  description?: string;
  mileage?: number;
  hours?: number;
  issuer?: string;
  certificate_url?: string;
}

/**
 * 학생 로그인 (학번 + 비밀번호)
 */
export async function loginStudent(studentId: string, password: string): Promise<StudentData | null> {
  try {
    const passwordHash = await hashSHA256(password);

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .eq('password_hash', passwordHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 결과 없음
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Student login failed:', error);
    return null;
  }
}

/**
 * 학번으로 학생 정보 조회
 */
export async function getStudentByStudentId(studentId: string): Promise<StudentData | null> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get student:', error);
    return null;
  }
}

/**
 * 학생 정보 저장/업데이트
 */
export async function saveStudent(student: StudentData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('students')
      .upsert(student, { onConflict: 'student_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save student:', error);
    return false;
  }
}

/**
 * 학생 RIASEC 결과 업데이트
 */
export async function updateStudentRiasec(studentId: string, riasecCode: string, targetCareer?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        riasec_code: riasecCode,
        target_career: targetCareer,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update student RIASEC:', error);
    return false;
  }
}

/**
 * 학생의 수강 이력 조회
 */
export async function getStudentCourses(studentId: string): Promise<StudentCourse[]> {
  try {
    const { data, error } = await supabase
      .from('student_courses')
      .select('*')
      .eq('student_id', studentId)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get student courses:', error);
    return [];
  }
}

/**
 * 수강 이력 저장
 */
export async function saveStudentCourse(course: StudentCourse): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_courses')
      .insert(course);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save student course:', error);
    return false;
  }
}

/**
 * 학생의 성적 이력 조회
 */
export async function getStudentGrades(studentId: string): Promise<StudentGradeRecord[]> {
  try {
    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', studentId)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get student grades:', error);
    return [];
  }
}

/**
 * 성적 정보 저장
 */
export async function saveStudentGrade(grade: StudentGradeRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_grades')
      .upsert(grade, { onConflict: 'student_id,year,semester' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save student grade:', error);
    return false;
  }
}

/**
 * 학생의 비교과 활동 조회
 */
export async function getStudentActivities(studentId: string): Promise<StudentActivity[]> {
  try {
    const { data, error } = await supabase
      .from('student_activities')
      .select('*')
      .eq('student_id', studentId)
      .order('activity_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get student activities:', error);
    return [];
  }
}

/**
 * 비교과 활동 저장
 */
export async function saveStudentActivity(activity: StudentActivity): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_activities')
      .insert(activity);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save student activity:', error);
    return false;
  }
}

/**
 * 학생 전체 프로필 조회 (기본정보 + 수강이력 + 성적 + 비교과)
 */
export async function getStudentFullProfile(studentId: string): Promise<{
  student: StudentData | null;
  courses: StudentCourse[];
  grades: StudentGradeRecord[];
  activities: StudentActivity[];
  totalCredits: number;
  averageGpa: number;
}> {
  const [student, courses, grades, activities] = await Promise.all([
    getStudentByStudentId(studentId),
    getStudentCourses(studentId),
    getStudentGrades(studentId),
    getStudentActivities(studentId)
  ]);

  // 총 이수학점 계산
  const totalCredits = grades.reduce((sum, g) => sum + (g.acquired_credits || 0), 0);

  // 평균 평점 계산
  const validGrades = grades.filter(g => g.gpa && g.gpa > 0);
  const averageGpa = validGrades.length > 0
    ? validGrades.reduce((sum, g) => sum + (g.gpa || 0), 0) / validGrades.length
    : 0;

  return { student, courses, grades, activities, totalCredits, averageGpa };
}

/**
 * 학과별 학생 목록 조회
 */
export async function getStudentsByDepartment(department: string): Promise<StudentData[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('department', `%${department}%`)
      .order('grade', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get students by department:', error);
    return [];
  }
}

// ===== Major Courses Types and Functions =====

export interface MajorCourse {
  id?: number;
  college: string;
  department: string;
  major: string;
  course_name: string;
}

// 학과명 → major_courses의 (department, major) 매핑
// DB major_courses 테이블의 실제 값과 일치해야 함
const DEPARTMENT_MAPPING: Record<string, { department: string; major: string }> = {
  // 인문대학 (DB에 '전전공'으로 저장됨)
  '중어중문학과': { department: '아시아·중동어문학부', major: '중어중문학전전공' },
  '중어중문학전공': { department: '아시아·중동어문학부', major: '중어중문학전전공' },
  '일어일문학과': { department: '아시아·중동어문학부', major: '일어일문학전전공' },
  '일어일문학전공': { department: '아시아·중동어문학부', major: '일어일문학전전공' },
  '아랍지역학과': { department: '아시아·중동어문학부', major: '아랍지역학전전공' },
  '아랍지역학전공': { department: '아시아·중동어문학부', major: '아랍지역학전전공' },
  '국어국문학과': { department: '인문콘텐츠학부', major: '국어국문학전공' },
  '국어국문학전공': { department: '인문콘텐츠학부', major: '국어국문학전공' },
  '영어영문학과': { department: '인문콘텐츠학부', major: '영어영문학전공' },
  '영어영문학전공': { department: '인문콘텐츠학부', major: '영어영문학전공' },
  '문헌정보학과': { department: '인문콘텐츠학부', major: '문헌정보학전공' },
  '문헌정보학전공': { department: '인문콘텐츠학부', major: '문헌정보학전공' },
  '문예창작학과': { department: '문예창작학과', major: '' },
  // 사회과학대학
  '행정학과': { department: '공공인재학부', major: '행정학전공' },
  '행정학전공': { department: '공공인재학부', major: '행정학전공' },
  '정치외교학과': { department: '공공인재학부', major: '정치외교학전공' },
  '정치외교학전공': { department: '공공인재학부', major: '정치외교학전공' },
  '경제학과': { department: '경상·통계학부', major: '경제학전공' },
  '경제학전공': { department: '경상·통계학부', major: '경제학전공' },
  '법학과': { department: '법학과', major: '' },
  // 경영대학 (DB에 없음, CSV 폴백)
  '경영학과': { department: '경영학부', major: '경영학전공' },
  '경영정보학과': { department: '경영정보학과', major: '' },
  // 미디어·휴먼라이프대학
  '디지털미디어학과': { department: '디지털미디어학부', major: '' },
  '디지털미디어학부': { department: '디지털미디어학부', major: '' },
  '청소년지도학과': { department: '청소년지도·아동학부', major: '청소년지도학' }, // DB: 청소년지도학 (전공 없음)
  '청소년지도학전공': { department: '청소년지도·아동학부', major: '청소년지도학' },
  '아동학과': { department: '청소년지도·아동학부', major: '아동학전공' },
  '아동학전공': { department: '청소년지도·아동학부', major: '아동학전공' },
  // 인공지능·소프트웨어융합대학 (DB: '전공' 없이 저장됨)
  '응용소프트웨어학과': { department: '융합소프트웨어학부', major: '응용소프트웨어' },
  '응용소프트웨어전공': { department: '융합소프트웨어학부', major: '응용소프트웨어' },
  '데이터사이언스학과': { department: '융합소프트웨어학부', major: '데이터사이언스' },
  '데이터사이언스전공': { department: '융합소프트웨어학부', major: '데이터사이언스' },
  '디지털콘텐츠디자인학과': { department: '디지털콘텐츠디자인학과', major: '' },
  '디지털콘텐츠디자인전공': { department: '디지털콘텐츠디자인학과', major: '' },
  // 화학·생명과학대학 (DB: '전전공'으로 저장됨)
  '화학나노학과': { department: '화학·에너지융합학부', major: '화학나노학전전공' },
  '화학나노학전공': { department: '화학·에너지융합학부', major: '화학나노학전전공' },
  '식품영양학과': { department: '융합바이오학부', major: '식품영양학전공' },
  '식품영양학전공': { department: '융합바이오학부', major: '식품영양학전공' },
  '시스템생명과학과': { department: '융합바이오학부', major: '시스템생명과학전공' },
  '시스템생명과학전공': { department: '융합바이오학부', major: '시스템생명과학전공' },
};

/**
 * 학과명을 major_courses의 department/major로 변환
 */
export function mapStudentDepartment(studentDepartment: string): { department: string; major: string } | null {
  // 정확히 매칭되면 반환
  if (DEPARTMENT_MAPPING[studentDepartment]) {
    return DEPARTMENT_MAPPING[studentDepartment];
  }

  // 부분 매칭 시도 (예: '경영학과' → '경영학부')
  for (const [key, value] of Object.entries(DEPARTMENT_MAPPING)) {
    if (studentDepartment.includes(key.replace('학과', '').replace('과', '')) ||
        key.includes(studentDepartment.replace('학과', '').replace('과', ''))) {
      return value;
    }
  }

  return null;
}

/**
 * 전공별 교과목 조회
 */
export async function getMajorCourses(department: string, major?: string): Promise<MajorCourse[]> {
  try {
    let query = supabase
      .from('major_courses')
      .select('*')
      .eq('department', department);

    if (major) {
      query = query.eq('major', major);
    }

    const { data, error } = await query.order('course_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get major courses:', error);
    return [];
  }
}

/**
 * 학생의 학과에 맞는 교과목 목록 조회
 */
export async function getCoursesForStudent(studentDepartment: string): Promise<MajorCourse[]> {
  const mapping = mapStudentDepartment(studentDepartment);
  if (!mapping) {
    console.warn(`No mapping found for department: ${studentDepartment}`);
    return [];
  }

  return getMajorCourses(mapping.department, mapping.major || undefined);
}

/**
 * 학생에게 전공 교과목 할당 (student_courses에 추가)
 */
export async function assignCoursesToStudent(
  studentId: string,
  courses: MajorCourse[],
  options?: {
    year?: number;
    semester?: number;
    credits?: number;
    grade?: string;
    completionType?: string;
  }
): Promise<{ success: number; failed: number }> {
  const year = options?.year || new Date().getFullYear();
  const semester = options?.semester || 1;
  let success = 0;
  let failed = 0;

  for (const course of courses) {
    try {
      const { error } = await supabase
        .from('student_courses')
        .insert({
          student_id: studentId,
          year,
          semester,
          course_number: `MC${String(Math.random()).slice(2, 8)}`, // 임시 과목코드
          course_name: course.course_name,
          completion_type: options?.completionType || '전필',
          credits: options?.credits || 3,
          grade: options?.grade || null,
          professor: null
        });

      if (error) {
        console.error(`Failed to assign course ${course.course_name}:`, error);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      console.error(`Error assigning course ${course.course_name}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * 학생의 이수한 과목과 전공 교과목 비교
 */
export async function compareStudentCoursesWithMajor(studentId: string): Promise<{
  completed: string[];
  remaining: string[];
  completionRate: number;
}> {
  // 학생 정보 조회
  const student = await getStudentByStudentId(studentId);
  if (!student || !student.department) {
    return { completed: [], remaining: [], completionRate: 0 };
  }

  // 학생의 수강 이력 조회
  const studentCourses = await getStudentCourses(studentId);
  const completedCourseNames = new Set(studentCourses.map(c => c.course_name));

  // 전공 교과목 목록 조회
  const majorCourses = await getCoursesForStudent(student.department);
  const majorCourseNames = majorCourses.map(c => c.course_name);

  // 비교
  const completed = majorCourseNames.filter(name => completedCourseNames.has(name));
  const remaining = majorCourseNames.filter(name => !completedCourseNames.has(name));
  const completionRate = majorCourseNames.length > 0
    ? (completed.length / majorCourseNames.length) * 100
    : 0;

  return { completed, remaining, completionRate };
}

/**
 * 전체 학생에게 랜덤 교과목 할당 (테스트용)
 */
export async function assignRandomCoursesToAllStudents(
  coursesPerStudent: number = 5,
  options?: { year?: number; semester?: number }
): Promise<{ totalStudents: number; totalCourses: number }> {
  try {
    // 모든 학생 조회
    const { data: students, error } = await supabase
      .from('students')
      .select('student_id, department');

    if (error) throw error;
    if (!students || students.length === 0) return { totalStudents: 0, totalCourses: 0 };

    let totalCourses = 0;

    for (const student of students) {
      if (!student.department || student.department === '무전공') continue;

      const majorCourses = await getCoursesForStudent(student.department);
      if (majorCourses.length === 0) continue;

      // 랜덤으로 coursesPerStudent개 선택
      const shuffled = [...majorCourses].sort(() => Math.random() - 0.5);
      const selectedCourses = shuffled.slice(0, Math.min(coursesPerStudent, shuffled.length));

      const grades = ['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0'];
      const result = await assignCoursesToStudent(student.student_id, selectedCourses, {
        year: options?.year || new Date().getFullYear(),
        semester: options?.semester || 1,
        grade: grades[Math.floor(Math.random() * grades.length)],
        completionType: '전필'
      });

      totalCourses += result.success;
    }

    return { totalStudents: students.length, totalCourses };
  } catch (error) {
    console.error('Failed to assign random courses:', error);
    return { totalStudents: 0, totalCourses: 0 };
  }
}

// ==================== 핵심역량진단 관련 ====================

export interface CompetencyResult {
  id?: number;
  code: string;
  student_id?: string;
  answers: Record<string, number>;
  scores: {
    convergence: number;
    practical: number;
    creative: number;
    selfDirected: number;
    harmony: number;
    care: number;
    total: number;
  };
  created_at: string;
}

/**
 * 핵심역량진단 결과 저장
 */
export async function saveCompetencyResult(
  code: string,
  options: {
    studentId?: string;
    answers: Record<string, number>;
    scores: {
      convergence: number;
      practical: number;
      creative: number;
      selfDirected: number;
      harmony: number;
      care: number;
      total: number;
    };
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('competency_results')
      .upsert({
        code,
        student_id: options.studentId || null,
        answers: options.answers,
        scores: options.scores,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'code'
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to save competency result:', error);
    throw error;
  }
}

/**
 * 학생 ID로 핵심역량진단 결과 조회
 */
export async function getCompetencyResultByStudentId(studentId: string): Promise<CompetencyResult | null> {
  try {
    const { data, error } = await supabase
      .from('competency_results')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      code: data.code,
      student_id: data.student_id,
      answers: data.answers,
      scores: data.scores,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Failed to get competency result by student_id:', error);
    return null;
  }
}

// ============================================
// 전공능력진단 (Major Assessment) 관련 함수
// ============================================

export interface MajorAssessment {
  id?: string;
  student_id: string;
  major_key: string;
  major_name: string;
  answers: Record<string, number>;
  avg_score: number;
  completion_percentage: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 전공능력진단 결과 저장 (Upsert)
 */
export async function saveMajorAssessment(assessment: Omit<MajorAssessment, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('major_assessments')
      .upsert({
        student_id: assessment.student_id,
        major_key: assessment.major_key,
        major_name: assessment.major_name,
        answers: assessment.answers,
        avg_score: assessment.avg_score,
        completion_percentage: assessment.completion_percentage,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id,major_key'
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to save major assessment:', error);
    throw error;
  }
}

/**
 * 학생의 모든 전공능력진단 결과 조회
 */
export async function getMajorAssessmentsByStudentId(studentId: string): Promise<MajorAssessment[]> {
  try {
    const { data, error } = await supabase
      .from('major_assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get major assessments:', error);
    return [];
  }
}

/**
 * 특정 전공의 진단 결과 조회
 */
export async function getMajorAssessment(studentId: string, majorKey: string): Promise<MajorAssessment | null> {
  try {
    const { data, error } = await supabase
      .from('major_assessments')
      .select('*')
      .eq('student_id', studentId)
      .eq('major_key', majorKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get major assessment:', error);
    return null;
  }
}

/**
 * 전공능력진단 결과 삭제
 */
export async function deleteMajorAssessment(studentId: string, majorKey: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('major_assessments')
      .delete()
      .eq('student_id', studentId)
      .eq('major_key', majorKey);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete major assessment:', error);
    return false;
  }
}

// ============================================
// 커리큘럼 플랜 (Curriculum Plans) 관련 함수
// ============================================

export interface CurriculumPlan {
  id?: string;
  student_id: string;
  name: string;
  major_name: string;
  semesters: { [key: string]: string[] }; // { "1-1": ["courseNum1", "courseNum2"], ... }
  created_at?: string;
  updated_at?: string;
}

/**
 * 커리큘럼 플랜 저장 (Upsert)
 */
export async function saveCurriculumPlan(plan: Omit<CurriculumPlan, 'id' | 'created_at' | 'updated_at'>): Promise<CurriculumPlan | null> {
  try {
    const { data, error } = await supabase
      .from('curriculum_plans')
      .upsert({
        student_id: plan.student_id,
        name: plan.name,
        major_name: plan.major_name,
        semesters: plan.semesters,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id,name,major_name'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save curriculum plan:', error);
    return null;
  }
}

/**
 * 학생의 모든 커리큘럼 플랜 조회
 */
export async function getCurriculumPlansByStudentId(studentId: string): Promise<CurriculumPlan[]> {
  try {
    const { data, error } = await supabase
      .from('curriculum_plans')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get curriculum plans:', error);
    return [];
  }
}

/**
 * 특정 커리큘럼 플랜 조회
 */
export async function getCurriculumPlan(studentId: string, name: string, majorName: string): Promise<CurriculumPlan | null> {
  try {
    const { data, error } = await supabase
      .from('curriculum_plans')
      .select('*')
      .eq('student_id', studentId)
      .eq('name', name)
      .eq('major_name', majorName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get curriculum plan:', error);
    return null;
  }
}

/**
 * 커리큘럼 플랜 삭제
 */
export async function deleteCurriculumPlan(studentId: string, name: string, majorName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('curriculum_plans')
      .delete()
      .eq('student_id', studentId)
      .eq('name', name)
      .eq('major_name', majorName);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete curriculum plan:', error);
    return false;
  }
}

// ============================================
// 나만의 전공 조합 (Custom Major Plans) 관련 함수
// ============================================

export interface CustomMajorPlanDB {
  id?: string;
  student_id: string;
  name: string;
  primary_major: string;
  secondary_major?: string;
  minor_major?: string;
  created_at?: string;
}

/**
 * 나만의 전공 조합 저장
 */
export async function saveCustomMajorPlan(plan: Omit<CustomMajorPlanDB, 'id' | 'created_at'>): Promise<CustomMajorPlanDB | null> {
  try {
    const { data, error } = await supabase
      .from('custom_major_plans')
      .upsert({
        student_id: plan.student_id,
        name: plan.name,
        primary_major: plan.primary_major,
        secondary_major: plan.secondary_major || null,
        minor_major: plan.minor_major || null,
      }, {
        onConflict: 'student_id,name'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save custom major plan:', error);
    return null;
  }
}

/**
 * 학생의 모든 나만의 전공 조합 조회
 */
export async function getCustomMajorPlansByStudentId(studentId: string): Promise<CustomMajorPlanDB[]> {
  try {
    const { data, error } = await supabase
      .from('custom_major_plans')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get custom major plans:', error);
    return [];
  }
}

/**
 * 나만의 전공 조합 삭제
 */
export async function deleteCustomMajorPlan(studentId: string, name: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('custom_major_plans')
      .delete()
      .eq('student_id', studentId)
      .eq('name', name);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete custom major plan:', error);
    return false;
  }
}

// ============================================
// 롤모델 선택 (Rolemodel Selections) 관련 함수
// ============================================

export interface RolemodelSelection {
  id?: string;
  student_id: string;
  selected_graduate_ids: number[];
  selected_majors: string[];
  has_explored: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * 롤모델 선택 저장 (Upsert)
 */
export async function saveRolemodelSelection(
  studentId: string,
  selectedGraduateIds: number[],
  hasExplored: boolean = false,
  selectedMajors: string[] = []
): Promise<RolemodelSelection | null> {
  try {
    const { data, error } = await supabase
      .from('rolemodel_selections')
      .upsert({
        student_id: studentId,
        selected_graduate_ids: selectedGraduateIds,
        selected_majors: selectedMajors,
        has_explored: hasExplored,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save rolemodel selection:', error);
    return null;
  }
}

/**
 * 학생의 롤모델 선택 조회
 */
export async function getRolemodelSelectionByStudentId(studentId: string): Promise<RolemodelSelection | null> {
  try {
    const { data, error } = await supabase
      .from('rolemodel_selections')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get rolemodel selection:', error);
    return null;
  }
}

// ============================================
// 브릿지 상태 (Step Bridge Status) 관련 함수
// ============================================

export type StepBridgeType = '1to2' | '2to3' | '3to4' | '4to5';

/**
 * 학생의 본 브릿지 목록 조회
 */
export async function getSeenBridges(studentId: string): Promise<StepBridgeType[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('seen_bridges')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return [];
      throw error;
    }

    return (data?.seen_bridges as StepBridgeType[]) || [];
  } catch (error) {
    console.error('Failed to get seen bridges:', error);
    return [];
  }
}

/**
 * 브릿지를 봤음으로 마킹
 */
export async function markBridgeSeen(studentId: string, bridge: StepBridgeType): Promise<boolean> {
  try {
    // 현재 본 브릿지 목록 조회
    const currentBridges = await getSeenBridges(studentId);

    // 이미 본 브릿지면 스킵
    if (currentBridges.includes(bridge)) return true;

    // 새 브릿지 추가
    const newBridges = [...currentBridges, bridge];

    const { error } = await supabase
      .from('students')
      .update({ seen_bridges: newBridges })
      .eq('student_id', studentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to mark bridge seen:', error);
    return false;
  }
}

/**
 * 학생의 브릿지 상태 초기화 (테스트용)
 */
export async function resetSeenBridges(studentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('students')
      .update({ seen_bridges: [] })
      .eq('student_id', studentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to reset seen bridges:', error);
    return false;
  }
}
