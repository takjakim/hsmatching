# Supabase 데이터베이스 연동 가이드

## ✅ 현재 상황

- Supabase 데이터베이스 생성 완료
- Vercel 프로젝트 연결 완료
- 환경 변수 자동 생성됨 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 등)

---

## 📋 다음 단계

### Step 1: Supabase 테이블 생성

1. Vercel 대시보드에서 **"Open in Supabase"** 버튼 클릭
2. Supabase 대시보드 → **SQL Editor** 이동
3. 아래 SQL 스크립트 실행:

```sql
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

-- 공개 읽기 정책 (검사 결과 조회용)
CREATE POLICY "Anyone can read test results"
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
```

### Step 2: Supabase 클라이언트 라이브러리 설치

```bash
npm install @supabase/supabase-js
```

### Step 3: Supabase 클라이언트 생성

### Step 4: 기존 코드를 Supabase에 맞게 수정

---

## 🔄 Vercel Postgres vs Supabase

현재 코드는 Vercel Postgres용으로 작성되어 있습니다. Supabase를 사용하려면:

1. **옵션 A**: Supabase용으로 코드 수정 (권장)
2. **옵션 B**: Vercel Postgres 사용 유지

어느 쪽을 사용하시겠습니까?
