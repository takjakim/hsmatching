/**
 * 외부 시스템(myicap)에서 전달받은 암호화된 학번 토큰 처리
 *
 * 사용법:
 * URL: https://e-advisor.vercel.app/pilot?token=암호화된학번
 *
 * 이니스트 측에서 암호화 알고리즘/키 공유 후 실제 복호화 로직으로 교체 필요
 */

// 테스트용 비밀키 (실제 운영 시 환경변수로 관리)
const TEST_SECRET_KEY = 'mju-eadvisor-test-key-2024';

/**
 * Base64 URL-safe 디코딩
 */
function base64UrlDecode(str: string): string {
  // URL-safe base64 → 일반 base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 패딩 추가
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * 테스트용 간단한 XOR 복호화 (실제 운영 시 AES로 교체)
 * 이니스트 측 암호화 방식에 맞춰 수정 필요
 */
function xorDecrypt(encrypted: string, key: string): string {
  const decoded = base64UrlDecode(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * 테스트용 XOR 암호화 (테스트 URL 생성용)
 */
export function encryptStudentId(studentId: string, key: string = TEST_SECRET_KEY): string {
  let encrypted = '';
  for (let i = 0; i < studentId.length; i++) {
    encrypted += String.fromCharCode(
      studentId.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  // URL-safe base64 인코딩
  const base64 = btoa(encrypted);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * URL 토큰에서 학번 추출
 * @param token - URL 파라미터로 전달받은 암호화된 토큰
 * @returns 복호화된 학번 또는 null
 */
export function decryptStudentIdFromToken(token: string): string | null {
  try {
    const decrypted = xorDecrypt(token, TEST_SECRET_KEY);

    // 학번 형식 검증 (숫자 8-12자리)
    if (/^\d{8,12}$/.test(decrypted)) {
      return decrypted;
    }

    console.warn('복호화된 값이 학번 형식이 아닙니다:', decrypted);
    return null;
  } catch (error) {
    console.error('토큰 복호화 실패:', error);
    return null;
  }
}

/**
 * URL에서 토큰 파라미터 추출 및 학번 반환
 */
export function getStudentIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    return null;
  }

  return decryptStudentIdFromToken(token);
}

/**
 * 테스트용 URL 생성
 * @param studentId - 학번
 * @returns 테스트용 전체 URL
 */
export function generateTestUrl(studentId: string): string {
  const token = encryptStudentId(studentId);
  return `https://e-advisor.vercel.app/pilot?token=${token}`;
}
