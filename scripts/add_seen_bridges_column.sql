-- students 테이블에 seen_bridges 컬럼 추가
-- 브릿지 페이지 상태를 저장 (어떤 단계 전환을 이미 봤는지)
-- 값 예시: ['1to2', '2to3', '3to4', '4to5']

-- 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'seen_bridges'
    ) THEN
        ALTER TABLE students ADD COLUMN seen_bridges TEXT[] DEFAULT '{}';
        COMMENT ON COLUMN students.seen_bridges IS '본 브릿지 페이지 목록 (1to2, 2to3, 3to4, 4to5)';
    END IF;
END $$;

-- 기존 학생들의 seen_bridges를 빈 배열로 초기화 (NULL인 경우만)
UPDATE students
SET seen_bridges = '{}'
WHERE seen_bridges IS NULL;

-- 확인
SELECT student_id, name, seen_bridges
FROM students
LIMIT 5;
