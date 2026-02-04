import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CURRENT_STUDENT,
  MIS_ALL_COURSES,
  getCourseGrade,
  getModuleForCourse,
  getModuleProgress,
  getMicroDegreeProgress,
  getCoursesByGradeUpTo,
  getCurrentGrades
} from "../data/dummyData";
import { Course } from "../types/student";
import { exportToDocx, exportToPdfSimple } from "../utils/exportPlanner";
import { recommendMajors, type RecommendedMajor } from "../utils/recommendMajors";
import { getMajorHierarchyEntries, type MajorHierarchyEntry } from "../data/majorList";
import subjectListCsv from "../../subject_lst.csv?raw";

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
  majorName: string;
  createdAt: string;
  updatedAt: string;
  semesters: { [key: string]: string[] };
}

// 나만의 전공 조합 타입
interface CustomMajorPlan {
  id: string;
  name: string;  // User-defined name like "데이터 사이언티스트 트랙"
  majors: {
    primary: string;
    secondary?: string;
    minor?: string;
  };
  createdAt: string;
}

interface CurriculumPlannerProps {
  riasecResult?: Record<Dim, number> | null;
}

interface SubjectMajorOption {
  fullName: string;
  shortName: string;
}

interface SelectedMajor {
  fullName: string;
  shortName: string;
  matchScore?: number;
}

interface SubjectCourseRow {
  majorName: string;
  courseName: string;
}

const MIS_MAJOR_NAME = "경영정보학과";

const SUBJECT_COURSE_ROWS = parseSubjectList(subjectListCsv);
const SUBJECT_MAJOR_MAP = SUBJECT_COURSE_ROWS.reduce((map, row) => {
  if (!map.has(row.majorName)) {
    map.set(row.majorName, []);
  }
  map.get(row.majorName)!.push(row.courseName);
  return map;
}, new Map<string, string[]>());

const SUBJECT_MAJOR_OPTIONS: SubjectMajorOption[] = Array.from(
  new Map<string, SubjectMajorOption>(
    [
      { fullName: MIS_MAJOR_NAME, shortName: getMajorShortName(MIS_MAJOR_NAME) },
      ...Array.from(SUBJECT_MAJOR_MAP.keys()).map((fullName) => ({
        fullName,
        shortName: getMajorShortName(fullName)
      }))
    ].map((option) => [option.fullName, option])
  ).values()
).sort((a, b) => a.fullName.localeCompare(b.fullName, "ko"));

const SUBJECT_COURSE_CACHE = new Map<string, Course[]>();

const MAJOR_HIERARCHY_ENTRIES = getMajorHierarchyEntries();

interface MajorHierarchyDepartment {
  name: string;
  majors: SelectedMajor[];
}

interface MajorHierarchyCollege {
  name: string;
  departments: MajorHierarchyDepartment[];
}

function normalizeMajorName(value: string) {
  return value.replace(/\s+/g, "").replace(/[·]/g, "");
}

function normalizeKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^0-9A-Za-z가-힣]+/g, "")
    .slice(0, 24);
}

function getMajorShortName(fullName: string) {
  const trimmed = fullName.trim();
  const parts = trimmed.split(" ");
  return parts[parts.length - 1] || trimmed;
}

function getHierarchyMajorFullName(entry: MajorHierarchyEntry) {
  if (entry.major && entry.major !== entry.department) {
    return `${entry.department} ${entry.major}`;
  }
  return entry.department;
}

function parseSubjectList(csvText: string): SubjectCourseRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  const result: SubjectCourseRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const [majorName, courseName] = line.split(",");
    if (!majorName || !courseName) continue;

    result.push({
      majorName: majorName.trim(),
      courseName: courseName.trim()
    });
  }

  return result;
}

function buildCourseNumber(majorName: string, index: number) {
  const majorKey = normalizeKey(majorName) || "MAJOR";
  return `SUBJ-${majorKey}-${index + 1}`;
}

function getSubjectCoursesForMajor(majorName: string): Course[] {
  if (!majorName) return [];

  const normalizedMajor = normalizeMajorName(majorName);
  if (normalizedMajor === normalizeMajorName(MIS_MAJOR_NAME)) {
    return MIS_ALL_COURSES;
  }

  const cached = SUBJECT_COURSE_CACHE.get(majorName);
  if (cached) return cached;

  const courseNames = SUBJECT_MAJOR_MAP.get(majorName) || [];
  const courses = courseNames.map((courseName, index) => ({
    year: new Date().getFullYear(),
    semester: 1,
    courseNumber: buildCourseNumber(majorName, index),
    courseName,
    completionType: "전공",
    credits: 3,
    timeAndRoom: "",
    retake: false,
    professor: ""
  }));

  SUBJECT_COURSE_CACHE.set(majorName, courses);
  return courses;
}

function findSubjectMajorByName(name: string): SubjectMajorOption | null {
  const normalizedTarget = normalizeMajorName(name);

  const exact = SUBJECT_MAJOR_OPTIONS.find(
    (option) => normalizeMajorName(option.fullName) === normalizedTarget
  );
  if (exact) return exact;

  const matches = SUBJECT_MAJOR_OPTIONS.filter((option) =>
    normalizeMajorName(option.fullName).includes(normalizedTarget)
  );
  if (matches.length === 0) return null;

  return matches.sort((a, b) => a.fullName.length - b.fullName.length)[0];
}

export default function CurriculumPlanner({ riasecResult }: CurriculumPlannerProps) {
  const plannerRef = useRef<HTMLDivElement>(null);

  const recommendedMajors = useMemo<RecommendedMajor[]>(() => {
    if (!riasecResult) return [];
    return recommendMajors(riasecResult, { limit: 3 });
  }, [riasecResult]);

  const recommendedMajorOptions = useMemo<SelectedMajor[]>(() => {
    return recommendedMajors.map((major) => {
      const mapped = findSubjectMajorByName(major.name);
      if (!mapped) {
        return {
          fullName: major.name,
          shortName: major.name,
          matchScore: major.matchScore
        };
      }
      return {
        fullName: mapped.fullName,
        shortName: mapped.shortName,
        matchScore: major.matchScore
      };
    });
  }, [recommendedMajors]);

  const [selectedMajors, setSelectedMajors] = useState<SelectedMajor[]>([]);
  const [activeMajor, setActiveMajor] = useState<string>("");
  const [majorPlanners, setMajorPlanners] = useState<{ [key: string]: SemesterSlot[] }>({});
  const [majorQuery, setMajorQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const hasInitializedRecommended = useRef(false);

  useEffect(() => {
    if (hasInitializedRecommended.current) return;
    if (recommendedMajorOptions.length === 0) return;

    setSelectedMajors(recommendedMajorOptions);
    if (!activeMajor) {
      setActiveMajor(recommendedMajorOptions[0].fullName);
    }
    hasInitializedRecommended.current = true;
  }, [recommendedMajorOptions, activeMajor]);

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

  // 학점 비공개 토글
  const [isGpaHidden, setIsGpaHidden] = useState(false);

  // 내보내기 드롭다운
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // 나만의 전공 조합 관련 상태
  const [customMajorName, setCustomMajorName] = useState("");
  const [showCustomMajorModal, setShowCustomMajorModal] = useState(false);
  const [savedCustomMajors, setSavedCustomMajors] = useState<CustomMajorPlan[]>([]);

  // 학점 정보
  const gradesData = getCurrentGrades();

  const majorHierarchy = useMemo<MajorHierarchyCollege[]>(() => {
    const collegeMap = new Map<string, Map<string, Map<string, SelectedMajor>>>();

    MAJOR_HIERARCHY_ENTRIES.forEach((entry) => {
      const fullName = getHierarchyMajorFullName(entry);
      if (!collegeMap.has(entry.college)) {
        collegeMap.set(entry.college, new Map());
      }
      const departmentMap = collegeMap.get(entry.college)!;
      if (!departmentMap.has(entry.department)) {
        departmentMap.set(entry.department, new Map());
      }
      const majorMap = departmentMap.get(entry.department)!;
      if (!majorMap.has(fullName)) {
        majorMap.set(fullName, {
          fullName,
          shortName: entry.majorName || getMajorShortName(fullName)
        });
      }
    });

    return Array.from(collegeMap.entries())
      .map(([collegeName, departmentMap]) => ({
        name: collegeName,
        departments: Array.from(departmentMap.entries())
          .map(([departmentName, majorMap]) => ({
            name: departmentName,
            majors: Array.from(majorMap.values()).sort((a, b) =>
              a.fullName.localeCompare(b.fullName, "ko")
            )
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, []);

  const selectedCollegeEntry = useMemo(
    () => majorHierarchy.find((college) => college.name === selectedCollege) || null,
    [majorHierarchy, selectedCollege]
  );
  const departmentOptions = selectedCollegeEntry?.departments ?? [];
  const selectedDepartmentEntry = useMemo(
    () => departmentOptions.find((department) => department.name === selectedDepartment) || null,
    [departmentOptions, selectedDepartment]
  );

  const filteredMajorOptions = useMemo(() => {
    const majors = selectedDepartmentEntry?.majors ?? [];
    const query = majorQuery.trim();
    if (!query) return majors;

    const normalizedQuery = normalizeMajorName(query);
    return majors.filter((major) =>
      normalizeMajorName(major.fullName).includes(normalizedQuery) ||
      normalizeMajorName(major.shortName).includes(normalizedQuery)
    );
  }, [selectedDepartmentEntry, majorQuery]);

  const majorSearchOptions = useMemo(() => {
    const query = majorQuery.trim();
    if (!query) return [] as SelectedMajor[];

    const normalizedQuery = normalizeMajorName(query);
    const unique = new Map<string, SelectedMajor>();

    majorHierarchy.forEach((college) => {
      college.departments.forEach((department) => {
        department.majors.forEach((major) => {
          if (
            normalizeMajorName(major.fullName).includes(normalizedQuery) ||
            normalizeMajorName(major.shortName).includes(normalizedQuery)
          ) {
            if (!unique.has(major.fullName)) {
              unique.set(major.fullName, major);
            }
          }
        });
      });
    });

    return Array.from(unique.values());
  }, [majorHierarchy, majorQuery]);

  useEffect(() => {
    if (selectedCollege || majorHierarchy.length === 0) return;
    setSelectedCollege(majorHierarchy[0].name);
  }, [majorHierarchy, selectedCollege]);

  useEffect(() => {
    if (!selectedCollege) {
      if (selectedDepartment) {
        setSelectedDepartment("");
      }
      return;
    }

    const college = majorHierarchy.find((entry) => entry.name === selectedCollege);
    const departments = college?.departments ?? [];
    if (departments.length === 0) {
      if (selectedDepartment) {
        setSelectedDepartment("");
      }
      return;
    }

    if (!departments.some((department) => department.name === selectedDepartment)) {
      setSelectedDepartment(departments[0].name);
    }
  }, [majorHierarchy, selectedCollege, selectedDepartment]);

  const activeMajorLabel = useMemo(() => {
    if (!activeMajor) return "";
    const selected = selectedMajors.find((major) => major.fullName === activeMajor);
    return selected?.shortName || getMajorShortName(activeMajor);
  }, [activeMajor, selectedMajors]);

  const buildPlannedCourses = (majorName: string) => {
    const completedCourses = getCoursesByGradeUpTo(CURRENT_STUDENT.grade);
    const completedCourseNumbers = new Set(completedCourses.map((c) => c.courseNumber));

    return getSubjectCoursesForMajor(majorName).map((course, idx) => ({
      ...course,
      plannedId: `course-${idx}-${course.courseNumber}`,
      targetGrade: getCourseGrade(course.courseNumber),
      isCompleted: completedCourseNumbers.has(course.courseNumber)
    }));
  };

  // 교과목 풀 초기화 함수
  const initializeSemesters = (majorName?: string) => {
    const newSemesters = initialSemesters.map(sem => ({ ...sem, courses: [] as PlannedCourse[] }));
    if (!majorName) {
      return { newSemesters, remaining: [] as PlannedCourse[] };
    }

    const allCoursesWithId = buildPlannedCourses(majorName);
    const placedIds = new Set<string>();

    // 이미 수강한 과목 배치
    allCoursesWithId.forEach(course => {
      if (course.isCompleted) {
        const targetYear = course.targetGrade || getCourseGrade(course.courseNumber);
        if (!targetYear) return;
        const courseSemester = course.semester || 1;
        const semIdx = (targetYear - 1) * 2 + (courseSemester - 1);

        if (semIdx >= 0 && semIdx < 8) {
          newSemesters[semIdx].courses.push(course);
          placedIds.add(course.plannedId);
        }
      }
    });

    const remaining = allCoursesWithId.filter(c => !placedIds.has(c.plannedId));

    return { newSemesters, remaining };
  };

  useEffect(() => {
    const saved = localStorage.getItem('curriculumPlans');
    if (saved) {
      setSavedPlans(JSON.parse(saved));
    }

    // Load custom major combinations
    const savedCustom = localStorage.getItem('customMajorPlans');
    if (savedCustom) {
      setSavedCustomMajors(JSON.parse(savedCustom));
    }
  }, []);

  useEffect(() => {
    if (!activeMajor) {
      setSemesters(initialSemesters);
      setAvailableCourses([]);
      return;
    }

    if (majorPlanners[activeMajor]) {
      setSemesters(majorPlanners[activeMajor]);

      const placedIds = new Set<string>();
      majorPlanners[activeMajor].forEach(sem => {
        sem.courses.forEach(c => placedIds.add(c.plannedId));
      });

      const allCoursesWithId = buildPlannedCourses(activeMajor);
      setAvailableCourses(allCoursesWithId.filter(c => !placedIds.has(c.plannedId)));
      return;
    }

    const { newSemesters, remaining } = initializeSemesters(activeMajor);
    setSemesters(newSemesters);
    setAvailableCourses(remaining);
    setMajorPlanners(prev => ({ ...prev, [activeMajor]: newSemesters }));
  }, [activeMajor, majorPlanners]);

  const handleSelectMajor = (major: SelectedMajor) => {
    setSelectedMajors(prev => {
      const exists = prev.some(item => item.fullName === major.fullName);
      if (exists) {
        const next = prev.filter(item => item.fullName !== major.fullName);
        if (activeMajor === major.fullName) {
          setActiveMajor(next[0]?.fullName || "");
        }
        return next;
      }
      setActiveMajor(major.fullName);
      return [...prev, major];
    });
  };

  const handleSelectCollege = (collegeName: string) => {
    if (collegeName === selectedCollege) return;
    setSelectedCollege(collegeName);
    const college = majorHierarchy.find((entry) => entry.name === collegeName);
    setSelectedDepartment(college?.departments[0]?.name || "");
  };

  const handleSelectDepartment = (departmentName: string) => {
    setSelectedDepartment(departmentName);
  };

  const handleRemoveMajor = (majorName: string) => {
    setSelectedMajors(prev => {
      const next = prev.filter(item => item.fullName !== majorName);
      if (activeMajor === majorName) {
        setActiveMajor(next[0]?.fullName || "");
      }
      return next;
    });
  };

  const handleTabChange = (majorName: string) => {
    if (!majorName || majorName === activeMajor) return;

    if (activeMajor) {
      setMajorPlanners(prev => ({
        ...prev,
        [activeMajor]: semesters
      }));
    }

    setActiveMajor(majorName);
  };

  // 내보내기 함수들
  const handleExportDocx = async () => {
    if (!activeMajorLabel) {
      alert('전공을 선택한 후 저장할 수 있습니다.');
      return;
    }
    setShowExportDropdown(false);
    try {
      await exportToDocx(
        `${activeMajorLabel}_커리큘럼`,
        CURRENT_STUDENT.name,
        CURRENT_STUDENT.department,
        semesters,
        {
          totalCredits: totalCredits,
          acquiredCredits: gradesData.totalAcquiredCredits,
          averageGpa: gradesData.averageGpa,
          lastSemesterGpa: gradesData.lastSemesterGpa
        },
        activeMajorLabel
      );
      alert('DOCX 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('DOCX 내보내기 오류:', error);
      alert('DOCX 내보내기에 실패했습니다. 필요한 라이브러리가 설치되어 있는지 확인해주세요.');
    }
  };

  const handleExportPdf = async () => {
    if (!activeMajorLabel) {
      alert('전공을 선택한 후 저장할 수 있습니다.');
      return;
    }
    setShowExportDropdown(false);
    try {
      await exportToPdfSimple(
        `${activeMajorLabel}_커리큘럼`,
        CURRENT_STUDENT.name,
        CURRENT_STUDENT.department,
        semesters,
        {
          totalCredits: totalCredits,
          acquiredCredits: gradesData.totalAcquiredCredits,
          averageGpa: gradesData.averageGpa,
          lastSemesterGpa: gradesData.lastSemesterGpa
        },
        activeMajorLabel
      );
      alert('PDF 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      alert('PDF 내보내기에 실패했습니다.');
    }
  };

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
    if (!activeMajor) {
      alert('전공을 선택한 후 저장할 수 있습니다.');
      return;
    }

    const semesterData: { [key: string]: string[] } = {};
    semesters.forEach(sem => {
      const key = `${sem.year}-${sem.semester}`;
      semesterData[key] = sem.courses.map(c => c.courseNumber);
    });

    const newPlan: SavedPlan = {
      name: planName,
      majorName: activeMajor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      semesters: semesterData
    };

    const existingIndex = savedPlans.findIndex(
      p => p.name === planName && p.majorName === activeMajor
    );
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
    const targetMajor = plan.majorName || activeMajor;
    if (!targetMajor) {
      alert('전공을 선택한 후 불러올 수 있습니다.');
      return;
    }

    const allCourses = buildPlannedCourses(targetMajor);

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
    setMajorPlanners(prev => ({ ...prev, [targetMajor]: newSemesters }));
    setActiveMajor(targetMajor);
    setSelectedMajors(prev => {
      if (prev.some(major => major.fullName === targetMajor)) {
        return prev;
      }
      const option = SUBJECT_MAJOR_OPTIONS.find(item => item.fullName === targetMajor) || findSubjectMajorByName(targetMajor);
      const shortName = option?.shortName || getMajorShortName(targetMajor);
      return [...prev, { fullName: targetMajor, shortName }];
    });
    setShowLoadModal(false);
  };

  // 계획 초기화 (이수 완료 과목은 유지)
  const resetPlan = () => {
    if (!activeMajor) {
      alert('전공을 선택한 후 초기화할 수 있습니다.');
      return;
    }
    if (confirm('현재 계획을 초기화하시겠습니까? (이미 수강한 과목은 유지됩니다)')) {
      const allCoursesWithId = buildPlannedCourses(activeMajor);

      // 이미 수강한 과목들은 해당 학기에 자동 배치
      const newSemesters = initialSemesters.map(sem => ({ ...sem, courses: [] as PlannedCourse[] }));
      const placedIds = new Set<string>();

      allCoursesWithId.forEach(course => {
        if (course.isCompleted) {
          const targetYear = course.targetGrade || getCourseGrade(course.courseNumber);
          if (!targetYear) return;
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
      setMajorPlanners(prev => ({ ...prev, [activeMajor]: newSemesters }));
    }
  };

  // 나만의 전공 조합 저장
  const saveCustomMajor = () => {
    if (!customMajorName.trim()) {
      alert('조합 이름을 입력해주세요.');
      return;
    }

    if (selectedMajors.length < 2) {
      alert('최소 2개 이상의 전공을 선택해야 합니다.');
      return;
    }

    const newCustomMajor: CustomMajorPlan = {
      id: Date.now().toString(),
      name: customMajorName,
      majors: {
        primary: selectedMajors[0]?.fullName || "",
        secondary: selectedMajors[1]?.fullName,
        minor: selectedMajors[2]?.fullName,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedCustomMajors, newCustomMajor];
    setSavedCustomMajors(updated);
    localStorage.setItem('customMajorPlans', JSON.stringify(updated));
    setShowCustomMajorModal(false);
    setCustomMajorName("");
    alert('나만의 전공 조합이 저장되었습니다!');
  };

  // 저장된 나만의 전공 조합 불러오기
  const loadCustomMajor = (customPlan: CustomMajorPlan) => {
    const majorsToLoad: SelectedMajor[] = [];

    if (customPlan.majors.primary) {
      const primary = SUBJECT_MAJOR_OPTIONS.find(opt => opt.fullName === customPlan.majors.primary) ||
                      findSubjectMajorByName(customPlan.majors.primary);
      if (primary) {
        majorsToLoad.push({
          fullName: primary.fullName,
          shortName: primary.shortName
        });
      }
    }

    if (customPlan.majors.secondary) {
      const secondary = SUBJECT_MAJOR_OPTIONS.find(opt => opt.fullName === customPlan.majors.secondary) ||
                        findSubjectMajorByName(customPlan.majors.secondary);
      if (secondary) {
        majorsToLoad.push({
          fullName: secondary.fullName,
          shortName: secondary.shortName
        });
      }
    }

    if (customPlan.majors.minor) {
      const minor = SUBJECT_MAJOR_OPTIONS.find(opt => opt.fullName === customPlan.majors.minor) ||
                    findSubjectMajorByName(customPlan.majors.minor);
      if (minor) {
        majorsToLoad.push({
          fullName: minor.fullName,
          shortName: minor.shortName
        });
      }
    }

    if (majorsToLoad.length > 0) {
      setSelectedMajors(majorsToLoad);
      setActiveMajor(majorsToLoad[0].fullName);
      alert(`"${customPlan.name}" 조합을 불러왔습니다.`);
    }
  };

  // 저장된 나만의 전공 조합 삭제
  const deleteCustomMajor = (id: string) => {
    if (confirm('이 전공 조합을 삭제하시겠습니까?')) {
      const updated = savedCustomMajors.filter(plan => plan.id !== id);
      setSavedCustomMajors(updated);
      localStorage.setItem('customMajorPlans', JSON.stringify(updated));
      alert('전공 조합이 삭제되었습니다.');
    }
  };

  // 학년별 색상
  const getGradeColor = (grade: number | undefined) => {
    if (!grade) return 'bg-slate-400';
    const colors: Record<number, string> = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500'
    };
    return colors[grade] || 'bg-slate-400';
  };

  const getGradeBgColor = (grade: number | undefined) => {
    if (!grade) return 'bg-slate-50 border-slate-300';
    const colors: Record<number, string> = {
      1: 'bg-green-50 border-green-300',
      2: 'bg-blue-50 border-blue-300',
      3: 'bg-purple-50 border-purple-300',
      4: 'bg-orange-50 border-orange-300'
    };
    return colors[grade] || 'bg-slate-50 border-slate-300';
  };

  return (
    <div className="space-y-4" ref={plannerRef} id="curriculum-planner">


      {/* 나만의 전공 조합 섹션 */}
      {selectedMajors.length > 1 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-indigo-800 flex items-center gap-2">
              <span>🎨</span> 나만의 전공 조합
            </h3>
            <button
              onClick={() => setShowCustomMajorModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              조합 저장하기
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {selectedMajors.map((major, idx) => (
              <div key={major.fullName} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  idx === 0 ? 'bg-indigo-600 text-white' :
                  idx === 1 ? 'bg-purple-500 text-white' :
                  'bg-pink-500 text-white'
                }`}>
                  {idx === 0 ? '주전공' : idx === 1 ? '복수전공' : '부전공'}: {major.shortName}
                </span>
                {idx < selectedMajors.length - 1 && <span className="text-gray-400">+</span>}
              </div>
            ))}
          </div>

          <p className="text-sm text-indigo-600">
            💡 여러 전공의 교과목을 조합하여 나만의 커리어 경로를 설계하세요.
          </p>

          {/* 저장된 나만의 전공 조합 목록 */}
          {savedCustomMajors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-700 mb-2">저장된 조합:</h4>
              <div className="flex flex-wrap gap-2">
                {savedCustomMajors.map((customPlan) => (
                  <div key={customPlan.id} className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 border border-indigo-200">
                    <button
                      onClick={() => loadCustomMajor(customPlan)}
                      className="text-sm text-indigo-700 hover:text-indigo-900 font-medium"
                    >
                      {customPlan.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomMajor(customPlan.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-end px-4 pt-2 bg-gray-50 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {selectedMajors.map((major, idx) => {
            const isActive = activeMajor === major.fullName;
            return (
              <button
                key={major.fullName}
                onClick={() => handleTabChange(major.fullName)}
                className={`
                  relative px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg mr-1 border-t border-x min-w-[120px]
                  ${isActive
                    ? 'bg-white border-gray-200 border-b-white text-blue-600 z-10 -mb-[1px] shadow-[0_-2px_5px_rgba(0,0,0,0.02)]'
                    : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-base ${isActive ? '' : 'grayscale opacity-70'}`}>
                    {idx === 0 ? '📊' : idx === 1 ? '💼' : '🤖'}
                  </span>
                  <span className="truncate max-w-[100px]">{major.shortName}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMajor(major.fullName);
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors z-20 cursor-pointer"
                    title="제거"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                </div>
                {isActive && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-lg" />
                )}
              </button>
            );
          })}

          {selectedMajors.length === 0 && (
            <div className="px-6 py-3 text-sm text-gray-400 italic">
              상단에서 전공을 선택해주세요.
            </div>
          )}
        </div>

        {/* 헤더 콘텐츠 */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2 tracking-tight">
                📐 {activeMajorLabel || "전공 선택"} 커리큘럼 플래너
              </h2>
              <p className="text-gray-500 text-xs">교과목 블럭을 드래그하여 나만의 커리어 경로를 설계하세요</p>
            </div>

            <div className="flex justify-end gap-2 flex-wrap">
              <button
                onClick={() => setShowLoadModal(true)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium text-sm"
              >
                📂 불러오기
              </button>

              {/* 저장하기 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center gap-1 text-sm"
                >
                  💾 저장하기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showExportDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <button
                        onClick={() => {
                          setShowExportDropdown(false);
                          setShowSaveModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>🌐</span> 브라우저 저장
                      </button>
                      <button
                        onClick={handleExportDocx}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>📄</span> DOCX 다운로드
                      </button>
                      <button
                        onClick={handleExportPdf}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>📕</span> PDF 다운로드
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={resetPlan}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium text-sm"
              >
                🔄 초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 학점 이수현황 (개선된 버전) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>📊</span> 학점 이수현황
            </h3>
            <button
              onClick={() => setIsGpaHidden(!isGpaHidden)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                isGpaHidden
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {isGpaHidden ? '🔒 비공개' : '🔓 공개'}
            </button>
          </div>

          {/* 120학점 기준 이수율 원형 차트 */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(gradesData.totalAcquiredCredits / 120, 1))}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(gradesData.totalAcquiredCredits / 120, 1)) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-base font-bold text-blue-600">{Math.round((gradesData.totalAcquiredCredits / 120) * 100)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* 학점 정보 */}
          <div className="space-y-3">
            {/* 이수 학점 */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">이수 학점</span>
              <span className="font-bold text-gray-800">
                {gradesData.totalAcquiredCredits} / 120
              </span>
            </div>

            {/* 직전학기 평점 */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">직전학기 평점</span>
              <span className={`font-bold ${isGpaHidden ? 'blur-sm select-none' : 'text-purple-600'}`}>
                {gradesData.lastSemesterGpa?.toFixed(2) || '-'} / 4.5
              </span>
            </div>

            {/* 전체 평점 */}
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 text-sm">전체 평점</span>
              <span className={`font-bold ${isGpaHidden ? 'blur-sm select-none' : 'text-blue-600'}`}>
                {gradesData.averageGpa.toFixed(2)} / 4.5
              </span>
            </div>
          </div>

          {/* 학년별 학점 미니 바 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2">학년별 배치 학점</div>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map(year => {
                const yearCredits = semesterCredits[(year-1)*2] + semesterCredits[(year-1)*2+1];
                return (
                  <div key={year} className="text-center">
                    <div className="h-8 bg-gray-100 rounded-sm relative overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min((yearCredits / 36) * 100, 100)}%` }}
                        className={`absolute bottom-0 left-0 right-0 ${getGradeColor(year)}`}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{yearCredits}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 h-full overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>🔍</span> 전공 탐색
              </h2>
              {recommendedMajorOptions.length > 0 && (
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-semibold text-gray-500 hidden sm:inline-block">추천 전공:</span>
                   <div className="flex gap-1.5">
                     {recommendedMajorOptions.map((major) => (
                       <button
                         key={major.fullName}
                         onClick={() => handleSelectMajor(major)}
                         className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full transition-colors border border-indigo-100 text-xs font-medium"
                         title={major.fullName}
                       >
                         <span>{major.shortName}</span>
                         {typeof major.matchScore === "number" && (
                           <span className="text-[10px] font-bold opacity-80 bg-white/50 px-1 rounded">
                             {major.matchScore}%
                           </span>
                         )}
                       </button>
                     ))}
                   </div>
                 </div>
              )}
            </div>

            <div className="p-4 flex flex-col h-full gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={majorQuery}
                  onChange={(e) => setMajorQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm placeholder-gray-400"
                  placeholder="전공명 검색 (예: 경영, 정보...)" 
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {majorQuery && (
                  <button 
                    onClick={() => setMajorQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <span className="sr-only">Clear</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden min-h-[220px] shadow-sm relative">
                  {majorQuery ? (
                    <div className="absolute inset-0 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                      {majorSearchOptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs">검색 결과가 없습니다.</span>
                        </div>
                      ) : (
                        majorSearchOptions.map(opt => {
                          const isSelected = selectedMajors.some(m => m.fullName === opt.fullName);
                          return (
                            <button
                              key={opt.fullName}
                              onClick={() => handleSelectMajor(opt)}
                              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors ${
                                isSelected 
                                  ? 'bg-blue-50 text-blue-700 font-medium' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="truncate">{opt.fullName}</span>
                                <span className="text-xs text-gray-400 shrink-0">({opt.shortName})</span>
                              </div>
                              {isSelected && <span className="text-blue-600 text-xs">선택됨</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 h-full divide-x divide-gray-100 absolute inset-0">
                      <div className="flex flex-col bg-gray-50/50">
                        <div className="px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50 sticky top-0">
                          계열/단과대
                        </div>
                        <div className="overflow-y-auto custom-scrollbar flex-1 p-1 space-y-0.5">
                          {majorHierarchy.map(college => (
                            <button
                              key={college.name}
                              onClick={() => handleSelectCollege(college.name)}
                              className={`w-full text-left px-2.5 py-1.5 rounded text-[13px] transition-all ${
                                selectedCollege === college.name
                                  ? 'bg-white text-blue-700 font-bold shadow-sm ring-1 ring-black/5 z-10'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              {college.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col bg-white">
                        <div className="px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-white sticky top-0">
                          학부/학과
                        </div>
                        <div className="overflow-y-auto custom-scrollbar flex-1 p-1 space-y-0.5">
                          {departmentOptions.map(dept => (
                            <button
                              key={dept.name}
                              onClick={() => handleSelectDepartment(dept.name)}
                              className={`w-full text-left px-2.5 py-1.5 rounded text-[13px] transition-all ${
                                selectedDepartment === dept.name
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              {dept.name}
                            </button>
                          ))}
                          {departmentOptions.length === 0 && (
                            <div className="px-3 py-10 text-xs text-gray-400 text-center">
                              선택해주세요
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col bg-white">
                        <div className="px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-white sticky top-0">
                          전공
                        </div>
                        <div className="overflow-y-auto custom-scrollbar flex-1 p-1 space-y-0.5">
                          {filteredMajorOptions.map(major => {
                             const isSelected = selectedMajors.some(m => m.fullName === major.fullName);
                             return (
                              <button
                                key={major.fullName}
                                onClick={() => handleSelectMajor(major)}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-[13px] transition-all flex items-center justify-between group ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-700 font-bold'
                                    : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-600'
                                }`}
                              >
                                <span className="truncate">{major.shortName}</span>
                                {isSelected && <span className="text-blue-500 text-[10px] font-bold">✓</span>}
                              </button>
                             );
                          })}
                           {filteredMajorOptions.length === 0 && selectedDepartment && (
                            <div className="px-3 py-10 text-xs text-gray-400 text-center">
                              전공이 없습니다
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 플래너 영역 */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* 교과목 풀 - 사이드바 (sticky) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 bg-white rounded-lg border border-gray-200 p-3 max-h-[400px] lg:max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm">
              <span>📚</span> 교과목 풀
              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
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
                  className={`p-2.5 rounded-md cursor-grab active:cursor-grabbing border transition-all ${
                    draggedCourse?.plannedId === course.plannedId 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : `${getGradeBgColor(grade)} hover:border-blue-300`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {/* 학년 배지 */}
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold text-white ${getGradeColor(grade)}`}>
                          {grade ? `${grade}학년` : '미정'}
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
              className={`bg-white rounded-lg border border-gray-200 p-3 min-h-[180px] transition-all ${
                draggedCourse ? 'ring-2 ring-blue-300 ring-dashed' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2 border-b border-gray-50 pb-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getGradeColor(semester.year)}`}>
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
                                {grade ? `${grade}학년` : '미정'}
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

      {/* 나만의 전공 조합 저장 모달 */}
      <AnimatePresence>
        {showCustomMajorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCustomMajorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">💾 나만의 전공 조합 저장</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  조합 이름 (예: "AI 비즈니스 트랙")
                </label>
                <input
                  type="text"
                  value={customMajorName}
                  onChange={(e) => setCustomMajorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="나만의 전공 조합 이름"
                />
              </div>

              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-600 font-medium">포함된 전공:</p>
                {selectedMajors.map((major, idx) => (
                  <div key={major.fullName} className="flex items-center gap-2">
                    <span className={`text-sm font-bold px-2 py-1 rounded ${
                      idx === 0 ? 'bg-indigo-100 text-indigo-700' :
                      idx === 1 ? 'bg-purple-100 text-purple-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {idx === 0 ? '주전공' : idx === 1 ? '복수전공' : '부전공'}
                    </span>
                    <span className="text-sm text-gray-800">{major.fullName}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomMajorModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  onClick={saveCustomMajor}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  저장
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
