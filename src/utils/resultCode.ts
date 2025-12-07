// 결과 코드 생성 및 관리 유틸리티
import { collectDeviceInfo, DeviceInfo } from "./deviceInfo";

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
 * 결과를 코드와 함께 저장
 */
export function saveResultWithCode(result: any, code: string): void {
  // 기기 정보 수집
  const deviceInfo = collectDeviceInfo();
  
  const resultData = {
    code,
    result,
    deviceInfo, // 기기 정보 추가
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90일 후 만료
  };
  
  // 코드로 결과 저장
  localStorage.setItem(`result_${code}`, JSON.stringify(resultData));
  
  // 코드 목록에 추가 (최근 100개만 유지)
  const codeList = getCodeList();
  codeList.unshift({ code, createdAt: resultData.createdAt });
  if (codeList.length > 100) {
    codeList.pop();
  }
  localStorage.setItem('result_codes', JSON.stringify(codeList));
}

/**
 * 코드로 결과 조회
 */
export function getResultByCode(code: string): any | null {
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
export function getFullResultByCode(code: string): any | null {
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
 * 코드 목록 조회
 */
export function getCodeList(): Array<{ code: string; createdAt: string }> {
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
