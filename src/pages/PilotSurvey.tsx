import React, { useState, useEffect, useRef } from 'react';
import { usePilotSurvey } from '../hooks/usePilotSurvey';
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
import { PilotResult as PilotResultType } from '../types/pilot';

interface PilotSurveyProps {
  onNavigate?: (page: string) => void;
  onComplete?: (result: PilotResultType) => void;
}

interface ParticipantInfo {
  name: string;
  studentId: string;
  email: string;
}

export default function PilotSurvey({ onNavigate, onComplete }: PilotSurveyProps) {
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({
    name: '',
    studentId: '',
    email: '',
  });

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
    participantInfo: participantInfo.name && participantInfo.email ? participantInfo : undefined,
    onComplete,
  });

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
    return (
      <RiasecQuestion
        question={currentRiasecQuestion}
        value={riasecAnswers[currentRiasecQuestion.id]}
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
