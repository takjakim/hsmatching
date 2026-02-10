-- 전공별 교과목 테이블 초기화 스크립트 (v2)
-- Supabase 대시보드의 SQL Editor에서 실행

-- 1. 기존 테이블이 있으면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS major_courses CASCADE;

-- 2. 전공별 교과목 테이블 (4컬럼 구조)
CREATE TABLE IF NOT EXISTS major_courses (
  id SERIAL PRIMARY KEY,
  college VARCHAR(100) NOT NULL,           -- 단과대학 (인문대학, 경영대학 등)
  department VARCHAR(100) NOT NULL,        -- 학부 (경상·통계학부, 융합소프트웨어학부 등)
  major VARCHAR(100),                      -- 전공 (경제학전공, 데이터사이언스전공 등) - 학과인 경우 NULL
  course_name VARCHAR(200) NOT NULL,       -- 교과목명
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department, major, course_name)   -- 학부+전공+교과목 조합 유니크
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_major_courses_college ON major_courses(college);
CREATE INDEX IF NOT EXISTS idx_major_courses_department ON major_courses(department);
CREATE INDEX IF NOT EXISTS idx_major_courses_major ON major_courses(major);
CREATE INDEX IF NOT EXISTS idx_major_courses_course ON major_courses(course_name);

-- 4. RLS 활성화
ALTER TABLE major_courses ENABLE ROW LEVEL SECURITY;

-- 5. 읽기 정책 (모든 사용자 조회 가능)
CREATE POLICY "Anyone can read major_courses"
ON major_courses FOR SELECT TO anon, authenticated
USING (true);

-- 6. 쓰기 정책 (인증된 사용자만)
CREATE POLICY "Authenticated can insert major_courses"
ON major_courses FOR INSERT TO authenticated
WITH CHECK (true);

-- 7. 전공 목록 조회용 뷰
CREATE OR REPLACE VIEW major_list AS
SELECT DISTINCT
  college,
  department,
  major,
  COUNT(*) as course_count
FROM major_courses
GROUP BY college, department, major
ORDER BY college, department, major;

-- 8. 단과대학별 학부 목록 뷰
CREATE OR REPLACE VIEW department_list AS
SELECT DISTINCT
  college,
  department,
  COUNT(DISTINCT major) as major_count,
  COUNT(*) as total_courses
FROM major_courses
GROUP BY college, department
ORDER BY college, department;

-- 9. 단과대학 목록 뷰
CREATE OR REPLACE VIEW college_list AS
SELECT DISTINCT
  college,
  COUNT(DISTINCT department) as department_count,
  COUNT(*) as total_courses
FROM major_courses
GROUP BY college
ORDER BY college;
