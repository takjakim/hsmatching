-- 나만의 전공 조합 테이블 생성
CREATE TABLE IF NOT EXISTS custom_major_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  primary_major TEXT NOT NULL,
  secondary_major TEXT,
  minor_major TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 학생별 조합 이름은 유니크
  UNIQUE(student_id, name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_custom_major_plans_student_id ON custom_major_plans(student_id);

-- RLS (Row Level Security) 정책
ALTER TABLE custom_major_plans ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 (anon key 사용)
CREATE POLICY "Allow all operations on custom_major_plans"
  ON custom_major_plans
  FOR ALL USING (true) WITH CHECK (true);

-- 테이블 코멘트
COMMENT ON TABLE custom_major_plans IS '학생별 나만의 전공 조합 저장';
COMMENT ON COLUMN custom_major_plans.student_id IS '학번';
COMMENT ON COLUMN custom_major_plans.name IS '조합 이름';
COMMENT ON COLUMN custom_major_plans.primary_major IS '주전공';
COMMENT ON COLUMN custom_major_plans.secondary_major IS '복수전공';
COMMENT ON COLUMN custom_major_plans.minor_major IS '부전공';
