import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CURRENT_STUDENT,
  MIS_STUDENT,
  MIS_CAREER_ROADMAP,
  MIS_RECOMMENDED_CAREERS,
  getMISCurriculum,
  getCoursesByGradeUpTo,
  ROLE_MODELS,
  compareWithRoleModel,
  CareerRoadmap
} from "../data/dummyData";
import CurriculumPlanner from "../components/CurriculumPlanner";
import TutorialOverlay from "../components/TutorialOverlay";
import LearningAccount from "../components/LearningAccount";
import ConnectionLinks from "../components/ConnectionLinks";
import StepGuideFlow from "../components/StepGuideFlow";
import ExtracurricularRecommendation from "../components/ExtracurricularRecommendation";
import EAdvisorCertificateModal from "../components/EAdvisorCertificateModal";
import { getGraduateRoleModelsByMajor, getAllGraduateRoleModels, GraduateRoleModel, getMajorAssessmentsByStudentId, MajorAssessment, getRolemodelSelectionByStudentId, saveRolemodelSelection, getGraduateRoleModelsByIds } from "../../lib/supabase";
import { recommendMajors } from "../utils/recommendMajors";
import { CURRENT_STUDENT as DUMMY_STUDENT } from "../data/dummyData";

interface CareerRoadmapPageProps {
  onNavigate?: (page: string) => void;
  riasecResult?: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null;
  initialViewMode?: 'roadmap' | 'careers' | 'planner' | 'rolemodels' | 'extracurricular';
  competencyResult?: any; // Add support for competency test result
  recommendedMajor?: string | null; // 첫 번째 추천 전공
  currentStudentId?: string | null; // 학생 ID 추가
}

// 비교과 활동 더미 데이터 (기존 호환성을 위해 유지 - 실제로는 dummyData.ts에서 가져옴)

export default function CareerRoadmapPage({ onNavigate, riasecResult, competencyResult, initialViewMode = 'planner', recommendedMajor, currentStudentId }: CareerRoadmapPageProps) {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_STUDENT.grade || 1);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'roadmap' | 'careers' | 'planner' | 'rolemodels' | 'extracurricular'>(initialViewMode);
  const [showTutorial, setShowTutorial] = useState(false);

  // 졸업생 롤모델 데이터 (DB에서 가져옴)
  const [graduateRoleModels, setGraduateRoleModels] = useState<GraduateRoleModel[]>([]);
  const [isLoadingRoleModels, setIsLoadingRoleModels] = useState(false);
  // 모든 카드 확장 여부
  const [isAllCardsExpanded, setIsAllCardsExpanded] = useState(false);
  // 선택된 롤모델 카드들 (DB에서 복원)
  const [selectedRoleModelCards, setSelectedRoleModelCards] = useState<Set<number>>(new Set());
  // 롤모델 탐색 완료 여부 (카드가 없어도 탐색했으면 완료)
  const [hasExploredRoleModels, setHasExploredRoleModels] = useState(false);
  // DB 로딩 완료 여부 (저장 중복 방지)
  const [isRoleModelDataLoaded, setIsRoleModelDataLoaded] = useState(false);

  // 완료된 전공능력진단 목록 (DB에서 가져옴)
  const [completedMajorAssessments, setCompletedMajorAssessments] = useState<MajorAssessment[]>([]);
  // 롤모델 검색에 선택된 전공 목록
  const [selectedMajorsForRoleModels, setSelectedMajorsForRoleModels] = useState<string[]>([]);
  // 선택된 롤모델들의 상세 정보 (비교과 프로그램 포함) - ExtracurricularRecommendation에 사용
  const [selectedRoleModelsWithDetails, setSelectedRoleModelsWithDetails] = useState<GraduateRoleModel[]>([]);
  // 이수증 모달 상태
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // RIASEC 결과 기반 추천 전공 목록
  const riasecRecommendedMajors = useMemo(() => {
    if (!riasecResult) return [];
    const riasecWithV = { ...riasecResult, V: 0 };
    return recommendMajors(riasecWithV, { limit: 5 });
  }, [riasecResult]);

  // 사용 가능한 전공 목록 (완료된 전공능력진단 + RIASEC 추천 전공)
  const availableMajorsForRoleModels = useMemo(() => {
    const majors: { key: string; name: string; source: 'assessment' | 'riasec'; score?: number }[] = [];

    // 완료된 전공능력진단 추가
    completedMajorAssessments.forEach(a => {
      majors.push({
        key: a.major_key,
        name: a.major_name,
        source: 'assessment',
        score: a.avg_score
      });
    });

    // RIASEC 추천 전공 추가 (중복 제외)
    riasecRecommendedMajors.forEach(m => {
      if (!majors.some(existing => existing.name === m.name)) {
        majors.push({
          key: m.key,
          name: m.name,
          source: 'riasec',
          score: m.matchScore
        });
      }
    });

    return majors;
  }, [completedMajorAssessments, riasecRecommendedMajors]);

  // DB에서 롤모델 선택 정보 가져오기
  useEffect(() => {
    async function fetchRoleModelSelection() {
      if (!currentStudentId) return;

      try {
        const selection = await getRolemodelSelectionByStudentId(currentStudentId);
        if (selection) {
          setSelectedRoleModelCards(new Set(selection.selected_graduate_ids || []));
          setHasExploredRoleModels(selection.has_explored || false);
          // DB에 저장된 전공 필터가 있으면 불러옴
          if (selection.selected_majors && selection.selected_majors.length > 0) {
            setSelectedMajorsForRoleModels(selection.selected_majors);
          }
        }
      } catch (error) {
        console.error('Failed to fetch role model selection:', error);
      } finally {
        setIsRoleModelDataLoaded(true);
      }
    }

    fetchRoleModelSelection();
  }, [currentStudentId]);

  // 완료된 전공능력진단 목록 가져오기
  useEffect(() => {
    async function fetchMajorAssessments() {
      if (!currentStudentId) return;

      try {
        const assessments = await getMajorAssessmentsByStudentId(currentStudentId);
        const completed = assessments.filter(a => (a.completion_percentage || 0) >= 100);
        setCompletedMajorAssessments(completed);

        // DB에서 가져온 전공이 없을 때만 기본값 설정
        // (isRoleModelDataLoaded가 true가 될 때까지 기다려야 함)
      } catch (error) {
        console.error('Failed to fetch major assessments:', error);
      }
    }

    fetchMajorAssessments();
  }, [currentStudentId, recommendedMajor]);

  // Bridge trigger removed - bridges now only show on step completion, not page entry

  // DB 로딩 완료 후, 저장된 전공이 없으면 기본값 설정
  useEffect(() => {
    if (!isRoleModelDataLoaded) return;
    // 이미 DB에서 불러온 전공이 있으면 건너뜀
    if (selectedMajorsForRoleModels.length > 0) return;

    // 기본 선택: 완료된 전공이 있으면 첫 번째 전공, 없으면 RIASEC 추천 전공
    if (completedMajorAssessments.length > 0) {
      setSelectedMajorsForRoleModels([completedMajorAssessments[0].major_name]);
    } else if (recommendedMajor) {
      setSelectedMajorsForRoleModels([recommendedMajor]);
    }
  }, [isRoleModelDataLoaded, completedMajorAssessments, recommendedMajor, selectedMajorsForRoleModels.length]);

  // 롤모델 선택을 DB에 저장
  useEffect(() => {
    // DB 로딩 전에는 저장하지 않음 (초기 빈 값으로 덮어쓰기 방지)
    if (!currentStudentId || !isRoleModelDataLoaded) return;

    async function saveSelection() {
      try {
        await saveRolemodelSelection(
          currentStudentId!,
          [...selectedRoleModelCards],
          hasExploredRoleModels,
          selectedMajorsForRoleModels
        );
      } catch (error) {
        console.error('Failed to save role model selection:', error);
      }
    }

    saveSelection();
  }, [selectedRoleModelCards, hasExploredRoleModels, selectedMajorsForRoleModels, currentStudentId, isRoleModelDataLoaded]);

  // Bridge trigger removed - bridges now only show on step completion, not page entry

  // 선택된 롤모델들의 상세 정보 로드 (비교과 추천용)
  useEffect(() => {
    async function fetchSelectedRoleModelsWithDetails() {
      if (selectedRoleModelCards.size === 0) {
        setSelectedRoleModelsWithDetails([]);
        return;
      }
      try {
        const graduateIds = Array.from(selectedRoleModelCards);
        const roleModels = await getGraduateRoleModelsByIds(graduateIds);
        setSelectedRoleModelsWithDetails(roleModels);
      } catch (error) {
        console.error('Failed to fetch selected role models with details:', error);
      }
    }
    fetchSelectedRoleModelsWithDetails();
  }, [selectedRoleModelCards]);

  // 선택된 전공 기반 졸업생 롤모델 조회
  useEffect(() => {
    async function fetchRoleModels() {
      if (selectedMajorsForRoleModels.length === 0) {
        setGraduateRoleModels([]);
        return;
      }

      setIsLoadingRoleModels(true);
      try {
        // 선택된 각 전공별로 롤모델 조회
        const allRoleModels: GraduateRoleModel[] = [];
        const seenIds = new Set<number>();

        for (const majorName of selectedMajorsForRoleModels) {
          const roleModels = await getGraduateRoleModelsByMajor(majorName, 30);
          // 중복 제거
          roleModels.forEach(rm => {
            if (!seenIds.has(rm.graduateno)) {
              seenIds.add(rm.graduateno);
              allRoleModels.push(rm);
            }
          });
        }

        // 대기업/공공기관 우선, GPA 높은 순 정렬
        allRoleModels.sort((a, b) => {
          const typeOrder: Record<string, number> = { '대기업': 0, '공공기관': 1, '중소기업': 2 };
          const aOrder = typeOrder[a.company_type || ''] ?? 3;
          const bOrder = typeOrder[b.company_type || ''] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.gpa || 0) - (a.gpa || 0);
        });

        setGraduateRoleModels(allRoleModels);
        // 롤모델 탐색 완료는 카드 선택 시에만 처리 (자동 완료 제거)
      } catch (error) {
        console.error('Failed to fetch role models:', error);
      } finally {
        setIsLoadingRoleModels(false);
      }
    }

    if (viewMode === 'rolemodels') {
      fetchRoleModels();
    }
  }, [selectedMajorsForRoleModels, viewMode]);

  // 졸업생 데이터 기반 AI 인사이트 생성
  const graduateInsights = useMemo(() => {
    if (graduateRoleModels.length === 0) return null;

    // 전체 수강과목 집계
    const allCourses: Record<string, number> = {};
    const allPrograms: Record<string, number> = {};
    const allCerts: Record<string, number> = {};
    const jobTypes: Record<string, number> = {};

    graduateRoleModels.forEach(grad => {
      // 교과목 집계
      grad.courses?.forEach(c => {
        allCourses[c.course_name] = (allCourses[c.course_name] || 0) + 1;
      });
      // 비교과 집계
      grad.programs?.forEach(p => {
        allPrograms[p.program_name] = (allPrograms[p.program_name] || 0) + 1;
      });
      // 자격증 집계
      [grad.cert1, grad.cert2, grad.cert3]
        .filter(c => c && c !== '-')
        .forEach(cert => {
          allCerts[cert!] = (allCerts[cert!] || 0) + 1;
        });
      // 직무유형 집계
      if (grad.job_type) {
        jobTypes[grad.job_type] = (jobTypes[grad.job_type] || 0) + 1;
      }
    });

    // 상위 항목 추출
    const topCourses = Object.entries(allCourses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topPrograms = Object.entries(allPrograms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topCerts = Object.entries(allCerts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topJobTypes = Object.entries(jobTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // 평균 학점
    const gpas = graduateRoleModels.filter(g => g.gpa).map(g => g.gpa!);
    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

    // 어학성적 보유율
    const hasLanguage = graduateRoleModels.filter(g => g.toeic || g.toeic_s || g.opic).length;
    const languageRate = Math.round((hasLanguage / graduateRoleModels.length) * 100);

    // 자격증 보유율
    const hasCert = graduateRoleModels.filter(g => g.cert1 || g.cert2 || g.cert3).length;
    const certRate = Math.round((hasCert / graduateRoleModels.length) * 100);

    return {
      topCourses,
      topPrograms,
      topCerts,
      topJobTypes,
      avgGpa,
      languageRate,
      certRate,
      totalGraduates: graduateRoleModels.length,
      totalCourses: Object.keys(allCourses).length,
      totalPrograms: Object.keys(allPrograms).length
    };
  }, [graduateRoleModels]);

  // 개별 졸업생의 성공 요약 생성 (실제 DB 데이터 기반)
  const generateSuccessSummary = (grad: GraduateRoleModel): string => {
    const highlights: string[] = [];

    // 1. 실제 자격증명 표시 (최대 2개)
    const certs = [grad.cert1, grad.cert2, grad.cert3].filter(c => c && c !== '-');
    if (certs.length > 0) {
      const certNames = certs.slice(0, 2).join(', ');
      highlights.push(certNames);
    }

    // 2. 실제 비교과 프로그램명 표시 (가장 주목할 만한 1개)
    if (grad.programs && grad.programs.length > 0) {
      // 프로그램 이름에서 키워드로 중요도 판단
      const importantKeywords = ['인턴', '현장실습', '공모전', '경진대회', '해외', '글로벌', '창업', '멘토링', 'SW', '코딩', '프로젝트'];
      const importantProgram = grad.programs.find(p =>
        importantKeywords.some(kw => p.program_name.includes(kw))
      );

      if (importantProgram) {
        // 프로그램명이 너무 길면 축약
        const programName = importantProgram.program_name.length > 20
          ? importantProgram.program_name.substring(0, 20) + '...'
          : importantProgram.program_name;
        highlights.push(`'${programName}' 참여`);
      } else if (grad.programs.length >= 3) {
        // 중요 프로그램이 없으면 첫 번째 프로그램 표시
        const firstProgram = grad.programs[0].program_name.length > 15
          ? grad.programs[0].program_name.substring(0, 15) + '...'
          : grad.programs[0].program_name;
        highlights.push(`'${firstProgram}' 외 ${grad.programs.length - 1}개 활동`);
      }
    }

    // 3. 어학 성적 (구체적 점수)
    if (grad.toeic && grad.toeic >= 700) {
      highlights.push(`TOEIC ${grad.toeic}점`);
    } else if (grad.opic && grad.opic !== '-') {
      highlights.push(`OPIc ${grad.opic}`);
    }

    // 4. 주요 수강 과목 (직무 관련 키워드 매칭)
    if (grad.courses && grad.courses.length > 0 && highlights.length < 2) {
      const jobKeywords: Record<string, string[]> = {
        'IT': ['프로그래밍', '데이터', '소프트웨어', '시스템', '네트워크', '보안', '알고리즘'],
        '개발': ['프로그래밍', '데이터', '소프트웨어', '웹', '앱', '코딩'],
        '금융': ['회계', '재무', '경제', '금융', '투자'],
        '기획': ['경영', '마케팅', '전략', '기획'],
        '영업': ['마케팅', '소비자', '광고'],
        '연구': ['통계', '분석', '연구방법론']
      };

      const jobType = grad.job_type || '';
      let relevantKeywords: string[] = [];

      for (const [key, keywords] of Object.entries(jobKeywords)) {
        if (jobType.includes(key)) {
          relevantKeywords = keywords;
          break;
        }
      }

      if (relevantKeywords.length > 0) {
        const relevantCourse = grad.courses.find(c =>
          relevantKeywords.some(kw => c.course_name.includes(kw))
        );
        if (relevantCourse) {
          const courseName = relevantCourse.course_name.length > 12
            ? relevantCourse.course_name.substring(0, 12) + '...'
            : relevantCourse.course_name;
          highlights.push(`'${courseName}' 수강`);
        }
      }
    }

    // 요약문 생성
    if (highlights.length === 0) {
      return `${grad.department} 전공 지식을 바탕으로 ${grad.company_name}에 입사`;
    }

    const highlightText = highlights.slice(0, 2).join(', ');
    return `${highlightText}을 통해 ${grad.company_name} 입사`;
  };

  // Map viewMode to step number
  const viewModeToStep: Record<string, number> = {
    'roadmap': 3, // 전공 탐색
    'careers': 3, // 전공 탐색 (alternative view)
    'rolemodels': 4, // 롤모델 탐색
    'planner': 5, // 커리큘럼 플래너
    'extracurricular': 5 // 비교과 활동 (part of planner stage)
  };

  const currentStepNumber = viewModeToStep[viewMode] || 1;

  // 4단계 완료 조건: 최소 1개 이상 롤모델 카드 선택 필요
  const isStep4Completed = selectedRoleModelCards.size > 0;

  // Define the 5-step flow (대시보드와 동일하게)
  const guideSteps = [
    {
      step: 1,
      title: 'MJU 전공 진로 적합도 검사',
      completed: !!riasecResult,
      action: () => onNavigate?.('riasec')
    },
    {
      step: 2,
      title: '핵심역량진단',
      completed: !!competencyResult,
      action: () => handleStepNavigation(2, () => onNavigate?.('competency'))
    },
    {
      step: 3,
      title: '전공능력진단',
      completed: completedMajorAssessments.length > 0,
      action: () => handleStepNavigation(3, () => onNavigate?.('roadmap-explorer'))
    },
    {
      step: 4,
      title: '롤모델 탐색',
      completed: isStep4Completed,
      action: () => handleStepNavigation(4, () => setViewMode('rolemodels'))
    },
    {
      step: 5,
      title: '커리큘럼 플래너',
      completed: false, // 커리큘럼 진행 여부는 별도 로직 필요
      action: () => handleStepNavigation(5, () => setViewMode('planner'))
    }
  ];

  // 완료된 단계 수 계산
  const completedStepsCount = guideSteps.filter(step => step.completed).length;

  // 이전 단계 완료 여부 체크 (guideSteps 정의 전이라 조건 직접 체크)
  const canAccessStep = (stepNumber: number) => {
    const stepCompletions = [
      true, // step 0 (placeholder)
      !!riasecResult, // step 1
      !!competencyResult, // step 2
      completedMajorAssessments.length > 0, // step 3
      isStep4Completed, // step 4
    ];
    for (let i = 1; i < stepNumber; i++) {
      if (!stepCompletions[i]) return false;
    }
    return true;
  };

  // 단계 이동 핸들러 (접근 가능 여부 체크)
  const handleStepNavigation = (stepNumber: number, navigateAction: () => void) => {
    if (canAccessStep(stepNumber)) {
      navigateAction();
    } else {
      // 미완료 이전 단계 찾기
      const stepCompletions = [
        { step: 1, completed: !!riasecResult, name: 'MJU 전공 진로 적합도 검사' },
        { step: 2, completed: !!competencyResult, name: '핵심역량진단' },
        { step: 3, completed: completedMajorAssessments.length > 0, name: '전공능력진단' },
        { step: 4, completed: isStep4Completed, name: '롤모델 탐색' },
      ];
      const incompleteStep = stepCompletions.find(s => s.step < stepNumber && !s.completed);
      if (incompleteStep) {
        alert(`${incompleteStep.step}단계 "${incompleteStep.name}"을(를) 먼저 완료해주세요.`);
      }
    }
  };

  // 튜토리얼 단계 정의
  const tutorialSteps = useMemo(() => {
    const baseSteps = [
      {
        id: 'welcome',
        title: '전주기 진로 가이드에 오신 것을 환영합니다! 🎓',
        description: '이 페이지에서는 1~4학년 전주기 커리큘럼과 진로 로드맵을 확인할 수 있습니다.',
        position: 'center' as const
      },
      {
        id: 'viewmode',
        title: '뷰 모드 선택',
        description: '4가지 탭을 통해 로드맵, 커리큘럼, 추천 직무, 커리큘럼 플래너를 확인할 수 있습니다.',
        targetSelector: '[data-tutorial="viewmode-tabs"]',
        position: 'bottom' as const
      },
      {
        id: 'year-select',
        title: '학년 선택',
        description: '학년 버튼을 클릭하면 해당 학년의 정보를 확인할 수 있습니다. 추천 직무는 선택한 학년까지의 수강 이력을 기반으로 계산됩니다.',
        targetSelector: '[data-tutorial="year-select"]',
        position: 'bottom' as const
      }
    ];

    // 현재 뷰 모드에 따른 추가 단계
    if (viewMode === 'careers') {
      return [
        ...baseSteps,
        {
          id: 'careers-info',
          title: '학년별 추천 직무',
          description: `${selectedYear}학년까지의 수강 교과목과 MJU 전공 진로 적합도 검사 결과를 바탕으로 직무를 추천합니다. 학년을 변경하면 추천 결과도 달라집니다.`,
          targetSelector: '[data-tutorial="careers-section"]',
          position: 'top' as const
        }
      ];
    } else if (viewMode === 'planner') {
      return [
        ...baseSteps,
        {
          id: 'planner-info',
          title: '커리큘럼 플래너',
          description: '교과목을 드래그하여 8학기 그리드에 배치하고, 나만의 4년 커리큘럼을 설계할 수 있습니다.',
          targetSelector: '[data-tutorial="planner-section"]',
          position: 'top' as const
        }
      ];
    }

    return baseSteps;
  }, [viewMode, selectedYear]);


  // 경영정보학과 학생인지 확인
  const isMISStudent = CURRENT_STUDENT.studentId === MIS_STUDENT.studentId;

  // 현재 학년의 로드맵 정보
  const currentRoadmap = useMemo(() => {
    return MIS_CAREER_ROADMAP.filter(r => r.year === selectedYear);
  }, [selectedYear]);

  // 현재 학년의 커리큘럼
  const currentCurriculum = useMemo(() => {
    return getMISCurriculum(selectedYear);
  }, [selectedYear]);

  // 선택된 학년까지의 수강 교과목 (누적)
  const coursesUpToSelectedYear = useMemo(() => {
    return getCoursesByGradeUpTo(selectedYear);
  }, [selectedYear]);

  // 롤 모델 비교 결과
  const roleModelComparisons = useMemo(() => {
    return ROLE_MODELS.map(roleModel => {
      const comparison = compareWithRoleModel(coursesUpToSelectedYear, roleModel);
      return {
        ...roleModel,
        ...comparison
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [coursesUpToSelectedYear]);

  // 추천 직무 중 RIASEC + 수강 교과목 기반 매칭 점수 계산
  const rankedCareers = useMemo(() => {
    const allCareers = MIS_RECOMMENDED_CAREERS.map(career => {
      let riasecScore = 0;
      let courseScore = 0;
      
      // RIASEC 점수 계산
      if (riasecResult) {
        const riasecKeys = Object.keys(career.riasecMatch) as Array<'R' | 'I' | 'A' | 'S' | 'E' | 'C'>;
        riasecKeys.forEach(key => {
          if (riasecResult[key]) {
            riasecScore += (career.riasecMatch as any)[key] * riasecResult[key];
          }
        });
      }
      
      // 수강 교과목 기반 점수 계산
      const completedCourseNames = coursesUpToSelectedYear.map(c => c.courseName);
      const relatedCourseNames = career.relatedCourses;
      
      // 관련 교과목과 수강 교과목 매칭
      let matchedCourses = 0;
      relatedCourseNames.forEach(relatedCourse => {
        const found = completedCourseNames.some(completed => 
          completed.includes(relatedCourse) || 
          relatedCourse.includes(completed) ||
          // 부분 매칭 (예: "데이터분석" -> "데이터분석프로그래밍")
          completed.toLowerCase().includes(relatedCourse.toLowerCase()) ||
          relatedCourse.toLowerCase().includes(completed.toLowerCase())
        );
        if (found) matchedCourses++;
      });
      
      // 교과목 매칭 점수: 관련 교과목 중 수강한 비율
      if (relatedCourseNames.length > 0) {
        courseScore = matchedCourses / relatedCourseNames.length;
      }
      
      // 최종 점수: RIASEC 60% + 교과목 40% (RIASEC이 없으면 교과목만)
      const finalScore = riasecResult 
        ? riasecScore * 0.6 + courseScore * 0.4
        : courseScore;
      
      return { 
        ...career, 
        matchScore: finalScore,
        riasecScore,
        courseScore,
        matchedCourses,
        totalRelatedCourses: relatedCourseNames.length
      };
    });
    
    return allCareers.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [riasecResult, coursesUpToSelectedYear, selectedYear]);

  return (
    <div className="space-y-6">
      {/* 튜토리얼 오버레이 */}
      {showTutorial && (
        <TutorialOverlay
          steps={tutorialSteps}
          storageKey="roadmap-tutorial-completed"
          onComplete={() => setShowTutorial(false)}
        />
      )}

      {/* Step Guide Flow - 비교과 활동에서는 숨김 */}
      {viewMode !== 'extracurricular' && (
        <StepGuideFlow
          currentStep={currentStepNumber}
          steps={guideSteps}
        />
      )}

      {/* 컨텐츠 영역 */}
      <AnimatePresence mode="wait">
        {viewMode === 'planner' && (
          <motion.div
            key="planner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
            data-tutorial="planner-section"
          >
            <CurriculumPlanner riasecResult={riasecResult} currentStudentId={currentStudentId || undefined} />

            {/* 지원 서비스 - 교수학습센터 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📖 학습 계획에 도움이 필요하신가요?</h3>
              <p className="text-sm text-gray-600 mb-4">
                커리큘럼 설계와 학습 전략 수립에 전문적인 도움이 필요하다면 교수학습센터를 방문하세요.
              </p>
              <ConnectionLinks variant="horizontal" filterIds={['learning', 'counseling']} showAll={false} />
            </div>
          </motion.div>
        )}

        {viewMode === 'roadmap' && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 학년별 로드맵 카드 */}
            {currentRoadmap.map((roadmap, index) => (
              <RoadmapCard key={`${roadmap.year}-${roadmap.semester}`} roadmap={roadmap} index={index} />
            ))}
            
            {currentRoadmap.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                해당 학년의 로드맵 정보가 없습니다.
              </div>
            )}

            {/* 교과목 목록 (통합) */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <h3 className="text-lg font-bold">📚 {selectedYear}학년 교과목 목록</h3>
                <p className="text-blue-100 text-sm">총 {currentCurriculum.length}개 과목</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {currentCurriculum.map((course, index) => (
                  <motion.div
                    key={course.courseNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            course.completionType === '전공필수' ? 'bg-red-100 text-red-700' :
                            course.completionType === '전공' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {course.completionType}
                          </span>
                          <span className="text-xs text-gray-500">{course.courseNumber}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800">{course.courseName}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>👨‍🏫 {course.professor}</span>
                          <span>📊 {course.credits}학점</span>
                        </div>
                      </div>
                      {course.riasecProfile && (
                        <div className="flex flex-wrap gap-1 max-w-[150px] justify-end">
                          {Object.entries(course.riasecProfile).map(([key, value]) => (
                            value && value > 0.5 && (
                              <span
                                key={key}
                                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                              >
                                {key}: {Math.round(value * 100)}%
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'careers' && (
          <motion.div
            key="careers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
            data-tutorial="careers-section"
          >
            {/* 학년별 수강 현황 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📚</span>
                <h3 className="font-semibold text-blue-800">
                  {selectedYear}학년까지의 수강 교과목 기반 추천
                </h3>
              </div>
              <p className="text-sm text-blue-700">
                {coursesUpToSelectedYear.length}개 교과목을 수강하셨습니다. 
                {riasecResult ? ' MJU 전공 진로 적합도 검사 결과와 함께' : ''} 수강 이력을 바탕으로 직무를 추천합니다.
              </p>
              {!riasecResult && (
                <button
                  onClick={() => onNavigate?.('riasec')}
                  className="text-sm text-blue-600 hover:text-blue-700 underline mt-2"
                >
                  MJU 전공 진로 적합도 검사하기 → (더 정확한 추천을 위해)
                </button>
              )}
            </div>

            {rankedCareers.map((career, index) => (
              <motion.div
                key={career.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all ${
                  selectedCareer === career.title ? 'ring-2 ring-amber-500' : ''
                }`}
              >
                <button
                  onClick={() => setSelectedCareer(selectedCareer === career.title ? null : career.title)}
                  className="w-full p-4 text-left min-h-[80px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{career.title}</h3>
                        <p className="text-sm text-gray-500">{career.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((career.matchScore || 0) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">매칭 점수</div>
                      {career.totalRelatedCourses > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          수강: {career.matchedCourses}/{career.totalRelatedCourses}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {selectedCareer === career.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 bg-gray-50">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <span>🛠️</span> 필요 역량
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.requiredSkills.map((skill) => (
                                <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <span>📚</span> 관련 교과목
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.relatedCourses.map((course) => {
                                // 수강한 교과목인지 확인
                                const isCompleted = coursesUpToSelectedYear.some(c => 
                                  c.courseName.includes(course) || 
                                  course.includes(c.courseName) ||
                                  c.courseName.toLowerCase().includes(course.toLowerCase()) ||
                                  course.toLowerCase().includes(c.courseName.toLowerCase())
                                );
                                return (
                                  <span 
                                    key={course} 
                                    className={`px-2 py-1 rounded text-sm ${
                                      isCompleted 
                                        ? 'bg-green-200 text-green-800 font-medium' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {course} {isCompleted && '✓'}
                                  </span>
                                );
                              })}
                            </div>
                            {career.totalRelatedCourses > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                {selectedYear}학년까지 {career.matchedCourses}개 수강 완료
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <span>📊</span> 매칭 상세
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {riasecResult && (
                              <div>
                                <p className="text-xs text-gray-600 mb-2">MJU 전공 진로 적합도 검사 매칭</p>
                                <div className="flex gap-2 flex-wrap">
                                  {Object.entries(career.riasecMatch).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-1">
                                      <span className="font-medium text-gray-600 text-xs">{key}:</span>
                                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{ width: `${value * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  MJU 전공 진로 적합도 검사 점수: {Math.round((career.riasecScore || 0) * 100)}%
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-600 mb-2">교과목 매칭</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${(career.courseScore || 0) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700">
                                  {Math.round((career.courseScore || 0) * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                관련 교과목 {career.matchedCourses}/{career.totalRelatedCourses}개 수강
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* 지원 서비스 - 취업지원팀, 상담 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 진로 결정에 도움이 필요하신가요?</h3>
              <p className="text-sm text-gray-600 mb-4">
                추천된 직무와 커리어 경로에 대해 더 자세한 상담이 필요하다면 아래 서비스를 이용하세요.
              </p>
              <ConnectionLinks variant="horizontal" filterIds={['counseling', 'career']} showAll={false} />
            </div>
          </motion.div>
        )}

        {viewMode === 'rolemodels' && (
          <motion.div
            key="rolemodels"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 전공 선택 UI */}
            {availableMajorsForRoleModels.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span>🎓</span> 롤모델 전공 선택
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      여러 전공을 선택하여 다양한 선배들의 진로를 확인하세요
                    </p>
                  </div>
                  {selectedMajorsForRoleModels.length > 0 && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {selectedMajorsForRoleModels.length}개 선택
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableMajorsForRoleModels.map((major) => {
                    const isSelected = selectedMajorsForRoleModels.includes(major.name);
                    const isAssessment = major.source === 'assessment';

                    return (
                      <button
                        key={major.key}
                        onClick={() => {
                          if (isSelected) {
                            // 최소 1개는 선택 유지
                            if (selectedMajorsForRoleModels.length > 1) {
                              setSelectedMajorsForRoleModels(prev => prev.filter(m => m !== major.name));
                            }
                          } else {
                            setSelectedMajorsForRoleModels(prev => [...prev, major.name]);
                          }
                        }}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                          ${isSelected
                            ? isAssessment
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {isAssessment && <span className="text-xs">✅</span>}
                        {major.name}
                        {major.score && (
                          <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            {isAssessment ? `${major.score.toFixed(1)}점` : `${Math.round(major.score)}%`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 선택된 전공 설명 */}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-600"></span>
                    전공능력진단 완료
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                    RIASEC 추천 전공
                  </span>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⭐</span>
                <h3 className="font-semibold text-amber-800">
                  {selectedMajorsForRoleModels.length > 0
                    ? `${selectedMajorsForRoleModels.join(', ')} 출신 선배들의 진로`
                    : '우수 선배들의 진로'
                  }
                </h3>
              </div>
              <p className="text-sm text-amber-700">
                {selectedMajorsForRoleModels.length > 0
                  ? `선택한 ${selectedMajorsForRoleModels.length}개 전공을 졸업한 선배들이 어떤 회사에서 어떤 일을 하고 있는지 확인해보세요.`
                  : '전공을 선택하여 선배들의 취업 현황과 커리어 경로를 확인해보세요.'
                }
              </p>
            </div>

            {/* 로딩 상태 */}
            {isLoadingRoleModels && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-500">선배 정보를 불러오는 중...</p>
                </div>
              </div>
            )}

            {/* 롤모델 없음 */}
            {!isLoadingRoleModels && graduateRoleModels.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-6xl mb-4">
                  {selectedMajorsForRoleModels.length > 0 ? '🔍' : availableMajorsForRoleModels.length > 0 ? '👆' : '🎯'}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {selectedMajorsForRoleModels.length > 0
                    ? `${selectedMajorsForRoleModels.join(', ')} 출신 롤모델 정보가 없습니다`
                    : availableMajorsForRoleModels.length > 0
                      ? '위에서 전공을 선택해주세요'
                      : 'MJU 전공 진로 적합도 검사를 먼저 완료해주세요'
                  }
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedMajorsForRoleModels.length > 0
                    ? '해당 전공의 졸업생 취업 데이터가 아직 등록되지 않았습니다. 다른 전공을 선택해보세요.'
                    : availableMajorsForRoleModels.length > 0
                      ? '전공을 선택하면 해당 전공 선배들의 진로를 확인할 수 있습니다.'
                      : '검사를 완료하면 추천 전공에 맞는 선배들의 진로를 확인할 수 있습니다.'
                  }
                </p>
                {availableMajorsForRoleModels.length === 0 && (
                  <button
                    onClick={() => onNavigate?.('riasec')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                  >
                    검사 시작하기 →
                  </button>
                )}
              </div>
            )}

            {/* 롤모델 카드들 */}
            {!isLoadingRoleModels && graduateRoleModels.length > 0 && (
              <>
                {/* AI 인사이트 섹션 */}
                {graduateInsights && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                      <span>🤖</span> AI 취업 성공 인사이트
                    </h3>
                    <p className="text-sm text-indigo-700 mb-4">
                      {selectedMajorsForRoleModels.length > 0
                        ? selectedMajorsForRoleModels.join(', ')
                        : '해당 전공'} 출신 {graduateInsights.totalGraduates}명의 선배 데이터 분석 결과입니다.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/70 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-indigo-600">{graduateInsights.avgGpa.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">평균 학점</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{graduateInsights.certRate}%</div>
                        <div className="text-sm text-gray-600">자격증 보유율</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{graduateInsights.languageRate}%</div>
                        <div className="text-sm text-gray-600">어학성적 보유율</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{graduateInsights.totalPrograms}</div>
                        <div className="text-sm text-gray-600">참여 비교과 종류</div>
                      </div>
                    </div>

                    {/* 주요 직무 */}
                    {graduateInsights.topJobTypes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-indigo-700 mb-2">📌 주요 취업 직무</p>
                        <div className="flex flex-wrap gap-2">
                          {graduateInsights.topJobTypes.map((job, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-indigo-700 border border-indigo-200">
                              {job.name} ({job.count}명)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOP 자격증 */}
                    {graduateInsights.topCerts.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-indigo-700 mb-2">📜 자주 취득하는 자격증</p>
                        <div className="flex flex-wrap gap-2">
                          {graduateInsights.topCerts.map((cert, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                              {cert.name} ({cert.count}명)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOP 교과목 */}
                    {graduateInsights.topCourses.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-indigo-700 mb-2">📖 많이 수강하는 과목 TOP 10</p>
                        <div className="flex flex-wrap gap-1">
                          {graduateInsights.topCourses.map((course, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded text-xs ${
                                idx < 3 ? 'bg-indigo-100 text-indigo-800 font-medium' : 'bg-white text-gray-600 border'
                              }`}
                            >
                              {idx < 3 && '🔥'} {course.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOP 비교과 */}
                    {graduateInsights.topPrograms.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-indigo-700 mb-2">🏆 인기 비교과 프로그램</p>
                        <div className="space-y-1">
                          {graduateInsights.topPrograms.map((prog, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-amber-500">{idx + 1}.</span>
                              <span className="text-gray-700 truncate">{prog.name}</span>
                              <span className="text-gray-400 text-xs">({prog.count}명)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 롤모델 선택 안내 박스 */}
                {selectedRoleModelCards.size === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-5 text-white shadow-lg mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl animate-bounce">👇</div>
                      <div>
                        <h3 className="font-bold text-lg">롤모델로 삼고 싶은 선배를 선택해보세요!</h3>
                        <p className="text-cyan-100 text-sm mt-1">
                          카드를 클릭하면 선택됩니다. 여러 선배를 선택할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 선택된 롤모델 표시 */}
                {selectedRoleModelCards.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg mb-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✨</span>
                        <div>
                          <h3 className="font-bold">
                            {selectedRoleModelCards.size}명의 롤모델을 선택했습니다!
                          </h3>
                          <p className="text-green-100 text-sm">
                            선택한 선배들의 커리어 경로를 참고해보세요.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRoleModelCards(new Set())}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                      >
                        선택 초기화
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 롤모델 카드 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    총 <span className="font-bold text-indigo-600">{graduateRoleModels.length}</span>명의 선배
                    {selectedRoleModelCards.size > 0 && (
                      <span className="ml-2 text-green-600 font-medium">
                        ({selectedRoleModelCards.size}명 선택됨)
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => setIsAllCardsExpanded(!isAllCardsExpanded)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                      ${isAllCardsExpanded
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {isAllCardsExpanded ? (
                      <>
                        <span>📂</span> 상세정보 접기
                      </>
                    ) : (
                      <>
                        <span>📁</span> 상세정보 펼치기
                      </>
                    )}
                  </button>
                </div>

                {/* 롤모델 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {graduateRoleModels.map((graduate, index) => {
                    // 기업유형에 따른 색상
                    const getCompanyColor = (companyType?: string) => {
                      if (companyType === '대기업') return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
                      if (companyType === '공공기관') return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
                      if (companyType === '중소기업') return { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' };
                      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
                    };

                    // 직무에 따른 아이콘
                    const getJobIcon = (jobType?: string) => {
                      if (jobType?.includes('IT') || jobType?.includes('개발')) return '💻';
                      if (jobType?.includes('금융') || jobType?.includes('회계')) return '💰';
                      if (jobType?.includes('기획') || jobType?.includes('사무')) return '📋';
                      if (jobType?.includes('영업') || jobType?.includes('마케팅')) return '📈';
                      if (jobType?.includes('연구')) return '🔬';
                      if (jobType?.includes('생산') || jobType?.includes('품질')) return '🏭';
                      if (jobType?.includes('교육')) return '📚';
                      return '👤';
                    };

                    const companyColor = getCompanyColor(graduate.company_type);
                    const jobIcon = getJobIcon(graduate.job_type);
                    // DB에 저장된 인사이트 우선 사용, 없으면 동적 생성
                    const successSummary = graduate.success_insight || generateSuccessSummary(graduate);

                    // 카드 선택 여부
                    const isCardSelected = selectedRoleModelCards.has(graduate.graduateno);
                    // 첫 번째 카드이고 아무것도 선택 안됐으면 빛나게
                    const shouldGlow = index === 0 && selectedRoleModelCards.size === 0;

                    // 카드 클릭 핸들러
                    const handleCardClick = () => {
                      setSelectedRoleModelCards(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(graduate.graduateno)) {
                          newSet.delete(graduate.graduateno);
                        } else {
                          newSet.add(graduate.graduateno);
                        }
                        return newSet;
                      });
                    };

                    return (
                      <motion.div
                        key={graduate.graduateno}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={handleCardClick}
                        className={`
                          bg-white rounded-xl shadow-md overflow-hidden transition-all border-l-4 cursor-pointer
                          ${companyColor.border}
                          ${isCardSelected
                            ? 'ring-4 ring-green-400 shadow-lg scale-[1.02]'
                            : 'hover:shadow-lg hover:scale-[1.01]'
                          }
                          ${shouldGlow ? 'animate-pulse ring-4 ring-cyan-400 ring-opacity-75' : ''}
                        `}
                      >
                        {/* 헤더 */}
                        <div className={`p-5 ${companyColor.bg} relative`}>
                          {/* 선택 표시 */}
                          {isCardSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <span className="text-white text-lg">✓</span>
                            </motion.div>
                          )}
                          {/* 클릭 유도 (첫 번째 카드) */}
                          {shouldGlow && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute top-3 right-3 px-2 py-1 bg-cyan-500 text-white text-xs rounded-full font-medium"
                            >
                              클릭!
                            </motion.div>
                          )}
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-3xl">{jobIcon}</div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${companyColor.badge} ${isCardSelected || shouldGlow ? 'mr-10' : ''}`}>
                              {graduate.company_type || '기타'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{graduate.company_name}</h3>
                          <p className="text-sm text-gray-600">{graduate.job_type}</p>
                        </div>

                        {/* 성공 요약 */}
                        <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                          <p className="text-xs text-amber-800">
                            ✨ {successSummary}
                          </p>
                        </div>

                        {/* 기본 정보 */}
                        <div className="p-5 space-y-3">
                          {/* 출신 학과 */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">🎓</span>
                            <span className="font-medium text-gray-800">
                              {graduate.department}
                              {graduate.major && graduate.major !== '-' && ` (${graduate.major})`}
                            </span>
                          </div>

                          {/* GPA & 취업년도 */}
                          <div className="flex items-center justify-between text-sm">
                            {graduate.gpa && (
                              <span className={`font-bold ${graduate.gpa >= 4.0 ? 'text-green-600' : graduate.gpa >= 3.5 ? 'text-blue-600' : 'text-gray-700'}`}>
                                📊 {graduate.gpa.toFixed(2)} / 4.5
                              </span>
                            )}
                            {graduate.employment_year && (
                              <span className="text-gray-500 text-xs">📅 {graduate.employment_year}년 입사</span>
                            )}
                          </div>

                          {/* 간략 스펙 요약 */}
                          <div className="flex flex-wrap gap-1 pt-2">
                            {[graduate.cert1, graduate.cert2, graduate.cert3]
                              .filter(c => c && c !== '-')
                              .slice(0, 2)
                              .map((cert, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  {cert}
                                </span>
                              ))
                            }
                            {(graduate.toeic || graduate.opic) && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                                {graduate.toeic ? `TOEIC ${graduate.toeic}` : `OPIc ${graduate.opic}`}
                              </span>
                            )}
                          </div>

                          {/* 교과목/비교과 요약 */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex gap-3 text-xs text-gray-500">
                              {graduate.courses && graduate.courses.length > 0 && (
                                <span>📖 {graduate.courses.length}과목</span>
                              )}
                              {graduate.programs && graduate.programs.length > 0 && (
                                <span>🏆 {graduate.programs.length}개 활동</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 확장된 상세 정보 */}
                        <AnimatePresence>
                          {isAllCardsExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-200 bg-gray-50"
                            >
                              <div className="p-5 space-y-4">
                                {/* 전체 자격증 */}
                                {(graduate.cert1 || graduate.cert2 || graduate.cert3) && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">📜 취득 자격증</p>
                                    <div className="flex flex-wrap gap-1">
                                      {[graduate.cert1, graduate.cert2, graduate.cert3]
                                        .filter(cert => cert && cert !== '-')
                                        .map((cert, idx) => (
                                          <span key={idx} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border">
                                            {cert}
                                          </span>
                                        ))
                                      }
                                    </div>
                                  </div>
                                )}

                                {/* 전체 어학성적 */}
                                {(graduate.toeic || graduate.toeic_s || graduate.opic) && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">🌐 어학성적</p>
                                    <div className="flex flex-wrap gap-2 text-sm">
                                      {graduate.toeic && <span className="px-2 py-1 bg-white rounded border text-gray-700">TOEIC {graduate.toeic}</span>}
                                      {graduate.toeic_s && graduate.toeic_s !== '-' && <span className="px-2 py-1 bg-white rounded border text-gray-700">TOEIC-S {graduate.toeic_s}</span>}
                                      {graduate.opic && graduate.opic !== '-' && <span className="px-2 py-1 bg-white rounded border text-gray-700">OPIc {graduate.opic}</span>}
                                    </div>
                                  </div>
                                )}

                                {/* 전체 수강과목 */}
                                {graduate.courses && graduate.courses.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">📖 수강 교과목 ({graduate.courses.length}개)</p>
                                    <div className="max-h-32 overflow-y-auto bg-white rounded-lg p-2 border">
                                      <div className="flex flex-wrap gap-1">
                                        {graduate.courses.map((course, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded"
                                            title={course.category || ''}
                                          >
                                            {course.course_name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 전체 비교과 프로그램 */}
                                {graduate.programs && graduate.programs.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">🏆 비교과 활동 ({graduate.programs.length}개)</p>
                                    <div className="max-h-40 overflow-y-auto bg-white rounded-lg p-2 border space-y-2">
                                      {graduate.programs.map((program, idx) => (
                                        <div key={idx} className="text-xs">
                                          <p className="font-medium text-gray-800">{program.program_name}</p>
                                          {program.period && (
                                            <p className="text-gray-500 text-[10px]">{program.period}</p>
                                          )}
                                          {program.department && (
                                            <p className="text-gray-400 text-[10px]">{program.department}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 통계 요약 */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📊 기업유형별 취업 현황</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const stats = {
                        대기업: graduateRoleModels.filter(g => g.company_type === '대기업').length,
                        공공기관: graduateRoleModels.filter(g => g.company_type === '공공기관').length,
                        중소기업: graduateRoleModels.filter(g => g.company_type === '중소기업').length,
                        기타: graduateRoleModels.filter(g => !g.company_type || !['대기업', '공공기관', '중소기업'].includes(g.company_type)).length
                      };

                      return (
                        <>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stats.대기업}</div>
                            <div className="text-sm text-gray-600">대기업</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.공공기관}</div>
                            <div className="text-sm text-gray-600">공공기관</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{stats.중소기업}</div>
                            <div className="text-sm text-gray-600">중소기업</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">{stats.기타}</div>
                            <div className="text-sm text-gray-600">기타</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {/* 지원 서비스 - 취업지원팀, 상담 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🤝 추가 지원이 필요하신가요?</h3>
              <p className="text-sm text-gray-600 mb-4">
                롤모델 선배처럼 성공하기 위해 전문적인 도움이 필요하다면 아래 서비스를 이용하세요.
              </p>
              <ConnectionLinks variant="horizontal" filterIds={['career', 'counseling']} showAll={false} />
            </div>
          </motion.div>
        )}

        {/* 비교과 활동 뷰 - 평생학습계좌 */}
        {viewMode === 'extracurricular' && (
          <motion.div
            key="extracurricular"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* e-advisor 이수증 - 간소화 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    completedStepsCount === 5
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-violet-500 to-purple-600'
                  }`}>
                    <span className="text-white text-xl">{completedStepsCount === 5 ? '🏆' : '🎓'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">e-advisor 이수증</h3>
                    <p className="text-slate-500 text-sm">
                      {completedStepsCount === 5 ? '모든 단계 완료!' : `${completedStepsCount}/5 단계 완료`}
                    </p>
                  </div>
                </div>

                {/* 단계 표시 */}
                <div className="flex items-center gap-1.5">
                  {guideSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        step.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.completed ? '✓' : step.step}
                    </div>
                  ))}
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mt-4">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      completedStepsCount === 5
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-violet-500 to-purple-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedStepsCount / 5) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {completedStepsCount === 5 && (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold text-sm transition shadow-md hover:shadow-lg"
                >
                  이수증 발급받기
                </button>
              )}
            </motion.div>

            {/* 롤모델 기반 비교과 추천 */}
            <ExtracurricularRecommendation
              selectedRoleModels={selectedRoleModelsWithDetails}
              onNavigate={onNavigate}
            />

            {/* 평생학습계좌 */}
            <LearningAccount />
          </motion.div>
        )}

        {/* 이수증 모달 */}
        {showCertificateModal && (
          <EAdvisorCertificateModal
            studentName={DUMMY_STUDENT.name}
            studentId={DUMMY_STUDENT.studentId}
            department={DUMMY_STUDENT.department}
            completedSteps={{
              riasec: !!riasecResult,
              competency: !!competencyResult,
              majorAssessment: completedMajorAssessments.length > 0,
              roleModel: isStep4Completed,
              curriculum: true, // 비교과 페이지에 들어왔으면 커리큘럼은 진행 중으로 간주
            }}
            onClose={() => setShowCertificateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 로드맵 카드 컴포넌트
function RoadmapCard({ roadmap, index }: { roadmap: CareerRoadmap; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 md:p-6 text-left bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 min-h-[80px]"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-bold">
                {roadmap.year}학년 {roadmap.semester}학기
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{roadmap.title}</h3>
            <p className="text-gray-600 mt-1">{roadmap.description}</p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-amber-600 text-2xl"
          >
            ▼
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* 습득 역량 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> 습득 역량
                </h4>
                <div className="flex flex-wrap gap-2">
                  {roadmap.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* 추천 교과목 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📚</span> 추천 교과목
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {roadmap.recommendedCourses.map((course) => (
                    <div key={course} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-amber-500">•</span>
                      <span className="text-gray-700">{course}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 진로 목표 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">🚀</span> 진로 목표
                </h4>
                <div className="space-y-2">
                  {roadmap.careerGoals.map((goal) => (
                    <div key={goal} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-700">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 추천 자격증 */}
              {roadmap.certifications && roadmap.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">📜</span> 추천 자격증
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.certifications.map((cert) => (
                      <span key={cert} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

