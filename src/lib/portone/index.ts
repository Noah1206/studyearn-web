/**
 * PortOne V2 Payment Library
 * 포트원 결제 연동 라이브러리
 *
 * @example Client-side (결제 요청)
 * ```typescript
 * import { requestCardPayment, generatePaymentId } from '@/lib/portone/client';
 *
 * const paymentId = generatePaymentId();
 * const result = await requestCardPayment(
 *   paymentId,
 *   '스터플 콘텐츠 구매',
 *   10000,
 *   { fullName: '홍길동', phoneNumber: '01012345678' }
 * );
 *
 * if (result.success) {
 *   // 서버에서 검증
 *   await verifyPaymentOnServer(result.paymentId);
 * }
 * ```
 *
 * @example Server-side (결제 검증)
 * ```typescript
 * import { verifyPayment, cancelPayment } from '@/lib/portone/server';
 *
 * const { verified, payment, error } = await verifyPayment(paymentId, expectedAmount);
 * if (verified) {
 *   // 결제 성공 처리
 * }
 * ```
 */

// Client-side exports (브라우저에서만 사용)
export {
  requestPayment,
  requestCardPayment,
  requestVirtualAccountPayment,
  requestKakaoPayPayment,
  generatePaymentId,
  type PayMethod,
  type EasyPayProvider,
  type PaymentCustomer,
  type PaymentRequest,
  type PaymentResponse,
} from './client';

// Server-side exports (API routes에서만 사용)
export {
  getPayment,
  verifyPayment,
  cancelPayment,
  mapPaymentStatusToPurchaseStatus,
  PortOneApiError,
  type PortOnePayment,
  type PortOneWebhookPayload,
} from './server';
