/**
 * 외부 시스템(이니스트/myicap)에서 전달받은 사용자 정보 처리
 *
 * 사용법 1 - 암호화된 토큰:
 * URL: https://e-advisor.vercel.app/pilot?token=암호화된JSON
 * JSON 형식: {"name":"홍길동","studentId":"60211234","email":"hong@mju.ac.kr"}
 *
 * 사용법 2 - 개별 파라미터 (Base64 인코딩):
 * URL: https://e-advisor.vercel.app/pilot?name=홍길동&studentId=60211234&email=hong@mju.ac.kr
 *
 * 사용법 3 - 개별 파라미터 (Base64 인코딩):
 * URL: https://e-advisor.vercel.app/pilot?n=base64(이름)&s=base64(학번)&e=base64(이메일)
 */

// 테스트용 비밀키 (실제 운영 시 환경변수로 관리)
const TEST_SECRET_KEY = 'mju-eadvisor-test-key-2024';

// 사용자 정보 인터페이스
export interface UserInfo {
  name: string;
  studentId: string;
  email: string;
}

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
 * 테스트용 URL 생성 (학번만)
 * @param studentId - 학번
 * @returns 테스트용 전체 URL
 */
export function generateTestUrl(studentId: string): string {
  const token = encryptStudentId(studentId);
  return `https://e-advisor.vercel.app/pilot?token=${token}`;
}

/**
 * URL에서 사용자 정보 추출 (이니스트 SSO 연동)
 * 지원 형식:
 * 1. 개별 파라미터: ?name=홍길동&studentId=60211234&email=hong@mju.ac.kr
 * 2. Base64 인코딩: ?n=7ZmN6ri464-Z&s=NjAyMTEyMzQ&e=aG9uZ0BtanUuYWMua3I
 * 3. 암호화된 토큰: ?token=암호화된JSON (기존 방식 호환)
 */
export function getUserInfoFromUrl(): UserInfo | null {
  const urlParams = new URLSearchParams(window.location.search);

  // 방법 1: 개별 파라미터 (평문)
  const name = urlParams.get('name');
  const studentId = urlParams.get('studentId') || urlParams.get('student_id');
  const email = urlParams.get('email');

  if (name && studentId && email) {
    console.log('[TokenAuth] URL 파라미터에서 사용자 정보 추출:', { name, studentId, email });
    return { name, studentId, email };
  }

  // 방법 2: Base64 인코딩된 파라미터
  const n = urlParams.get('n');
  const s = urlParams.get('s');
  const e = urlParams.get('e');

  if (n && s && e) {
    try {
      const decodedName = decodeURIComponent(atob(n));
      const decodedStudentId = decodeURIComponent(atob(s));
      const decodedEmail = decodeURIComponent(atob(e));
      console.log('[TokenAuth] Base64 파라미터에서 사용자 정보 추출:', {
        name: decodedName,
        studentId: decodedStudentId,
        email: decodedEmail
      });
      return { name: decodedName, studentId: decodedStudentId, email: decodedEmail };
    } catch (error) {
      console.error('[TokenAuth] Base64 디코딩 실패:', error);
    }
  }

  // 방법 3: 암호화된 JSON 토큰
  const token = urlParams.get('token');
  if (token) {
    try {
      const decrypted = xorDecrypt(token, TEST_SECRET_KEY);

      // JSON 파싱 시도
      try {
        const parsed = JSON.parse(decrypted);
        if (parsed.name && parsed.studentId && parsed.email) {
          console.log('[TokenAuth] 암호화된 토큰에서 사용자 정보 추출:', parsed);
          return parsed as UserInfo;
        }
      } catch {
        // JSON이 아니면 학번만 있는 기존 형식
        if (/^\d{8,12}$/.test(decrypted)) {
          console.log('[TokenAuth] 기존 토큰 형식 (학번만):', decrypted);
          return { name: '', studentId: decrypted, email: '' };
        }
      }
    } catch (error) {
      console.error('[TokenAuth] 토큰 복호화 실패:', error);
    }
  }

  return null;
}

/**
 * 테스트용 URL 생성 (전체 사용자 정보)
 */
export function generateTestUrlWithUserInfo(userInfo: UserInfo): string {
  const params = new URLSearchParams({
    name: userInfo.name,
    studentId: userInfo.studentId,
    email: userInfo.email,
  });
  return `https://e-advisor.vercel.app/pilot?${params.toString()}`;
}

/**
 * 테스트용 URL 생성 (Base64 인코딩)
 */
export function generateBase64Url(userInfo: UserInfo): string {
  const n = btoa(encodeURIComponent(userInfo.name));
  const s = btoa(encodeURIComponent(userInfo.studentId));
  const e = btoa(encodeURIComponent(userInfo.email));
  return `https://e-advisor.vercel.app/pilot?n=${n}&s=${s}&e=${e}`;
}
