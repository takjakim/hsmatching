import React from 'react';
import { motion } from 'framer-motion';
import { StepTransition } from '../data/stepBridgeContent';

interface StepBridgePageProps {
  transition: StepTransition;
  studentName?: string;
  // 1→2: RIASEC data
  riasecTypeCode?: string;
  recommendedMajors?: string[];
  // 2→3: Competency data
  topCompetencies?: Array<{ type: string; name: string; score: number }>;
  // 3→4: Major assessment data
  bestMajor?: { name: string; score: number };
  totalMajorsExplored?: number;
  // 4→5: Role model data
  roleModelCount?: number;
  topCompanyType?: string;
  // Navigation
  onContinue: () => void;
  onBack: () => void;
}

// 단계별 콘텐츠 구성
const STEP_CONFIG = {
  '1to2': {
    completedStep: 1,
    completedTitle: '전공 진로 적합도 검사',
    completedIcon: '🎯',
    completedColor: 'from-blue-500 to-indigo-600',
    nextStep: 2,
    nextTitle: '핵심역량진단',
    nextIcon: '💪',
    nextColor: 'from-purple-500 to-pink-600',
    nextBenefits: [
      '6대 핵심역량 진단',
      '나만의 강점 발견',
      '성장 방향 제시'
    ]
  },
  '2to3': {
    completedStep: 2,
    completedTitle: '핵심역량진단',
    completedIcon: '💪',
    completedColor: 'from-purple-500 to-pink-600',
    nextStep: 3,
    nextTitle: '전공능력진단',
    nextIcon: '📚',
    nextColor: 'from-green-500 to-emerald-600',
    nextBenefits: [
      '추천 전공 자가진단',
      '전공별 적합도 분석',
      '학습 로드맵 제공'
    ]
  },
  '3to4': {
    completedStep: 3,
    completedTitle: '전공능력진단',
    completedIcon: '📚',
    completedColor: 'from-green-500 to-emerald-600',
    nextStep: 4,
    nextTitle: '롤모델 탐색',
    nextIcon: '⭐',
    nextColor: 'from-amber-500 to-orange-600',
    nextBenefits: [
      '선배 커리어 탐색',
      '롤모델 분석',
      '취업 경로 파악'
    ]
  },
  '4to5': {
    completedStep: 4,
    completedTitle: '롤모델 탐색',
    completedIcon: '⭐',
    completedColor: 'from-amber-500 to-orange-600',
    nextStep: 5,
    nextTitle: '커리큘럼 플래너',
    nextIcon: '📊',
    nextColor: 'from-cyan-500 to-teal-600',
    nextBenefits: [
      '4년 학습 계획 수립',
      '학점 관리',
      '졸업 요건 추적'
    ]
  }
};

export default function StepBridgePage({
  transition,
  studentName = '학생',
  riasecTypeCode,
  recommendedMajors = [],
  topCompetencies = [],
  bestMajor,
  totalMajorsExplored = 0,
  roleModelCount = 0,
  topCompanyType,
  onContinue,
  onBack
}: StepBridgePageProps) {
  const config = STEP_CONFIG[transition];

  // 완료 단계 결과 요약 렌더링
  const renderResultSummary = () => {
    switch (transition) {
      case '1to2':
        return (
          <div className="space-y-3">
            {riasecTypeCode && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-200">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {riasecTypeCode[0]}
                </div>
                <div>
                  <p className="text-xs text-gray-500">진로 유형</p>
                  <p className="text-sm font-bold text-gray-800">{riasecTypeCode} 유형</p>
                </div>
              </div>
            )}
            {recommendedMajors.length > 0 && (
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-2">추천 전공 TOP 3</p>
                <div className="space-y-1">
                  {recommendedMajors.slice(0, 3).map((major, idx) => (
                    <p key={idx} className="text-sm text-gray-700">
                      {idx + 1}. {major}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case '2to3':
        return (
          <div className="space-y-3">
            {topCompetencies.length > 0 && (
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <p className="text-xs text-purple-600 font-medium mb-2">나의 강점 역량</p>
                <div className="space-y-2">
                  {topCompetencies.slice(0, 3).map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{comp.name}</span>
                      <span className="text-sm font-bold text-purple-600">{comp.score}점</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case '3to4':
        return (
          <div className="space-y-3">
            {bestMajor && (
              <div className="relative p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 overflow-hidden">
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
                <div className="relative z-10">
                  <p className="text-xs text-green-600 font-medium mb-1">가장 적합한 전공</p>
                  <p className="text-lg font-bold text-green-700">{bestMajor.name}</p>
                  <p className="text-sm text-green-600 mt-1">적합도: {bestMajor.score.toFixed(1)}점</p>
                </div>
              </div>
            )}
            {totalMajorsExplored > 0 && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-green-200">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="text-xs text-gray-500">탐색한 전공</p>
                  <p className="text-sm font-bold text-gray-800">{totalMajorsExplored}개 전공</p>
                </div>
              </div>
            )}
          </div>
        );

      case '4to5':
        return (
          <div className="space-y-3">
            {roleModelCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="text-xs text-amber-600 font-medium">선택한 롤모델</p>
                  <p className="text-lg font-bold text-amber-700">{roleModelCount}명</p>
                </div>
              </div>
            )}
            {topCompanyType && (
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <p className="text-xs text-gray-500 mb-1">주요 기업 유형</p>
                <p className="text-sm font-bold text-gray-800">{topCompanyType}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* 완료 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          {/* 체크마크 아이콘 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mb-4 shadow-lg"
          >
            <motion.svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-black text-gray-800 mb-2"
          >
            {config.completedStep}단계 완료!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600"
          >
            {studentName}님, {config.completedTitle}를 완료했어요
          </motion.p>
        </motion.div>

        {/* 결과 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.completedColor} flex items-center justify-center text-2xl`}>
              {config.completedIcon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{config.completedTitle} 결과</h2>
              <p className="text-xs text-gray-500">주요 결과를 확인하세요</p>
            </div>
          </div>

          {renderResultSummary()}
        </motion.div>

        {/* 다음 단계 안내 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`bg-gradient-to-br ${config.nextColor} rounded-2xl shadow-xl p-6 text-white relative overflow-hidden mb-6`}
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                {config.nextIcon}
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">다음 단계</p>
                <h3 className="text-xl font-bold">{config.nextTitle}</h3>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {config.nextBenefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/90">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-xs text-white/70">
                {config.nextStep}단계를 완료하면 더 정확한 진로 추천을 받을 수 있어요!
              </p>
            </div>
          </div>
        </motion.div>

        {/* 액션 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={onBack}
            className="flex-1 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md min-h-[56px]"
          >
            이전 결과 다시 보기
          </button>
          <button
            onClick={onContinue}
            className={`flex-1 px-6 py-4 bg-gradient-to-r ${config.nextColor} text-white rounded-xl font-bold hover:shadow-xl transition-all shadow-lg hover:scale-[1.02] min-h-[56px] flex items-center justify-center gap-2`}
          >
            <span>{config.nextTitle} 시작하기</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </motion.div>

        {/* 진행 상황 표시 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500 mb-2">전체 진행 상황</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step <= config.completedStep
                    ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-500'
                    : step === config.nextStep
                    ? `w-8 bg-gradient-to-r ${config.nextColor} opacity-50`
                    : 'w-6 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {config.completedStep}/5 완료
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
