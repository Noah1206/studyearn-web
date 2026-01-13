-- Add order_number column to existing content_purchases table
-- 기존 content_purchases 테이블에 order_number 컬럼 추가

-- 1. order_number 컬럼 추가
ALTER TABLE content_purchases
ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;

-- 2. 기존 레코드에 주문번호 생성 (만약 있다면)
UPDATE content_purchases
SET order_number = 'SP' || TO_CHAR(created_at, 'MMDD') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))
WHERE order_number IS NULL;

-- 3. NOT NULL 제약 추가
ALTER TABLE content_purchases
ALTER COLUMN order_number SET NOT NULL;

-- 4. 인덱스 추가 (존재하지 않으면)
CREATE INDEX IF NOT EXISTS idx_content_purchases_order_number
ON content_purchases(order_number);

-- 5. 주문번호 유효성 검사 함수 (존재하지 않으면)
CREATE OR REPLACE FUNCTION validate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number !~ '^SP\d{4}[A-Z0-9]{4}$' THEN
    RAISE EXCEPTION 'Invalid order number format. Expected: SP + 4 digits + 4 alphanumeric characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 (존재하지 않으면)
DROP TRIGGER IF EXISTS check_order_number ON content_purchases;
CREATE TRIGGER check_order_number
  BEFORE INSERT OR UPDATE ON content_purchases
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_number();

-- 7. 코멘트
COMMENT ON COLUMN content_purchases.order_number IS '주문번호 (SP + MMDD + 랜덤4자리)';
