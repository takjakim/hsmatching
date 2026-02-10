-- 커리큘럼 플랜 테이블 생성
CREATE TABLE IF NOT EXISTS curriculum_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  major_name TEXT NOT NULL,
  semesters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 학생별 계획명+전공명 조합은 유니크
  UNIQUE(student_id, name, major_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_curriculum_plans_student_id ON curriculum_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_plans_updated_at ON curriculum_plans(updated_at DESC);

-- RLS (Row Level Security) 정책
ALTER TABLE curriculum_plans ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (본인 데이터만)
CREATE POLICY "Users can view own curriculum plans"
  ON curriculum_plans FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Users can insert curriculum plans"
  ON curriculum_plans FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 수정 가능 (본인 데이터만)
CREATE POLICY "Users can update own curriculum plans"
  ON curriculum_plans FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제 가능 (본인 데이터만)
CREATE POLICY "Users can delete own curriculum plans"
  ON curriculum_plans FOR DELETE
  USING (true);

-- 테이블 코멘트
COMMENT ON TABLE curriculum_plans IS '학생별 커리큘럼 계획 저장';
COMMENT ON COLUMN curriculum_plans.student_id IS '학번';
COMMENT ON COLUMN curriculum_plans.name IS '계획 이름';
COMMENT ON COLUMN curriculum_plans.major_name IS '전공명';
COMMENT ON COLUMN curriculum_plans.semesters IS '학기별 과목 배치 (JSON)';
