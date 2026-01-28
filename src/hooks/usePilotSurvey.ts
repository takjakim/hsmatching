import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PilotQuestion,
  PilotAnswers,
  PilotAnswer,
  PilotResult,
  ValueScores,
  CareerDecision,
  SelfEfficacy,
  Preferences,
  DeviceInfo,
  PilotPhase,
  RiasecScores,
  RiasecAnswer
} from '../types/pilot';
import { getActiveQuestions } from '../data/pilotQuestions';
import { savePilotResult, generatePilotCode } from '../../lib/supabase';
import { QUESTION_POOL } from '../data/questionPool';

const STORAGE_KEY = 'pilot_survey_progress';
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface ParticipantInfo {
  name: string;
  studentId: string;
  email: string;
}

interface UsePilotSurveyOptions {
  participantInfo?: ParticipantInfo;
  onComplete?: (result: PilotResult) => void;
}

interface UsePilotSurveyReturn {
  // State
  phase: PilotPhase;
  currentIndex: number;
  currentQuestion: PilotQuestion | null;
  answers: PilotAnswers;
  activeQuestions: PilotQuestion[];
  result: PilotResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSurvey: () => void;
  answerQuestion: (answer: PilotAnswer) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  forceGoToNext: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  resetSurvey: () => void;

  // RIASEC-related
  riasecIndex: number;
  riasecAnswers: RiasecAnswer;
  riasecScores: RiasecScores | null;
  currentRiasecQuestion: typeof QUESTION_POOL[0] | null;
  answerRiasecQuestion: (choice: 'A' | 'B') => void;
  goToPreviousRiasec: () => void;
  goToNextRiasec: () => void;
  riasecCanGoPrevious: boolean;
  riasecCanGoNext: boolean;
  startSupplementary: () => void;
  skipSupplementary: () => Promise<void>;
}

export function usePilotSurvey(options: UsePilotSurveyOptions = {}): UsePilotSurveyReturn {
  const { participantInfo, onComplete } = options;

  const [phase, setPhase] = useState<PilotPhase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PilotAnswers>({});
  const [result, setResult] = useState<PilotResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RIASEC state
  const [riasecIndex, setRiasecIndex] = useState(0);
  const [riasecAnswers, setRiasecAnswers] = useState<RiasecAnswer>({});
  const [riasecScores, setRiasecScores] = useState<RiasecScores | null>(null);

  // Calculate active questions based on current answers (handles conditional questions)
  const activeQuestions = useMemo(() => {
    return getActiveQuestions(answers);
  }, [answers]);

  const currentQuestion = activeQuestions[currentIndex] || null;
  const currentRiasecQuestion = QUESTION_POOL[riasecIndex] || null;

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Restore RIASEC answers if available
        if (parsed.riasecAnswers) {
          setRiasecAnswers(parsed.riasecAnswers);
        }

        // Restore RIASEC scores if available
        if (parsed.riasecScores) {
          setRiasecScores(parsed.riasecScores);
        }

        // Restore supplementary answers if available
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers);
          setCurrentIndex(parsed.currentIndex || 0);
        }

        // Restore phase
        if (parsed.phase === 'supplementary') {
          setPhase('supplementary');
        } else if (parsed.phase === 'riasec') {
          // Validate riasecIndex is within bounds
          const savedIndex = parsed.riasecIndex ?? 0;
          if (savedIndex >= 0 && savedIndex < QUESTION_POOL.length) {
            setPhase('riasec');
            setRiasecIndex(savedIndex);
          } else {
            // Invalid index, start from beginning
            console.warn('Invalid riasecIndex in localStorage, resetting');
            setPhase('intro');
            localStorage.removeItem(STORAGE_KEY);
          }
        } else if (parsed.phase === 'riasec_result' && parsed.riasecScores) {
          setPhase('riasec_result');
        }
      } catch (e) {
        console.error('Failed to load saved progress:', e);
      }
    }
  }, []);

  // Auto-save progress for riasec, riasec_result, and supplementary phases
  useEffect(() => {
    if (phase !== 'riasec' && phase !== 'riasec_result' && phase !== 'supplementary') return;

    const saveProgress = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        currentIndex,
        phase,
        riasecIndex,
        riasecAnswers,
        riasecScores,
        savedAt: new Date().toISOString()
      }));
    };

    // Save on answer change
    saveProgress();

    // Save periodically
    const interval = setInterval(saveProgress, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [answers, currentIndex, phase, riasecIndex, riasecAnswers, riasecScores]);

  // Calculate RIASEC scores
  const calculateRiasecScores = useCallback((answers: RiasecAnswer): RiasecScores => {
    const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUESTION_POOL.forEach((q) => {
      const choice = answers[q.id];
      if (!choice) return;
      const weights = choice === 'A' ? q.A.weights : q.B.weights;
      weights.forEach(([dim, weight]) => {
        scores[dim] += weight;
      });
    });
    return scores;
  }, []);

  // Calculate scores from answers
  const calculateScores = useCallback((finalAnswers: PilotAnswers): {
    valueScores: ValueScores;
    careerDecision: CareerDecision;
    selfEfficacy: SelfEfficacy;
    preferences: Preferences;
  } => {
    // Value scores (V01-V15 mapped to 7 categories)
    const valueScores: ValueScores = {
      achievement: ((finalAnswers['V01'] as number || 0) + (finalAnswers['V02'] as number || 0)) / 2,
      recognition: ((finalAnswers['V03'] as number || 0) + (finalAnswers['V04'] as number || 0)) / 2,
      independence: ((finalAnswers['V05'] as number || 0) + (finalAnswers['V06'] as number || 0)) / 2,
      social: ((finalAnswers['V07'] as number || 0) + (finalAnswers['V08'] as number || 0)) / 2,
      security: ((finalAnswers['V09'] as number || 0) + (finalAnswers['V10'] as number || 0)) / 2,
      economic: ((finalAnswers['V11'] as number || 0) + (finalAnswers['V12'] as number || 0)) / 2,
      growth: ((finalAnswers['V13'] as number || 0) + (finalAnswers['V14'] as number || 0) + (finalAnswers['V15'] as number || 0)) / 3,
    };

    // Career decision (D01-D04)
    const decisionAvg = (
      (finalAnswers['D01'] as number || 0) +
      (finalAnswers['D02'] as number || 0) +
      (finalAnswers['D03'] as number || 0) +
      (finalAnswers['D04'] as number || 0)
    ) / 4;

    let decisionStatus: 'decided' | 'exploring' | 'undecided';
    if (decisionAvg >= 4) {
      decisionStatus = 'decided';
    } else if (decisionAvg >= 2.5) {
      decisionStatus = 'exploring';
    } else {
      decisionStatus = 'undecided';
    }

    const careerDecision: CareerDecision = {
      status: decisionStatus,
      score: decisionAvg,
      factors: finalAnswers['C04'] as string[] | undefined
    };

    // Self efficacy by RIASEC (E01-E06)
    // E01=I(분석), E02=A(창의), E03=S(대인), E04=E(리더십), E05=R(실무), E06=C(체계)
    const selfEfficacy: SelfEfficacy = {
      I: finalAnswers['E01'] as number || 0,
      A: finalAnswers['E02'] as number || 0,
      S: finalAnswers['E03'] as number || 0,
      E: finalAnswers['E04'] as number || 0,
      R: finalAnswers['E05'] as number || 0,
      C: finalAnswers['E06'] as number || 0,
    };

    // Preferences from S01-S04 and C01-C03
    const preferences: Preferences = {
      fieldPreference: finalAnswers['S01'] as string,
      workStyle: finalAnswers['S02'] as string,
      workEnvironment: finalAnswers['S03'] as string,
      careerGoal: finalAnswers['S04'] as string,
      conditionalDetails: [
        finalAnswers['C01'] as string,
        finalAnswers['C02'] as string,
        finalAnswers['C03'] as string,
      ].filter(Boolean)
    };

    return { valueScores, careerDecision, selfEfficacy, preferences };
  }, []);

  // Get device info
  const getDeviceInfo = (): DeviceInfo => ({
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    platform: navigator.platform,
    language: navigator.language,
  });

  // Start RIASEC phase
  const startRiasec = useCallback(() => {
    setPhase('riasec');
    setRiasecIndex(0);
    setRiasecAnswers({});
  }, []);

  // Start survey (redirects to RIASEC)
  const startSurvey = useCallback(() => {
    startRiasec();
  }, [startRiasec]);

  // Answer RIASEC question and auto-advance
  const answerRiasecQuestion = useCallback((choice: 'A' | 'B') => {
    const questionId = QUESTION_POOL[riasecIndex].id;
    const newAnswers = { ...riasecAnswers, [questionId]: choice };
    setRiasecAnswers(newAnswers);

    // Auto-advance after a short delay for visual feedback
    setTimeout(() => {
      if (riasecIndex >= QUESTION_POOL.length - 1) {
        // Complete RIASEC phase
        const scores = calculateRiasecScores(newAnswers);
        setRiasecScores(scores);
        setPhase('riasec_result');
      } else {
        setRiasecIndex(prev => prev + 1);
      }
    }, 300);
  }, [riasecIndex, riasecAnswers, calculateRiasecScores]);

  // Answer current question and auto-advance
  const answerQuestion = useCallback((answer: PilotAnswer) => {
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  }, [currentQuestion]);

  // RIASEC navigation
  const riasecCanGoPrevious = riasecIndex > 0;
  const riasecCanGoNext = true; // Always allow proceeding without answering

  const goToPreviousRiasec = useCallback(() => {
    if (riasecCanGoPrevious) setRiasecIndex(prev => prev - 1);
  }, [riasecCanGoPrevious]);

  const goToNextRiasec = useCallback(() => {
    if (riasecIndex >= QUESTION_POOL.length - 1) {
      // Complete RIASEC phase
      const scores = calculateRiasecScores(riasecAnswers);
      setRiasecScores(scores);
      setPhase('riasec_result');
    } else {
      setRiasecIndex(prev => prev + 1);
    }
  }, [riasecIndex, riasecAnswers, calculateRiasecScores]);

  // Navigation
  const canGoPrevious = currentIndex > 0;
  // Freetext questions are optional and can be skipped
  const canGoNext = currentQuestion
    ? currentQuestion.type === 'freetext' || answers[currentQuestion.id] !== undefined
    : false;

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canGoPrevious]);

  // Force advance to next question (bypasses canGoNext check for auto-advance after selection)
  const forceGoToNext = useCallback(async () => {
    // Check if this is the last question
    if (currentIndex >= activeQuestions.length - 1) {
      // Complete the survey
      setIsLoading(true);
      setError(null);

      try {
        const code = generatePilotCode();
        const { valueScores, careerDecision, selfEfficacy, preferences } = calculateScores(answers);
        const deviceInfo = getDeviceInfo();

        const pilotResult: PilotResult = {
          code,
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          rawAnswers: answers,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          roleModel: {
            name: answers['R01'] as string,
            traits: answers['R02'] as string[],
          },
          valueRanking: answers['K01'] as Record<string, number>,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Save to Supabase
        await savePilotResult(code, answers, {
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
        });

        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY);

        setResult(pilotResult);
        setPhase('complete');
        onComplete?.(pilotResult);
      } catch (e) {
        console.error('Failed to save result:', e);
        setError('결과 저장에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, activeQuestions.length, answers, participantInfo, riasecScores, riasecAnswers, calculateScores, onComplete]);

  // Phase transitions
  const startSupplementary = useCallback(() => {
    setPhase('supplementary');
    setCurrentIndex(0);
  }, []);

  const skipSupplementary = useCallback(async () => {
    // Save RIASEC-only result
    setIsLoading(true);
    try {
      const code = generatePilotCode();
      await savePilotResult(code, {}, {
        name: participantInfo?.name || undefined,
        studentId: participantInfo?.studentId || undefined,
        email: participantInfo?.email || undefined,
        riasecScores: riasecScores!,
        riasecAnswers,
        skippedSupplementary: true,
        deviceInfo: getDeviceInfo(),
      });
      localStorage.removeItem(STORAGE_KEY);
      setResult({
        code,
        name: participantInfo?.name || undefined,
        studentId: participantInfo?.studentId || undefined,
        email: participantInfo?.email || undefined,
        rawAnswers: {},
        riasecScores: riasecScores!,
        riasecAnswers,
        skippedSupplementary: true,
        valueScores: { achievement: 0, recognition: 0, independence: 0, social: 0, security: 0, economic: 0, growth: 0 },
        careerDecision: { status: 'exploring', score: 0 },
        selfEfficacy: {},
        preferences: {},
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setPhase('complete');
    } catch (e) {
      setError('결과 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [participantInfo, riasecScores, riasecAnswers]);

  const goToNext = useCallback(async () => {
    if (!canGoNext) return;

    // Check if this is the last question
    if (currentIndex >= activeQuestions.length - 1) {
      // Complete the survey
      setIsLoading(true);
      setError(null);

      try {
        const code = generatePilotCode();
        const { valueScores, careerDecision, selfEfficacy, preferences } = calculateScores(answers);
        const deviceInfo = getDeviceInfo();

        const pilotResult: PilotResult = {
          code,
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          rawAnswers: answers,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          roleModel: {
            name: answers['R01'] as string,
            traits: answers['R02'] as string[],
          },
          valueRanking: answers['K01'] as Record<string, number>,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Save to Supabase
        await savePilotResult(code, answers, {
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
        });

        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY);

        setResult(pilotResult);
        setPhase('complete');
        onComplete?.(pilotResult);
      } catch (e) {
        console.error('Failed to save result:', e);
        setError('결과 저장에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canGoNext, currentIndex, activeQuestions.length, answers, participantInfo, riasecScores, riasecAnswers, calculateScores, onComplete]);

  // Reset survey
  const resetSurvey = useCallback(() => {
    setPhase('intro');
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    // Existing
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
    goToPrevious,
    goToNext,
    forceGoToNext,
    canGoNext,
    canGoPrevious,
    resetSurvey,

    // New RIASEC-related
    riasecIndex,
    riasecAnswers,
    riasecScores,
    currentRiasecQuestion,
    answerRiasecQuestion,
    goToPreviousRiasec,
    goToNextRiasec,
    riasecCanGoPrevious,
    riasecCanGoNext,
    startSupplementary,
    skipSupplementary,
  };
}

export default usePilotSurvey;
