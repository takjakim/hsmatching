import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // 하이라이트할 요소의 selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  storageKey: string;
  onComplete?: () => void;
}

export default function TutorialOverlay({ steps, storageKey, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // localStorage에서 튜토리얼 완료 여부 확인
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(storageKey);
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, [storageKey]);

  // 현재 단계의 타겟 요소 찾기 및 위치 계산
  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (step.targetSelector) {
        const element = document.querySelector(step.targetSelector) as HTMLElement;
        if (element) {
          setTargetElement(element);
          const rect = element.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;

          // 툴팁 위치 계산
          const position = step.position || 'bottom';
          let top = 0;
          let left = 0;

          switch (position) {
            case 'top':
              top = rect.top + scrollY - 10;
              left = rect.left + scrollX + rect.width / 2;
              break;
            case 'bottom':
              top = rect.bottom + scrollY + 10;
              left = rect.left + scrollX + rect.width / 2;
              break;
            case 'left':
              top = rect.top + scrollY + rect.height / 2;
              left = rect.left + scrollX - 10;
              break;
            case 'right':
              top = rect.top + scrollY + rect.height / 2;
              left = rect.right + scrollX + 10;
              break;
            case 'center':
            default:
              top = window.innerHeight / 2 + scrollY;
              left = window.innerWidth / 2 + scrollX;
              break;
          }

          // 화면 경계 체크 (툴팁 크기 고려: 약 320px)
          const tooltipWidth = 320;
          const tooltipHeight = 200;
          
          if (left < tooltipWidth / 2) left = tooltipWidth / 2;
          if (left > window.innerWidth - tooltipWidth / 2) left = window.innerWidth - tooltipWidth / 2;
          if (top < tooltipHeight / 2) top = tooltipHeight / 2;
          if (top > window.innerHeight + scrollY - tooltipHeight / 2) {
            top = window.innerHeight + scrollY - tooltipHeight / 2;
          }

          setTooltipPosition({ top, left });

          // 스크롤하여 요소가 보이도록
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        } else {
          setTargetElement(null);
          setTooltipPosition({
            top: window.innerHeight / 2 + window.scrollY,
            left: window.innerWidth / 2 + window.scrollX
          });
        }
      } else {
        setTargetElement(null);
        setTooltipPosition({
          top: window.innerHeight / 2 + window.scrollY,
          left: window.innerWidth / 2 + window.scrollX
        });
      }
    };

    // 초기 위치 설정
    updatePosition();

    // 리사이즈 및 스크롤 이벤트 리스너
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'completed');
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible || currentStep >= steps.length || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={handleSkip}
          />

          {/* 타겟 요소 하이라이트 */}
          {targetElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: targetElement.getBoundingClientRect().top + window.scrollY - 4,
                left: targetElement.getBoundingClientRect().left + window.scrollX - 4,
                width: targetElement.offsetWidth + 8,
                height: targetElement.offsetHeight + 8,
                border: '3px solid #3b82f6',
                borderRadius: '8px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            />
          )}

          {/* 툴팁 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[10000] bg-white rounded-xl shadow-2xl p-6 max-w-sm"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 진행 표시 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-sm font-medium text-gray-500">
                  {currentStep + 1} / {steps.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>

            {/* 진행 바 */}
            <div className="mb-4">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                >
                  이전
                </button>
              )}
              <button
                onClick={handleNext}
                className={`flex-1 px-4 py-2 rounded-lg transition font-medium ${
                  isLast
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLast ? '완료' : '다음'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

