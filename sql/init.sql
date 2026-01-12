-- Vercel Postgres 데이터베이스 초기화 스크립트
-- Vercel 대시보드의 SQL Editor에서 실행하거나, psql로 직접 실행

-- 검사 결과 테이블
CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  result JSONB NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- 코드 목록 인덱스 테이블 (빠른 조회용)
CREATE TABLE IF NOT EXISTS result_codes (
  code VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (PostgreSQL 문법)
CREATE INDEX IF NOT EXISTS idx_test_results_code ON test_results(code);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_expires_at ON test_results(expires_at);
CREATE INDEX IF NOT EXISTS idx_result_codes_created_at ON result_codes(created_at);

-- 만료된 결과 자동 삭제를 위한 함수 (선택사항)
-- 주기적으로 실행하거나 cron job으로 설정
CREATE OR REPLACE FUNCTION delete_expired_results()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM test_results
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
