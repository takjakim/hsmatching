-- 롤모델 선택 테이블 생성
CREATE TABLE IF NOT EXISTS rolemodel_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  selected_graduate_ids INTEGER[] NOT NULL DEFAULT '{}',
  has_explored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 학생별 유니크
  UNIQUE(student_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rolemodel_selections_student_id ON rolemodel_selections(student_id);

-- RLS (Row Level Security) 정책
ALTER TABLE rolemodel_selections ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 (anon key 사용)
CREATE POLICY "Allow all operations on rolemodel_selections"
  ON rolemodel_selections
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_rolemodel_selections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rolemodel_selections_updated_at
  BEFORE UPDATE ON rolemodel_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_rolemodel_selections_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE rolemodel_selections IS '학생별 롤모델 선택 저장';
COMMENT ON COLUMN rolemodel_selections.student_id IS '학번';
COMMENT ON COLUMN rolemodel_selections.selected_graduate_ids IS '선택한 졸업생 ID 배열';
COMMENT ON COLUMN rolemodel_selections.has_explored IS '롤모델 탐색 완료 여부';
