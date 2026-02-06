-- 샘플 학생 데이터 (테스트용)
-- 비밀번호는 SHA-256 해시로 저장 (실제 비밀번호: test1234)
-- SHA-256('test1234') = '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244'

-- 1. 샘플 학생 추가
INSERT INTO students (student_id, password_hash, name, name_eng, department, grade, phone_number, email, admission_year, status)
VALUES
  ('2501001', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '김명지', 'KIM MYUNGJI', '경영정보학과', 2, '010-1234-5678', 'student1@mju.ac.kr', 2025, 'active'),
  ('2401001', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '이경영', 'LEE KYUNGYOUNG', '경영학과', 3, '010-2345-6789', 'student2@mju.ac.kr', 2024, 'active'),
  ('2501002', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '박신입', 'PARK SHINIP', '무전공', 1, '010-3456-7890', 'student3@mju.ac.kr', 2025, 'active')
ON CONFLICT (student_id) DO NOTHING;

-- 2. 샘플 수강 이력 (김명지 - 경영정보학과 2학년)
INSERT INTO student_courses (student_id, year, semester, course_number, course_name, completion_type, credits, grade, professor) VALUES
-- 1학년 1학기
('2501001', 2025, 1, 'GEN101', '경영학입문', '학문기초', 3, 'A0', '김경영'),
('2501001', 2025, 1, 'GEN102', '경제학원론', '학문기초', 3, 'B+', '이경제'),
('2501001', 2025, 1, 'MIS101', '경영정보', '전공필수', 3, 'A+', '최정보'),
('2501001', 2025, 1, 'MIS102', '프로그래밍기초', '전공필수', 3, 'A0', '정파이썬'),
('2501001', 2025, 1, 'GEN001', '대학생활설계', '교양', 1, 'P', '한진로'),
-- 1학년 2학기
('2501001', 2025, 2, 'GEN103', '경상통계학', '학문기초', 3, 'B+', '박통계'),
('2501001', 2025, 2, 'MIS100', '전공탐색세미나', '전공필수', 1, 'P', '한진로'),
('2501001', 2025, 2, 'MIS201', '데이터분석입문', '전공', 3, 'A0', '최한별'),
('2501001', 2025, 2, 'GEN201', '영어회화', '교양', 2, 'B+', '스미스'),
-- 2학년 1학기
('2501001', 2026, 1, 'MIS5864', '데이터분석프로그래밍', '전공', 3, 'A+', '최한별'),
('2501001', 2026, 1, 'MIS6244', '데이터베이스활용', '전공', 3, 'A0', '남호헌'),
('2501001', 2026, 1, 'BUS104', '회계원리', '전공', 3, 'B+', '이회계'),
('2501001', 2026, 1, 'BUS106', '마케팅원론', '전공', 3, 'A0', '박마케팅'),
('2501001', 2026, 1, 'BUS120', 'ERP개론', '전공', 3, 'A+', '강성구');

-- 3. 샘플 성적 정보 (김명지)
INSERT INTO student_grades (student_id, year, semester, grade_year, registered_credits, acquired_credits, general_credits, major_credits, gpa, percentile, semester_rank, overall_rank)
VALUES
('2501001', 2025, 1, 1, 16, 16, 4, 12, 3.75, 82.5, '45/120', '1256/5230'),
('2501001', 2025, 2, 1, 12, 12, 2, 10, 3.60, 78.3, '52/118', '1320/5180'),
('2501001', 2026, 1, 2, 18, 18, 0, 18, 3.90, 88.5, '28/115', '985/5120')
ON CONFLICT (student_id, year, semester) DO NOTHING;

-- 4. 샘플 비교과 활동 (김명지)
INSERT INTO student_activities (student_id, category, name, activity_date, status, description, mileage, hours, issuer) VALUES
('2501001', 'certificate', 'SQLD', '2025-12-15', 'completed', 'SQL 개발자 자격증 취득', 100, 40, '한국데이터산업진흥원'),
('2501001', 'certificate', 'ADsP', '2026-03-20', 'completed', '데이터분석 준전문가', 80, 30, '한국데이터산업진흥원'),
('2501001', 'seminar', 'AI 트렌드 특강', '2026-04-10', 'completed', 'ChatGPT와 생성형 AI 활용', 20, 3, '경영정보학과'),
('2501001', 'contest', '빅데이터 분석 경진대회', '2026-09-01', 'planned', 'DACON 경진대회 참가 예정', 0, 0, NULL),
('2501001', 'club', 'IT 학술동아리', '2025-03-01', 'completed', '2학기 활동 완료', 50, 40, 'MIS 학회');

-- 5. 이경영 (경영학과 3학년) 데이터
INSERT INTO student_courses (student_id, year, semester, course_number, course_name, completion_type, credits, grade, professor) VALUES
('2401001', 2024, 1, 'BUS101', '경영학원론', '전공필수', 3, 'A0', '김원론'),
('2401001', 2024, 1, 'BUS102', '회계원리', '전공필수', 3, 'B+', '이회계'),
('2401001', 2024, 2, 'BUS201', '재무관리', '전공', 3, 'A+', '최재무'),
('2401001', 2024, 2, 'BUS202', '마케팅관리', '전공', 3, 'A0', '이마케팅'),
('2401001', 2025, 1, 'BUS301', '전략경영론', '전공', 3, 'A0', '박전략'),
('2401001', 2025, 1, 'BUS302', '인적자원관리', '전공', 3, 'B+', '홍인사'),
('2401001', 2025, 2, 'BUS303', '국제경영론', '전공', 3, 'A+', '서국제'),
('2401001', 2025, 2, 'BUS304', '조직행동론', '전공', 3, 'A0', '정조직');

INSERT INTO student_grades (student_id, year, semester, grade_year, registered_credits, acquired_credits, general_credits, major_credits, gpa, percentile, semester_rank, overall_rank)
VALUES
('2401001', 2024, 1, 1, 18, 18, 6, 12, 3.50, 78.5, '48/98', '1580/4230'),
('2401001', 2024, 2, 1, 18, 18, 3, 15, 3.75, 82.3, '38/95', '1320/4150'),
('2401001', 2025, 1, 2, 18, 18, 3, 15, 3.68, 80.5, '42/92', '1420/4080'),
('2401001', 2025, 2, 2, 18, 18, 0, 18, 3.82, 84.2, '35/90', '1180/4020')
ON CONFLICT (student_id, year, semester) DO NOTHING;

-- 6. 박신입 (무전공 1학년) 데이터 - 수강 이력 거의 없음
INSERT INTO student_courses (student_id, year, semester, course_number, course_name, completion_type, credits, grade, professor) VALUES
('2501002', 2025, 1, 'GEN001', '대학생활과 진로설계', '교양', 2, 'A0', '김진로'),
('2501002', 2025, 1, 'GEN002', '글쓰기와 의사소통', '교양', 3, 'B+', '박작문'),
('2501002', 2025, 1, 'GEN003', '컴퓨터활용', '교양', 3, 'A0', '정컴퓨터');

INSERT INTO student_grades (student_id, year, semester, grade_year, registered_credits, acquired_credits, general_credits, major_credits, gpa, percentile, semester_rank, overall_rank)
VALUES
('2501002', 2025, 1, 1, 8, 8, 8, 0, 3.50, 75.0, '156/320', '3245/6890')
ON CONFLICT (student_id, year, semester) DO NOTHING;
