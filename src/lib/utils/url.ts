/**
 * HTTP URL을 HTTPS로 변환합니다.
 * Mixed Content 경고를 방지하기 위해 사용됩니다.
 */
export function ensureHttps(url: string | null | undefined): string | null {
  if (!url) return null;

  // 이미 HTTPS이거나 상대 경로인 경우 그대로 반환
  if (url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }

  // HTTP를 HTTPS로 변환
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
}

/**
 * 프로필 이미지 URL을 안전하게 가져옵니다.
 * Kakao 등 외부 서비스의 HTTP URL을 HTTPS로 변환합니다.
 */
export function getSecureImageUrl(url: string | null | undefined): string | null {
  return ensureHttps(url);
}
