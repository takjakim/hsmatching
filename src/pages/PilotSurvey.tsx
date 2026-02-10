import React, { useState, useEffect, useRef } from 'react';
import { usePilotSurvey } from '../hooks/usePilotSurvey';
import { getStudentIdFromUrl, getUserInfoFromUrl } from '../utils/tokenAuth';
import PilotIntro from '../components/pilot/PilotIntro';
import LikertQuestion from '../components/pilot/LikertQuestion';
import SingleSelectQuestion from '../components/pilot/SingleSelectQuestion';
import MultiSelectQuestion from '../components/pilot/MultiSelectQuestion';
import RankingQuestion from '../components/pilot/RankingQuestion';
import FreeTextQuestion from '../components/pilot/FreeTextQuestion';
import RiasecQuestion from '../components/pilot/RiasecQuestion';
import RiasecResult from '../components/pilot/RiasecResult';
import InterestSelect from '../components/pilot/InterestSelect';
import MajorPreview from '../components/pilot/MajorPreview';
import { PilotResult as PilotResultType, RiasecScores, RiasecAnswer } from '../types/pilot';

interface PilotSurveyProps {
  onNavigate?: (page: string) => void;
  onComplete?: (result: PilotResultType) => void;
  isLoggedIn?: boolean;
  currentStudentId?: string | null;
  mode?: 'mju' | 'external' | 'default';
  // 보완검사부터 시작할 때 사용
  initialRiasecScores?: RiasecScores;
  initialRiasecAnswers?: RiasecAnswer;
  startAtSupplementary?: boolean;
}

interface ParticipantInfo {
  name: string;
  studentId: string;
  email: string;
}

export default function PilotSurvey({
  onNavigate,
  onComplete,
  isLoggedIn = false,
  currentStudentId,
  mode = 'default',
  initialRiasecScores,
  initialRiasecAnswers,
  startAtSupplementary = false,
}: PilotSurveyProps) {
  // URL에서 사용자 정보 추출 (이니스트 SSO 연동)
  const [urlUserInfo] = useState(() => getUserInfoFromUrl());
  // 기존 토큰 방식 호환 (학번만)
  const [tokenStudentId] = useState<string | null>(() => getStudentIdFromUrl());

  // 외부 연동 여부: URL에서 사용자 정보가 있으면 true
  const isExternalAccess = !!(urlUserInfo?.name && urlUserInfo?.email) || !!tokenStudentId;

  // 학번 우선순위: URL 사용자정보 > URL 토큰 > props > 입력
  const effectiveStudentId = urlUserInfo?.studentId || tokenStudentId || currentStudentId || '';

  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({
    name: urlUserInfo?.name || (tokenStudentId ? '김삼순' : ''),
    studentId: effectiveStudentId,
    email: urlUserInfo?.email || (tokenStudentId ? 'test@test.com' : ''),
  });

  // URL에서 사용자 정보가 전달된 경우 콘솔 로그 (디버깅용)
  useEffect(() => {
    if (urlUserInfo) {
      console.log('[TokenAuth] URL에서 사용자 정보 추출됨:', urlUserInfo);
    } else if (tokenStudentId) {
      console.log('[TokenAuth] URL 토큰에서 학번만 추출됨:', tokenStudentId);
      console.log('[TokenAuth] 외부 연동 모드 - 더미 데이터 사용');
    }
  }, [urlUserInfo, tokenStudentId]);

  const {
    phase,
    currentIndex,
    currentQuestion,
    answers,
    activeQuestions,
    result,
    isLoading,
    error,
    startSurvey,
    answerQuestion,
    goToNext,
    forceGoToNext,
    goToPrevious,
    canGoPrevious,
    resetSurvey,
    riasecIndex,
    riasecAnswers,
    riasecScores,
    currentRiasecQuestion,
    answerRiasecQuestion,
    goToPreviousRiasec,
    riasecCanGoPrevious,
    startSupplementary,
    skipSupplementary,
    selectedClusters,
    toggleCluster,
    startMajorPreview,
    startRiasecFromPreview,
    backToInterestSelect,
    interestedMajorKeys,
    toggleInterestedMajor,
  } = usePilotSurvey({
    // 로그인 사용자는 studentId만 있어도 저장, 비로그인은 name+email 필요
    // 외부 연동(토큰)인 경우 더미 데이터 사용
    participantInfo: isExternalAccess
      ? { name: '김삼순', studentId: effectiveStudentId, email: 'test@test.com' }
      : isLoggedIn && currentStudentId
        ? { name: '', studentId: currentStudentId, email: '' }
        : (participantInfo.name && participantInfo.email ? participantInfo : undefined),
    onComplete,
    // 외부 연동(토큰)인 경우 인트로 스킵
    skipIntro: isLoggedIn || startAtSupplementary || isExternalAccess,
    initialRiasecScores,
    initialRiasecAnswers,
    startAtSupplementary,
  });

  // 외부 연동(토큰)인 경우 자동으로 검사 시작
  const autoStarted = useRef(false);
  useEffect(() => {
    if (isExternalAccess && phase === 'interest_select' && !autoStarted.current) {
      // 이미 interest_select로 넘어왔으면 자동 시작 성공
      autoStarted.current = true;
      console.log('[TokenAuth] SSO 자동 시작 - 계열 선택 화면으로 진입');
    }
  }, [isExternalAccess, phase]);

  // Auto-reset if phase state is inconsistent (e.g. after HMR or corrupt localStorage)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPhaseDataReady =
    phase === 'intro' ||
    phase === 'interest_select' ||
    phase === 'major_preview' ||
    (phase === 'riasec' && !!currentRiasecQuestion) ||
    (phase === 'riasec_result' && !!riasecScores) ||
    (phase === 'supplementary' && !!currentQuestion) ||
    (phase === 'complete' && !!result && !!result.riasecScores);

  useEffect(() => {
    if (!isPhaseDataReady && !isLoading) {
      resetTimerRef.current = setTimeout(() => {
        console.warn('Auto-resetting: phase data not ready after 1s. phase:', phase);
        localStorage.removeItem('pilot_survey_progress');
        resetSurvey();
      }, 1000);
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [isPhaseDataReady, isLoading, phase, resetSurvey]);

  // Intro phase
  if (phase === 'intro') {
    return (
      <PilotIntro
        onStart={startSurvey}
        participantInfo={participantInfo}
        onParticipantInfoChange={setParticipantInfo}
        mode={mode}
      />
    );
  }

  // Interest Select phase
  if (phase === 'interest_select') {
    return (
      <InterestSelect
        selectedClusters={selectedClusters}
        onSelectCluster={toggleCluster}
        onNext={startMajorPreview}
      />
    );
  }

  // Major Preview phase
  if (phase === 'major_preview') {
    return (
      <MajorPreview
        selectedClusters={selectedClusters}
        onStartRiasec={startRiasecFromPreview}
        onBack={backToInterestSelect}
        interestedMajorKeys={interestedMajorKeys}
        onToggleMajor={toggleInterestedMajor}
      />
    );
  }

  // RIASEC phase - RiasecQuestion is already a full-screen component
  if (phase === 'riasec') {
    if (!currentRiasecQuestion) {
      // riasecIndex not yet updated (e.g. during localStorage restore) — wait for next render
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }

    // 저장된 원래 선택값을 화면 표시용으로 변환 (스왑된 경우)
    const storedValue = riasecAnswers[currentRiasecQuestion.id];
    const isSwapped = (currentRiasecQuestion as { _isSwapped?: boolean })._isSwapped;
    const displayValue = storedValue && isSwapped
      ? (storedValue === 'A' ? 'B' : 'A')
      : storedValue;

    return (
      <RiasecQuestion
        question={currentRiasecQuestion}
        value={displayValue}
        onChange={answerRiasecQuestion}
        onPrevious={goToPreviousRiasec}
        canGoPrevious={riasecCanGoPrevious}
        questionNumber={riasecIndex + 1}
        totalQuestions={75}
      />
    );
  }

  // RIASEC Result phase
  if (phase === 'riasec_result') {
    if (!riasecScores) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }
    return (
      <RiasecResult
        scores={riasecScores}
        onContinue={startSupplementary}
        onSkip={skipSupplementary}
        participantName={participantInfo.name || undefined}
        interestedMajorKeys={interestedMajorKeys}
      />
    );
  }

  // Supplementary phase - All question types get full-screen treatment
  if (phase === 'supplementary') {
    if (!currentQuestion) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }
    const commonProps = {
      questionNumber: currentIndex + 1,
      totalQuestions: activeQuestions.length,
      onPrevious: canGoPrevious ? goToPrevious : undefined,
    };

    switch (currentQuestion.type) {
      case 'likert':
        return (
          <LikertQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as number}
            onChange={answerQuestion}
            onAutoAdvance={forceGoToNext}
            {...commonProps}
          />
        );

      case 'single':
        return (
          <SingleSelectQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as string}
            onChange={answerQuestion}
            onAutoAdvance={forceGoToNext}
            {...commonProps}
          />
        );

      case 'multi':
        return (
          <MultiSelectQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as string[]}
            onChange={answerQuestion}
            onNext={goToNext}
            {...commonProps}
          />
        );

      case 'ranking':
        return (
          <RankingQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as Record<string, number>}
            onChange={answerQuestion}
            onNext={goToNext}
            {...commonProps}
          />
        );

      case 'freetext':
        return (
          <FreeTextQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            value={answers[currentQuestion.id] as string}
            onChange={answerQuestion}
            onNext={goToNext}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  }

  // Complete phase - render RiasecResult with supplementary data
  if (phase === 'complete') {
    if (!result || !result.riasecScores) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1E3A5F] border-t-transparent"></div>
        </div>
      );
    }
    // Map career decision status to display text
    const decisionLevelMap: Record<string, string> = {
      decided: '확정',
      exploring: '탐색',
      undecided: '미결정',
    };

    // Build supplementary data if not skipped
    const supplementaryData = result.skippedSupplementary ? undefined : {
      valueScores: result.valueScores,
      careerDecision: result.careerDecision ? {
        level: decisionLevelMap[result.careerDecision.status] || '탐색',
        confidence: result.careerDecision.score / 5, // Convert 1-5 scale to 0-1
      } : undefined,
      selfEfficacy: result.selfEfficacy,
      preferences: {
        fieldPreference: result.preferences?.fieldPreference,
        workStyle: result.preferences?.workStyle,
        environmentPreference: result.preferences?.workEnvironment,
      },
      roleModel: result.roleModel,
      valueRanking: result.valueRanking,
    };

    return (
      <RiasecResult
        scores={result.riasecScores}
        participantName={result.name || participantInfo.name || undefined}
        supplementaryData={supplementaryData}
        isComplete={true}
        onNavigate={onNavigate}
        onRestart={resetSurvey}
        interestedMajorKeys={interestedMajorKeys}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1E3A5F] border-t-transparent mb-4"></div>
        <p className="text-[#475569]">결과를 저장하고 있습니다...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">오류가 발생했습니다</h2>
          <p className="text-[#475569] mb-6">{error}</p>
          <button
            onClick={goToNext}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // Default fallback - log for debugging and auto-reset
  console.warn('PilotSurvey fallback reached. phase:', phase, 'result:', !!result, 'riasecScores:', !!riasecScores, 'currentQuestion:', !!currentQuestion);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1E293B] mb-2">이전 검사 데이터에 문제가 있습니다</h2>
        <p className="text-sm text-[#475569] mb-6">저장된 진행 상태를 불러올 수 없습니다.<br />처음부터 다시 시작해 주세요.</p>
        <button
          onClick={() => {
            localStorage.removeItem('pilot_survey_progress');
            resetSurvey();
          }}
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
        >
          처음부터 시작하기
        </button>
      </div>
    </div>
  );
}
