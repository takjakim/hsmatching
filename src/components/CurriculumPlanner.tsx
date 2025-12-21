import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MIS_ALL_COURSES, 
  MIS_RECOMMENDED_CAREERS,
  MIS_MODULES,
  MIS_MICRO_DEGREES,
  CURRENT_STUDENT,
  getCourseGrade,
  getModuleForCourse,
  getModuleProgress,
  getMicroDegreeProgress,
  getCoursesByGradeUpTo
} from "../data/dummyData";
import { Course } from "../types/student";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

// 학기 정보 타입
interface SemesterSlot {
  year: number;
  semester: number;
  label: string;
  courses: PlannedCourse[];
}

// 계획된 과목 타입
interface PlannedCourse extends Course {
  plannedId: string;
  targetGrade?: number; // 이수예정 학년
  isCompleted?: boolean; // 이미 수강 완료한 과목인지
}

// 저장 데이터 타입
interface SavedPlan {
  name: string;
  createdAt: string;
  updatedAt: string;
  semesters: { [key: string]: string[] };
}

interface CurriculumPlannerProps {
  riasecResult?: Record<Dim, number> | null;
}

export default function CurriculumPlanner({ riasecResult }: CurriculumPlannerProps) {
  const initialSemesters: SemesterSlot[] = [
    { year: 1, semester: 1, label: "1학년 1학기", courses: [] },
    { year: 1, semester: 2, label: "1학년 2학기", courses: [] },
    { year: 2, semester: 1, label: "2학년 1학기", courses: [] },
    { year: 2, semester: 2, label: "2학년 2학기", courses: [] },
    { year: 3, semester: 1, label: "3학년 1학기", courses: [] },
    { year: 3, semester: 2, label: "3학년 2학기", courses: [] },
    { year: 4, semester: 1, label: "4학년 1학기", courses: [] },
    { year: 4, semester: 2, label: "4학년 2학기", courses: [] },
  ];

  const [semesters, setSemesters] = useState<SemesterSlot[]>(initialSemesters);
  const [availableCourses, setAvailableCourses] = useState<PlannedCourse[]>([]);
  const [draggedCourse, setDraggedCourse] = useState<PlannedCourse | null>(null);
  const [planName, setPlanName] = useState("나의 커리큘럼 계획");
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [selectedCareerTrack, setSelectedCareerTrack] = useState<string | null>(null);

  // 교과목 풀 초기화 (학년 정보 포함) + 이미 수강한 과목 자동 배치
  useEffect(() => {
    // 이미 수강한 과목들 (현재 학년까지)
    const completedCourses = getCoursesByGradeUpTo(CURRENT_STUDENT.grade);
    const completedCourseNumbers = new Set(completedCourses.map(c => c.courseNumber));

    // 모든 과목에 ID 부여
    const allCoursesWithId: PlannedCourse[] = MIS_ALL_COURSES.map((course, idx) => ({
      ...course,
      plannedId: `course-${idx}-${course.courseNumber}`,
      targetGrade: getCourseGrade(course.courseNumber),
      isCompleted: completedCourseNumbers.has(course.courseNumber)
    }));

    // 이미 수강한 과목들은 해당 학기에 자동 배치
    const newSemesters = initialSemesters.map(sem => ({ ...sem, courses: [] as PlannedCourse[] }));
    const placedIds = new Set<string>();

    allCoursesWithId.forEach(course => {
      if (course.isCompleted) {
        const targetYear = course.targetGrade || getCourseGrade(course.courseNumber) || 1;
        const courseSemester = course.semester || 1;
        const semIdx = (targetYear - 1) * 2 + (courseSemester - 1);

        if (semIdx >= 0 && semIdx < 8) {
          newSemesters[semIdx].courses.push(course);
          placedIds.add(course.plannedId);
        }
      }
    });

    // 미수강 과목들만 교과목 풀에 표시
    const remaining = allCoursesWithId.filter(c => !placedIds.has(c.plannedId));

    setSemesters(newSemesters);
    setAvailableCourses(remaining);

    const saved = localStorage.getItem('curriculumPlans');
    if (saved) {
      setSavedPlans(JSON.parse(saved));
    }
  }, []);

  // 배치된 모든 과목 번호
  const placedCourseNumbers = useMemo(() => {
    const numbers: string[] = [];
    semesters.forEach(sem => {
      sem.courses.forEach(c => numbers.push(c.courseNumber));
    });
    return numbers;
  }, [semesters]);

  // 모듈 이수 현황
  const moduleProgress = useMemo(() => {
    return getModuleProgress(placedCourseNumbers);
  }, [placedCourseNumbers]);

  // 마이크로디그리 이수 현황
  const microDegreeProgress = useMemo(() => {
    return getMicroDegreeProgress(placedCourseNumbers);
  }, [placedCourseNumbers]);

  // 총 학점 계산
  const totalCredits = useMemo(() => {
    return semesters.reduce((sum, sem) => 
      sum + sem.courses.reduce((s, c) => s + c.credits, 0), 0
    );
  }, [semesters]);

  // 학기별 학점
  const semesterCredits = useMemo(() => {
    return semesters.map(sem => 
      sem.courses.reduce((sum, c) => sum + c.credits, 0)
    );
  }, [semesters]);

  // 드래그 시작
  const handleDragStart = (course: PlannedCourse) => {
    setDraggedCourse(course);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedCourse(null);
  };

  // 학기에 드롭
  const handleDropToSemester = (targetSemesterIndex: number) => {
    if (!draggedCourse) return;

    const targetSemester = semesters[targetSemesterIndex];
    if (targetSemester.courses.find(c => c.plannedId === draggedCourse.plannedId)) {
      return;
    }

    const newSemesters = semesters.map((sem) => ({
      ...sem,
      courses: sem.courses.filter(c => c.plannedId !== draggedCourse.plannedId)
    }));

    setAvailableCourses(prev => prev.filter(c => c.plannedId !== draggedCourse.plannedId));

    newSemesters[targetSemesterIndex].courses.push(draggedCourse);
    setSemesters(newSemesters);
    setDraggedCourse(null);
  };

  // 교과목 풀로 되돌리기
  const handleReturnToPool = (course: PlannedCourse) => {
    const newSemesters = semesters.map(sem => ({
      ...sem,
      courses: sem.courses.filter(c => c.plannedId !== course.plannedId)
    }));
    setSemesters(newSemesters);

    if (!availableCourses.find(c => c.plannedId === course.plannedId)) {
      setAvailableCourses(prev => [...prev, course]);
    }
  };

  // 계획 저장
  const savePlan = () => {
    const semesterData: { [key: string]: string[] } = {};
    semesters.forEach(sem => {
      const key = `${sem.year}-${sem.semester}`;
      semesterData[key] = sem.courses.map(c => c.courseNumber);
    });

    const newPlan: SavedPlan = {
      name: planName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      semesters: semesterData
    };

    const existingIndex = savedPlans.findIndex(p => p.name === planName);
    let updatedPlans: SavedPlan[];
    
    if (existingIndex >= 0) {
      updatedPlans = [...savedPlans];
      updatedPlans[existingIndex] = { ...newPlan, createdAt: savedPlans[existingIndex].createdAt };
    } else {
      updatedPlans = [...savedPlans, newPlan];
    }

    setSavedPlans(updatedPlans);
    localStorage.setItem('curriculumPlans', JSON.stringify(updatedPlans));
    setShowSaveModal(false);
    alert('계획이 저장되었습니다!');
  };

  // 계획 불러오기
  const loadPlan = (plan: SavedPlan) => {
    const allCourses: PlannedCourse[] = MIS_ALL_COURSES.map((course, idx) => ({
      ...course,
      plannedId: `course-${idx}-${course.courseNumber}`,
      targetGrade: getCourseGrade(course.courseNumber)
    }));

    const newSemesters = initialSemesters.map(sem => {
      const key = `${sem.year}-${sem.semester}`;
      const courseNumbers = plan.semesters[key] || [];
      const courses = courseNumbers
        .map(cn => allCourses.find(c => c.courseNumber === cn))
        .filter(Boolean) as PlannedCourse[];
      return { ...sem, courses };
    });

    const placedIds = new Set<string>();
    newSemesters.forEach(sem => {
      sem.courses.forEach(c => placedIds.add(c.plannedId));
    });
    
    const remaining = allCourses.filter(c => !placedIds.has(c.plannedId));

    setSemesters(newSemesters);
    setAvailableCourses(remaining);
    setPlanName(plan.name);
    setShowLoadModal(false);
  };

  // 계획 초기화 (이수 완료 과목은 유지)
  const resetPlan = () => {
    if (confirm('현재 계획을 초기화하시겠습니까? (이미 수강한 과목은 유지됩니다)')) {
      // 이미 수강한 과목들 (현재 학년까지)
      const completedCourses = getCoursesByGradeUpTo(CURRENT_STUDENT.grade);
      const completedCourseNumbers = new Set(completedCourses.map(c => c.courseNumber));

      const allCoursesWithId: PlannedCourse[] = MIS_ALL_COURSES.map((course, idx) => ({
        ...course,
        plannedId: `course-${idx}-${course.courseNumber}`,
        targetGrade: getCourseGrade(course.courseNumber),
        isCompleted: completedCourseNumbers.has(course.courseNumber)
      }));

      // 이미 수강한 과목들은 해당 학기에 자동 배치
      const newSemesters = initialSemesters.map(sem => ({ ...sem, courses: [] as PlannedCourse[] }));
      const placedIds = new Set<string>();

      allCoursesWithId.forEach(course => {
        if (course.isCompleted) {
          const targetYear = course.targetGrade || getCourseGrade(course.courseNumber) || 1;
          const courseSemester = course.semester || 1;
          const semIdx = (targetYear - 1) * 2 + (courseSemester - 1);

          if (semIdx >= 0 && semIdx < 8) {
            newSemesters[semIdx].courses.push(course);
            placedIds.add(course.plannedId);
          }
        }
      });

      // 미수강 과목들만 교과목 풀에 표시
      const remaining = allCoursesWithId.filter(c => !placedIds.has(c.plannedId));

      setSemesters(newSemesters);
      setAvailableCourses(remaining);
      setSelectedCareerTrack(null);
    }
  };

  // 추천 트랙 적용
  const applyCareerTrack = (careerTitle: string) => {
    const career = MIS_RECOMMENDED_CAREERS.find(c => c.title === careerTitle);
    if (!career) return;

    const allCourses: PlannedCourse[] = MIS_ALL_COURSES.map((course, idx) => ({
      ...course,
      plannedId: `course-${idx}-${course.courseNumber}`,
      targetGrade: getCourseGrade(course.courseNumber)
    }));

    // 트랙 관련 교과목만 필터링 (relatedCourses에 포함된 교과목)
    const relatedCourseNames = career.relatedCourses;
    const trackCourses = allCourses.filter(course => 
      relatedCourseNames.some(rc => 
        course.courseName.includes(rc) || 
        rc.includes(course.courseName) ||
        // 부분 매칭 (예: "데이터분석" -> "데이터분석프로그래밍", "데이터베이스활용" 등)
        course.courseName.toLowerCase().includes(rc.toLowerCase()) ||
        rc.toLowerCase().includes(course.courseName.toLowerCase())
      )
    );

    // 1학년 필수 교과목도 포함
    const requiredCourses = allCourses.filter(course => 
      course.completionType === '학문기초' || 
      course.completionType === '전공필수' ||
      course.courseName.includes('경영학입문') ||
      course.courseName.includes('경제학원론') ||
      course.courseName.includes('경상통계학') ||
      course.courseName.includes('경영정보') ||
      course.courseName.includes('프로그래밍기초')
    );

    // 트랙 관련 교과목 + 필수 교과목 합치기 (중복 제거)
    const coursesToPlace = [...new Map([
      ...requiredCourses.map(c => [c.plannedId, c]),
      ...trackCourses.map(c => [c.plannedId, c])
    ]).values()];

    const newSemesters = initialSemesters.map(sem => ({ ...sem, courses: [] as PlannedCourse[] }));
    const placedIds = new Set<string>();

    coursesToPlace.forEach(course => {
      const targetYear = course.targetGrade || getCourseGrade(course.courseNumber) || 1;
      const semester = course.semester || 1;
      const semIdx = (targetYear - 1) * 2 + (semester - 1);

      if (semIdx >= 0 && semIdx < 8) {
        newSemesters[semIdx].courses.push(course);
        placedIds.add(course.plannedId);
      }
    });

    const remaining = allCourses.filter(c => !placedIds.has(c.plannedId));
    
    setSemesters(newSemesters);
    setAvailableCourses(remaining);
    setSelectedCareerTrack(careerTitle);
  };

  // 학년별 색상
  const getGradeColor = (grade: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500'
    };
    return colors[grade] || 'bg-gray-400';
  };

  const getGradeBgColor = (grade: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-50 border-green-300',
      2: 'bg-blue-50 border-blue-300',
      3: 'bg-purple-50 border-purple-300',
      4: 'bg-orange-50 border-orange-300'
    };
    return colors[grade] || 'bg-gray-50 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">📐 나의 4년 커리큘럼 플래너</h2>
            <p className="text-gray-600 text-sm">교과목 블럭을 드래그하여 나만의 커리어 경로를 설계하세요</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowLoadModal(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              📂 불러오기
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              💾 저장하기
            </button>
            <button
              onClick={resetPlan}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
            >
              🔄 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 통계 및 모듈/마이크로디그리 현황 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 학점 통계 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> 학점 현황
          </h3>
          
          {/* 120학점 기준 이수율 원형 차트 */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  fill="none"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - Math.min(totalCredits / 120, 1))}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - Math.min(totalCredits / 120, 1)) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">{Math.round((totalCredits / 120) * 100)}%</p>
                  <p className="text-[10px] text-gray-500">이수율</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 총 학점 / 졸업 학점 */}
          <div className="text-center mb-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-2xl font-bold text-blue-600">{totalCredits}</span>
            <span className="text-gray-500 text-sm"> / 120 학점</span>
          </div>

          {/* 학년별 학점 */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(year => (
              <div key={year} className="text-center">
                <div className="text-lg font-bold text-gray-700">
                  {semesterCredits[(year-1)*2] + semesterCredits[(year-1)*2+1]}
                </div>
                <div className="text-xs text-gray-500">{year}학년</div>
              </div>
            ))}
          </div>
        </div>

        {/* 모듈 이수 현황 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📦</span> 모듈 이수 현황
          </h3>
          <div className="space-y-3">
            {moduleProgress.map(({ module, completed, total, isComplete }) => (
              <div key={module.id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: module.color }}
                    />
                    <span className={`text-sm font-medium ${isComplete ? 'text-gray-800' : 'text-gray-600'}`}>
                      {module.name}
                    </span>
                    {isComplete && <span className="text-green-500 text-xs">✓</span>}
                  </div>
                  <span className="text-xs text-gray-500">{completed}/{total}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completed / total) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: module.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 마이크로디그리 현황 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎓</span> 마이크로디그리 현황
          </h3>
          <div className="space-y-4">
            {microDegreeProgress.map(({ microDegree, modulesCompleted, totalModules, isComplete, modules }) => (
              <div 
                key={microDegree.id} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  isComplete 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{microDegree.icon}</span>
                    <span className={`font-bold ${isComplete ? 'text-green-700' : 'text-gray-700'}`}>
                      {microDegree.name}
                    </span>
                  </div>
                  {isComplete && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-bold">
                      획득!
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {modules.map(({ module, isComplete: modComplete }) => (
                    <div 
                      key={module.id}
                      className={`flex-1 px-2 py-1 rounded text-xs text-center ${
                        modComplete 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {module.name.split(' ')[0]}
                      {modComplete && ' ✓'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 플래너 영역 */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* 교과목 풀 - 사이드바 (sticky) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 bg-white rounded-xl shadow-sm p-4 max-h-[400px] lg:max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
              <span>📚</span> 교과목 풀
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {availableCourses.length}개
              </span>
            </h3>
          
          {/* 학년별 필터/범례 */}
          <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-gray-200">
            {[1, 2, 3, 4].map(grade => (
              <div key={grade} className="flex items-center gap-1 text-xs">
                <div className={`w-3 h-3 rounded-full ${getGradeColor(grade)}`} />
                <span className="text-gray-600">{grade}학년</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            {availableCourses.map(course => {
              const grade = course.targetGrade || getCourseGrade(course.courseNumber);
              const module = getModuleForCourse(course.courseNumber);
              
              return (
                <motion.div
                  key={course.plannedId}
                  draggable
                  onDragStart={() => handleDragStart(course)}
                  onDragEnd={handleDragEnd}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg cursor-grab active:cursor-grabbing border-2 transition-all ${
                    draggedCourse?.plannedId === course.plannedId 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : `${getGradeBgColor(grade)} hover:border-blue-300`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {/* 학년 배지 */}
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold text-white ${getGradeColor(grade)}`}>
                          {grade}학년
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          course.completionType === '전공필수' ? 'bg-red-100 text-red-700' :
                          course.completionType === '전공' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.credits}학점
                        </span>
                        {/* 모듈 표시 */}
                        {module && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: module.color }}
                          >
                            {module.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800 text-sm truncate">{course.courseName}</p>
                      <p className="text-xs text-gray-500 truncate">{course.professor}</p>
                    </div>
                    <div className="text-gray-400 pl-2">⋮⋮</div>
                  </div>
                </motion.div>
              );
            })}

            {availableCourses.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm">모든 과목을 배치했습니다!</p>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* 8학기 그리드 */}
        <div className="lg:col-span-3 grid md:grid-cols-2 gap-4">
          {semesters.map((semester, semIdx) => (
            <motion.div
              key={`${semester.year}-${semester.semester}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropToSemester(semIdx)}
              className={`bg-white rounded-xl shadow-md p-4 min-h-[200px] transition-all ${
                draggedCourse ? 'ring-2 ring-blue-300 ring-dashed' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getGradeColor(semester.year)}`}>
                    {semester.year}-{semester.semester}
                  </span>
                  {semester.label}
                </h4>
                <div className="flex items-center gap-2">
                  {semester.courses.some(c => c.isCompleted) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ {semester.courses.filter(c => c.isCompleted).length}개 이수
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {semesterCredits[semIdx]}학점
                  </span>
                </div>
              </div>

              <div className="space-y-2 min-h-[120px]">
                <AnimatePresence>
                  {semester.courses.map(course => {
                    const grade = course.targetGrade || getCourseGrade(course.courseNumber);
                    const module = getModuleForCourse(course.courseNumber);
                    
                    return (
                      <motion.div
                        key={course.plannedId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        draggable={!course.isCompleted}
                        onDragStart={() => !course.isCompleted && handleDragStart(course)}
                        onDragEnd={handleDragEnd}
                        className={`p-2 rounded-lg border transition-all ${
                          course.isCompleted 
                            ? 'bg-green-50 border-green-300 cursor-default'
                            : draggedCourse?.plannedId === course.plannedId
                              ? 'border-blue-500 bg-blue-50 shadow-lg cursor-grab active:cursor-grabbing'
                              : `${getGradeBgColor(grade)} hover:border-blue-300 cursor-grab active:cursor-grabbing`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* 수강 완료 표시 */}
                              {course.isCompleted && (
                                <span className="px-1 py-0.5 rounded text-xs font-bold bg-green-500 text-white">
                                  ✓
                                </span>
                              )}
                              {/* 학년 배지 */}
                              <span className={`px-1 py-0.5 rounded text-xs font-bold text-white ${getGradeColor(grade)}`}>
                                {grade}
                              </span>
                              <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                course.completionType === '전공필수' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {course.credits}
                              </span>
                              {/* 모듈 인디케이터 */}
                              {module && (
                                <span 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: module.color }}
                                  title={module.name}
                                />
                              )}
                              <span className={`font-medium text-sm truncate ${course.isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                                {course.courseName}
                              </span>
                            </div>
                          </div>
                          {!course.isCompleted && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReturnToPool(course);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1 transition"
                              title="교과목 풀로 되돌리기"
                            >
                              ✕
                            </button>
                          )}
                          {course.isCompleted && (
                            <span className="text-green-500 text-xs font-medium px-1">이수완료</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {semester.courses.length === 0 && (
                  <div className={`h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg p-4 ${
                    draggedCourse ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'
                  }`}>
                    {draggedCourse ? '여기에 놓으세요' : '과목을 드래그하세요'}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 추천 트랙 빠른 적용 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💼</span> 추천 트랙 빠른 적용
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          클릭하면 해당 트랙에 맞게 교과목이 자동 배치됩니다
        </p>
        <div className="flex flex-wrap gap-3">
          {MIS_RECOMMENDED_CAREERS.slice(0, 4).map((career) => (
            <button
              key={career.title}
              onClick={() => applyCareerTrack(career.title)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCareerTrack === career.title
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {career.title}
            </button>
          ))}
        </div>
      </div>

      {/* 저장 모달 */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">💾 계획 저장</h3>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="계획 이름을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  onClick={savePlan}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  저장
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 불러오기 모달 */}
      <AnimatePresence>
        {showLoadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowLoadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">📂 저장된 계획</h3>
              
              {savedPlans.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  저장된 계획이 없습니다
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlans.map((plan, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadPlan(plan)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-left"
                    >
                      <div className="font-medium text-gray-800">{plan.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        저장: {new Date(plan.updatedAt).toLocaleDateString('ko-KR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowLoadModal(false)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
