// 기기 정보 수집 유틸리티
// 참고: 브라우저 보안상 MAC 주소는 직접 가져올 수 없습니다.

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  timezoneOffset: number;
  cookieEnabled: boolean;
  onLine: boolean;
  hardwareConcurrency?: number; // CPU 코어 수
  deviceMemory?: number; // RAM (GB)
  // 브라우저 지문 (기기 식별용)
  fingerprint: string;
}

/**
 * 기기 정보 수집
 */
export function collectDeviceInfo(): DeviceInfo {
  const nav = navigator;
  const screen = window.screen;
  
  // 브라우저 지문 생성 (기기 식별용)
  const fingerprint = generateFingerprint();
  
  return {
    userAgent: nav.userAgent,
    platform: nav.platform || 'unknown',
    language: nav.language || 'unknown',
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cookieEnabled: nav.cookieEnabled,
    onLine: nav.onLine,
    hardwareConcurrency: (nav as any).hardwareConcurrency,
    deviceMemory: (nav as any).deviceMemory,
    fingerprint
  };
}

/**
 * 브라우저 지문 생성 (기기 식별용)
 * MAC 주소는 불가능하지만, 여러 정보를 조합하여 고유 식별자 생성
 */
function generateFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  
  const components = [
    nav.userAgent,
    nav.platform,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.cookieEnabled ? '1' : '0',
    (nav as any).hardwareConcurrency || '0',
    (nav as any).deviceMemory || '0',
    nav.maxTouchPoints || '0'
  ];
  
  // 간단한 해시 생성
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  
  return Math.abs(hash).toString(36).substring(0, 12).toUpperCase();
}

/**
 * 기기 정보를 읽기 쉬운 형식으로 변환
 */
export function formatDeviceInfo(info: DeviceInfo): {
  browser: string;
  os: string;
  device: string;
  screen: string;
  other: string;
} {
  // 브라우저 감지
  let browser = 'Unknown';
  if (info.userAgent.includes('Chrome') && !info.userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (info.userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (info.userAgent.includes('Safari') && !info.userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (info.userAgent.includes('Edg')) {
    browser = 'Edge';
  }
  
  // OS 감지
  let os = 'Unknown';
  if (info.userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (info.userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (info.userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (info.userAgent.includes('Android')) {
    os = 'Android';
  } else if (info.userAgent.includes('iOS') || info.userAgent.includes('iPhone') || info.userAgent.includes('iPad')) {
    os = 'iOS';
  }
  
  // 기기 타입 감지
  let device = 'Desktop';
  if (info.userAgent.includes('Mobile')) {
    device = 'Mobile';
  } else if (info.userAgent.includes('Tablet') || info.userAgent.includes('iPad')) {
    device = 'Tablet';
  }
  
  const screen = `${info.screenWidth}x${info.screenHeight}`;
  const other = `언어: ${info.language}, 타임존: ${info.timezone}`;
  
  return { browser, os, device, screen, other };
}






