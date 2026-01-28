import React, { useState } from 'react';
import { usePilotSurvey } from '../hooks/usePilotSurvey';
import PilotIntro from '../components/pilot/PilotIntro';
import LikertQuestion from '../components/pilot/LikertQuestion';
import SingleSelectQuestion from '../components/pilot/SingleSelectQuestion';
import MultiSelectQuestion from '../components/pilot/MultiSelectQuestion';
import RankingQuestion from '../components/pilot/RankingQuestion';
import FreeTextQuestion from '../components/pilot/FreeTextQuestion';
import RiasecQuestion from '../components/pilot/RiasecQuestion';
import RiasecResult from '../components/pilot/RiasecResult';
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
    startSupplementary,
    skipSupplementary,
  } = usePilotSurvey({
    participantInfo: participantInfo.name && participantInfo.email ? participantInfo : undefined,
    onComplete,
  });

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

  // RIASEC phase - RiasecQuestion is already a full-screen component
  if (phase === 'riasec' && currentRiasecQuestion) {
    return (
      <RiasecQuestion
        question={currentRiasecQuestion}
        value={riasecAnswers[currentRiasecQuestion.id]}
        onChange={answerRiasecQuestion}
        questionNumber={riasecIndex + 1}
        totalQuestions={75}
      />
    );
  }

  // RIASEC Result phase
  if (phase === 'riasec_result' && riasecScores) {
    return (
      <RiasecResult
        scores={riasecScores}
        onContinue={startSupplementary}
        onSkip={skipSupplementary}
        participantName={participantInfo.name || undefined}
      />
    );
  }

  // Supplementary phase - All question types get full-screen treatment
  if (phase === 'supplementary' && currentQuestion) {
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
  if (phase === 'complete' && result && result.riasecScores) {
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

  // Default fallback - show debug info in development
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <p className="text-[#475569] mb-4">페이지를 불러오는 중...</p>
        <p className="text-xs text-[#94A3B8]">Phase: {phase}</p>
      </div>
    </div>
  );
}
