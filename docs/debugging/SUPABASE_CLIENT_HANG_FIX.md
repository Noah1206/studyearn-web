# Supabase Client Hang Issue - 해결 문서

## 문제 상황

**날짜**: 2026-01-12
**영향 페이지**: `/dashboard/contents/[id]/edit`

### 증상
- 콘텐츠 편집 페이지 진입 시 무한 로딩
- Supabase 쿼리가 시작되지만 완료되지 않음
- Network 탭에 Supabase REST API 요청이 전혀 보이지 않음
- 10초 타임아웃 후 실패

### 콘솔 로그
```
✅ [EditPage] User authenticated: user@example.com Loading content...
🔧 [EditPage] Creating fresh Supabase client...
📦 [EditPage] Query started...
// 이후 아무 응답 없이 타임아웃
```

## 원인 분석

### 문제의 코드 (작동 안 함)
```typescript
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);

// 이 쿼리가 네트워크 요청을 보내지 않고 hang됨
const { data, error } = await supabase
  .from('contents')
  .select('*')
  .eq('id', contentId)
  .eq('creator_id', user.id)
  .maybeSingle();
```

### 시도한 해결 방법들 (실패)
1. **getSession() 타임아웃 추가** - 여전히 hang
2. **중복 getSession() 호출 제거** - 여전히 hang
3. **싱글톤 대신 새 클라이언트 생성** - 여전히 hang
4. **Promise.race로 타임아웃 적용** - 타임아웃은 작동하지만 쿼리 자체가 실행 안 됨

### 근본 원인
`@supabase/ssr`의 `createBrowserClient`가 특정 React 컴포넌트 라이프사이클에서 쿼리를 실행하지 않는 문제로 추정:
- SessionProvider에서는 동일한 클라이언트가 정상 작동
- 특정 페이지의 useEffect 내에서만 문제 발생
- 네트워크 요청 자체가 발생하지 않음 (브라우저 Network 탭에서 확인)

## 해결 방법

### 최종 해결: Native Fetch API 사용

```typescript
// Supabase REST API를 직접 호출
const fetchUrl = `${supabaseUrl}/rest/v1/contents?id=eq.${contentId}&creator_id=eq.${user.id}&select=*`;

const response = await fetch(fetchUrl, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
const contentData = data?.[0] || null;
```

### 왜 작동하는가?
- Supabase JS 클라이언트의 내부 상태/Promise 처리를 우회
- 브라우저의 native fetch API는 항상 신뢰성 있게 작동
- Supabase REST API는 표준 HTTP 요청으로 직접 호출 가능

## Supabase REST API 참고

### 기본 쿼리 패턴
```
GET /rest/v1/{table}?{column}=eq.{value}&select={columns}
```

### 필수 헤더
```typescript
headers: {
  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${accessToken || anonKey}`,
  'Content-Type': 'application/json',
}
```

### 필터 연산자
- `eq.` - equals
- `neq.` - not equals
- `gt.` - greater than
- `lt.` - less than
- `like.` - LIKE
- `ilike.` - ILIKE (case insensitive)
- `in.` - IN (예: `in.(1,2,3)`)

### 예시 쿼리들
```typescript
// 단일 항목 조회
`/rest/v1/contents?id=eq.${id}&select=*`

// 여러 조건
`/rest/v1/contents?creator_id=eq.${userId}&is_published=eq.true&select=*`

// 특정 컬럼만 선택
`/rest/v1/profiles?id=eq.${id}&select=id,nickname,avatar_url`
```

## 권장 사항

1. **이 페이지에서는 native fetch 유지** - 작동이 확인됨
2. **다른 페이지에서 같은 문제 발생 시** - 동일한 패턴 적용
3. **Supabase 클라이언트 버전 업데이트 검토** - 버그 수정 가능성
4. **SessionProvider의 supabase 인스턴스 공유 고려** - 컨텍스트로 전달

## 관련 파일

- `src/app/dashboard/contents/[id]/edit/page.tsx` - 수정된 파일
- `src/lib/supabase/client.ts` - 기존 싱글톤 클라이언트 (이 페이지에서 사용 안 함)
- `src/components/providers/SessionProvider.tsx` - 정상 작동하는 Supabase 사용 예시

## 향후 모니터링

- [ ] Supabase JS 클라이언트 업데이트 후 재테스트
- [ ] 다른 페이지에서 유사 문제 발생 여부 확인
- [ ] React Strict Mode 비활성화 시 동작 확인
