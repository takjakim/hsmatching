import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recommendMajors } from "../utils/recommendMajors";
import { getMajorCompetencyData, DEFAULT_COMPETENCY_DATA, MajorCompetencyData, MajorCompetency } from "../data/majorCompetencyData";
import { saveMajorAssessment, getMajorAssessmentsByStudentId, deleteMajorAssessment, MajorAssessment } from "../../lib/supabase";
import StepGuideFlow from "../components/StepGuideFlow";
import { CompetencyScores } from "../data/competencyQuestions";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type RiasecResult = Record<Dim, number>;

// 자가진단 응답 타입 (리커트 5점 척도)
type SelfAssessmentScore = 1 | 2 | 3 | 4 | 5;

interface Props {
  onNavigate?: (page: string) => void;
  riasecResult?: RiasecResult | null;
  currentStudentId?: string | null;
  competencyResult?: CompetencyScores | null;
}

export default function MajorExplorer({ onNavigate, riasecResult, currentStudentId, competencyResult }: Props) {
  // 모든 추천 전공 (검색용)
  const allRecommendedMajors = useMemo(() => {
    if (!riasecResult) return [];
    return recommendMajors(riasecResult, { limit: 50 }); // 전체 가져오기
  }, [riasecResult]);

  // 자가진단 응답 저장
  const [assessments, setAssessments] = useState<Record<string, Record<string, SelfAssessmentScore>>>({});

  // 완료된 전공 진단 목록
  const completedMajorAssessments = useMemo(() => {
    return Object.keys(assessments).filter(majorKey => {
      const majorAnswers = assessments[majorKey];
      return Object.keys(majorAnswers).length > 0;
    });
  }, [assessments]);

  // 단계 가이드 플로우
  const guideSteps = useMemo(() => [
    { step: 1, title: 'MJU 전공 진로 적합도 검사', completed: !!riasecResult, action: () => onNavigate?.('riasec') },
    { step: 2, title: '핵심역량진단', completed: !!competencyResult, action: () => onNavigate?.('competency') },
    { step: 3, title: '전공능력진단', completed: completedMajorAssessments.length > 0, action: () => {} },
    { step: 4, title: '롤모델 탐색', completed: false, action: () => onNavigate?.('roadmap-rolemodels') },
    { step: 5, title: '커리큘럼 플래너', completed: false, action: () => onNavigate?.('roadmap-planner') },
  ], [riasecResult, competencyResult, completedMajorAssessments, onNavigate]);

  // 기본 추천 전공 (상위 3개)
  const defaultMajors = useMemo(() => {
    return allRecommendedMajors.slice(0, 3);
  }, [allRecommendedMajors]);

  // 사용자가 추가한 전공
  const [addedMajorKeys, setAddedMajorKeys] = useState<string[]>([]);

  // 선택된 전공 인덱스 (파일철 탭)
  const [selectedMajorIndex, setSelectedMajorIndex] = useState(0);

  // DB 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 숨긴 전공 목록 (localStorage에서 복원)
  const [hiddenMajors, setHiddenMajors] = useState<Set<string>>(() => {
    if (!currentStudentId) return new Set();
    try {
      const saved = localStorage.getItem(`hiddenMajors_${currentStudentId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // 전공 검색 모달 상태
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 표시할 전공 목록 (기본 + 추가 - 숨김)
  const visibleMajors = useMemo(() => {
    const addedMajors = allRecommendedMajors.filter(m => addedMajorKeys.includes(m.key));
    const combined = [...defaultMajors, ...addedMajors];
    // 중복 제거 및 숨긴 전공 제외
    const uniqueMap = new Map(combined.map(m => [m.key, m]));
    return Array.from(uniqueMap.values()).filter(m => !hiddenMajors.has(m.key));
  }, [defaultMajors, addedMajorKeys, allRecommendedMajors, hiddenMajors]);

  // 검색 결과 (이미 표시 중인 전공 제외)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allRecommendedMajors
      .filter(m => !visibleMajors.some(v => v.key === m.key))
      .filter(m => m.name.toLowerCase().includes(query) || m.college?.toLowerCase().includes(query))
      .slice(0, 10);
  }, [searchQuery, allRecommendedMajors, visibleMajors]);

  // DB에서 기존 응답 불러오기
  useEffect(() => {
    async function loadAssessments() {
      if (!currentStudentId) {
        setIsLoading(false);
        return;
      }

      try {
        const savedAssessments = await getMajorAssessmentsByStudentId(currentStudentId);
        if (savedAssessments.length > 0) {
          const loadedAnswers: Record<string, Record<string, SelfAssessmentScore>> = {};
          savedAssessments.forEach((assessment) => {
            if (assessment.answers) {
              loadedAnswers[assessment.major_key] = assessment.answers as Record<string, SelfAssessmentScore>;
            }
          });
          setAssessments(loadedAnswers);
        }
      } catch (error) {
        console.error('Failed to load assessments:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssessments();
  }, [currentStudentId]);

  // hiddenMajors를 localStorage에 저장
  useEffect(() => {
    if (!currentStudentId) return;
    try {
      localStorage.setItem(`hiddenMajors_${currentStudentId}`, JSON.stringify([...hiddenMajors]));
    } catch (error) {
      console.error('Failed to save hidden majors:', error);
    }
  }, [hiddenMajors, currentStudentId]);

  // 현재 선택된 전공
  const selectedMajor = visibleMajors[selectedMajorIndex];

  // 현재 전공의 능력 데이터 (CSV 기반)
  const competencyData = useMemo((): MajorCompetencyData | null => {
    if (!selectedMajor) return null;
    
    // CSV 데이터에서 찾기
    const csvData = getMajorCompetencyData(selectedMajor.name);
    if (csvData) {
      return csvData;
    }
    
    // 없으면 기본 데이터 사용
    return {
      majorName: selectedMajor.name,
      college: selectedMajor.college || "소속 대학",
      majorCode: "",
      competencies: DEFAULT_COMPETENCY_DATA
    };
  }, [selectedMajor]);

  // DB 저장 함수
  const saveToDb = useCallback(async (
    majorKey: string,
    majorName: string,
    answers: Record<string, SelfAssessmentScore>,
    competencies: MajorCompetency[]
  ) => {
    if (!currentStudentId) return;

    const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
    const avgScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
    const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    try {
      setIsSaving(true);
      await saveMajorAssessment({
        student_id: currentStudentId,
        major_key: majorKey,
        major_name: majorName,
        answers,
        avg_score: avgScore,
        completion_percentage: completionPercentage,
      });
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentStudentId]);

  // 전공 추가
  const handleAddMajor = (majorKey: string) => {
    setAddedMajorKeys(prev => [...prev, majorKey]);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  // 전공 삭제 (목록에서 제거)
  const handleRemoveMajor = async (majorKey: string) => {
    if (!confirm('이 전공을 목록에서 제거하시겠습니까?\n(진단 데이터도 함께 삭제됩니다)')) return;

    // DB에서 진단 결과 삭제
    if (currentStudentId && assessments[majorKey]) {
      await deleteMajorAssessment(currentStudentId, majorKey);
    }

    // 로컬 상태에서 삭제
    setAssessments(prev => {
      const newAssessments = { ...prev };
      delete newAssessments[majorKey];
      return newAssessments;
    });

    // 추가된 전공이면 추가 목록에서 제거
    setAddedMajorKeys(prev => prev.filter(k => k !== majorKey));

    // 기본 전공이면 숨김 목록에 추가
    if (defaultMajors.some(m => m.key === majorKey)) {
      setHiddenMajors(prev => new Set([...prev, majorKey]));
    }

    // 선택된 인덱스 조정
    if (selectedMajorIndex >= visibleMajors.length - 1) {
      setSelectedMajorIndex(Math.max(0, visibleMajors.length - 2));
    }
  };

  // 전공 진단 결과 초기화 (응답만 삭제, 전공은 유지)
  const handleResetAssessment = async (majorKey: string) => {
    if (!currentStudentId) return;

    if (!confirm('이 전공의 진단 응답을 초기화하시겠습니까?')) return;

    try {
      const success = await deleteMajorAssessment(currentStudentId, majorKey);
      if (success) {
        setAssessments(prev => {
          const newAssessments = { ...prev };
          delete newAssessments[majorKey];
          return newAssessments;
        });
      }
    } catch (error) {
      console.error('Failed to reset assessment:', error);
      alert('초기화에 실패했습니다.');
    }
  };

  // 응답 처리
  const handleAssessment = (majorKey: string, majorName: string, questionKey: string, score: SelfAssessmentScore, competencies: MajorCompetency[]) => {
    const newAnswers = {
      ...(assessments[majorKey] || {}),
      [questionKey]: score
    };

    setAssessments(prev => ({
      ...prev,
      [majorKey]: newAnswers
    }));

    // DB에 저장 (debounce 효과를 위해 약간의 딜레이)
    saveToDb(majorKey, majorName, newAnswers, competencies);
  };

  // 현재 전공의 진단 결과 계산
  const calculateResults = (majorKey: string, competencies: MajorCompetency[]) => {
    const majorAssessment = assessments[majorKey] || {};
    const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);
    const answeredQuestions = Object.keys(majorAssessment).length;
    const totalScore = Object.values(majorAssessment).reduce((sum, score) => sum + score, 0);
    const avgScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      avgScore,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
    };
  };

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // RIASEC 검사가 완료되지 않은 경우
  if (!riasecResult || allRecommendedMajors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">전공 탐색</h2>
          <p className="text-gray-600 mb-6">
            MJU 전공 진로 적합도 검사를 완료하면<br />
            나에게 맞는 전공을 탐색할 수 있습니다.
          </p>
          <button
            onClick={() => onNavigate?.("riasec")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            MJU 전공 진로 적합도 검사 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 단계 가이드 */}
      <StepGuideFlow currentStep={3} steps={guideSteps} />

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <span className="mr-2">📂</span>
              나에게 맞는 전공 탐색
            </h2>
            <p className="text-indigo-100 mt-1">
              전공을 선택하여 전공능력 자가진단을 해보세요 (현재 {visibleMajors.length}개 선택)
            </p>
            <p className="text-indigo-200 text-sm mt-2">
              💡 리커트 5점 척도: 1(전혀 그렇지 않다) ~ 5(매우 그렇다)
            </p>
          </div>
          <button
            onClick={() => setShowSearchModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>➕</span> 전공 추가
          </button>
        </div>
      </div>

      {/* 전공 검색 모달 */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800">전공 추가</h3>
                <button
                  onClick={() => { setShowSearchModal(false); setSearchQuery(""); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="전공명 또는 단과대학 검색..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {searchQuery.trim() === "" ? (
                <div className="text-center text-gray-500 py-8">
                  <p>검색어를 입력해주세요</p>
                  <p className="text-sm mt-2">추천 전공 {allRecommendedMajors.length}개 중 검색</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((major) => (
                    <button
                      key={major.key}
                      onClick={() => handleAddMajor(major.key)}
                      className="w-full p-3 text-left rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{major.name}</p>
                          <p className="text-sm text-gray-500">{major.college}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-indigo-600 font-bold">{major.matchScore}%</span>
                          <p className="text-xs text-gray-400">매칭도</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 파일철 탭 UI */}
      <div className="relative">
        {/* 탭 헤더 (파일철 스타일) */}
        <div className="flex -mb-px relative z-10 flex-wrap gap-1">
          {visibleMajors.map((major, index) => {
            const isSelected = index === selectedMajorIndex;
            const majorData = getMajorCompetencyData(major.name);
            const competencies = majorData?.competencies || DEFAULT_COMPETENCY_DATA;
            const results = calculateResults(major.key, competencies);
            
            // 파일철 색상
            const colors = [
              { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", tab: "bg-blue-100" },
              { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", tab: "bg-emerald-100" },
              { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", tab: "bg-amber-100" },
              { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", tab: "bg-rose-100" },
              { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", tab: "bg-violet-100" }
            ];
            const color = colors[index] || colors[0];

            return (
              <button
                key={major.key}
                onClick={() => setSelectedMajorIndex(index)}
                className={`
                  relative px-4 py-3 rounded-t-xl border-2 border-b-0 transition-all
                  ${isSelected 
                    ? `${color.bg} ${color.border} ${color.text} -mb-[2px] z-20` 
                    : `bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-50`
                  }
                  ${index > 0 ? '-ml-2' : ''}
                `}
                style={{ 
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  minWidth: '160px'
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {index === 0 ? "📁" : index === 1 ? "📂" : "📁"}
                  </span>
                  <div className="text-left">
                    <div className={`font-semibold text-sm truncate max-w-[100px] ${isSelected ? color.text : ''}`}>
                      {major.name.length > 8 ? major.name.substring(0, 8) + "..." : major.name}
                    </div>
                    <div className="text-xs opacity-70">
                      {results.answeredQuestions > 0 
                        ? `${Math.round(results.percentage)}% 완료`
                        : "미진단"
                      }
                    </div>
                  </div>
                </div>
                {/* 매칭도 배지 */}
                <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                  isSelected ? 'bg-white shadow' : 'bg-gray-200'
                } ${color.text}`}>
                  {major.matchScore}%
                </div>
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 (파일철 본체) */}
        <AnimatePresence mode="wait">
          {selectedMajor && competencyData && (
            <motion.div
              key={selectedMajor.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`
                bg-white rounded-b-xl rounded-tr-xl shadow-lg border-2 p-6
                ${selectedMajorIndex === 0 ? 'border-blue-300' :
                  selectedMajorIndex === 1 ? 'border-emerald-300' :
                  selectedMajorIndex === 2 ? 'border-amber-300' :
                  selectedMajorIndex === 3 ? 'border-rose-300' : 'border-violet-300'}
              `}
            >
              {/* 전공 정보 헤더 */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-gray-800">{selectedMajor.name}</h3>
                    {selectedMajor.url && (
                      <button
                        onClick={() => window.open(selectedMajor.url, '_blank')}
                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                      >
                        🔗 홈페이지
                      </button>
                    )}
                    {assessments[selectedMajor.key] && Object.keys(assessments[selectedMajor.key]).length > 0 && (
                      <button
                        onClick={() => handleResetAssessment(selectedMajor.key)}
                        className="text-orange-400 hover:text-orange-600 text-sm flex items-center gap-1"
                      >
                        🔄 초기화
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMajor(selectedMajor.key)}
                      className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1"
                    >
                      ✕ 삭제
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{competencyData.college}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMajor.reasons?.slice(0, 3).map((reason, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{selectedMajor.matchScore}%</div>
                  <div className="text-xs text-gray-500">MJU 전공 진로 적합도 검사 매칭도</div>
                </div>
              </div>

              {/* 자가진단 진행 상태 */}
              {(() => {
                const results = calculateResults(selectedMajor.key, competencyData.competencies);
                return (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">전공능력 자가진단 진행도</span>
                        {isSaving && (
                          <span className="text-xs text-indigo-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            저장 중...
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {results.answeredQuestions} / {results.totalQuestions} 문항
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${results.percentage}%` }}
                      />
                    </div>
                    {results.avgScore > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        평균 자기평가 점수: <span className={`font-semibold ${getScoreColor(results.avgScore)}`}>{results.avgScore.toFixed(1)}</span> / 5
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 전공능력별 진단 */}
              <div className="space-y-6">
                {competencyData.competencies.map((competency, compIndex) => (
                  <div key={compIndex} className="border rounded-xl overflow-hidden">
                    {/* 역량 헤더 */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {competency.competencyNumber}
                        </span>
                        <h4 className="font-semibold text-gray-800">{competency.competencyName}</h4>
                      </div>
                    </div>

                    {/* 질문 목록 */}
                    <div className="divide-y">
                      {competency.questions.map((questionItem, qIndex) => {
                        const questionKey = `${compIndex}-${qIndex}`;
                        const currentScore = assessments[selectedMajor.key]?.[questionKey];
                        const questionText = typeof questionItem === 'string' 
                          ? questionItem 
                          : questionItem.question;

                        return (
                          <div key={qIndex} className="p-4">
                            <p className="text-sm text-gray-700 mb-3">
                              <span className="font-medium text-gray-500 mr-2">Q{qIndex + 1}.</span>
                              {questionText}
                            </p>
                            
                            {/* 5점 척도 */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 w-24">전혀 그렇지 않다</span>
                              <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((score) => (
                                  <button
                                    key={score}
                                    onClick={() => handleAssessment(selectedMajor.key, selectedMajor.name, questionKey, score as SelfAssessmentScore, competencyData.competencies)}
                                    className={`
                                      w-10 h-10 rounded-full font-medium transition-all
                                      ${currentScore === score
                                        ? 'bg-indigo-600 text-white shadow-lg scale-110'
                                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                                      }
                                    `}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 w-24 text-right">매우 그렇다</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 하단 액션 버튼 */}
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <button
                  onClick={() => onNavigate?.("roadmap")}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← 로드맵으로 돌아가기
                </button>
                <div className="flex space-x-3">
                  {selectedMajor.url && (
                    <button
                      onClick={() => window.open(selectedMajor.url, '_blank')}
                      className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                    >
                      전공 홈페이지 방문
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const results = calculateResults(selectedMajor.key, competencyData.competencies);
                      if (results.percentage === 100) {
                        alert(`${selectedMajor.name} 전공능력 자가진단이 완료되었습니다!\n\n평균 점수: ${results.avgScore.toFixed(1)} / 5\n\n${results.avgScore >= 4 ? '✅ 이 전공에 대한 역량이 높습니다!' : results.avgScore >= 3 ? '💪 기본 역량을 갖추고 있습니다.' : '📚 이 전공에 대한 학습이 더 필요합니다.'}`);
                      } else {
                        alert(`아직 ${results.totalQuestions - results.answeredQuestions}개 문항이 남아있습니다.`);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    진단 결과 확인
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 비교 요약 카드 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          선택한 전공 비교
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleMajors.map((major, index) => {
            const majorData = getMajorCompetencyData(major.name);
            const competencies = majorData?.competencies || DEFAULT_COMPETENCY_DATA;
            const results = calculateResults(major.key, competencies);
            const colorClasses = [
              { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-500' },
              { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', progress: 'bg-emerald-500' },
              { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', progress: 'bg-amber-500' },
              { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-600', progress: 'bg-rose-500' },
              { border: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-600', progress: 'bg-violet-500' }
            ];
            const color = colorClasses[index] || colorClasses[0];

            return (
              <div 
                key={major.key}
                onClick={() => setSelectedMajorIndex(index)}
                className={`
                  p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${index === selectedMajorIndex 
                    ? `${color.border} ${color.bg}` 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{major.name}</span>
                  <span className={`${color.text} font-bold`}>{major.matchScore}%</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{major.college}</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`${color.progress} h-1.5 rounded-full transition-all`}
                      style={{ width: `${results.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {results.percentage > 0 ? `${Math.round(results.percentage)}%` : '미진단'}
                  </span>
                </div>
                {results.avgScore > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    평균: <span className={getScoreColor(results.avgScore)}>{results.avgScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
