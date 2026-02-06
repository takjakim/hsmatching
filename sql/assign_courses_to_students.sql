-- 학생들에게 전공 교과목 할당 스크립트
-- Supabase SQL Editor에서 실행

-- 1. 학과명 → major_courses 매핑 테이블 (임시)
CREATE TEMP TABLE IF NOT EXISTS dept_mapping (
  student_dept VARCHAR(100),
  mc_department VARCHAR(100),
  mc_major VARCHAR(100)
);

INSERT INTO dept_mapping (student_dept, mc_department, mc_major) VALUES
  -- 인문대학
  ('중어중문학과', '아시아·중동어문학부', '중어중문학전공'),
  ('일어일문학과', '아시아·중동어문학부', '일어일문학전공'),
  ('아랍지역학과', '아시아·중동어문학부', '아랍지역학전공'),
  ('국어국문학과', '인문콘텐츠학부', '국어국문학전공'),
  ('영어영문학과', '인문콘텐츠학부', '영어영문학전공'),
  ('문헌정보학과', '인문콘텐츠학부', '문헌정보학전공'),
  ('문예창작학과', '문예창작학과', ''),
  -- 사회과학대학
  ('행정학과', '공공인재학부', '행정학전공'),
  ('정치외교학과', '공공인재학부', '정치외교학전공'),
  ('경제학과', '경상·통계학부', '경제학전공'),
  ('법학과', '법학과', ''),
  -- 경영대학
  ('경영학과', '경영학부', '경영학전공'),
  ('경영정보학과', '경영정보학과', ''),
  -- 미디어·휴먼라이프대학
  ('디지털미디어학과', '디지털미디어학부', ''),
  ('청소년지도학과', '청소년지도·아동학부', '청소년지도학전공'),
  ('아동학과', '청소년지도·아동학부', '아동학전공'),
  -- 인공지능·소프트웨어융합대학
  ('응용소프트웨어학과', '융합소프트웨어학부', '응용소프트웨어전공'),
  ('데이터사이언스학과', '융합소프트웨어학부', '데이터사이언스전공'),
  ('디지털콘텐츠디자인학과', '디지털콘텐츠디자인학과', ''),
  -- 화학·생명과학대학
  ('화학나노학과', '화학·에너지융합학부', '화학나노학전공'),
  ('식품영양학과', '융합바이오학부', '식품영양학전공'),
  ('시스템생명과학과', '융합바이오학부', '시스템생명과학전공')
ON CONFLICT DO NOTHING;

-- 2. 특정 학생에게 전공 교과목 할당 (예시)
-- 사용법: student_id와 과목 수를 수정하여 실행

-- 예시: 학번 '2501001' 학생에게 전공 교과목 5개 할당
DO $$
DECLARE
  target_student_id VARCHAR := '2501001';  -- 대상 학번
  courses_to_add INT := 5;                  -- 할당할 과목 수
  target_year INT := 2025;                  -- 학년도
  target_semester INT := 1;                 -- 학기
  v_student_dept VARCHAR;
  v_mc_dept VARCHAR;
  v_mc_major VARCHAR;
  course_rec RECORD;
  grades TEXT[] := ARRAY['A+', 'A0', 'B+', 'B0', 'C+', 'C0'];
  counter INT := 0;
BEGIN
  -- 학생 학과 조회
  SELECT department INTO v_student_dept
  FROM students
  WHERE student_id = target_student_id;

  IF v_student_dept IS NULL THEN
    RAISE NOTICE 'Student not found: %', target_student_id;
    RETURN;
  END IF;

  -- 매핑 조회
  SELECT dm.mc_department, dm.mc_major INTO v_mc_dept, v_mc_major
  FROM dept_mapping dm
  WHERE dm.student_dept = v_student_dept;

  IF v_mc_dept IS NULL THEN
    RAISE NOTICE 'No mapping for department: %', v_student_dept;
    RETURN;
  END IF;

  RAISE NOTICE 'Assigning courses for student % (dept: % -> %, %)',
    target_student_id, v_student_dept, v_mc_dept, v_mc_major;

  -- 전공 교과목에서 랜덤으로 선택하여 할당
  FOR course_rec IN
    SELECT course_name
    FROM major_courses
    WHERE department = v_mc_dept
      AND (v_mc_major = '' OR major = v_mc_major OR major = '')
    ORDER BY RANDOM()
    LIMIT courses_to_add
  LOOP
    counter := counter + 1;

    INSERT INTO student_courses (
      student_id, year, semester, course_number, course_name,
      completion_type, credits, grade, professor
    ) VALUES (
      target_student_id,
      target_year,
      target_semester,
      'MC' || LPAD(counter::TEXT, 4, '0'),
      course_rec.course_name,
      '전필',
      3,
      grades[1 + floor(random() * array_length(grades, 1))::INT],
      NULL
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Added: %', course_rec.course_name;
  END LOOP;

  RAISE NOTICE 'Total courses added: %', counter;
END $$;

-- 3. 모든 학생에게 전공 교과목 할당 (배치)
-- 주의: 실행 전 확인 필요!

/*
DO $$
DECLARE
  student_rec RECORD;
  course_rec RECORD;
  v_mc_dept VARCHAR;
  v_mc_major VARCHAR;
  counter INT;
  grades TEXT[] := ARRAY['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+'];
  courses_per_student INT := 5;
  target_year INT := 2025;
  target_semester INT := 1;
BEGIN
  FOR student_rec IN
    SELECT s.student_id, s.department
    FROM students s
    WHERE s.department IS NOT NULL AND s.department != '무전공'
  LOOP
    -- 매핑 조회
    SELECT dm.mc_department, dm.mc_major INTO v_mc_dept, v_mc_major
    FROM dept_mapping dm
    WHERE dm.student_dept = student_rec.department;

    IF v_mc_dept IS NULL THEN
      RAISE NOTICE 'Skipping student % (no mapping for %)',
        student_rec.student_id, student_rec.department;
      CONTINUE;
    END IF;

    counter := 0;

    FOR course_rec IN
      SELECT course_name
      FROM major_courses
      WHERE department = v_mc_dept
        AND (v_mc_major = '' OR major = v_mc_major OR major = '')
      ORDER BY RANDOM()
      LIMIT courses_per_student
    LOOP
      counter := counter + 1;

      INSERT INTO student_courses (
        student_id, year, semester, course_number, course_name,
        completion_type, credits, grade
      ) VALUES (
        student_rec.student_id,
        target_year,
        target_semester,
        'MC' || student_rec.student_id || LPAD(counter::TEXT, 2, '0'),
        course_rec.course_name,
        '전필',
        3,
        grades[1 + floor(random() * array_length(grades, 1))::INT]
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Student %: % courses added', student_rec.student_id, counter;
  END LOOP;
END $$;
*/

-- 4. 확인 쿼리

-- 학생별 수강 과목 수 확인
SELECT
  s.student_id,
  s.name,
  s.department,
  COUNT(sc.id) as course_count
FROM students s
LEFT JOIN student_courses sc ON s.student_id = sc.student_id
GROUP BY s.student_id, s.name, s.department
ORDER BY s.student_id;

-- 특정 학생의 수강 과목 목록
-- SELECT * FROM student_courses WHERE student_id = '2501001';
