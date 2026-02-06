-- 졸업생 취업 데이터 테이블 초기화 스크립트
-- Supabase 대시보드의 SQL Editor에서 실행

-- 1. 졸업생 기본정보 테이블
CREATE TABLE IF NOT EXISTS graduates (
  graduateno INT PRIMARY KEY,
  company_name TEXT,
  company_type TEXT,
  graduation_date TEXT,
  employment_year INT,
  department TEXT,
  major TEXT,
  job_type TEXT,
  gpa DECIMAL(4,2),
  toeic INT,
  toeic_s TEXT,
  opic TEXT,
  cert1 TEXT,
  cert2 TEXT,
  cert3 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 비교과 프로그램 테이블
CREATE TABLE IF NOT EXISTS graduate_programs (
  id SERIAL PRIMARY KEY,
  graduateno INT REFERENCES graduates(graduateno) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  period TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 수강 교과목 테이블
CREATE TABLE IF NOT EXISTS graduate_courses (
  id SERIAL PRIMARY KEY,
  graduateno INT REFERENCES graduates(graduateno) ON DELETE CASCADE,
  category TEXT,
  course_name TEXT NOT NULL,
  credits TEXT,
  competency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_graduates_company ON graduates(company_name);
CREATE INDEX IF NOT EXISTS idx_graduates_department ON graduates(department);
CREATE INDEX IF NOT EXISTS idx_graduates_job ON graduates(job_type);
CREATE INDEX IF NOT EXISTS idx_graduate_programs_graduateno ON graduate_programs(graduateno);
CREATE INDEX IF NOT EXISTS idx_graduate_courses_graduateno ON graduate_courses(graduateno);
CREATE INDEX IF NOT EXISTS idx_graduate_courses_category ON graduate_courses(category);

-- RLS (Row Level Security) 활성화
ALTER TABLE graduates ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduate_courses ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Anyone can read graduates"
ON graduates FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can read graduate_programs"
ON graduate_programs FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can read graduate_courses"
ON graduate_courses FOR SELECT TO anon, authenticated USING (true);

-- 관리자 쓰기 정책 (authenticated만)
CREATE POLICY "Authenticated can insert graduates"
ON graduates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert graduate_programs"
ON graduate_programs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert graduate_courses"
ON graduate_courses FOR INSERT TO authenticated WITH CHECK (true);
