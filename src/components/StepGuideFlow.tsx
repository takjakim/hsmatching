import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  step: number;
  title: string;
  completed: boolean;
  action: () => void;
  color?: string;
}

interface StepGuideFlowProps {
  currentStep: number;
  steps: Step[];
  onStepChange?: (step: number) => void;
}

// 단계별 색상
const stepColors = [
  { bg: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-600', light: 'bg-blue-50' },
  { bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-600', light: 'bg-purple-50' },
  { bg: 'bg-green-500', ring: 'ring-green-200', text: 'text-green-600', light: 'bg-green-50' },
  { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-600', light: 'bg-amber-50' },
  { bg: 'bg-cyan-500', ring: 'ring-cyan-200', text: 'text-cyan-600', light: 'bg-cyan-50' },
];

export default function StepGuideFlow({ currentStep, steps }: StepGuideFlowProps) {
  const currentIndex = steps.findIndex(s => s.step === currentStep);
  const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  const current = steps[currentIndex];
  const currentColor = stepColors[currentIndex] || stepColors[0];

  // Check if previous steps are completed
  const canProceed = currentIndex === 0 || steps.slice(0, currentIndex).every(s => s.completed);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4 md:p-5">
      {/* Compact progress bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center">
          {steps.map((step, idx) => {
            const color = stepColors[idx] || stepColors[0];
            return (
              <React.Fragment key={step.step}>
                <button
                  onClick={step.action}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : step.step === currentStep
                      ? `${color.bg} text-white ring-3 ${color.ring}`
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  {step.completed ? '✓' : step.step}
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded-full transition-colors ${
                    steps[idx].completed ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current step & navigation */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Previous button */}
        {prevStep ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={prevStep.action}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span className="hidden sm:inline">이전</span>
          </motion.button>
        ) : (
          <div className="hidden sm:block w-16" />
        )}

        {/* Current step info */}
        <div className={`flex-1 text-center px-4 py-2 rounded-xl ${currentColor.light}`}>
          <p className={`text-xs ${currentColor.text} font-medium`}>
            현재 {currentStep}단계
          </p>
          <h3 className="font-bold text-gray-800 text-sm truncate">
            {current?.title}
          </h3>
        </div>

        {/* Next button */}
        {nextStep ? (
          <motion.button
            whileHover={{ scale: canProceed ? 1.02 : 1 }}
            whileTap={{ scale: canProceed ? 0.98 : 1 }}
            onClick={canProceed ? nextStep.action : undefined}
            disabled={!canProceed}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
              canProceed
                ? `${currentColor.bg} text-white hover:opacity-90`
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">다음</span>
            <span>→</span>
          </motion.button>
        ) : current?.completed ? (
          <div className="w-full sm:w-auto px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium text-center">
            완료
          </div>
        ) : (
          <div className="hidden sm:block w-16" />
        )}
      </div>

      {/* Warning message */}
      {!canProceed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-amber-600 text-center"
        >
          이전 단계를 먼저 완료해주세요
        </motion.p>
      )}
    </div>
  );
}
