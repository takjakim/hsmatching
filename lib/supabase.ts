// Supabase 클라이언트 생성
import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 키 가져오기
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      expiresAt: data.expires_at
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
      createdAt: row.created_at
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
      deviceInfo: row.device_info,
      createdAt: row.created_at,
      expiresAt: row.expires_at
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
