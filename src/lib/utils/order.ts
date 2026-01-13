/**
 * 주문번호 생성 유틸리티
 * 형식: SP + MMDD + 랜덤 4자리 (예: SP0113A7K2)
 */

export function generateOrderNumber(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // 랜덤 4자리 (영문+숫자)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 문자 제외 (0,O,1,I)
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `SP${month}${day}${random}`;
}

/**
 * 주문번호 유효성 검사
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  return /^SP\d{4}[A-Z0-9]{4}$/.test(orderNumber);
}
