import React from 'react';
import { motion } from 'framer-motion';
import { QuestionArea } from '../../types/pilot';
import { AREA_LABELS } from '../../data/pilotQuestions';

interface PilotProgressProps {
  currentIndex: number;
  totalQuestions: number;
  currentArea: QuestionArea;
}

export default function PilotProgress({ currentIndex, totalQuestions, currentArea }: PilotProgressProps) {
  const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const areaInfo = AREA_LABELS[currentArea] || { label: '설문', emoji: '📝' };

  // Growth stages based on progress
  const getGrowthStage = () => {
    if (progress < 20) return { emoji: '🌱', label: '시작' };
    if (progress < 40) return { emoji: '🌿', label: '진행중' };
    if (progress < 60) return { emoji: '🌺', label: '중반' };
    if (progress < 80) return { emoji: '🌻', label: '후반' };
    return { emoji: '🍎', label: '거의 완료' };
  };

  const stage = getGrowthStage();

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      {/* Top info */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{areaInfo.emoji}</span>
          <span className="text-sm font-medium text-gray-700">{areaInfo.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{stage.emoji}</span>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full"
        />
      </div>

      {/* Progress percentage */}
      <div className="flex justify-end mt-1">
        <span className="text-xs text-gray-400">{progress}% 완료</span>
      </div>
    </div>
  );
}
