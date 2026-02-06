import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COMPETENCY_QUESTIONS,
  COMPETENCY_INFO,
  CompetencyType,
  CompetencyScores,
  calculateCompetencyScores,
  CompetencyQuestion,
} from '../data/competencyQuestions';
import { saveCompetencyResult, generatePilotCode, getCompetencyResultByStudentId } from '../../lib/supabase';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import StepGuideFlow from '../components/StepGuideFlow';

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type RiasecResult = Record<Dim, number>;

interface CompetencySurveyProps {
  onNavigate?: (page: string) => void;
  onComplete?: (scores: CompetencyScores) => void;
  currentStudentId?: string | null;
  riasecResult?: RiasecResult | null;
  completedMajorAssessments?: string[];
}

const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#E8B86D',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
};

// 리커트 척도 옵션
const LIKERT_OPTIONS = [
  { value: 1, label: '전혀\n그렇지 않다' },
  { value: 2, label: '그렇지\n않다' },
  { value: 3, label: '보통이다' },
  { value: 4, label: '그렇다' },
  { value: 5, label: '매우\n그렇다' },
];

// 역량 순서
const COMPETENCY_ORDER: CompetencyType[] = [
  'convergence',
  'practical',
  'creative',
  'selfDirected',
  'harmony',
  'care',
];

export default function CompetencySurvey({
  onNavigate,
  onComplete,
  currentStudentId,
  riasecResult,
  completedMajorAssessments = [],
}: CompetencySurveyProps) {
  const [phase, setPhase] = useState<'loading' | 'intro' | 'survey' | 'result'>('loading');
  const [scores, setScores] = useState<CompetencyScores | null>(null);

  // 단계 가이드 플로우
  const guideSteps = useMemo(() => [
    { step: 1, title: 'MJU 전공 진로 적합도 검사', completed: !!riasecResult, action: () => onNavigate?.('riasec') },
    { step: 2, title: '핵심역량진단', completed: !!scores || phase === 'result', action: () => {} },
    { step: 3, title: '전공능력진단', completed: completedMajorAssessments.length > 0, action: () => onNavigate?.('roadmap-explorer') },
    { step: 4, title: '롤모델 탐색', completed: false, action: () => onNavigate?.('roadmap-rolemodels') },
    { step: 5, title: '커리큘럼 플래너', completed: false, action: () => onNavigate?.('roadmap-planner') },
  ], [riasecResult, scores, phase, completedMajorAssessments, onNavigate]);
  const [currentCompetencyIndex, setCurrentCompetencyIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // DB에서 기존 결과 불러오기
  useEffect(() => {
    async function loadExistingResult() {
      if (currentStudentId) {
        try {
          const result = await getCompetencyResultByStudentId(currentStudentId);
          if (result?.scores) {
            setScores(result.scores);
            setPhase('result');
            return;
          }
        } catch (error) {
          console.error('Failed to load competency result:', error);
        }
      }
      setPhase('intro');
    }
    loadExistingResult();
  }, [currentStudentId]);

  // 역량별로 문항 그룹화
  const questionsByCompetency = useMemo(() => {
    const grouped: Record<CompetencyType, CompetencyQuestion[]> = {
      convergence: [],
      practical: [],
      creative: [],
      selfDirected: [],
      harmony: [],
      care: [],
    };
    COMPETENCY_QUESTIONS.forEach((q) => {
      grouped[q.competency].push(q);
    });
    return grouped;
  }, []);

  const currentCompetency = COMPETENCY_ORDER[currentCompetencyIndex];
  const currentQuestions = questionsByCompetency[currentCompetency];
  const competencyInfo = COMPETENCY_INFO[currentCompetency];
  const progress = ((currentCompetencyIndex + 1) / COMPETENCY_ORDER.length) * 100;

  // 현재 역량의 모든 문항이 응답되었는지 확인
  const isCurrentCompetencyComplete = currentQuestions.every(
    (q) => answers[q.id] !== undefined
  );

  // 응답 처리
  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // 다음 역량으로
  const goToNext = async () => {
    if (currentCompetencyIndex < COMPETENCY_ORDER.length - 1) {
      setCurrentCompetencyIndex(currentCompetencyIndex + 1);
    } else {
      // 검사 완료 - 결과 계산 및 저장
      setIsLoading(true);
      try {
        const calculatedScores = calculateCompetencyScores(answers);
        setScores(calculatedScores);

        // DB에 저장
        if (currentStudentId) {
          const code = generatePilotCode();
          await saveCompetencyResult(code, {
            studentId: currentStudentId,
            answers: answers,
            scores: calculatedScores,
          });
        }

        onComplete?.(calculatedScores);
        setPhase('result');
      } catch (error) {
        console.error('Failed to save competency result:', error);
        // 저장 실패해도 결과는 보여줌
        const calculatedScores = calculateCompetencyScores(answers);
        setScores(calculatedScores);
        setPhase('result');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 이전 역량으로
  const goToPrevious = () => {
    if (currentCompetencyIndex > 0) {
      setCurrentCompetencyIndex(currentCompetencyIndex - 1);
    }
  };

  // 초기 로딩 화면
  if (phase === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
          />
          <p style={{ color: COLORS.text.secondary }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 인트로 화면
  if (phase === 'intro') {
    return (
      <div
        className="min-h-screen p-6"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* 단계 가이드 */}
          <StepGuideFlow currentStep={2} steps={guideSteps} />

          <div className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                  }}
                >
                  <span className="text-4xl">💪</span>
                </div>
                <h1
                  className="text-2xl md:text-3xl font-bold mb-4"
                  style={{ color: COLORS.text.primary }}
                >
                  MJU 핵심역량진단
                </h1>
                <p className="text-base md:text-lg" style={{ color: COLORS.text.secondary }}>
                  명지대학교 6대 핵심역량을 진단합니다
                </p>
              </div>

              {/* 6대 핵심역량 소개 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {Object.values(COMPETENCY_INFO).map((info) => (
                  <div
                    key={info.type}
                    className="p-3 rounded-xl text-center"
                    style={{ backgroundColor: `${info.color}10` }}
                  >
                    <p className="font-semibold text-sm" style={{ color: info.color }}>
                      {info.name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold mb-3" style={{ color: COLORS.text.primary }}>
                  검사 안내
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: COLORS.text.secondary }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>6개 역량별 5문항씩, 총 30문항으로 구성되어 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>각 역량별로 모든 문항에 응답 후 다음으로 넘어갑니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>정답이 없으니 솔직하게 응답해주세요</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setPhase('survey')}
                className="w-full py-4 rounded-2xl font-semibold text-white text-lg transition-transform hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                }}
              >
                검사 시작하기
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (phase === 'result' && scores) {
    const radarData = Object.entries(COMPETENCY_INFO).map(([key, info]) => ({
      competency: info.name,
      score: scores[key as CompetencyType],
      fullMark: 100,
    }));

    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.bg }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 단계 가이드 */}
          <StepGuideFlow currentStep={2} steps={guideSteps} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h1
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: COLORS.text.primary }}
              >
                핵심역량진단 결과
              </h1>
              <p style={{ color: COLORS.text.secondary }}>
                명지대학교 6대 핵심역량 진단 결과입니다
              </p>
            </div>

            {/* 종합 점수 */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                }}
              >
                <span className="text-4xl font-bold text-white">{scores.total}</span>
              </div>
              <p className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
                종합 점수
              </p>
            </div>

            {/* 레이더 차트 */}
            <div className="w-full h-80 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="competency" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="점수"
                    dataKey="score"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 역량별 점수 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {Object.entries(COMPETENCY_INFO).map(([key, info]) => (
                <div
                  key={key}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: `${info.color}10` }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: info.color }}>
                    {info.name}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                    {scores[key as CompetencyType]}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                  </p>
                </div>
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="flex-1 py-4 rounded-2xl font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                }}
              >
                대시보드로
              </button>
              <button
                onClick={() => {
                  setPhase('intro');
                  setCurrentCompetencyIndex(0);
                  setAnswers({});
                  setScores(null);
                }}
                className="flex-1 py-4 rounded-2xl font-semibold border-2"
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              >
                다시 검사하기
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}
          />
          <p style={{ color: COLORS.text.secondary }}>결과를 저장하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 검사 화면 - 역량별 페이지
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg }}>
      {/* 프로그래스바 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-slate-200">
          <motion.div
            className="h-full"
            style={{
              background: `linear-gradient(90deg, ${competencyInfo.color} 0%, ${COLORS.secondary} 100%)`,
              width: `${progress}%`,
            }}
            layout
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-4 md:px-6 py-16 overflow-auto">
        <div className="w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCompetency}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 역량 헤더 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${competencyInfo.color}20` }}
                  >
                    {currentCompetencyIndex === 0 && '🔗'}
                    {currentCompetencyIndex === 1 && '🛠️'}
                    {currentCompetencyIndex === 2 && '💡'}
                    {currentCompetencyIndex === 3 && '🎯'}
                    {currentCompetencyIndex === 4 && '🤝'}
                    {currentCompetencyIndex === 5 && '💝'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${competencyInfo.color}20`,
                          color: competencyInfo.color,
                        }}
                      >
                        {currentCompetencyIndex + 1} / {COMPETENCY_ORDER.length}
                      </span>
                    </div>
                    <h2
                      className="text-xl md:text-2xl font-bold"
                      style={{ color: competencyInfo.color }}
                    >
                      {competencyInfo.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{competencyInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* 리커트 척도 헤더 */}
              <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-1/2 md:w-2/5"></div>
                  <div className="w-1/2 md:w-3/5 flex justify-between px-2">
                    {LIKERT_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex-1 text-center text-[10px] md:text-xs text-gray-500 whitespace-pre-line leading-tight"
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 문항 리스트 */}
              <div className="space-y-3">
                {currentQuestions.map((question, idx) => {
                  const selectedValue = answers[question.id];
                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        {/* 문항 텍스트 */}
                        <div className="w-1/2 md:w-2/5">
                          <span
                            className="text-xs font-medium mr-2"
                            style={{ color: competencyInfo.color }}
                          >
                            Q{idx + 1}
                          </span>
                          <span
                            className="text-sm md:text-base"
                            style={{ color: COLORS.text.primary }}
                          >
                            {question.text}
                          </span>
                        </div>

                        {/* 리커트 척도 버튼 */}
                        <div className="w-1/2 md:w-3/5 flex justify-between items-center px-2">
                          {LIKERT_OPTIONS.map((option) => {
                            const isSelected = selectedValue === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleAnswer(question.id, option.value)}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'scale-110 shadow-md'
                                    : 'hover:scale-105 hover:border-gray-400'
                                }`}
                                style={{
                                  backgroundColor: isSelected ? competencyInfo.color : 'transparent',
                                  borderColor: isSelected ? competencyInfo.color : '#E2E8F0',
                                }}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 md:w-5 md:h-5 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {!isSelected && (
                                  <span className="text-xs text-gray-400">{option.value}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 네비게이션 버튼 */}
              <div className="flex gap-4 mt-8">
                {currentCompetencyIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className="flex-1 py-4 rounded-2xl font-semibold border-2 transition-colors"
                    style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                  >
                    ← 이전 역량
                  </button>
                )}
                <button
                  onClick={goToNext}
                  disabled={!isCurrentCompetencyComplete}
                  className={`flex-1 py-4 rounded-2xl font-semibold text-white transition-all ${
                    isCurrentCompetencyComplete
                      ? 'hover:scale-[1.02]'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{
                    background: isCurrentCompetencyComplete
                      ? `linear-gradient(135deg, ${competencyInfo.color} 0%, ${COLORS.secondary} 100%)`
                      : '#CBD5E1',
                  }}
                >
                  {currentCompetencyIndex < COMPETENCY_ORDER.length - 1
                    ? '다음 역량 →'
                    : '결과 보기'}
                </button>
              </div>

              {/* 응답 현황 안내 */}
              {!isCurrentCompetencyComplete && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  모든 문항에 응답해주세요 (
                  {currentQuestions.filter((q) => answers[q.id] !== undefined).length}/
                  {currentQuestions.length})
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
