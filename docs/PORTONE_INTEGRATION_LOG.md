# 스터플 포트원 결제 연동 작업 로그

> 최종 업데이트: 2025-01-22
> 작업 상태: **개발 완료, 테스트 필요**

---

## 1. 프로젝트 정보

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

## 2. 포트원 인증 정보

```
Store ID: store-27e1ff8c-52b4-4abb-9425-ac45b634a12c
MID: MOI7262952
Channel Key: channel-key-4d6a9c69-27c0-4404-900c-e8d34fa1f899
API Secret: ElxDEIHmdodjtTunA6RlAkyox2WdGSXtypQTABoGEiYDOifH6xpuQ6yfRc3wKtNXQBd5ZLdfL9I9hnBW
웹훅 URL: https://studyearn-web.vercel.app/api/webhooks/portone
```

---

## 3. 환경 변수 (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tmxgwtouhfzaqljeqzbr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGd3dG91aGZ6YXFsamVxemJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTY3NDEsImV4cCI6MjA3OTU3Mjc0MX0.PjyqJ2GNR0N1hrKl_esTfetrNyLQl5Mp_6QOjFiwdV8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGd3dG91aGZ6YXFsamVxemJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk5Njc0MSwiZXhwIjoyMDc5NTcyNzQxfQ.FpJPZJeLDYIpI0HF5uUpGuGTiCEumK-b8wBioI961AU

# 포트원 V2 (KG이니시스)
NEXT_PUBLIC_PORTONE_STORE_ID=store-27e1ff8c-52b4-4abb-9425-ac45b634a12c
PORTONE_V2_API_SECRET=ElxDEIHmdodjtTunA6RlAkyox2WdGSXtypQTABoGEiYDOifH6xpuQ6yfRc3wKtNXQBd5ZLdfL9I9hnBW
NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY=channel-key-4d6a9c69-27c0-4404-900c-e8d34fa1f899
```

---

## 4. 완료된 작업

### 4.1 포트원 설정 ✅
- [x] KG이니시스 채널 등록 (결제창 일반/정기결제 V2)
- [x] MID, Store ID, Channel Key 발급
- [x] API Secret 발급
- [x] 웹훅 URL 설정
- [x] 과세구분: "과세" 선택

### 4.2 SDK 설치 ✅
```bash
npm install @portone/browser-sdk
```

### 4.3 라이브러리 구현 ✅

| 파일 | 설명 |
|------|------|
| `src/lib/portone/client.ts` | 클라이언트 결제 SDK 래퍼 |
| `src/lib/portone/server.ts` | 서버 API 유틸리티 (검증, 취소) |
| `src/lib/portone/index.ts` | 모듈 익스포트 |

### 4.4 API 라우트 구현 ✅

| API 엔드포인트 | 파일 | 설명 |
|---------------|------|------|
| `POST /api/purchase/portone` | `src/app/api/purchase/portone/route.ts` | 결제 초기화, paymentId 발급 |
| `POST /api/payments/portone/verify` | `src/app/api/payments/portone/verify/route.ts` | 결제 검증 및 완료 처리 |
| `POST /api/payments/portone/cancel` | `src/app/api/payments/portone/cancel/route.ts` | 결제 취소/환불 |
| `POST /api/webhooks/portone` | `src/app/api/webhooks/portone/route.ts` | 웹훅 수신 (입금 통보 등) |

### 4.5 결제 페이지 UI 수정 ✅

**파일**: `src/app/purchase/[contentId]/page.tsx`

수정 내용:
- 결제 방법 선택 UI 추가 (카드결제 / 토스 송금)
- 카드결제 선택 시 PortOne SDK 연동
- 결제 완료 후 자동 검증 및 리다이렉트
- `handleCardPayment()` 함수 추가

### 4.6 빌드 확인 ✅
```bash
npm run build  # 성공
```

---

## 5. 결제 플로우

### 5.1 카드결제 (신규 구현)

```
사용자 행동                     시스템 처리
────────────────────────────────────────────────────────────
1. "카드결제" 선택
2. "결제하기" 버튼 클릭  →  POST /api/purchase/portone
                            - content_purchases 레코드 생성
                            - paymentId 발급
                        ←  { paymentId, orderName, amount }

3. PortOne 결제창 표시   →  PortOne.requestPayment()
4. 결제 진행 (카드 입력)
5. 결제 완료             →  POST /api/payments/portone/verify
                            - 포트원 API로 결제 검증
                            - content_purchases.status = 'completed'
                        ←  { success: true, status: 'completed' }

6. 콘텐츠 페이지 이동    →  /content/[id]?purchased=true
```

### 5.2 토스 송금 (기존)

```
1. "토스 송금" 선택
2. 토스 앱으로 이동 → 송금
3. 입금자명 입력
4. "송금 완료했어요" 클릭 → POST /api/purchase/p2p
5. 입금 확인 대기 상태
6. 관리자 승인 후 콘텐츠 이용
```

---

## 6. 파일 구조

```
src/
├── lib/portone/
│   ├── client.ts          # requestCardPayment, requestPayment 등
│   ├── server.ts          # getPayment, verifyPayment, cancelPayment
│   └── index.ts
├── app/
│   ├── api/
│   │   ├── purchase/
│   │   │   └── portone/route.ts       # 결제 초기화
│   │   ├── payments/portone/
│   │   │   ├── verify/route.ts        # 결제 검증
│   │   │   └── cancel/route.ts        # 결제 취소
│   │   └── webhooks/
│   │       └── portone/route.ts       # 웹훅 수신
│   └── purchase/
│       └── [contentId]/
│           └── page.tsx               # 결제 페이지 (수정됨)
docs/
├── PORTONE_PAYMENT_GUIDE.md           # 연동 가이드
└── PORTONE_INTEGRATION_LOG.md         # 이 파일
```

---

## 7. 해야 할 일

### 7.1 즉시 해결 필요 🔴

| 작업 | 설명 | 상태 |
|------|------|------|
| Supabase 프로젝트 복원 | DNS 에러 발생 - Supabase 대시보드에서 Paused 상태인지 확인 후 Restore | ⏳ 대기 |
| Vercel 환경변수 설정 | 위 환경변수들을 Vercel Settings에 추가 | ⏳ 대기 |

### 7.2 테스트 필요 🟡

| 작업 | 설명 |
|------|------|
| 테스트 결제 | 로컬에서 카드결제 테스트 (npm run dev) |
| 결제 완료 확인 | 결제 후 콘텐츠 접근 가능한지 확인 |
| 웹훅 테스트 | Vercel 배포 후 웹훅 수신 확인 |
| 결제 취소 테스트 | 관리자 페이지에서 환불 처리 테스트 |

### 7.3 선택 사항 🟢

| 작업 | 설명 |
|------|------|
| KG이니시스 입금통보 URL | 가상계좌 사용 시 필요 (현재는 카드결제만) |
| 가상계좌 UI 추가 | 가상계좌 결제 옵션 추가 |
| 카카오페이/토스페이 | 간편결제 옵션 추가 |

---

## 8. 문제 해결

### 8.1 Vercel 배포 후 DNS 에러

**증상**: `tmxgwtouhfzaqljeqzbr.supabase.co의 DNS 주소를 찾을 수 없습니다`

**원인**:
1. Supabase 프로젝트 일시 중지 (무료 플랜 7일 비활성 시)
2. Vercel 환경변수 미설정

**해결**:
1. https://supabase.com/dashboard → 프로젝트 선택 → "Restore project"
2. Vercel Settings → Environment Variables → 환경변수 추가 → Redeploy

### 8.2 결제창이 안 열림

**확인사항**:
- `NEXT_PUBLIC_PORTONE_STORE_ID` 환경변수 설정됨?
- `NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY` 환경변수 설정됨?
- 브라우저 콘솔에 에러 메시지 확인

### 8.3 결제 검증 실패

**확인사항**:
- `PORTONE_V2_API_SECRET` 서버 환경변수 설정됨?
- paymentId가 올바른지 확인
- 결제 금액이 일치하는지 확인

---

## 9. 참고 링크

| 서비스 | URL |
|--------|-----|
| 포트원 관리자 | https://admin.portone.io |
| 포트원 V2 문서 | https://developers.portone.io/opi/ko/integration/start/v2/readme?v=v2 |
| KG이니시스 상점관리자 | https://iniweb.inicis.com |
| Supabase 대시보드 | https://supabase.com/dashboard |
| Vercel 대시보드 | https://vercel.com |

---

## 10. 코드 스니펫

### 10.1 카드결제 호출 (클라이언트)

```typescript
import { requestCardPayment } from '@/lib/portone/client';

// 1. 결제 초기화
const initResponse = await fetch('/api/purchase/portone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contentId: product.id }),
});
const { paymentId, orderName, amount } = await initResponse.json();

// 2. 결제창 호출
const paymentResult = await requestCardPayment(
  paymentId,
  orderName,
  amount,
  {
    fullName: '구매자명',
    phoneNumber: '01012345678',
    email: 'buyer@example.com',
  }
);

// 3. 결제 검증
if (!paymentResult.code) {
  const verifyResponse = await fetch('/api/payments/portone/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId: paymentResult.paymentId, amount }),
  });
}
```

### 10.2 결제 검증 (서버)

```typescript
import { verifyPayment } from '@/lib/portone/server';

const { verified, payment, error } = await verifyPayment(paymentId, amount);

if (verified) {
  // content_purchases 테이블 업데이트
  await supabase
    .from('content_purchases')
    .update({ status: 'completed', purchased_at: payment.paidAt })
    .eq('payment_id', paymentId);
}
```

---

*이 문서는 Claude와의 작업 세션 내용을 기록한 것입니다.*
