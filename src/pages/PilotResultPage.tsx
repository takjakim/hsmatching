import React, { useState, useEffect } from 'react';
import RiasecResult from '../components/pilot/RiasecResult';
import { getPilotResultByStudentId, PilotResult } from '../../lib/supabase';
import { RiasecScores } from '../types/pilot';

interface PilotResultPageProps {
  onNavigate?: (page: string) => void;
  onStartTest: () => void;
  currentStudentId?: string | null;
}

export default function PilotResultPage({ onNavigate, onStartTest, currentStudentId }: PilotResultPageProps) {
  const [dbResult, setDbResult] = useState<PilotResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DB에서 결과 불러오기
  useEffect(() => {
    async function loadResult() {
      if (!currentStudentId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await getPilotResultByStudentId(currentStudentId);
        console.log('[PilotResultPage] Loaded result:', result);
        setDbResult(result);
      } catch (err) {
        console.error('[PilotResultPage] Error loading result:', err);
        setError('결과를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [currentStudentId]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1E3A5F] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#475569]">검사 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">오류</h2>
          <p className="text-[#475569] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 결과 없음 - 검사 안내
  if (!dbResult || !dbResult.riasec_scores) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[#1E3A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-3">
            MJU 전공 진로 적합도 검사가 필요합니다
          </h2>
          <p className="text-[#475569] mb-8">
            진로 인사이트를 확인하려면 먼저 검사를 완료해주세요.
          </p>
          <button
            onClick={onStartTest}
            className="w-full py-4 rounded-xl font-semibold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
          >
            검사 시작하기
          </button>
        </div>
      </div>
    );
  }

  // RIASEC scores 변환
  const scores: RiasecScores = dbResult.riasec_scores;

  // Supplementary data 변환
  const supplementaryData = dbResult.skipped_supplementary ? undefined : {
    valueScores: dbResult.value_scores,
    careerDecision: dbResult.career_decision ? {
      level: dbResult.career_decision.status === 'decided' ? '확정' :
             dbResult.career_decision.status === 'exploring' ? '탐색' : '미결정',
      confidence: (dbResult.career_decision.score || 3) / 5,
    } : undefined,
    selfEfficacy: dbResult.self_efficacy,
    preferences: dbResult.preferences ? {
      fieldPreference: dbResult.preferences.fieldPreference,
      workStyle: dbResult.preferences.workStyle,
      environmentPreference: dbResult.preferences.workEnvironment,
    } : undefined,
    valueRanking: dbResult.raw_answers?.valueRanking,
  };

  // 보완검사 건너뛴 경우 확인
  const skippedSupplementary = dbResult.skipped_supplementary === true;

  // 보완검사 시작 핸들러 - "supplementary" 페이지로 이동
  const handleStartSupplementary = () => {
    onNavigate?.('supplementary');
  };

  return (
    <RiasecResult
      scores={scores}
      participantName={dbResult.name || undefined}
      supplementaryData={skippedSupplementary ? undefined : supplementaryData}
      isComplete={true}
      onNavigate={onNavigate}
      onRestart={onStartTest}
      onStartSupplementary={skippedSupplementary ? handleStartSupplementary : undefined}
    />
  );
}
