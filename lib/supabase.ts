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

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
