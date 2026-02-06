-- 테스트용 신입 계정 10개 생성 (무전공)
-- 비밀번호: test1234 (SHA-256 해시)
-- 해시값: 937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244

INSERT INTO students (student_id, password_hash, name, name_eng, department, grade, email, admission_year, status)
VALUES
  ('60251001', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생1', 'Test Student 1', '무전공', 1, 'test1@mju.ac.kr', 2025, '재학'),
  ('60251002', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생2', 'Test Student 2', '무전공', 1, 'test2@mju.ac.kr', 2025, '재학'),
  ('60251003', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생3', 'Test Student 3', '무전공', 1, 'test3@mju.ac.kr', 2025, '재학'),
  ('60251004', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생4', 'Test Student 4', '무전공', 1, 'test4@mju.ac.kr', 2025, '재학'),
  ('60251005', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생5', 'Test Student 5', '무전공', 1, 'test5@mju.ac.kr', 2025, '재학'),
  ('60251006', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생6', 'Test Student 6', '무전공', 1, 'test6@mju.ac.kr', 2025, '재학'),
  ('60251007', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생7', 'Test Student 7', '무전공', 1, 'test7@mju.ac.kr', 2025, '재학'),
  ('60251008', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생8', 'Test Student 8', '무전공', 1, 'test8@mju.ac.kr', 2025, '재학'),
  ('60251009', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생9', 'Test Student 9', '무전공', 1, 'test9@mju.ac.kr', 2025, '재학'),
  ('60251010', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', '테스트학생10', 'Test Student 10', '무전공', 1, 'test10@mju.ac.kr', 2025, '재학')
ON CONFLICT (student_id) DO NOTHING;

-- 생성된 계정 확인
SELECT student_id, name, department, grade, admission_year FROM students WHERE student_id LIKE '6025100%';
