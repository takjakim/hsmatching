import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PilotResult as PilotResultType, ValueScores, RiasecScores } from '../../types/pilot';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';

interface PilotResultProps {
  result: PilotResultType;
  onRestart?: () => void;
  onNavigate?: (page: string) => void;
}

// Unified color palette - Light theme matching RiasecResult
const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#E8B86D',
  muted: '#94A3B8',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  card: {
    border: '#E2E8F0',
  },
  status: {
    decided: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
    exploring: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
    undecided: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  },
};

// RIASEC colors for bars and chart
const RIASEC_COLORS: Record<string, string> = {
  R: '#DC2626',
  I: '#2563EB',
  A: '#7C3AED',
  S: '#059669',
  E: '#D97706',
  C: '#0891B2',
};

const RIASEC_INFO: Record<string, { name: string; fullName: string; description: string; icon: string }> = {
  R: { name: '현실형', fullName: 'Realistic', description: '실용적, 기술적 활동 선호', icon: '🔧' },
  I: { name: '탐구형', fullName: 'Investigative', description: '분석적, 지적 탐구 선호', icon: '🔬' },
  A: { name: '예술형', fullName: 'Artistic', description: '창의적, 예술적 표현 선호', icon: '🎨' },
  S: { name: '사회형', fullName: 'Social', description: '타인과의 협력, 도움 선호', icon: '🤝' },
  E: { name: '진취형', fullName: 'Enterprising', description: '리더십, 설득 활동 선호', icon: '📈' },
  C: { name: '관습형', fullName: 'Conventional', description: '체계적, 정확한 업무 선호', icon: '📊' },
};

export default function PilotResult({ result, onRestart, onNavigate }: PilotResultProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Value score visualization
  const valueLabels: Record<keyof ValueScores, { label: string; description: string; icon: string }> = {
    achievement: { label: '성취', description: '목표 달성과 성공', icon: '🏆' },
    recognition: { label: '인정', description: '타인의 인정과 존경', icon: '👏' },
    independence: { label: '자율', description: '자유롭고 독립적인 업무', icon: '🦅' },
    social: { label: '사회공헌', description: '사회와 타인에 기여', icon: '💝' },
    security: { label: '안정', description: '안정적인 직업환경', icon: '🛡️' },
    economic: { label: '경제', description: '높은 수입과 보상', icon: '💰' },
    growth: { label: '성장', description: '지속적인 발전과 학습', icon: '🌱' },
  };

  const decisionStatusLabels: Record<string, { label: string; description: string; emoji: string }> = {
    decided: { label: '진로 확정', description: '명확한 진로 목표가 있습니다', emoji: '🎯' },
    exploring: { label: '진로 탐색 중', description: '다양한 진로를 탐색하고 있습니다', emoji: '🔍' },
    undecided: { label: '진로 미결정', description: '진로 결정에 도움이 필요합니다', emoji: '🤔' },
  };

  const preferenceLabels: Record<string, { label: string; icon: string }> = {
    fieldPreference: { label: '선호 계열', icon: '📚' },
    workStyle: { label: '업무 스타일', icon: '💼' },
    workEnvironment: { label: '근무 환경', icon: '🏢' },
    careerGoal: { label: '진로 목표', icon: '🎯' },
  };

  const valueScores = result.valueScores || {};
  const careerDecision = result.careerDecision || { status: 'exploring', score: 0 };
  const selfEfficacy = result.selfEfficacy || {};
  const preferences = result.preferences || {};
  const roleModel = result.roleModel;
  const valueRanking = result.valueRanking || {};
  const riasecScores = result.riasecScores;
  const decisionInfo = decisionStatusLabels[careerDecision.status] || decisionStatusLabels.exploring;
  const statusColors = COLORS.status[careerDecision.status as keyof typeof COLORS.status] || COLORS.status.exploring;

  // Get sorted values
  const sortedValues = Object.entries(valueScores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([key, score]) => ({
      key: key as keyof ValueScores,
      score: score as number,
      ...valueLabels[key as keyof ValueScores],
    }));

  const topValues = sortedValues.slice(0, 3);
  const maxValueScore = Math.max(...sortedValues.map(v => v.score), 1);

  // Sort self efficacy
  const sortedEfficacy = Object.entries(selfEfficacy)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  // Get RIASEC 3-code if available
  const getRiasecCode = (scores: RiasecScores): string => {
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([dim]) => dim);
    return sorted.join('');
  };

  const riasecCode = riasecScores ? getRiasecCode(riasecScores) : null;
  const topRiasecTypes = riasecCode ? riasecCode.split('') : [];

  // Prepare radar chart data
  const radarData = riasecScores ? [
    { dim: 'R', name: '현실형', value: riasecScores.R, fullMark: 50 },
    { dim: 'I', name: '탐구형', value: riasecScores.I, fullMark: 50 },
    { dim: 'A', name: '예술형', value: riasecScores.A, fullMark: 50 },
    { dim: 'S', name: '사회형', value: riasecScores.S, fullMark: 50 },
    { dim: 'E', name: '진취형', value: riasecScores.E, fullMark: 50 },
    { dim: 'C', name: '관습형', value: riasecScores.C, fullMark: 50 },
  ] : [];

  // Value ranking items
  const rankedValues = Object.entries(valueRanking)
    .sort(([, a], [, b]) => a - b)
    .map(([label, rank]) => ({ label, rank }));

  return (
    <div
      className="min-h-screen py-8 px-4 lg:py-12 lg:px-8"
      style={{ backgroundColor: COLORS.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header with RIASEC Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: '0 8px 30px rgba(30, 58, 95, 0.2)',
          }}
        >
          <div className="px-6 py-8 lg:px-10 lg:py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            {riasecCode ? (
              <>
                <div className="flex items-baseline justify-center gap-3 mb-2">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-wider">
                    {riasecCode}
                  </h1>
                  <span className="text-lg text-white/80">형 인재입니다</span>
                </div>
                <p className="text-white/70 text-sm">
                  {result.name ? `${result.name}님의 ` : ''}진로검사 + 보완설문 완료!
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  보완 설문 완료!
                </h1>
                <p className="text-white/80">
                  {result.name ? `${result.name}님, ` : ''}응답해 주셔서 감사합니다.
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* RIASEC Profile Card */}
        {riasecScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl p-6 lg:p-8 mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
              RIASEC 흥미 프로필
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 50]}
                      tick={{ fill: COLORS.text.muted, fontSize: 10 }}
                    />
                    <Radar
                      name="점수"
                      dataKey="value"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}점`, '점수']}
                      contentStyle={{
                        backgroundColor: COLORS.surface,
                        border: `1px solid ${COLORS.card.border}`,
                        borderRadius: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 3 Types */}
              <div className="space-y-3">
                <p className="text-sm font-medium mb-4" style={{ color: COLORS.text.muted }}>
                  상위 3개 유형
                </p>
                {topRiasecTypes.map((dim, idx) => {
                  const info = RIASEC_INFO[dim];
                  const score = riasecScores[dim as keyof RiasecScores];
                  return (
                    <motion.div
                      key={dim}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="p-4 rounded-2xl"
                      style={{
                        backgroundColor: idx === 0 ? `${RIASEC_COLORS[dim]}10` : '#F8FAFC',
                        border: `1px solid ${idx === 0 ? RIASEC_COLORS[dim] : COLORS.card.border}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: RIASEC_COLORS[dim] }}
                        >
                          {dim}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold" style={{ color: COLORS.text.primary }}>
                              {info.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white" style={{ color: RIASEC_COLORS[dim] }}>
                              {idx + 1}순위
                            </span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                            {info.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold" style={{ color: RIASEC_COLORS[dim] }}>
                            {score}
                          </span>
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>점</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <h2 className="text-sm font-medium mb-4 text-center" style={{ color: COLORS.text.muted }}>
            결과 코드
          </h2>
          <div className="flex items-center justify-center gap-4">
            <span
              className="text-3xl lg:text-4xl font-mono font-bold tracking-wider"
              style={{ color: COLORS.primary }}
            >
              {result.code}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={copyCode}
              className="p-3 rounded-xl transition-colors"
              style={{
                backgroundColor: copied ? `${COLORS.primary}15` : '#F1F5F9',
                color: copied ? COLORS.primary : COLORS.text.secondary,
              }}
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </motion.button>
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: COLORS.text.muted }}>
            이 코드로 나중에 결과를 확인할 수 있습니다
          </p>
        </motion.div>

        {/* Preferences Card */}
        {(preferences.fieldPreference || preferences.workStyle || preferences.workEnvironment || preferences.careerGoal) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl p-6 lg:p-8 mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
              나의 선호 & 스타일
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(preferenceLabels).map(([key, { label, icon }]) => {
                const value = preferences[key as keyof typeof preferences];
                if (!value || typeof value !== 'string') return null;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: `1px solid ${COLORS.card.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                          {label}
                        </p>
                        <p className="font-semibold" style={{ color: COLORS.text.primary }}>
                          {value}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Conditional Details */}
            {preferences.conditionalDetails && preferences.conditionalDetails.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: `${COLORS.accent}10`, border: `1px solid ${COLORS.accent}30` }}>
                <p className="text-sm font-medium mb-2" style={{ color: COLORS.accent }}>
                  세부 선호 분야
                </p>
                <div className="flex flex-wrap gap-2">
                  {preferences.conditionalDetails.map((detail, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ backgroundColor: COLORS.surface, color: COLORS.text.primary }}
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Career Decision Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
            진로결정 상태
          </h2>
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{
              backgroundColor: statusColors.bg,
              border: `1px solid ${statusColors.border}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: statusColors.border }}
            >
              {decisionInfo.emoji}
            </div>
            <div className="flex-1">
              <span className="text-lg font-bold" style={{ color: statusColors.text }}>
                {decisionInfo.label}
              </span>
              <p className="text-sm mt-1" style={{ color: statusColors.text, opacity: 0.8 }}>
                {decisionInfo.description}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: statusColors.text }}>
                {careerDecision.score?.toFixed(1) || 0}
              </span>
              <p className="text-xs" style={{ color: statusColors.text, opacity: 0.7 }}>/5점</p>
            </div>
          </div>

          {/* Undecided factors */}
          {careerDecision.factors && careerDecision.factors.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: '#FEF3C7' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#92400E' }}>
                진로 미결정 요인
              </p>
              <div className="flex flex-wrap gap-2">
                {careerDecision.factors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: '#FDE68A', color: '#92400E' }}
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Top Values */}
        {topValues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-3xl p-6 lg:p-8 mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
              나의 핵심 직업가치 TOP 3
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topValues.map((value, idx) => (
                <motion.div
                  key={value.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="p-5 rounded-2xl relative overflow-hidden"
                  style={{
                    backgroundColor: idx === 0 ? `${COLORS.accent}15` : '#F8FAFC',
                    border: `1px solid ${idx === 0 ? COLORS.accent : COLORS.card.border}`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background: idx === 0
                        ? `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent}80 100%)`
                        : COLORS.card.border,
                    }}
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                      style={{
                        background: idx === 0
                          ? `linear-gradient(135deg, ${COLORS.accent} 0%, #D4A85A 100%)`
                          : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2" style={{ color: COLORS.text.primary }}>
                        <span>{value.icon}</span>
                        {value.label}
                      </h3>
                      <p className="text-xs" style={{ color: COLORS.text.muted }}>
                        {value.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: '#E2E8F0' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(value.score / maxValueScore) * 100}%` }}
                        transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{
                          background: idx === 0
                            ? `linear-gradient(90deg, ${COLORS.accent} 0%, #D4A85A 100%)`
                            : `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                      {value.score.toFixed(1)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Value Ranking */}
        {rankedValues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl p-6 lg:p-8 mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
              가치 우선순위
            </h2>
            <div className="flex flex-wrap gap-3">
              {rankedValues.map(({ label, rank }, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + idx * 0.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: idx === 0 ? `${COLORS.accent}15` : '#F8FAFC',
                    border: `1px solid ${idx === 0 ? COLORS.accent : COLORS.card.border}`,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      background: idx === 0
                        ? `linear-gradient(135deg, ${COLORS.accent} 0%, #D4A85A 100%)`
                        : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                    }}
                  >
                    {rank}
                  </span>
                  <span className="font-medium" style={{ color: COLORS.text.primary }}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Self Efficacy by RIASEC */}
        {sortedEfficacy.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-3xl p-6 lg:p-8 mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
              RIASEC별 자기효능감
            </h2>
            <div className="space-y-4">
              {sortedEfficacy.map(([dim, score], idx) => (
                <div key={dim} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: RIASEC_COLORS[dim] || COLORS.primary }}
                  >
                    {dim}
                  </div>
                  <span
                    className="w-16 text-sm font-medium"
                    style={{ color: COLORS.text.secondary }}
                  >
                    {RIASEC_INFO[dim]?.name || dim}
                  </span>
                  <div
                    className="flex-1 h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: '#E2E8F0' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((score as number) / 5) * 100}%` }}
                      transition={{ delay: 0.5 + idx * 0.05, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: RIASEC_COLORS[dim] || COLORS.primary }}
                    />
                  </div>
                  <span
                    className="w-12 text-sm font-medium text-right"
                    style={{ color: COLORS.text.primary }}
                  >
                    {(score as number).toFixed(1)}/5
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Role Model */}
        {roleModel && (roleModel.name || (roleModel.traits && roleModel.traits.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl p-6 lg:p-8 mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
              롤모델
            </h2>
            {roleModel.name && (
              <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: `${COLORS.secondary}10`, border: `1px solid ${COLORS.secondary}30` }}>
                <p className="text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  나의 롤모델
                </p>
                <p className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
                  "{roleModel.name}"
                </p>
              </div>
            )}
            {roleModel.traits && roleModel.traits.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: COLORS.text.muted }}>
                  닮고 싶은 특성
                </p>
                <div className="flex flex-wrap gap-2">
                  {roleModel.traits.map((trait, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: `1px solid ${COLORS.card.border}`,
                        color: COLORS.text.primary,
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-3xl p-6 lg:p-8"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: '0 8px 30px rgba(30, 58, 95, 0.2)',
          }}
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">
              결과가 저장되었습니다
            </h2>
            <p className="text-white/70 text-sm">
              결과는 90일간 보관됩니다
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {onNavigate && (
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('landing')}
                className="flex-1 py-4 rounded-2xl font-semibold transition-all duration-300"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: COLORS.primary,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                홈으로 돌아가기
              </motion.button>
            )}
            {onRestart && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRestart}
                className="flex-1 py-4 rounded-2xl font-semibold transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                다시 설문하기
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
