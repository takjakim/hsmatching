// 결과 코드 생성 및 관리 유틸리티
import { collectDeviceInfo, DeviceInfo } from "./deviceInfo";

// 데이터베이스 사용 여부 (환경 변수로 제어)
const USE_DATABASE = import.meta.env.VITE_USE_DATABASE === 'true';

/**
 * 랜덤 코드 생성 (6자리 이상)
 */
export function generateResultCode(): string {
  // 영문 대소문자 + 숫자 조합으로 8자리 코드 생성
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 결과를 코드와 함께 저장 (데이터베이스 또는 localStorage)
 */
export async function saveResultWithCode(result: any, code: string): Promise<void> {
  // 기기 정보 수집
  const deviceInfo = collectDeviceInfo();
  
  const resultData = {
    code,
    result,
    deviceInfo, // 기기 정보 추가
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90일 후 만료
  };
  
  if (USE_DATABASE) {
    // 데이터베이스에 저장
    try {
      const response = await fetch('/api/results/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          result,
          deviceInfo
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to database');
      }
      
      // 성공 시 localStorage에도 백업 저장 (선택사항)
      // localStorage.setItem(`result_${code}`, JSON.stringify(resultData));
    } catch (error) {
      console.error('Database save failed, falling back to localStorage:', error);
      // 실패 시 localStorage에 저장
      localStorage.setItem(`result_${code}`, JSON.stringify(resultData));
      
      const codeList = await getCodeList();
      codeList.unshift({ code, createdAt: resultData.createdAt });
      if (codeList.length > 100) {
        codeList.pop();
      }
      localStorage.setItem('result_codes', JSON.stringify(codeList));
    }
  } else {
    // localStorage에 저장 (기존 방식)
    localStorage.setItem(`result_${code}`, JSON.stringify(resultData));
    
      const codeList = await getCodeList();
      codeList.unshift({ code, createdAt: resultData.createdAt });
      if (codeList.length > 100) {
        codeList.pop();
      }
      localStorage.setItem('result_codes', JSON.stringify(codeList));
  }
}

/**
 * 코드로 결과 조회 (데이터베이스 또는 localStorage)
 */
export async function getResultByCode(code: string): Promise<any | null> {
  if (USE_DATABASE) {
    try {
      const response = await fetch(`/api/results/get?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch from database');
      }
      
      const data = await response.json();
      return data.data?.result || null;
    } catch (error) {
      console.error('Database fetch failed, falling back to localStorage:', error);
      // 실패 시 localStorage에서 조회
      return getResultByCodeLocalStorage(code);
    }
  } else {
    return getResultByCodeLocalStorage(code);
  }
}

/**
 * localStorage에서 결과 조회 (내부 함수)
 */
function getResultByCodeLocalStorage(code: string): any | null {
  const data = localStorage.getItem(`result_${code}`);
  if (!data) return null;
  
  try {
    const resultData = JSON.parse(data);
    
    // 만료 확인
    if (new Date(resultData.expiresAt) < new Date()) {
      localStorage.removeItem(`result_${code}`);
      return null;
    }
    
    return resultData.result;
  } catch (e) {
    console.error('Failed to parse result data', e);
    return null;
  }
}

/**
 * 코드로 전체 데이터 조회 (기기 정보 포함)
 */
export async function getFullResultByCode(code: string): Promise<any | null> {
  if (USE_DATABASE) {
    try {
      const response = await fetch(`/api/results/get?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch from database');
      }
      
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Database fetch failed, falling back to localStorage:', error);
      // 실패 시 localStorage에서 조회
      return getFullResultByCodeLocalStorage(code);
    }
  } else {
    return getFullResultByCodeLocalStorage(code);
  }
}

/**
 * localStorage에서 전체 데이터 조회 (내부 함수)
 */
function getFullResultByCodeLocalStorage(code: string): any | null {
  const data = localStorage.getItem(`result_${code}`);
  if (!data) return null;
  
  try {
    const resultData = JSON.parse(data);
    
    // 만료 확인
    if (new Date(resultData.expiresAt) < new Date()) {
      localStorage.removeItem(`result_${code}`);
      return null;
    }
    
    return resultData;
  } catch (e) {
    console.error('Failed to parse result data', e);
    return null;
  }
}

/**
 * 코드 목록 조회 (데이터베이스 또는 localStorage)
 */
export async function getCodeList(): Promise<Array<{ code: string; createdAt: string }>> {
  if (USE_DATABASE) {
    try {
      const response = await fetch('/api/results/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch code list from database');
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Database fetch failed, falling back to localStorage:', error);
      // 실패 시 localStorage에서 조회
      return getCodeListLocalStorage();
    }
  } else {
    return getCodeListLocalStorage();
  }
}

/**
 * localStorage에서 코드 목록 조회 (내부 함수)
 */
function getCodeListLocalStorage(): Array<{ code: string; createdAt: string }> {
  const data = localStorage.getItem('result_codes');
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

/**
 * 코드 유효성 검사
 */
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{6,}$/.test(code);
}







