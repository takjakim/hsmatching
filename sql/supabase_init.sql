-- Supabase 데이터베이스 초기화 스크립트
-- Supabase 대시보드의 SQL Editor에서 실행

-- 검사 결과 테이블
CREATE TABLE IF NOT EXISTS test_results (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  result JSONB NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 코드 목록 인덱스 테이블
CREATE TABLE IF NOT EXISTS result_codes (
  code VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_test_results_code ON test_results(code);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_expires_at ON test_results(expires_at);
CREATE INDEX IF NOT EXISTS idx_result_codes_created_at ON result_codes(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_codes ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (검사 결과 조회용 - 만료되지 않은 것만)
CREATE POLICY "Anyone can read non-expired test results"
ON test_results
FOR SELECT
TO anon, authenticated
USING (expires_at > CURRENT_TIMESTAMP);

-- 공개 쓰기 정책 (검사 결과 저장용)
CREATE POLICY "Anyone can insert test results"
ON test_results
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 업데이트 정책 (코드로 결과 업데이트 가능)
CREATE POLICY "Anyone can update test results"
ON test_results
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 코드 목록 읽기 정책
CREATE POLICY "Anyone can read result codes"
ON result_codes
FOR SELECT
TO anon, authenticated
USING (true);

-- 코드 목록 쓰기 정책
CREATE POLICY "Anyone can insert result codes"
ON result_codes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 코드 목록 업데이트 정책
CREATE POLICY "Anyone can update result codes"
ON result_codes
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
