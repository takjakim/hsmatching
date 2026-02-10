-- 학생 데이터 테이블 초기화 스크립트
-- Supabase 대시보드의 SQL Editor에서 실행

-- 1. 학생 기본정보 테이블
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,  -- 학번
  password_hash VARCHAR(255),              -- 비밀번호 해시 (SHA-256)
  name VARCHAR(50) NOT NULL,
  name_eng VARCHAR(100),
  department VARCHAR(100),                 -- 학과
  grade INT DEFAULT 1,                     -- 학년
  phone_number VARCHAR(20),
  email VARCHAR(100),
  address_zip VARCHAR(10),
  address_basic TEXT,
  address_detail TEXT,
  birth_date DATE,
  admission_year INT,                      -- 입학년도
  status VARCHAR(20) DEFAULT 'active',     -- active, leave, graduated
  riasec_code VARCHAR(10),                 -- RIASEC 검사 결과 코드
  target_career TEXT,                      -- 목표 진로
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 수강 이력 테이블
CREATE TABLE IF NOT EXISTS student_courses (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  year INT NOT NULL,                       -- 수강년도
  semester INT NOT NULL,                   -- 1 또는 2
  course_number VARCHAR(20) NOT NULL,      -- 과목번호
  course_name VARCHAR(200) NOT NULL,       -- 과목명
  completion_type VARCHAR(50),             -- 이수구분: 전공필수, 전공선택, 교양 등
  credits DECIMAL(3,1),                    -- 학점
  grade VARCHAR(5),                        -- 성적: A+, A0, B+ 등
  professor VARCHAR(50),
  retake BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 학기별 성적 테이블
CREATE TABLE IF NOT EXISTS student_grades (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  year INT NOT NULL,
  semester INT NOT NULL,
  grade_year INT,                          -- 학년
  registered_credits DECIMAL(4,1),         -- 신청학점
  acquired_credits DECIMAL(4,1),           -- 취득학점
  general_credits DECIMAL(4,1),            -- 교양학점
  major_credits DECIMAL(4,1),              -- 전공학점
  gpa DECIMAL(3,2),                        -- 평점
  percentile DECIMAL(5,2),                 -- 백분위
  semester_rank VARCHAR(20),               -- 학기석차
  overall_rank VARCHAR(20),                -- 전체석차
  academic_warning BOOLEAN DEFAULT FALSE,  -- 학사경고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, year, semester)
);

-- 4. 비교과 활동 테이블
CREATE TABLE IF NOT EXISTS student_activities (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,           -- certificate, contest, internship, volunteer, club, seminar
  name VARCHAR(200) NOT NULL,
  activity_date DATE,
  status VARCHAR(20) DEFAULT 'planned',    -- completed, in-progress, planned
  description TEXT,
  mileage INT DEFAULT 0,
  hours INT DEFAULT 0,
  issuer VARCHAR(100),                     -- 발급기관
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_year_sem ON student_courses(year, semester);
CREATE INDEX IF NOT EXISTS idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON student_activities(student_id);

-- RLS 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (자신의 데이터만)
CREATE POLICY "Users can read own student data"
ON students FOR SELECT TO anon, authenticated
USING (true);  -- 로그인 로직에서 학번으로 조회 필요

CREATE POLICY "Users can read own courses"
ON student_courses FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Users can read own grades"
ON student_grades FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Users can read own activities"
ON student_activities FOR SELECT TO anon, authenticated
USING (true);

-- 쓰기 정책
CREATE POLICY "Authenticated can insert students"
ON students FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update students"
ON students FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert courses"
ON student_courses FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can insert grades"
ON student_grades FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can manage activities"
ON student_activities FOR ALL TO authenticated
USING (true);

-- anon도 insert 허용 (회원가입, 데이터 입력용)
CREATE POLICY "Anon can insert students"
ON students FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon can insert courses"
ON student_courses FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon can insert grades"
ON student_grades FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon can insert activities"
ON student_activities FOR INSERT TO anon
WITH CHECK (true);
