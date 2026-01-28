import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RIASEC_TYPES, RiasecCode } from '../../data/riasecData';
import RiasecTypeModal from './RiasecTypeModal';

interface ParticipantInfo {
  name: string;
  studentId: string;
  email: string;
}

interface PilotIntroProps {
  onStart: () => void;
  participantInfo: ParticipantInfo;
  onParticipantInfoChange: (info: ParticipantInfo) => void;
}

// Unified color palette
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
};

export default function PilotIntro({ onStart, participantInfo, onParticipantInfoChange }: PilotIntroProps) {
  const { name, studentId, email } = participantInfo;
  const isValidEmail = email.includes('@') && email.includes('.');
  const isValidName = name.trim().length >= 2;
  const canStart = isValidName && isValidEmail;

  const [selectedType, setSelectedType] = useState<RiasecCode | null>(null);
  const [isMjuStudent, setIsMjuStudent] = useState(true);

  const handleChange = (field: keyof ParticipantInfo, value: string) => {
    onParticipantInfoChange({ ...participantInfo, [field]: value });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* PC: Two-column layout / Mobile: Single column */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-stretch lg:gap-12">

        {/* Left Column: Hero Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center lg:pr-8 mb-10 lg:mb-0"
        >
          {/* MJU Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <img
              src="/mju-logo.png"
              alt="명지대학교"
              className="h-12 lg:h-14 object-contain"
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="text-sm font-medium tracking-widest uppercase mb-3"
              style={{ color: COLORS.secondary }}
            >
              Myongji University
            </p>
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ color: COLORS.primary, fontFamily: "'Pretendard', sans-serif" }}
            >
              MJU 전공<br />
              진로 적합도 검사
            </h1>
            <p
              className="text-base lg:text-lg leading-relaxed max-w-md"
              style={{ color: COLORS.text.secondary }}
            >
              Holland의 RIASEC 이론을 기반으로 나의 진로 흥미 유형을 파악하고,
              명지대학교 학과 중 나에게 적합한 전공을 추천받아 보세요.
            </p>
          </motion.div>

          {/* RIASEC Types Grid - PC only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block mt-10"
          >
            <p className="text-xs font-medium mb-4" style={{ color: COLORS.muted }}>
              RIASEC 6가지 진로 흥미 유형
            </p>
            <div className="flex gap-2">
              {RIASEC_TYPES.map((type) => (
                <motion.button
                  key={type.code}
                  onClick={() => setSelectedType(type.code as RiasecCode)}
                  whileHover={{ scale: 1.05, boxShadow: `0 4px 12px ${type.color}30` }}
                  whileTap={{ scale: 0.98 }}
                  className="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center text-white text-sm font-bold transition-all duration-200"
                  style={{ backgroundColor: type.color }}
                >
                  {type.code}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Action Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:w-[420px] flex-shrink-0"
        >
          <div
            className="rounded-3xl shadow-lg p-8 lg:p-10 h-full flex flex-col"
            style={{ backgroundColor: COLORS.surface }}
          >
            {/* Header */}
            <div className="text-center lg:text-left mb-6">
              <h2
                className="text-xl lg:text-2xl font-bold mb-2"
                style={{ color: COLORS.primary }}
              >
                검사 시작하기
              </h2>
              <p className="text-sm" style={{ color: COLORS.muted }}>
                총 75문항 · 약 15-20분 소요
              </p>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: COLORS.text.primary }}
              >
                이름 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="홍길동"
                className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                style={{
                  borderColor: name ? (isValidName ? COLORS.primary : '#F87171') : '#E2E8F0',
                  backgroundColor: COLORS.surface,
                  color: COLORS.text.primary,
                }}
              />
            </div>

            {/* MJU Student Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMjuStudent}
                  onChange={(e) => {
                    setIsMjuStudent(e.target.checked);
                    if (!e.target.checked) {
                      handleChange('studentId', '');
                    }
                  }}
                  className="w-5 h-5 rounded border-2 accent-blue-600"
                />
                <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                  명지대학교 재학생/졸업생입니다
                </span>
              </label>
            </div>

            {/* Student ID Input (conditional) */}
            {isMjuStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: COLORS.text.primary }}
                >
                  학번
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => handleChange('studentId', e.target.value)}
                  className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                  style={{
                    borderColor: studentId ? COLORS.primary : '#E2E8F0',
                    backgroundColor: COLORS.surface,
                    color: COLORS.text.primary,
                  }}
                />
              </motion.div>
            )}

            {/* Email Input */}
            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: COLORS.text.primary }}
              >
                이메일 주소 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@email.com"
                className="w-full p-3.5 rounded-xl border-2 outline-none transition-all text-base"
                style={{
                  borderColor: email ? (isValidEmail ? COLORS.primary : '#F87171') : '#E2E8F0',
                  backgroundColor: COLORS.surface,
                  color: COLORS.text.primary,
                }}
              />
              <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
                검사 결과를 이메일로 받아보실 수 있습니다.
              </p>
            </div>

            {/* RIASEC Types - Mobile only */}
            <div className="lg:hidden mb-6">
              <p className="text-xs font-medium mb-3" style={{ color: COLORS.muted }}>
                RIASEC 6가지 진로 흥미 유형
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {RIASEC_TYPES.map((type) => (
                  <motion.button
                    key={type.code}
                    onClick={() => setSelectedType(type.code as RiasecCode)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-9 h-9 rounded-lg cursor-pointer flex items-center justify-center text-white text-xs font-bold transition-all duration-200"
                    style={{ backgroundColor: type.color }}
                  >
                    {type.code}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-2.5 mb-6 flex-grow">
              {[
                { text: '나의 진로 흥미 유형 분석', check: true },
                { text: 'RIASEC 6가지 차원 점수', check: true },
                { text: '명지대 맞춤형 학과 추천', check: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${COLORS.secondary}20` }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke={COLORS.secondary}
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Start Button */}
            <motion.button
              whileHover={canStart ? { y: -2, boxShadow: `0 16px 32px ${COLORS.primary}25` } : {}}
              whileTap={canStart ? { scale: 0.98 } : {}}
              onClick={onStart}
              disabled={!canStart}
              className="w-full py-4 px-8 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canStart
                  ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                  : '#CBD5E1',
              }}
            >
              검사 시작하기
            </motion.button>

            <p className="text-xs text-center mt-4" style={{ color: COLORS.muted }}>
              수집된 정보는 연구 목적으로만 사용되며,<br />
              개인정보보호법에 따라 안전하게 관리됩니다.
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIASEC Type Modal */}
      <RiasecTypeModal
        typeCode={selectedType}
        isOpen={selectedType !== null}
        onClose={() => setSelectedType(null)}
      />
    </div>
  );
}
