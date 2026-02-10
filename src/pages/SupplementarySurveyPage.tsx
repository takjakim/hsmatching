import React, { useState, useEffect } from 'react';
import PilotSurvey from './PilotSurvey';
import { getPilotResultByStudentId } from '../../lib/supabase';
import { RiasecScores, RiasecAnswer, PilotResult } from '../types/pilot';

interface SupplementarySurveyPageProps {
  onNavigate?: (page: string) => void;
  onComplete?: (result: PilotResult) => void;
  currentStudentId?: string | null;
}

export default function SupplementarySurveyPage({
  onNavigate,
  onComplete,
  currentStudentId,
}: SupplementarySurveyPageProps) {
  const [riasecScores, setRiasecScores] = useState<RiasecScores | null>(null);
  const [riasecAnswers, setRiasecAnswers] = useState<RiasecAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DB에서 기존 RIASEC 점수 불러오기
  useEffect(() => {
    async function loadExistingScores() {
      if (!currentStudentId) {
        setError('학생 정보가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getPilotResultByStudentId(currentStudentId);
        if (!result || !result.riasec_scores) {
          setError('기존 검사 결과를 찾을 수 없습니다. 먼저 RIASEC 검사를 완료해주세요.');
          setIsLoading(false);
          return;
        }

        setRiasecScores(result.riasec_scores);
        setRiasecAnswers(result.riasec_answers || {});
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load existing scores:', err);
        setError('기존 검사 결과를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    }

    loadExistingScores();
  }, [currentStudentId]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1E3A5F] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#475569]">검사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러
  if (error || !riasecScores) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">오류</h2>
          <p className="text-[#475569] mb-6">{error || '알 수 없는 오류가 발생했습니다.'}</p>
          <button
            onClick={() => onNavigate?.('insight')}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #4A6FA5 100%)' }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 보완검사 시작
  return (
    <PilotSurvey
      onNavigate={onNavigate}
      onComplete={onComplete}
      isLoggedIn={true}
      currentStudentId={currentStudentId}
      initialRiasecScores={riasecScores}
      initialRiasecAnswers={riasecAnswers || undefined}
      startAtSupplementary={true}
    />
  );
}
