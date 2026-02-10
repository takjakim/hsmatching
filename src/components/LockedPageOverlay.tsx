import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LockedPageOverlayProps {
  children: ReactNode;
  isLocked: boolean;
  requiredStep: string;
  onGoToStep: () => void;
}

export default function LockedPageOverlay({
  children,
  isLocked,
  requiredStep,
  onGoToStep
}: LockedPageOverlayProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* 상단 고정 잠금 배너 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-[60] bg-red-500 text-white py-4 px-6 shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div className="text-center sm:text-left">
              <p className="font-semibold">이전 단계를 먼저 완료해주세요</p>
              <p className="text-sm text-red-100">
                "{requiredStep}"을(를) 먼저 완료해야 합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToStep}
            className="bg-white text-red-600 hover:bg-red-50 font-semibold px-5 py-2 rounded-lg transition-colors shadow whitespace-nowrap"
          >
            {requiredStep} 진행하기 →
          </button>
        </div>
      </motion.div>

      {/* 실제 페이지 콘텐츠 (흐리게 표시) */}
      <div className="filter blur-sm grayscale pointer-events-none select-none opacity-50">
        {children}
      </div>
    </div>
  );
}
