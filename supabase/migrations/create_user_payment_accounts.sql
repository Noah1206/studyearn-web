-- User Payment Accounts Table
-- 유저 결제 계좌 관리 테이블

CREATE TABLE IF NOT EXISTS user_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 유저 정보
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 계좌 정보
  bank_code VARCHAR(50) NOT NULL,           -- 은행 코드 (toss, kakaobank, kbstar 등)
  bank_name VARCHAR(100) NOT NULL,          -- 은행명 (토스, 카카오뱅크, KB국민은행 등)
  account_number VARCHAR(50) NOT NULL,      -- 계좌번호 (숫자만)
  account_holder VARCHAR(100) NOT NULL,     -- 예금주명

  -- 옵션
  nickname VARCHAR(100),                    -- 계좌 별명
  supports_deeplink BOOLEAN DEFAULT true,   -- 딥링크 지원 여부
  is_primary BOOLEAN DEFAULT false,         -- 기본 계좌 여부
  is_verified BOOLEAN DEFAULT false,        -- 인증 여부

  -- 시간 정보
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 유니크 제약 (같은 유저가 같은 은행의 같은 계좌를 중복 등록 불가)
  UNIQUE(user_id, bank_code, account_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_payment_accounts_user ON user_payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_accounts_primary ON user_payment_accounts(user_id, is_primary) WHERE is_primary = true;

-- RLS 정책
ALTER TABLE user_payment_accounts ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 계좌만 조회 가능
CREATE POLICY "Users can view their own payment accounts"
  ON user_payment_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 유저는 자신의 계좌만 생성 가능
CREATE POLICY "Users can create their own payment accounts"
  ON user_payment_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 유저는 자신의 계좌만 수정 가능
CREATE POLICY "Users can update their own payment accounts"
  ON user_payment_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 유저는 자신의 계좌만 삭제 가능
CREATE POLICY "Users can delete their own payment accounts"
  ON user_payment_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_payment_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_payment_accounts_updated_at ON user_payment_accounts;
CREATE TRIGGER trigger_update_user_payment_accounts_updated_at
  BEFORE UPDATE ON user_payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_payment_accounts_updated_at();

-- 기본 계좌 관리 트리거 (한 유저당 하나의 기본 계좌만)
CREATE OR REPLACE FUNCTION manage_primary_payment_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- 다른 계좌의 기본 설정 해제
    UPDATE user_payment_accounts
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_manage_primary_payment_account ON user_payment_accounts;
CREATE TRIGGER trigger_manage_primary_payment_account
  AFTER INSERT OR UPDATE OF is_primary ON user_payment_accounts
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION manage_primary_payment_account();

-- 코멘트
COMMENT ON TABLE user_payment_accounts IS '유저 결제 계좌 정보';
COMMENT ON COLUMN user_payment_accounts.bank_code IS '은행 코드 (deeplink/banks.ts의 BankCode)';
COMMENT ON COLUMN user_payment_accounts.is_primary IS '기본 계좌 여부 (유저당 1개)';
