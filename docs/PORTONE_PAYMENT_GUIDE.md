# 스터플 포트원 결제 연동 가이드

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| 플랫폼명 | 스터플 (StudyEarn) |
| 사업자등록번호 | 508-14-52353 |
| 상호명 | 현웅통신 |
| 대표자 | 조현웅 |
| PG사 | KG이니시스 |
| 포트원 버전 | V2 |
| 결제 모듈 | 결제창 일반/정기결제 V2 |

---

## 주요 링크

### 포트원 공식 문서
- **V2 연동 시작하기**: https://developers.portone.io/opi/ko/integration/start/v2/readme?v=v2
- **가상계좌 연동**: https://developers.portone.io/opi/ko/integration/virtual-account/readme?v=v2
- **웹훅 연동**: https://portone.gitbook.io/docs/result/webhook
- **결제 검증 API**: https://developers.portone.io/opi/ko/integration/start/v2/payment?v=v2

### 포트원 관리자 콘솔
- **관리자 콘솔**: https://admin.portone.io
- **결제 연동 설정**: https://admin.portone.io/integration
- **API Keys 확인**: 결제연동 → 연동 관리 → 식별코드·API Keys

### KG이니시스
- **상점관리자**: https://iniweb.inicis.com
- **입금통보 URL 설정**: 상점정보 → 결제수단정보

---

## 환경 변수 설정 ✅

`.env.local` 파일에 설정 완료:

```env
# 포트원 V2
NEXT_PUBLIC_PORTONE_STORE_ID=store-27e1ff8c-52b4-4abb-9425-ac45b634a12c
PORTONE_V2_API_SECRET=ElxDEIHmdodjtTunA6RlAkyox2WdGSXtypQTABoGEiYDOifH6xpuQ6yfRc3wKtNXQBd5ZLdfL9I9hnBW
NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY=channel-key-4d6a9c69-27c0-4404-900c-e8d34fa1f899

# 플랫폼 정보 (기존)
NEXT_PUBLIC_PLATFORM_BANK_NAME=카카오뱅크
NEXT_PUBLIC_PLATFORM_BANK_CODE=kakaobank
NEXT_PUBLIC_PLATFORM_ACCOUNT_NUMBER=3333362382600
NEXT_PUBLIC_PLATFORM_ACCOUNT_HOLDER=스터플
```

### 포트원 콘솔 정보 (참고용)

| 항목 | 값 |
|------|-----|
| Store ID | `store-27e1ff8c-52b4-4abb-9425-ac45b634a12c` |
| MID | `MOI7262952` |
| Channel Key | `channel-key-4d6a9c69-27c0-4404-900c-e8d34fa1f899` |
| 웹훅 URL | `https://studyearn-web.vercel.app/api/webhooks/portone` |

---

## 결제 연동 순서

### 1단계: 포트원 SDK 설치

```bash
npm install @portone/browser-sdk
```

### 2단계: 결제 요청 (클라이언트)

```typescript
import * as PortOne from "@portone/browser-sdk/v2";

async function requestPayment() {
  const response = await PortOne.requestPayment({
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
    channelKey: process.env.NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY!,
    paymentId: `payment-${crypto.randomUUID()}`,
    orderName: "스터플 콘텐츠 구매",
    totalAmount: 10000,
    currency: "CURRENCY_KRW",
    payMethod: "CARD", // CARD, VIRTUAL_ACCOUNT, EASY_PAY 등
    customer: {
      fullName: "구매자이름",
      phoneNumber: "01012345678",
      email: "buyer@example.com",
    },
  });

  if (response?.code) {
    // 결제 실패
    console.error(response.message);
    return;
  }

  // 결제 성공 - 서버에서 검증
  await verifyPayment(response.paymentId);
}
```

### 3단계: 결제 검증 (서버)

```typescript
// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { paymentId } = await request.json();

  // 포트원 API로 결제 정보 조회
  const paymentResponse = await fetch(
    `https://api.portone.io/payments/${paymentId}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
      },
    }
  );

  const payment = await paymentResponse.json();

  // 결제 금액 검증
  if (payment.status === "PAID") {
    // DB에 결제 정보 저장
    // 구매 완료 처리
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: "결제 검증 실패" });
}
```

---

## 가상계좌 연동

### 가상계좌 결제 요청

```typescript
const response = await PortOne.requestPayment({
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
  channelKey: process.env.NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY!,
  paymentId: `payment-${crypto.randomUUID()}`,
  orderName: "스터플 콘텐츠 구매",
  totalAmount: 10000,
  currency: "CURRENCY_KRW",
  payMethod: "VIRTUAL_ACCOUNT",
  virtualAccount: {
    accountExpiry: {
      validHours: 24, // 24시간 후 만료
    },
  },
  customer: {
    fullName: "구매자이름",
    phoneNumber: "01012345678",
    email: "buyer@example.com",
  },
});
```

### 가상계좌 발급 후 처리

```typescript
// 가상계좌 발급 성공 시 (status: VIRTUAL_ACCOUNT_ISSUED)
if (response?.paymentId) {
  const payment = await getPaymentInfo(response.paymentId);

  // 가상계좌 정보
  const { virtualAccount } = payment;
  console.log("은행:", virtualAccount.bankCode);
  console.log("계좌번호:", virtualAccount.accountNumber);
  console.log("입금기한:", virtualAccount.expiresAt);

  // 사용자에게 가상계좌 정보 안내
  // SMS/알림톡 발송
}
```

---

## 웹훅 설정 (입금 통보)

### 웹훅 URL 설정

1. **포트원 관리자 콘솔** 접속
2. **결제연동** → **실연동관리** 탭
3. **Endpoint URL**에 웹훅 수신 URL 입력:
   ```
   https://your-domain.com/api/webhook/portone
   ```
4. **Content-Type**: `application/json` 선택

### KG이니시스 입금통보 URL 설정

1. **KG이니시스 상점관리자** 접속: https://iniweb.inicis.com
2. **상점정보** → **결제수단정보** 메뉴
3. **입금통보 URL(IP)** 설정:
   ```
   https://service.iamport.kr/inicis_payments/notice_vbank
   ```

### 웹훅 수신 API

```typescript
// app/api/webhook/portone/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { paymentId } = body;

  // 포트원 API로 결제 정보 조회
  const paymentResponse = await fetch(
    `https://api.portone.io/payments/${paymentId}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
      },
    }
  );

  const payment = await paymentResponse.json();

  switch (payment.status) {
    case "PAID":
      // 결제 완료 (카드 결제 or 가상계좌 입금 완료)
      await handlePaymentComplete(payment);
      break;
    case "VIRTUAL_ACCOUNT_ISSUED":
      // 가상계좌 발급됨
      await handleVirtualAccountIssued(payment);
      break;
    case "CANCELLED":
      // 결제 취소됨
      await handlePaymentCancelled(payment);
      break;
  }

  return NextResponse.json({ success: true });
}

async function handlePaymentComplete(payment: any) {
  // 1. DB에서 주문 정보 조회
  // 2. 결제 금액 검증
  // 3. 주문 상태 업데이트 (결제 완료)
  // 4. 구매자에게 알림 발송
  // 5. 디지털 콘텐츠 제공
}

async function handleVirtualAccountIssued(payment: any) {
  // 1. 가상계좌 정보 저장
  // 2. 구매자에게 가상계좌 정보 SMS 발송
}

async function handlePaymentCancelled(payment: any) {
  // 1. 주문 상태 업데이트 (취소)
  // 2. 구매자에게 취소 알림 발송
}
```

---

## 웹훅 호출 시점

| 상태 | 설명 | 웹훅 호출 |
|------|------|----------|
| `PAID` | 결제 승인 완료 | ✅ |
| `VIRTUAL_ACCOUNT_ISSUED` | 가상계좌 발급됨 | ✅ |
| `PAID` (가상계좌) | 가상계좌 입금 완료 | ✅ |
| `CANCELLED` | 결제 취소됨 | ✅ |
| `FAILED` | 결제 실패 | ❌ |

---

## 결제 수단별 payMethod

| 결제 수단 | payMethod |
|----------|-----------|
| 카드 결제 | `CARD` |
| 가상계좌 | `VIRTUAL_ACCOUNT` |
| 계좌이체 | `TRANSFER` |
| 휴대폰 결제 | `MOBILE` |
| 간편결제 | `EASY_PAY` |
| 카카오페이 | `EASY_PAY` + easyPay.provider: "KAKAOPAY" |
| 토스페이 | `EASY_PAY` + easyPay.provider: "TOSSPAY" |
| 네이버페이 | `EASY_PAY` + easyPay.provider: "NAVERPAY" |

---

## 간편결제 연동 예시

```typescript
// 카카오페이
const response = await PortOne.requestPayment({
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
  channelKey: process.env.NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY!,
  paymentId: `payment-${crypto.randomUUID()}`,
  orderName: "스터플 콘텐츠 구매",
  totalAmount: 10000,
  currency: "CURRENCY_KRW",
  payMethod: "EASY_PAY",
  easyPay: {
    provider: "KAKAOPAY",
  },
  customer: {
    fullName: "구매자이름",
    phoneNumber: "01012345678",
    email: "buyer@example.com",
  },
});
```

---

## 결제 취소 API

```typescript
// app/api/payment/cancel/route.ts
export async function POST(request: NextRequest) {
  const { paymentId, reason } = await request.json();

  const response = await fetch(
    `https://api.portone.io/payments/${paymentId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
      },
      body: JSON.stringify({
        reason: reason || "고객 요청에 의한 취소",
      }),
    }
  );

  const result = await response.json();
  return NextResponse.json(result);
}
```

---

## 체크리스트

### 연동 전 확인사항
- [x] 포트원 회원가입 완료
- [x] KG이니시스 채널 추가 (결제창 일반/정기결제 V2)
- [x] PG상점아이디(MID), 시크릿 키, 클라이언트 키 발급
- [x] 포트원 관리자 콘솔에 키 정보 입력
- [x] 환경 변수 설정 (.env.local)

### 개발 체크리스트
- [x] 포트원 SDK 설치 (`@portone/browser-sdk`)
- [x] 결제 요청 페이지 구현 (`/purchase/[contentId]` - 카드결제 옵션 추가)
- [x] 결제 초기화 API 구현 (`/api/purchase/portone`)
- [x] 결제 검증 API 구현 (`/api/payments/portone/verify`)
- [x] 웹훅 수신 API 구현 (`/api/webhooks/portone`)
- [x] 결제 완료 처리 로직 구현
- [x] 결제 취소 API 구현 (`/api/payments/portone/cancel`)

### 운영 전 확인사항
- [x] 포트원 웹훅 URL 설정
- [ ] KG이니시스 입금통보 URL 설정 (가상계좌 사용 시)
- [ ] 테스트 결제 → 실결제 테스트
- [ ] 에러 핸들링 및 로깅 구현

---

## 문제 해결

### 웹훅이 안 오는 경우
1. 포트원 관리자 콘솔에서 웹훅 URL 확인
2. 서버가 HTTPS인지 확인 (HTTP는 안 됨)
3. 방화벽에서 포트원 IP 허용 확인
4. 서버 로그에서 요청 수신 여부 확인

### 가상계좌 입금 통보가 안 오는 경우
1. KG이니시스 상점관리자에서 입금통보 URL 확인
2. URL: `https://service.iamport.kr/inicis_payments/notice_vbank`
3. 포트원 고객센터 문의: help@portone.io

### 결제 검증 실패
1. API Secret 키 확인
2. paymentId가 올바른지 확인
3. 결제 상태(status) 확인

---

## 참고 자료

- [포트원 V2 공식 문서](https://developers.portone.io)
- [포트원 GitHub](https://github.com/portone-io)
- [포트원 FAQ](https://faq.portone.io)
- [포트원 고객센터](mailto:help@portone.io)

---

*최종 업데이트: 2025-01-14*
