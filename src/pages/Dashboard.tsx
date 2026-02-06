import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CURRENT_STUDENT,
  getCurrentGrades,
  ROLE_MODELS,
  compareWithRoleModel,
  getCoursesByGradeUpTo
} from "../data/dummyData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import ConnectionLinks from "../components/ConnectionLinks";
import { getStudentFullProfile, StudentData, StudentGradeRecord, getPilotResultByStudentId, getCompetencyResultByStudentId, getMajorAssessmentsByStudentId, MajorAssessment, getRolemodelSelectionByStudentId, getGraduateByNo, Graduate } from "../../lib/supabase";
import { CompetencyScores, COMPETENCY_INFO } from "../data/competencyQuestions";
import { recommendMajors } from "../utils/recommendMajors";

interface DashboardProps {
  onNavigate: (page: string) => void;
  riasecCompleted?: boolean;
  riasecResult?: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null;
  currentStudentId?: string | null;
}

export default function Dashboard({ onNavigate, riasecCompleted = false, riasecResult, currentStudentId }: DashboardProps) {
  // DB에서 가져온 학생 데이터
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [dbGrades, setDbGrades] = useState<StudentGradeRecord[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [averageGpa, setAverageGpa] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 잠금 카드 클릭 시 흔들림 효과
  const [shakingStep, setShakingStep] = useState<number | null>(null);
  const [showLockedMessage, setShowLockedMessage] = useState<number | null>(null);
  // DB에서 가져온 RIASEC 점수
  const [dbRiasecScores, setDbRiasecScores] = useState<Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null>(null);
  // DB에서 가져온 핵심역량 점수
  const [dbCompetencyScores, setDbCompetencyScores] = useState<CompetencyScores | null>(null);
  // DB에서 가져온 전공능력진단 결과
  const [majorAssessments, setMajorAssessments] = useState<MajorAssessment[]>([]);

  // 롤모델 선택 상태 (DB에서 복원)
  const [selectedRoleModelCards, setSelectedRoleModelCards] = useState<Set<number>>(new Set());
  const [hasExploredRoleModels, setHasExploredRoleModels] = useState(false);
  // 선택된 롤모델들의 상세 정보
  const [selectedRoleModelDetails, setSelectedRoleModelDetails] = useState<Graduate[]>([]);

  // 롤모델 선택 상태 로드 (DB)
  useEffect(() => {
    async function fetchRoleModelSelection() {
      if (!currentStudentId) return;
      try {
        const selection = await getRolemodelSelectionByStudentId(currentStudentId);
        if (selection) {
          setSelectedRoleModelCards(new Set(selection.selected_graduate_ids || []));
          setHasExploredRoleModels(selection.has_explored || false);
        }
      } catch (error) {
        console.error('Failed to load role model state:', error);
      }
    }
    fetchRoleModelSelection();
  }, [currentStudentId]);

  // 선택된 롤모델 상세 정보 로드 (DB)
  useEffect(() => {
    async function fetchSelectedRoleModelDetails() {
      if (selectedRoleModelCards.size === 0) {
        setSelectedRoleModelDetails([]);
        return;
      }
      try {
        const graduateIds = Array.from(selectedRoleModelCards);
        const details = await Promise.all(
          graduateIds.map(id => getGraduateByNo(id))
        );
        // null이 아닌 결과만 필터링
        setSelectedRoleModelDetails(details.filter((d): d is Graduate => d !== null));
      } catch (error) {
        console.error('Failed to load role model details:', error);
      }
    }
    fetchSelectedRoleModelDetails();
  }, [selectedRoleModelCards]);

  // 4단계 완료 조건: 최소 1개 이상 롤모델 카드 선택 필요
  const isStep4Completed = selectedRoleModelCards.size > 0;

  // 데이터 새로고침 트리거 (페이지 진입 시마다 증가)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 컴포넌트가 마운트될 때마다 새로고침 트리거
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // DB에서 학생 정보 및 RIASEC 결과 가져오기
  useEffect(() => {
    async function fetchStudentData() {
      if (currentStudentId) {
        setIsLoading(true);
        try {
          // 학생 프로필 가져오기
          const profile = await getStudentFullProfile(currentStudentId);
          setStudentData(profile.student);
          setDbGrades(profile.grades);
          setTotalCredits(profile.totalCredits);
          setAverageGpa(profile.averageGpa);

          // RIASEC 결과 가져오기
          const pilotResult = await getPilotResultByStudentId(currentStudentId);
          if (pilotResult?.riasec_scores) {
            const scores = pilotResult.riasec_scores;
            // 최대값으로 정규화 (0-1 범위)
            const maxScore = Math.max(scores.R, scores.I, scores.A, scores.S, scores.E, scores.C) || 1;
            setDbRiasecScores({
              R: scores.R / maxScore,
              I: scores.I / maxScore,
              A: scores.A / maxScore,
              S: scores.S / maxScore,
              E: scores.E / maxScore,
              C: scores.C / maxScore,
            });
          }

          // 핵심역량 결과 가져오기
          const competencyResult = await getCompetencyResultByStudentId(currentStudentId);
          if (competencyResult?.scores) {
            setDbCompetencyScores(competencyResult.scores);
          }

          // 전공능력진단 결과 가져오기 (항상 새로 불러옴)
          const majorResults = await getMajorAssessmentsByStudentId(currentStudentId);
          setMajorAssessments(majorResults);
          console.log('[Dashboard] Loaded majorAssessments:', majorResults.length, 'items');
          if (majorResults.length > 0) {
            console.log('[Dashboard] First assessment completion:', majorResults[0].completion_percentage, '%');
          }
        } catch (error) {
          console.error('Failed to fetch student data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    fetchStudentData();
  }, [currentStudentId, refreshTrigger]);

  // 학생 정보 (DB 데이터 우선, 없으면 더미 데이터 폴백)
  const student = studentData || CURRENT_STUDENT;
  const studentName = studentData?.name || CURRENT_STUDENT.name;
  const studentDepartment = studentData?.department || CURRENT_STUDENT.department;
  const studentGrade = studentData?.grade || CURRENT_STUDENT.grade;
  const studentId = studentData?.student_id || CURRENT_STUDENT.studentId;

  // 학점 정보 (DB 데이터만 사용, 로그인된 경우 더미 폴백 안함)
  const currentGrades = getCurrentGrades();
  const acquiredCredits = currentStudentId ? totalCredits : currentGrades.totalAcquiredCredits;
  const gpa = currentStudentId ? averageGpa : currentGrades.gpa;

  // 롤모델 유사도 계산
  const coursesForComparison = getCoursesByGradeUpTo(studentGrade);
  const roleModelComparisons = ROLE_MODELS.map(roleModel =>
    compareWithRoleModel(coursesForComparison, roleModel)
  );
  const bestRoleModelMatch = Math.max(...roleModelComparisons.map(r => r.matchPercentage), 0);

  // 선택된 롤모델 요약 통계 계산
  const roleModelSummary = useMemo(() => {
    if (selectedRoleModelDetails.length === 0) return null;

    // 기업유형별 카운트
    const companyTypes: Record<string, number> = {};
    selectedRoleModelDetails.forEach(rm => {
      const type = rm.company_type || '기타';
      companyTypes[type] = (companyTypes[type] || 0) + 1;
    });

    // 직무별 카운트
    const jobTypes: Record<string, number> = {};
    selectedRoleModelDetails.forEach(rm => {
      if (rm.job_type) {
        jobTypes[rm.job_type] = (jobTypes[rm.job_type] || 0) + 1;
      }
    });

    // 평균 GPA
    const gpas = selectedRoleModelDetails.filter(rm => rm.gpa).map(rm => rm.gpa!);
    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null;

    // 어학성적 보유율
    const hasLanguage = selectedRoleModelDetails.filter(rm => rm.toeic || rm.toeic_s || rm.opic).length;
    const languageRate = Math.round((hasLanguage / selectedRoleModelDetails.length) * 100);

    // 자격증 보유율
    const hasCert = selectedRoleModelDetails.filter(rm => rm.cert1 || rm.cert2 || rm.cert3).length;
    const certRate = Math.round((hasCert / selectedRoleModelDetails.length) * 100);

    // 가장 많은 기업유형
    const topCompanyType = Object.entries(companyTypes).sort((a, b) => b[1] - a[1])[0];

    // 가장 많은 직무
    const topJobType = Object.entries(jobTypes).sort((a, b) => b[1] - a[1])[0];

    // 회사 목록
    const companies = selectedRoleModelDetails
      .map(rm => rm.company_name)
      .filter(Boolean)
      .slice(0, 3);

    return {
      companyTypes,
      topCompanyType: topCompanyType ? topCompanyType[0] : null,
      topJobType: topJobType ? topJobType[0] : null,
      avgGpa,
      languageRate,
      certRate,
      companies,
      total: selectedRoleModelDetails.length
    };
  }, [selectedRoleModelDetails]);

  // 커리큘럼 완료율 계산 (총 130학점 기준)
  const curriculumProgress = Math.min(Math.round((acquiredCredits / 130) * 100), 100);

  // 전공능력진단 진행률 계산 (완료된 전공 수 기반)
  const majorAssessmentProgress = useMemo(() => {
    if (majorAssessments.length === 0) return 0;
    const completedCount = majorAssessments.filter(a => (a.completion_percentage || 0) >= 100).length;
    // 1개 이상 완료 시 진행률 표시
    return completedCount > 0 ? Math.round((completedCount / majorAssessments.length) * 100) :
           Math.round(majorAssessments.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / majorAssessments.length);
  }, [majorAssessments]);

  // 완료된 전공능력진단이 있는지 확인
  const hasCompletedMajorAssessment = useMemo(() => {
    return majorAssessments.some(a => (a.completion_percentage || 0) >= 100);
  }, [majorAssessments]);

  // 전공능력진단 결과를 점수순으로 정렬 (높은 점수 우선)
  const sortedMajorAssessments = useMemo(() => {
    return [...majorAssessments].sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));
  }, [majorAssessments]);

  // 가장 적합한 전공 (완료된 것 중 최고 점수)
  const bestFitMajor = useMemo(() => {
    const completed = majorAssessments.filter(a => (a.completion_percentage || 0) >= 100);
    if (completed.length === 0) return null;
    return completed.sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))[0];
  }, [majorAssessments]);

  // 5단계 진행 상태 (실제로는 백엔드에서 가져와야 함)
  const roadmapSteps = [
    {
      step: 1,
      title: "MJU 전공 진로 적합도 검사",
      description: "진로 적성 검사",
      icon: "🎯",
      completed: riasecCompleted,
      progress: riasecCompleted ? 100 : 0,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      action: () => onNavigate(riasecCompleted ? "insight" : "riasec"),
      actionLabel: riasecCompleted ? "결과 보기" : "검사 시작"
    },
    {
      step: 2,
      title: "핵심역량진단",
      description: dbCompetencyScores ? `종합 ${dbCompetencyScores.total}점` : "인재상 성장 지원",
      icon: "💪",
      completed: !!dbCompetencyScores,
      progress: dbCompetencyScores ? dbCompetencyScores.total : 0,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
      action: () => onNavigate("competency"),
      actionLabel: dbCompetencyScores ? "결과 보기" : "진단 시작"
    },
    {
      step: 3,
      title: "전공능력진단",
      description: hasCompletedMajorAssessment && bestFitMajor
        ? `추천: ${bestFitMajor.major_name}`
        : majorAssessments.length > 0
          ? `${majorAssessments.length}개 전공 진단 중`
          : "추천 전공 자가진단",
      icon: "📚",
      completed: hasCompletedMajorAssessment, // 1개 이상 완료 시 완료 처리
      progress: majorAssessmentProgress,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      action: () => onNavigate("roadmap-explorer"),
      actionLabel: hasCompletedMajorAssessment ? "결과 보기" : majorAssessments.length > 0 ? "계속하기" : "자가진단 시작"
    },
    {
      step: 4,
      title: "롤모델 탐색",
      description: isStep4Completed && selectedRoleModelDetails.length > 0
        ? selectedRoleModelDetails.slice(0, 3).map(rm => rm.company_name || '기업').join(', ')
        : isStep4Completed
          ? `${selectedRoleModelCards.size}명 선택됨`
          : "선배 커리어 탐색",
      icon: "⭐",
      completed: isStep4Completed,
      progress: isStep4Completed ? 100 : 0,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-300",
      action: () => onNavigate("roadmap-rolemodels"),
      actionLabel: isStep4Completed ? "다시 보기" : "탐색 시작"
    },
    {
      step: 5,
      title: "커리큘럼 플래너",
      description: `${acquiredCredits}/130 학점 이수`,
      icon: "📊",
      completed: curriculumProgress >= 50, // 50% 이상 이수 시 완료
      progress: curriculumProgress,
      color: "from-cyan-500 to-teal-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-300",
      action: () => onNavigate("roadmap-fullcycle"),
      actionLabel: curriculumProgress >= 50 ? "계속 관리" : "관리하기"
    }
  ];

  // 전체 진행률 계산
  const totalProgress = Math.round(roadmapSteps.reduce((acc, step) => acc + step.progress, 0) / roadmapSteps.length);
  
  // 완료된 단계 수
  const completedSteps = roadmapSteps.filter(step => step.completed).length;

  // 목표 진로 (RIASEC 결과 기반, 더미 데이터)
  const targetCareer = riasecCompleted ? "데이터 분석가" : null;

  // 역량 데이터 (더미)
  const competencyData = [
    { axis: "융합역량", value: 75 },
    { axis: "실용역량", value: 68 },
    { axis: "창의역량", value: 82 },
    { axis: "자기주도역량", value: 70 },
    { axis: "어우름역량", value: 65 },
    { axis: "배려역량", value: 78 }
  ];

  // 실제 사용할 RIASEC 점수 (DB 결과 우선, 없으면 prop 사용)
  const effectiveRiasecResult = dbRiasecScores || riasecResult;
  const hasRiasecResult = !!effectiveRiasecResult;

  // RIASEC 결과를 차트 데이터로 변환
  const riasecChartData = effectiveRiasecResult ? [
    { axis: "R (현실형)", value: Math.round(effectiveRiasecResult.R * 100) },
    { axis: "I (탐구형)", value: Math.round(effectiveRiasecResult.I * 100) },
    { axis: "A (예술형)", value: Math.round(effectiveRiasecResult.A * 100) },
    { axis: "S (사회형)", value: Math.round(effectiveRiasecResult.S * 100) },
    { axis: "E (진취형)", value: Math.round(effectiveRiasecResult.E * 100) },
    { axis: "C (관습형)", value: Math.round(effectiveRiasecResult.C * 100) }
  ] : null;

  // 추천 전공 계산 (RIASEC 결과 기반)
  const recommendedMajorsList = useMemo(() => {
    if (!effectiveRiasecResult) return [];
    const riasecWithV = { ...effectiveRiasecResult, V: 0 };
    return recommendMajors(riasecWithV, { limit: 3 });
  }, [effectiveRiasecResult]);

  return (
    <div className="space-y-6">
      {/* 상단 환영 메시지 및 전체 진행률 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* 왼쪽: 환영 메시지 */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">
              안녕하세요, {studentName}님!
            </h1>
            <p className="text-blue-100 mb-4">
              {studentDepartment} {studentGrade}학년 · 학번 {studentId}
            </p>
            {targetCareer ? (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-medium">목표 진로: {targetCareer}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                <span>검사를 통해 목표 진로를 설정해보세요!</span>
              </div>
            )}
          </div>

          {/* 오른쪽: 3개 원형 차트 영역 */}
          <div className="flex gap-4 md:gap-6">
            {/* 추천전공 / 적합전공 */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center px-2">
                    {/* 전공능력진단 완료 시 - 적합 전공 표시 */}
                    {hasCompletedMajorAssessment && bestFitMajor ? (
                      <>
                        <motion.p
                          className="text-xs md:text-sm font-bold mb-1"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ✨ 적합 전공
                        </motion.p>
                        <motion.p
                          className="text-[11px] md:text-sm font-bold text-yellow-200 leading-tight"
                          animate={{ textShadow: ["0 0 4px rgba(255,255,255,0)", "0 0 8px rgba(255,255,255,0.8)", "0 0 4px rgba(255,255,255,0)"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {bestFitMajor.major_name}
                        </motion.p>
                        <p className="text-[10px] md:text-xs text-blue-200 mt-1">
                          {(bestFitMajor.avg_score || 0).toFixed(1)}점
                        </p>
                      </>
                    ) : hasRiasecResult && recommendedMajorsList.length > 0 ? (
                      /* RIASEC 검사 완료 시 - TOP 3 표시 */
                      <>
                        <p className="text-xs md:text-sm font-bold mb-1">🎓 TOP 3</p>
                        {recommendedMajorsList.slice(0, 3).map((major, idx) => (
                          <p
                            key={major.key}
                            className={`text-[10px] md:text-xs leading-tight ${idx > 0 ? 'text-blue-200' : ''}`}
                          >
                            {major.name}
                          </p>
                        ))}
                      </>
                    ) : (
                      <>
                        <p className="text-lg md:text-2xl mb-1">🎓</p>
                        <p className="text-[10px] md:text-xs text-blue-100">검사 필요</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs md:text-sm text-blue-100 text-center">
                {hasCompletedMajorAssessment ? "적합전공" : "추천전공"}
              </p>
            </div>

            {/* 학점현황 원형 차트 */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <svg className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="md:hidden"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="hidden md:block"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="md:hidden"
                    stroke="#4ade80"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - curriculumProgress / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - curriculumProgress / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="hidden md:block"
                    stroke="#4ade80"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - curriculumProgress / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - curriculumProgress / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.p
                      className="text-lg md:text-2xl font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {acquiredCredits}
                    </motion.p>
                    <p className="text-[10px] md:text-xs text-blue-100">/130학점</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs md:text-sm text-blue-100 text-center">학점현황 {curriculumProgress}%</p>
            </div>

            {/* e-advisor 진행률 원형 차트 */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <svg className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="md:hidden"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="hidden md:block"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="md:hidden"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - totalProgress / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - totalProgress / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="hidden md:block"
                    stroke="white"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - totalProgress / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - totalProgress / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.p
                      className="text-lg md:text-2xl font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {totalProgress}%
                    </motion.p>
                    <p className="text-[10px] md:text-xs text-blue-100">{completedSteps}/5단계</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs md:text-sm text-blue-100 text-center">e-advisor</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 메인 정보 섹션 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">메인</h2>
            <p className="text-sm text-gray-500 mt-1">5단계를 완료하고 목표 진로에 도달하세요!</p>
          </div>
          <button
            onClick={() => onNavigate("roadmap-fullcycle")}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 min-h-[44px]"
          >
            전체 보기 →
          </button>
        </div>

        {/* 5단계 카드 그리드 */}
        <div className="relative">
          {/* 잠금 경고 메시지 (카드 그리드 중앙) */}
          {showLockedMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <span className="font-medium text-sm">이전 단계를 먼저 진행해주세요</span>
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {roadmapSteps.map((step, index) => {
            // 이전 단계 완료 여부 체크
            const previousStepsCompleted = index === 0 || roadmapSteps.slice(0, index).every(s => s.completed);
            const isLocked = !previousStepsCompleted;

            // 잠금 시 클릭 핸들러 (흔들림 효과 + 메시지)
            const handleClick = () => {
              if (isLocked) {
                setShakingStep(step.step);
                setShowLockedMessage(null); // 기존 메시지 숨김
                setTimeout(() => {
                  setShakingStep(null);
                  setShowLockedMessage(step.step); // 흔들림 후 메시지 표시
                  setTimeout(() => setShowLockedMessage(null), 2000); // 2초 후 메시지 숨김
                }, 600);
              } else {
                step.action();
              }
            };

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={
                  shakingStep === step.step
                    ? { opacity: 1, y: 0, x: [0, -50, 50, -50, 50, -40, 40, -30, 30, -20, 20, -10, 10, 0], rotate: [0, -8, 8, -8, 8, -6, 6, -4, 4, -2, 2, 0] }
                    : { opacity: 1, y: 0, x: 0, rotate: 0 }
                }
                transition={
                  shakingStep === step.step
                    ? { duration: 0.6, ease: "easeInOut" }
                    : { delay: index * 0.1 }
                }
                className={`relative ${step.bgColor} ${step.borderColor} border-2 rounded-xl p-4 transition-all ${
                  isLocked
                    ? 'opacity-60 cursor-not-allowed grayscale'
                    : 'hover:shadow-lg cursor-pointer group'
                }`}
                onClick={handleClick}
              >
                {/* 잠금 아이콘 */}
                {isLocked && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center shadow-md z-10">
                    <span className="text-white text-sm">🔒</span>
                  </div>
                )}

                {/* 완료 체크마크 */}
                {step.completed && !isLocked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md z-10">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}

                {/* 단계 번호 */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm mb-3 ${isLocked ? 'opacity-50' : ''}`}>
                  {step.step}
                </div>

                {/* 아이콘 */}
                <div className={`text-2xl md:text-3xl mb-2 ${isLocked ? 'opacity-50' : ''}`}>{step.icon}</div>

                {/* 제목 */}
                <h3 className={`font-bold text-xs md:text-sm mb-1 ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>{step.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{step.description}</p>

                {/* 진행률 바 */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${step.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{step.progress}%</span>
                  <span className={`text-xs font-medium ${
                    isLocked ? 'text-gray-400' : step.completed ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {isLocked ? '잠금' : step.completed ? '완료' : '진행중'}
                  </span>
                </div>

                {/* 호버 시 액션 버튼 (잠금 아닐 때만) */}
                {!isLocked && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                      {step.actionLabel}
                    </button>
                  </div>
                )}

                {/* 잠금 시 오버레이 */}
                {isLocked && (
                  <div className="absolute inset-0 bg-gray-200/30 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl">🔒</span>
                      <p className="text-xs text-gray-500 mt-1">이전 단계 필요</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          </div>
        </div>

        {/* 연결선 (데스크톱에서만) */}
        <div className="hidden md:flex items-center justify-center mt-4 px-12">
          <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full relative">
            {roadmapSteps.map((step, index) => (
              <div
                key={step.step}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}
                style={{ left: `${(index / (roadmapSteps.length - 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            ))}
          </div>
        </div>

        {/* 지원 서비스 바로가기 */}
        <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">지원 서비스 바로가기</h3>
          <ConnectionLinks variant="horizontal" />
        </div>
      </div>

      {/* 진단 현황 요약 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* RIASEC 검사 결과 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              MJU 전공 진로 적합도 검사
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              riasecCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {riasecCompleted ? '완료' : '미완료'}
            </span>
          </div>
          
          {riasecChartData ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riasecChartData} outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="MJU 전공 진로 적합도 검사" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
              <p className="text-sm text-gray-500 text-center">
                검사를 완료하고<br />나의 진로 유형을 확인하세요
              </p>
            </div>
          )}
          
          <button
            onClick={() => onNavigate(riasecCompleted ? "insight" : "riasec")}
            className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-md text-blue-700 border border-blue-300/50 py-3 rounded-xl text-sm font-medium transition min-h-[44px] shadow-sm hover:shadow-md"
          >
            {riasecCompleted ? "결과 상세 보기 →" : "검사 시작하기 →"}
          </button>
        </motion.div>

        {/* 핵심역량 진단 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              핵심역량진단
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              dbCompetencyScores ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {dbCompetencyScores ? '완료' : '미완료'}
            </span>
          </div>

          {dbCompetencyScores ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { axis: "융합", value: dbCompetencyScores.convergence },
                  { axis: "실용", value: dbCompetencyScores.practical },
                  { axis: "창의", value: dbCompetencyScores.creative },
                  { axis: "자기주도", value: dbCompetencyScores.selfDirected },
                  { axis: "어우름", value: dbCompetencyScores.harmony },
                  { axis: "배려", value: dbCompetencyScores.care }
                ]} outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="핵심역량" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
              <p className="text-sm text-gray-500 text-center">
                핵심역량 진단을 통해<br />나의 강점을 파악하세요
              </p>
            </div>
          )}

          <button
            onClick={() => onNavigate("competency")}
            className="w-full mt-4 bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-md text-purple-700 border border-purple-300/50 py-3 rounded-xl text-sm font-medium transition min-h-[44px] shadow-sm hover:shadow-md"
          >
            {dbCompetencyScores ? "결과 상세 보기 →" : "진단 시작하기 →"}
          </button>
        </motion.div>

        {/* 전공능력 진단 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              전공능력진단
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              hasCompletedMajorAssessment ? 'bg-green-100 text-green-700' :
              majorAssessments.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {hasCompletedMajorAssessment ? '완료' : majorAssessments.length > 0 ? '진행 중' : '미완료'}
            </span>
          </div>

          {sortedMajorAssessments.length > 0 ? (
            <div className="h-48 flex flex-col justify-center">
              {/* 가장 적합한 전공 안내 (2개 이상 완료 시) */}
              {hasCompletedMajorAssessment && bestFitMajor && sortedMajorAssessments.filter(a => (a.completion_percentage || 0) >= 100).length >= 2 && (
                <div className="mb-3 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 text-center">
                    🎯 <span className="font-semibold">{studentName}</span>님에게는{' '}
                    <span className="font-bold text-amber-800">{bestFitMajor.major_name}</span>이(가) 어울립니다!
                  </p>
                </div>
              )}
              {/* 진단 전공 목록 (점수순 정렬) */}
              <div className="space-y-2">
                {sortedMajorAssessments.slice(0, 3).map((assessment, index) => {
                  const isCompleted = (assessment.completion_percentage || 0) >= 100;
                  const isTopScore = index === 0 && isCompleted && sortedMajorAssessments.filter(a => (a.completion_percentage || 0) >= 100).length >= 2;

                  return (
                    <div
                      key={assessment.major_key}
                      className={`relative flex items-center justify-between p-2 rounded-lg overflow-hidden transition-all ${
                        isTopScore
                          ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 shadow-md'
                          : 'bg-gray-50'
                      }`}
                    >
                      {/* 반짝이는 효과 (최고 점수 전공) */}
                      {isTopScore && (
                        <>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                          />
                          <span className="absolute -top-1 -left-1 text-lg">✨</span>
                          <span className="absolute -bottom-1 -right-1 text-lg">✨</span>
                        </>
                      )}
                      <div className="flex items-center gap-2 relative z-10">
                        {isTopScore && <span className="text-sm">🏆</span>}
                        <span className={`text-sm font-medium truncate max-w-[100px] ${isTopScore ? 'text-amber-800' : 'text-gray-700'}`}>
                          {assessment.major_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 relative z-10">
                        {isCompleted ? (
                          <span className={`text-sm font-bold ${isTopScore ? 'text-amber-700' : 'text-green-600'}`}>
                            {(assessment.avg_score || 0).toFixed(1)}점
                          </span>
                        ) : (
                          <>
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${assessment.completion_percentage || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">
                              {Math.round(assessment.completion_percentage || 0)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sortedMajorAssessments.length > 3 && (
                  <p className="text-xs text-gray-400 text-center">+{sortedMajorAssessments.length - 3}개 더</p>
                )}
              </div>
              {!hasCompletedMajorAssessment && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  전체 진행률: {majorAssessmentProgress}%
                </p>
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
              <p className="text-sm text-gray-500 text-center">
                추천 전공 자가진단을 통해<br />전공을 탐색해보세요
              </p>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">현재 전공</p>
                <p className="font-medium text-gray-700">{studentDepartment}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate("roadmap-explorer")}
            className="w-full mt-4 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-md text-green-700 border border-green-300/50 py-3 rounded-xl text-sm font-medium transition min-h-[44px] shadow-sm hover:shadow-md"
          >
            {hasCompletedMajorAssessment ? "결과 보기 →" : majorAssessments.length > 0 ? "계속하기 →" : "자가진단 시작하기 →"}
          </button>
        </motion.div>
      </div>


      {/* 롤모델 탐색 & 커리큘럼 플래너 요약 카드 */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* 롤모델 탐색 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              롤모델 탐색
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isStep4Completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {isStep4Completed ? '완료' : '미완료'}
            </span>
          </div>

          <div className="flex flex-col justify-center min-h-[144px]">
            {isStep4Completed && roleModelSummary ? (
              <div className="space-y-3">
                {/* 롤모델 회사 요약 */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                  <p className="text-xs text-amber-600 font-medium mb-1">📍 선택한 롤모델 {roleModelSummary.total}명의 회사</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {roleModelSummary.companies.join(', ')}
                    {selectedRoleModelDetails.length > 3 && ` 외 ${selectedRoleModelDetails.length - 3}곳`}
                  </p>
                </div>

                {/* 통계 요약 */}
                <div className="grid grid-cols-2 gap-2">
                  {roleModelSummary.topCompanyType && (
                    <div className="p-2 bg-white/60 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">주요 기업유형</p>
                      <p className="text-sm font-bold text-amber-700">{roleModelSummary.topCompanyType}</p>
                    </div>
                  )}
                  {roleModelSummary.topJobType && (
                    <div className="p-2 bg-white/60 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">주요 직무</p>
                      <p className="text-sm font-bold text-amber-700">{roleModelSummary.topJobType}</p>
                    </div>
                  )}
                  {roleModelSummary.avgGpa && (
                    <div className="p-2 bg-white/60 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">평균 학점</p>
                      <p className="text-sm font-bold text-amber-700">{roleModelSummary.avgGpa.toFixed(2)}</p>
                    </div>
                  )}
                  {roleModelSummary.certRate > 0 && (
                    <div className="p-2 bg-white/60 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">자격증 보유</p>
                      <p className="text-sm font-bold text-amber-700">{roleModelSummary.certRate}%</p>
                    </div>
                  )}
                </div>
              </div>
            ) : isStep4Completed ? (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <p className="text-sm font-semibold text-amber-800">선택한 롤모델</p>
                  <p className="text-lg font-bold text-amber-600">{selectedRoleModelCards.size}명</p>
                </div>
              </div>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
                <p className="text-sm text-gray-500 text-center">
                  선배들의 커리어 경로를 탐색하고<br />나만의 롤모델을 찾아보세요
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate("roadmap-rolemodels")}
            className="w-full mt-4 bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md text-amber-700 border border-amber-300/50 py-3 rounded-xl text-sm font-medium transition min-h-[44px] shadow-sm hover:shadow-md"
          >
            {isStep4Completed ? "롤모델 다시 보기 →" : "롤모델 탐색하기 →"}
          </button>
        </motion.div>

        {/* 커리큘럼 플래너 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              커리큘럼 플래너
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              curriculumProgress >= 50 ? 'bg-green-100 text-green-700' :
              curriculumProgress > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {curriculumProgress}% 이수
            </span>
          </div>

          <div className="h-36 flex flex-col justify-center">
            <div className="space-y-4">
              {/* 학점 이수 현황 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">총 이수 학점</span>
                  <span className="font-bold text-gray-800">{acquiredCredits} / 130 학점</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${curriculumProgress}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
              </div>

              {/* 학점 정보 */}
              <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500">평균 학점</p>
                  <p className="text-lg font-bold text-cyan-600">{(gpa || 0).toFixed(2)}</p>
                </div>
                <div className="w-px h-8 bg-cyan-200"></div>
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500">남은 학점</p>
                  <p className="text-lg font-bold text-cyan-600">{Math.max(130 - acquiredCredits, 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("roadmap-fullcycle")}
            className="w-full mt-4 bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md text-cyan-700 border border-cyan-300/50 py-3 rounded-xl text-sm font-medium transition min-h-[44px] shadow-sm hover:shadow-md"
          >
            커리큘럼 관리하기 →
          </button>
        </motion.div>
      </div>

      {/* 빠른 액션 버튼들 - 임시 주석처리 */}
      {/*
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { icon: "📂", label: "전공 탐색", desc: "추천 전공 자가진단", action: () => onNavigate("roadmap-explorer"), iconBg: "bg-indigo-100", iconColor: "text-indigo-600", borderColor: "border-indigo-200" },
          { icon: "📐", label: "커리큘럼 플래너", desc: "4년 계획 설계", action: () => onNavigate("roadmap-fullcycle"), iconBg: "bg-blue-100", iconColor: "text-blue-600", borderColor: "border-blue-200" },
          { icon: "⭐", label: "롤모델 탐색", desc: "선배 커리어 분석", action: () => onNavigate("roadmap-rolemodels"), iconBg: "bg-amber-100", iconColor: "text-amber-600", borderColor: "border-amber-200" },
          { icon: "📊", label: "성적 현황", desc: "학점 및 이수 현황", action: () => onNavigate("grades"), iconBg: "bg-green-100", iconColor: "text-green-600", borderColor: "border-green-200" },
          { icon: "👤", label: "개인정보", desc: "프로필 관리", action: () => onNavigate("personal"), iconBg: "bg-purple-100", iconColor: "text-purple-600", borderColor: "border-purple-200" }
        ].map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            onClick={item.action}
            className={`bg-white/60 backdrop-blur-sm border border-white/30 shadow-md rounded-2xl p-4 text-left hover:shadow-lg transition-all hover:scale-[1.02] group min-h-[120px] flex flex-col`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 ${item.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-xl md:text-2xl">{item.icon}</span>
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">{item.label}</h4>
            <p className="text-xs md:text-sm text-gray-500">{item.desc}</p>
          </motion.button>
        ))}
      </div>
      */}

      {/* 하단 정보 카드들 */}
      <div className="grid md:grid-cols-1 gap-6">
        {/* 목표 달성 현황 - 임시 주석처리 */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">목표 달성 현황</h3>
          <div className="space-y-4">
            {[
              { label: "진로 탐색", value: riasecCompleted ? 100 : 0, color: "bg-blue-500" },
              { label: "역량 개발", value: dbCompetencyScores ? dbCompetencyScores.total : 0, color: "bg-purple-500" },
              { label: "전공 심화", value: majorAssessmentProgress, color: "bg-green-500" },
              { label: "경력 준비", value: 8, color: "bg-amber-500" }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.9 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        */}

        {/* 추천 액션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-4">다음 추천 액션</h3>
          <div className="space-y-3">
            {!riasecCompleted && (
              <button
                onClick={() => onNavigate("riasec")}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
              >
                <p className="font-medium">MJU 전공 진로 적합도 검사 완료하기</p>
                <p className="text-sm text-white/70">진로 적성을 파악하세요</p>
              </button>
            )}
            {riasecCompleted && !dbCompetencyScores && (
              <button
                onClick={() => onNavigate("competency")}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
              >
                <p className="font-medium">핵심역량진단 완료하기</p>
                <p className="text-sm text-white/70">6대 핵심역량을 진단하세요</p>
              </button>
            )}
            <button
              onClick={() => onNavigate("roadmap-fullcycle")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
            >
              <p className="font-medium">커리큘럼 계획 세우기</p>
              <p className="text-sm text-white/70">4년 로드맵을 설계하세요</p>
            </button>
            <button
              onClick={() => onNavigate("roadmap-rolemodels")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
            >
              <p className="font-medium">롤모델 선배 찾기</p>
              <p className="text-sm text-white/70">성공한 선배의 경로를 참고하세요</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
