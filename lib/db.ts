// Vercel Postgres 데이터베이스 연결 유틸리티
import { sql } from '@vercel/postgres';

// 환경 변수 확인
if (!process.env.POSTGRES_URL) {
  console.warn('POSTGRES_URL is not set. Database functions will fail.');
}

export interface TestResult {
  id?: number;
  code: string;
  result: any;
  deviceInfo?: any;
  createdAt: string;
  expiresAt: string;
}

export interface ResultCode {
  code: string;
  createdAt: string;
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
    // JSONB 타입으로 저장 (Vercel Postgres는 자동으로 JSON 파싱)
    const resultJson = typeof result === 'string' ? result : JSON.stringify(result);
    const deviceInfoJson = deviceInfo ? (typeof deviceInfo === 'string' ? deviceInfo : JSON.stringify(deviceInfo)) : '{}';
    
    // 두 테이블에 동시 저장
    await sql`
      INSERT INTO test_results (code, result, device_info, expires_at)
      VALUES (${code}, ${resultJson}::jsonb, ${deviceInfoJson}::jsonb, ${expiresAt}::timestamp)
      ON CONFLICT (code) DO UPDATE SET
        result = EXCLUDED.result,
        device_info = EXCLUDED.device_info,
        expires_at = EXCLUDED.expires_at
    `;
    
    await sql`
      INSERT INTO result_codes (code, created_at)
      VALUES (${code}, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE SET created_at = CURRENT_TIMESTAMP
    `;
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
    const result = await sql`
      SELECT code, result, device_info, created_at, expires_at
      FROM test_results
      WHERE code = ${code}
        AND expires_at > CURRENT_TIMESTAMP
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      code: row.code,
      result: row.result,
      deviceInfo: row.device_info,
      createdAt: row.created_at,
      expiresAt: row.expires_at
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
    const result = await sql`
      SELECT code, created_at
      FROM result_codes
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    
    return result.rows.map(row => ({
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
    const result = await sql`
      SELECT code, result, device_info, created_at, expires_at
      FROM test_results
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    
    return result.rows.map(row => ({
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
    const result = await sql`
      DELETE FROM test_results
      WHERE expires_at < CURRENT_TIMESTAMP
    `;
    
    return result.rowCount || 0;
  } catch (error) {
    console.error('Failed to delete expired results:', error);
    return 0;
  }
}
