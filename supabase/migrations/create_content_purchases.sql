-- Content Purchases Table
-- P2P 결제 시스템을 위한 구매 기록 테이블

CREATE TABLE IF NOT EXISTS content_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 주문 정보
  order_number VARCHAR(20) UNIQUE NOT NULL,  -- 주문번호 (예: SP0113A7K2)

  -- 관계 정보
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 금액 정보
  amount INTEGER NOT NULL,           -- 총 결제 금액
  platform_fee INTEGER NOT NULL,     -- 플랫폼 수수료 (20%)
  creator_revenue INTEGER NOT NULL,  -- 크리에이터 수익 (80%)

  -- 상태 정보
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
  -- pending_payment: 결제 대기
  -- pending_confirm: 결제 확인 대기 (구매자가 송금 완료 표시)
  -- completed: 결제 완료 (관리자 확인)
  -- cancelled: 취소됨
  -- refunded: 환불됨

  -- 메모
  buyer_note TEXT,                   -- 구매자 메모 (송금 시 참고사항)
  admin_note TEXT,                   -- 관리자 메모

  -- 시간 정보
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_confirmed_at TIMESTAMPTZ,  -- 구매자가 송금 완료 표시한 시간
  admin_confirmed_at TIMESTAMPTZ,    -- 관리자가 확인한 시간
  completed_at TIMESTAMPTZ,          -- 구매 완료 시간

  -- 정산 정보
  settlement_id UUID,                -- 정산 ID (나중에 정산 테이블과 연결)
  settled_at TIMESTAMPTZ             -- 크리에이터에게 정산된 시간
);

-- 인덱스
CREATE INDEX idx_content_purchases_buyer ON content_purchases(buyer_id);
CREATE INDEX idx_content_purchases_seller ON content_purchases(seller_id);
CREATE INDEX idx_content_purchases_content ON content_purchases(content_id);
CREATE INDEX idx_content_purchases_status ON content_purchases(status);
CREATE INDEX idx_content_purchases_order_number ON content_purchases(order_number);
CREATE INDEX idx_content_purchases_created_at ON content_purchases(created_at DESC);

-- RLS 정책
ALTER TABLE content_purchases ENABLE ROW LEVEL SECURITY;

-- 구매자는 자신의 구매 내역 조회 가능
CREATE POLICY "Buyers can view their own purchases"
  ON content_purchases FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- 판매자는 자신의 콘텐츠에 대한 구매 내역 조회 가능
CREATE POLICY "Sellers can view purchases of their content"
  ON content_purchases FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- 인증된 사용자는 구매 생성 가능
CREATE POLICY "Authenticated users can create purchases"
  ON content_purchases FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- 구매자는 자신의 pending 구매만 업데이트 가능
CREATE POLICY "Buyers can update their pending purchases"
  ON content_purchases FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() AND status IN ('pending_payment', 'pending_confirm'));

-- 주문번호 유효성 검사 함수
CREATE OR REPLACE FUNCTION validate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number !~ '^SP\d{4}[A-Z0-9]{4}$' THEN
    RAISE EXCEPTION 'Invalid order number format. Expected: SP + 4 digits + 4 alphanumeric characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거
CREATE TRIGGER check_order_number
  BEFORE INSERT OR UPDATE ON content_purchases
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_number();

-- 코멘트
COMMENT ON TABLE content_purchases IS 'P2P 콘텐츠 구매 기록';
COMMENT ON COLUMN content_purchases.order_number IS '주문번호 (SP + MMDD + 랜덤4자리)';
COMMENT ON COLUMN content_purchases.status IS 'pending_payment, pending_confirm, completed, cancelled, refunded';
COMMENT ON COLUMN content_purchases.platform_fee IS '플랫폼 수수료 (20%)';
COMMENT ON COLUMN content_purchases.creator_revenue IS '크리에이터 수익 (80%)';
