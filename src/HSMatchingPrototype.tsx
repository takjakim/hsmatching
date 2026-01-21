import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { MAJORS } from "./data/majorList";
import { QUESTION_POOL, Dim, Choice, Question as Q, CLUSTER_QUESTIONS, ClusterType, ClusterQuestion } from "./data/questionPool";
import { OCC_ROLES } from "./data/occMatching";
import { generateResultCode, saveResultWithCode } from "./utils/resultCode";
import { recommendRoles } from "./utils/roleRecommendation";
import { recommendMajors } from "./utils/recommendMajors";
import { getWorkpediaJobUrl, getWorkpediaJobCode } from "./data/workpediaJobMap";

// 이미지 경로 매핑 함수 (public 폴더 사용)
function getImagePath(questionId: number, key: 'a' | 'b'): string | null {
  if (questionId < 1 || questionId > 6) return null;
  const imageName = `id${String(questionId).padStart(2, '0')}${key}.png`;
  // public 폴더는 루트 경로로 접근
  return `/img/${imageName}`;
}

/**
 * 전체 학과 커버 전공·직무 매칭 프로토타입 (A/B/None + Adaptive)
 * - 2지선다: A, B (강제선택형)
 * - 1차: 고정 문항 80개 (인문/사회/경영/공학/자연/예술/스포츠/건축/바이오) → 2차: 교차 문항(적응형, 낮은 차원 2개 중심, 최대 4문항)
 * - 모델: RIASEC (R,I,A,S,E,C)
 * - 결과: 전공 Top3, 직무 Top5, 자동 설명문, RIASEC 레이더
 * - 대상: 명지대학교 전체 학과 (인문/사회/경영/공학/자연/예술/스포츠/건축 등)
 *
 * 빌드 안정성 노트:
 * - 모든 문자열은 표준 따옴표 사용, 백슬래시 사용 금지, 이스케이프 시퀀스 미사용
 * - 한국어 UTF-8 텍스트 직접 포함 (CRA/Vite/Next 기본 설정에서 안전)
 */

// ----- 공통 차원 정의 -----
const DIMS: Dim[] = ["R", "I", "A", "S", "E", "C"];

// ----- 문항 세트 (문항pool_80.csv 기반) -----
const QUESTIONS: Q[] = QUESTION_POOL as Q[];

type KeyQuestion = Q & {
  signature: Dim[];
};

const KEY_QUESTIONS: KeyQuestion[] = [
  {
    id: 9001,
    signature: ["C", "S"],
    prompt: "사무·사회형 조합에서 더 끌리는 길은?",
    A: {
      text: "공공정책/법무 중심으로 규정과 절차를 설계하고 집행",
      weights: [["C", 0.9], ["I", 0.5]]
    },
    B: {
      text: "인사·교육·상담으로 사람과 조직의 성장을 지원",
      weights: [["S", 0.8], ["E", 0.4], ["C", 0.4]]
    }
  },
  {
    id: 9002,
    signature: ["A", "I"],
    prompt: "예술·탐구형 내에서 선호하는 방향은?",
    A: {
      text: "순수 예술과 공연, 감성 표현 중심 창작",
      weights: [["A", 1], ["E", 0.4], ["S", 0.3]]
    },
    B: {
      text: "디지털콘텐츠/UX 등 연구·데이터 기반 디자인",
      weights: [["I", 0.6], ["C", 0.4], ["A", 0.5]]
    }
  },
  {
    id: 9003,
    signature: ["R", "I"],
    prompt: "현장·탐구형에서 더 매력적인 커리어는?",
    A: {
      text: "스마트 인프라·기계 등 엔지니어링 실무 설계",
      weights: [["R", 0.9], ["I", 0.5], ["C", 0.4]]
    },
    B: {
      text: "기초과학/연구소에서 이론 검증과 분석",
      weights: [["I", 0.8], ["C", 0.5], ["R", 0.3]]
    }
  },
  {
    id: 9004,
    signature: ["E", "I"],
    prompt: "진취·탐구형의 진로 중 더 끌리는 것은?",
    A: {
      text: "데이터 드리븐 경영/컨설팅으로 의사결정 지원",
      weights: [["E", 0.7], ["I", 0.6], ["C", 0.4]]
    },
    B: {
      text: "창업/프로덕트 리더십으로 제품과 시장을 개척",
      weights: [["E", 0.9], ["A", 0.4], ["S", 0.4]]
    }
  },
  {
    id: 9005,
    signature: ["S", "C"],
    prompt: "사회·사무 지향에서 우선순위는?",
    A: {
      text: "청소년·상담·교육 등 개인 성장 지원",
      weights: [["S", 0.95], ["E", 0.4], ["I", 0.2]]
    },
    B: {
      text: "공공정책/국제개발 등 구조적 변화를 설계",
      weights: [["C", 0.9], ["I", 0.5], ["S", 0.3]]
    }
  },
  {
    id: 9006,
    signature: ["E", "A"],
    prompt: "진취·창의 조합에서 더 맞는 역할은?",
    A: {
      text: "브랜드/마케팅·콘텐츠 전략으로 대중과 소통",
      weights: [["E", 0.9], ["A", 0.6], ["S", 0.4]]
    },
    B: {
      text: "디지털 제품·서비스 기획으로 사용자 경험 혁신",
      weights: [["A", 0.6], ["I", 0.5], ["C", 0.4]]
    }
  }
];

// ----- 전공 및 직무 프로파일 -----
export { MAJORS };

const ROLES = OCC_ROLES;

// ----- 유틸: 코사인 유사도 -----
function cosineSim(vecA: Partial<Record<Dim, number>>, vecB: Partial<Record<Dim, number>>) {
  let dot = 0, a2 = 0, b2 = 0;
  for (const d of DIMS) {
    const a = vecA[d] || 0;
    const b = vecB[d] || 0;
    dot += a * b;
    a2 += a * a;
    b2 += b * b;
  }
  const denom = Math.sqrt(a2) * Math.sqrt(b2);
  return denom === 0 ? 0 : dot / denom;
}

// ----- 유틸: Fisher-Yates 셔플 알고리즘 (배열 랜덤 섞기) -----
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // 원본 배열 복사
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface HSMatchingPrototypeProps {
  onComplete?: (result: Record<Dim, number>) => void;
  onNavigate?: (page: string) => void;
}

export default function HSMatchingPrototype({ onComplete, onNavigate }: HSMatchingPrototypeProps = {}) {
  // 문항을 랜덤으로 섞어서 저장 (컴포넌트 마운트 시 초기화, 다시 하기 버튼으로 재섞기 가능)
  const [shuffledQuestions, setShuffledQuestions] = useState<Q[]>(() => shuffleArray(QUESTIONS));
  
  // 🆕 A/B 순서 랜덤화: true면 해당 문항에서 A↔B를 뒤집어 표시
  const [riasecFlipOrder, setRiasecFlipOrder] = useState<boolean[]>(() => 
    QUESTIONS.map(() => Math.random() < 0.5)
  );
  const [clusterFlipOrder, setClusterFlipOrder] = useState<boolean[]>(() => 
    CLUSTER_QUESTIONS.map(() => Math.random() < 0.5)
  );

  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Partial<Record<Dim, number>>>({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
  const [losers, setLosers] = useState<Choice[]>([]);
  const [adaptiveQs, setAdaptiveQs] = useState<Q[]>([]);
  const [resultSaved, setResultSaved] = useState(false);
  // 결과 코드
  const [resultCode, setResultCode] = useState<string | null>(null);
  // 제외된 전공/직무 목록
  const [excludedMajors, setExcludedMajors] = useState<Set<string>>(new Set());
  const [excludedRoles, setExcludedRoles] = useState<Set<string>>(new Set());
  
  // 🆕 계열 탐색 관련 상태
  const [clusterScores, setClusterScores] = useState<Partial<Record<ClusterType, number>>>({
    "인문": 0, "사회": 0, "경상": 0, "공학": 0, "자연": 0, "예체능": 0, "융합": 0
  });
  const clusterTotal = CLUSTER_QUESTIONS.length; // 계열 탐색 문항 수 (8개)
  
  // 🔧 디버깅 모드 상태
  const [showDebug, setShowDebug] = useState(false);
  
  // 🆕 답변 이력 (이전 문항으로 돌아가기용)
  type AnswerHistoryItem = {
    phase: "cluster" | "riasec" | "adaptive";
    step: number;
    choice: "A" | "B";
    clusterWeights?: Array<[ClusterType, number]>;
    riasecWeights?: Array<[Dim, number]>;
    loserChoice?: Choice;
  };
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryItem[]>([]);
  
  // 다시 하기 함수 (문항도 다시 섞기)
  const handleReset = () => {
    setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    setClusterScores({ "인문": 0, "사회": 0, "경상": 0, "공학": 0, "자연": 0, "예체능": 0, "융합": 0 });
    setStep(0);
    setLosers([]);
    setAdaptiveQs([]);
    setResultSaved(false);
    setShuffledQuestions(shuffleArray(QUESTIONS)); // 문항 다시 섞기
    setRiasecFlipOrder(QUESTIONS.map(() => Math.random() < 0.5)); // A/B 순서도 다시 섞기
    setClusterFlipOrder(CLUSTER_QUESTIONS.map(() => Math.random() < 0.5)); // 계열 탐색도 다시 섞기
    setExcludedMajors(new Set());
    setExcludedRoles(new Set());
    setAnswerHistory([]); // 답변 이력 초기화
  };
  
  // 🆕 문항 단계 계산 (계열 탐색 → RIASEC → 적응형)
  const mainTotal = shuffledQuestions.length;
  const totalAll = clusterTotal + mainTotal + adaptiveQs.length;
  
  // 🆕 이전 문항으로 돌아가기 함수
  const handlePrevious = () => {
    if (answerHistory.length === 0 || step <= 1) return; // 이력이 없거나 첫 문항이면 무시
    
    const lastAnswer = answerHistory[answerHistory.length - 1];
    const newHistory = answerHistory.slice(0, -1);
    
    // 점수 되돌리기
    if (lastAnswer.phase === "cluster" && lastAnswer.clusterWeights) {
      // 계열 점수 되돌리기
      setClusterScores(prev => {
        const current = { ...prev };
        for (const [cluster, weight] of lastAnswer.clusterWeights!) {
          current[cluster] = (current[cluster] || 0) - weight;
          if (current[cluster] < 0) current[cluster] = 0;
        }
        return current;
      });
    } else if ((lastAnswer.phase === "riasec" || lastAnswer.phase === "adaptive") && lastAnswer.riasecWeights) {
      // RIASEC 점수 되돌리기
      setScores(prev => {
        const current = { ...prev };
        for (const [dim, weight] of lastAnswer.riasecWeights!) {
          current[dim] = (current[dim] || 0) - weight;
          if (current[dim] < 0) current[dim] = 0;
        }
        return current;
      });
      
      // losers 배열에서 마지막 항목 제거
      if (lastAnswer.loserChoice) {
        setLosers(prev => prev.slice(0, -1));
      }
      
      // 적응형 문항이 생성된 경우 제거 (RIASEC 마지막 문항이었다면)
      const riasecStep = lastAnswer.step - clusterTotal;
      const currentMainTotal = shuffledQuestions.length;
      if (riasecStep === currentMainTotal && adaptiveQs.length > 0) {
        setAdaptiveQs([]);
      }
    }
    
    // step 감소 및 이력 업데이트
    setStep(lastAnswer.step);
    setAnswerHistory(newHistory);
  };
  
  // 현재 어느 단계인지 계산
  const isInClusterPhase = step >= 1 && step <= clusterTotal;
  const isInRiasecPhase = step > clusterTotal && step <= clusterTotal + mainTotal;
  const isInAdaptivePhase = step > clusterTotal + mainTotal && step <= totalAll;

  // 성장 단계 계산 (씨앗→싹→꽃→열매)
  const growthStage = useMemo(() => {
    const progressRatio = step / (totalAll || 1);
    if (progressRatio < 0.25) return { emoji: '🌱', name: '씨앗', color: '#10b981' }; // 초록
    if (progressRatio < 0.5) return { emoji: '🌿', name: '싹', color: '#22c55e' }; // 밝은 초록
    if (progressRatio < 0.75) return { emoji: '🌺', name: '꽃', color: '#f59e0b' }; // 주황
    if (progressRatio < 1) return { emoji: '🌻', name: '만개', color: '#eab308' }; // 노랑
    return { emoji: '🍎', name: '열매', color: '#ef4444' }; // 빨강
  }, [step, totalAll]);

  const progress = useMemo(() => {
    const denom = totalAll || 1;
    const current = Math.min(Math.max(step, 0), denom);
    return Math.round((current / denom) * 100);
  }, [step, totalAll]);
  
  // 🆕 현재 단계 표시 (계열탐색/RIASEC/적응형)
  const phaseLabel = useMemo(() => {
    if (isInClusterPhase) return "계열 탐색";
    if (isInRiasecPhase) return "적성 검사";
    if (isInAdaptivePhase) return "심층 탐색";
    return "";
  }, [isInClusterPhase, isInRiasecPhase, isInAdaptivePhase]);
  
  // 🔧 디버그 데이터 (실시간 점수 및 추천 현황)
  const debugData = useMemo(() => {
    // RIASEC 점수 정규화
    const riasecValues = DIMS.map((d) => scores[d] || 0);
    const riasecMax = Math.max(1, ...riasecValues);
    const normalizedRiasec: Record<Dim, number> = {} as Record<Dim, number>;
    DIMS.forEach((d) => {
      normalizedRiasec[d] = (scores[d] || 0) / riasecMax;
    });
    
    // 계열 점수 정규화
    const clusters: ClusterType[] = ["인문", "사회", "경상", "공학", "자연", "예체능", "융합"];
    const clusterValues = clusters.map(c => clusterScores[c] || 0);
    const clusterMax = Math.max(1, ...clusterValues);
    const normalizedClusters: Partial<Record<ClusterType, number>> = {};
    clusters.forEach(c => {
      normalizedClusters[c] = (clusterScores[c] || 0) / clusterMax;
    });
    
    // 상위 계열 및 RIASEC 차원
    const topClusters = clusters
      .map(c => ({ cluster: c, score: normalizedClusters[c] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    const topDims = DIMS
      .map(d => ({ dim: d, score: normalizedRiasec[d] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    // 현재 추천 전공/직무 (10개씩)
    const majors = step > clusterTotal ? recommendMajors(normalizedRiasec, { limit: 10, clusterScores: normalizedClusters }) : [];
    const topMajor = majors[0];
    const roles = step > clusterTotal ? recommendRoles(normalizedRiasec, 10, topMajor?.key, topMajor?.cluster) : [];
    
    return {
      rawScores: scores,
      normalizedRiasec,
      rawClusterScores: clusterScores,
      normalizedClusters,
      topClusters,
      topDims,
      majors,
      roles,
      step,
      phase: phaseLabel
    };
  }, [scores, clusterScores, step, clusterTotal, phaseLabel]);

  // 진행 중 추천 (계열 탐색 완료 후 60문항 이상일 때)
  const liveRecommendations = useMemo(() => {
    // 계열 탐색(8) + RIASEC 60문항 이상 = 68문항 이상
    if (step < clusterTotal + 60) return null;
    
    // 현재 점수를 정규화
    const values = DIMS.map((d) => scores[d] || 0);
    const maxVal = Math.max(1, ...values);
    const normalized: Record<Dim, number> = {} as Record<Dim, number>;
    DIMS.forEach((d) => {
      normalized[d] = (scores[d] || 0) / maxVal;
    });

    // 직무 추천 (상위 3개, 제외된 항목 필터링)
    const allRoles = recommendRoles(normalized, 10);
    const topRoles = allRoles.filter(role => !excludedRoles.has(role.key)).slice(0, 3);
    
    // 전공 추천 (상위 3개, 제외된 항목 필터링, 계열 점수 반영)
    const allMajors = recommendMajors(normalized, { limit: 10, clusterScores });
    const topMajors = allMajors.filter(major => !excludedMajors.has(major.key)).slice(0, 3);

    return {
      roles: topRoles,
      majors: topMajors
    };
  }, [step, scores, excludedMajors, excludedRoles, clusterScores, clusterTotal]);

  function applyWeights(next: Partial<Record<Dim, number>>, weights: Array<[Dim, number]>) {
    const copy = { ...next };
    for (let i = 0; i < weights.length; i++) {
      const d = weights[i][0];
      const v = weights[i][1];
      copy[d] = (copy[d] || 0) + v;
    }
    return copy;
  }
  
  // 🆕 계열 점수 가중치 적용 함수
  function applyClusterWeights(next: Partial<Record<ClusterType, number>>, weights: Array<[ClusterType, number]>) {
    const copy = { ...next };
    for (let i = 0; i < weights.length; i++) {
      const cluster = weights[i][0];
      const value = weights[i][1];
      copy[cluster] = (copy[cluster] || 0) + value;
    }
    return copy;
  }
  
  // 🆕 계열 탐색 스킵 함수 (둘 다 관심 없어요)
  function handleClusterSkip() {
    if (!isInClusterPhase) return;
    // 아무 점수도 주지 않고 다음 문항으로 넘어감 (이력에 저장하지 않음)
    setStep((prev) => prev + 1);
  }

  function handlePick(choice: "A" | "B") {
    // 🆕 계열 탐색 문항 처리
    if (isInClusterPhase) {
      const clusterIdx = step - 1;
      const clusterQ = CLUSTER_QUESTIONS[clusterIdx];
      if (!clusterQ) return;
      
      // 🆕 뒤집기 적용: 화면에서 선택한 것을 실제 선택으로 변환
      const isFlipped = clusterFlipOrder[clusterIdx] ?? false;
      const actualChoice = isFlipped ? (choice === "A" ? "B" : "A") : choice;
      
      const selected = actualChoice === "A" ? clusterQ.A : clusterQ.B;
      const nextClusterScores = applyClusterWeights(clusterScores, selected.clusters);
      
      // 답변 이력 저장
      setAnswerHistory(prev => [...prev, {
        phase: "cluster",
        step: step,
        choice: actualChoice,
        clusterWeights: selected.clusters
      }]);
      
      setClusterScores(nextClusterScores);
      setStep((prev) => prev + 1);
      return;
    }
    
    // RIASEC 문항 처리
    const riasecStep = step - clusterTotal; // 계열 탐색 문항 수를 빼서 실제 RIASEC 문항 인덱스 계산
    const questionIdx = riasecStep - 1; // 0-based index
    const isMainPhase = riasecStep <= mainTotal;
    
    const q = isMainPhase 
      ? shuffledQuestions[questionIdx] 
      : adaptiveQs[riasecStep - mainTotal - 1];
    if (!q) return;

    // 🆕 뒤집기 적용: 화면에서 선택한 것을 실제 선택으로 변환
    const isFlipped = isMainPhase ? (riasecFlipOrder[questionIdx] ?? false) : false;
    const actualChoice = isFlipped ? (choice === "A" ? "B" : "A") : choice;

    let nextScores = scores;
    let nextLosers = losers;

    const selected = actualChoice === "A" ? q.A : q.B;
    const other = actualChoice === "A" ? q.B : q.A;
    nextScores = applyWeights(scores, selected.weights);
    nextLosers = losers.concat([other]);
    
    // 답변 이력 저장
    setAnswerHistory(prev => [...prev, {
      phase: isMainPhase ? "riasec" : "adaptive",
      step: step,
      choice: actualChoice,
      riasecWeights: selected.weights,
      loserChoice: other
    }]);
    
    setScores(nextScores);
    setLosers(nextLosers);

    // RIASEC 문항이 끝나면 적응형 문항 생성
    if (riasecStep === mainTotal) {
      const generated = buildAdaptiveQuestions(nextScores, nextLosers, 4);
      setAdaptiveQs(generated);
    }

    setStep((prev) => prev + 1);
  }

  // 키보드 이벤트 리스너 (1번 키: A 선택, 2번 키: B 선택)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 검사 진행 중일 때만 작동 (인트로나 결과 화면에서는 작동 안 함)
      if (isInClusterPhase || isInRiasecPhase || isInAdaptivePhase) {
        if (e.key === '1') {
          e.preventDefault();
          handlePick('A');
        } else if (e.key === '2') {
          e.preventDefault();
          handlePick('B');
        } else if (e.key === '0' && isInClusterPhase) {
          // 계열 탐색에서만 0키로 스킵 가능
          e.preventDefault();
          handleClusterSkip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [step, isInClusterPhase, isInRiasecPhase, isInAdaptivePhase, shuffledQuestions, adaptiveQs, scores, losers, clusterScores]);

  function selectKeyQuestions(norm: Partial<Record<Dim, number>>, limit: number): Q[] {
    if (limit <= 0) return [];
    const ordered = DIMS.slice().sort((a, b) => (norm[b] || 0) - (norm[a] || 0));
    const top3 = ordered.slice(0, 3);

    const scored = KEY_QUESTIONS.map((q) => {
      const score = q.signature.reduce((acc, dim) => {
        const idx = top3.indexOf(dim);
        return acc + (idx === -1 ? 10 : idx);
      }, 0);
      return { question: q, score };
    }).filter(({ score }) => score < 20);

    return scored
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map(({ question }) => question);
  }

  function buildReinforcementQuestions(lowDims: Dim[], curLosers: Choice[], limit: number): Q[] {
    if (limit <= 0) return [];
    const bucketA = curLosers.filter((c) => c.weights.some((w) => w[0] === lowDims[0]));
    const bucketB = curLosers.filter((c) => c.weights.some((w) => w[0] === lowDims[1]));

    const pairs: Q[] = [];
    const n = Math.min(limit, Math.max(bucketA.length, bucketB.length, 0));
    for (let i = 0; i < n; i++) {
      const a = bucketA[i % Math.max(1, bucketA.length)] || curLosers[i % Math.max(1, curLosers.length)];
      const b = bucketB[i % Math.max(1, bucketB.length)] || curLosers[(i + 1) % Math.max(1, curLosers.length)];
      pairs.push({ id: 1000 + i, prompt: "덜 선호된 영역을 다시 비교해봅시다. 더 마음이 가는 활동은?", A: a, B: b });
    }

    while (pairs.length < limit && curLosers.length >= 2) {
      const a = curLosers[Math.floor(Math.random() * curLosers.length)];
      const b = curLosers[Math.floor(Math.random() * curLosers.length)];
      if (a !== b) pairs.push({ id: 2000 + pairs.length, prompt: "한 번 더 비교해볼까요?", A: a, B: b });
    }

    return pairs;
  }

  function buildAdaptiveQuestions(curScores: Partial<Record<Dim, number>>, curLosers: Choice[], maxQ: number): Q[] {
    const values = DIMS.map((d) => curScores[d] || 0);
    const maxVal = Math.max(1, ...values);
    const norm: Partial<Record<Dim, number>> = {};
    DIMS.forEach((d) => { norm[d] = (curScores[d] || 0) / maxVal; });

    const lowDims = DIMS.slice().sort((a, b) => (norm[a] || 0) - (norm[b] || 0)).slice(0, 2);

    const keyQuota = Math.min(2, maxQ);
    const keyQs = selectKeyQuestions(norm, keyQuota);
    const reinforcementQs = buildReinforcementQuestions(lowDims, curLosers, Math.max(0, maxQ - keyQs.length));

    return [...keyQs, ...reinforcementQs].slice(0, maxQ);
  }

  // 🆕 정규화된 계열 점수 계산
  const normalizedClusterScores = useMemo(() => {
    const clusters: ClusterType[] = ["인문", "사회", "경상", "공학", "자연", "예체능", "융합"];
    const values = clusters.map(c => clusterScores[c] || 0);
    const maxVal = Math.max(1, ...values);
    const normalized: Partial<Record<ClusterType, number>> = {};
    clusters.forEach(c => {
      normalized[c] = (clusterScores[c] || 0) / maxVal;
    });
    return normalized;
  }, [clusterScores]);
  
  const result = useMemo(() => {
    if (step <= totalAll) return null;
    const maxVal = Math.max(1, ...DIMS.map((d) => scores[d] || 0));
    const normObj = DIMS.reduce((acc, d) => {
      acc[d] = (scores[d] || 0) / maxVal;
      return acc;
    }, {} as Record<Dim, number>);

    // 🆕 전공 추천 - 계열 점수 반영하여 recommendMajors 사용
    // 제외된 전공을 고려하여 충분히 많은 후보에서 선택
    const candidateMajors = recommendMajors(normObj, { limit: 20, clusterScores: normalizedClusterScores });
    const allMajors = candidateMajors
      .filter(m => !excludedMajors.has(m.key))
      .slice(0, 5)
      .map(m => ({ ...m, score: m.matchScore / 100 })); // matchScore를 0~1 범위로 변환
    
    // 🆕 직무 추천 - 추천된 1순위 전공 기반으로 추천
    const topMajor = allMajors[0];
    const candidateRoles = recommendRoles(normObj, 20, topMajor?.key, topMajor?.cluster);
    const allRoles = candidateRoles
      .filter(r => !excludedRoles.has(r.key))
      .slice(0, 5)
      .map(r => ({ ...r, score: r.matchScore }));

    return { norm: normObj, majors: allMajors, roles: allRoles, clusterScores: normalizedClusterScores };
  }, [step, totalAll, scores, excludedMajors, excludedRoles, normalizedClusterScores]);

  // RIASEC 레이더 데이터 (먼저 정의)
  const riasecData = useMemo(() => {
    if (!result) return [] as any[];
    const order: Dim[] = ["R", "I", "A", "S", "E", "C"]; // 보기 좋은 시계 배치
    const dimLabels: Record<Dim, string> = { 
      R: "R(현장형)", 
      I: "I(탐구형)", 
      A: "A(예술형)", 
      S: "S(사회형)", 
      E: "E(진취형)", 
      C: "C(사무형)"
    };
    return order.map((d) => ({
      axis: dimLabels[d],
      score: Math.round((result.norm[d] || 0) * 100)
    }));
  }, [result]);

  // 검사 완료 시 결과 전달 및 코드 생성
  useEffect(() => {
    if (result && !resultSaved) {
      // 코드 생성 및 저장
      const code = generateResultCode();
      setResultCode(code);
      
      // 전체 결과 데이터 저장 (코드 포함)
      const fullResult = {
        norm: result.norm,
        majors: result.majors,
        roles: result.roles,
        riasecData: riasecData,
        explanation: generateExplanation(result.norm, result.majors, result.roles)
      };
      
      // 비동기 저장 함수
      const saveResult = async () => {
        try {
          await saveResultWithCode(fullResult, code);
        } catch (error) {
          console.error('Failed to save result:', error);
        }
      };
      
      saveResult();
      
      // onComplete 콜백 호출 (기존 로직 유지)
      if (onComplete) {
        onComplete(result.norm);
      }
      
      setResultSaved(true);
    }
  }, [result, resultSaved, onComplete, riasecData]);

  function generateExplanation(norm: Record<Dim, number>, majors: any[], roles: any[]) {
    const order = Object.keys(norm).map((k) => [k, norm[k as Dim]] as [string, number]).sort((a, b) => b[1] - a[1]);
    const top = order.slice(0, 3);
    const key2ko: Record<string, string> = { R: "현장형", E: "진취형", I: "탐구형", S: "사회형", C: "사무형", A: "예술형" };

    const topMajors = majors.slice(0, 5).map((m: any) => m.name).join(", ");
    const topRoles = roles.map((r: any) => r.name).slice(0, 3).join(", ");

    const lead = "당신은 " + key2ko[top[0][0]] + " 성향이 두드러지고, " + key2ko[top[1][0]] + "와 " + key2ko[top[2][0]] + " 경향도 강합니다.";
    const majorLine = "이 조합은 " + topMajors + " 전공에 잘 맞는 프로파일입니다.";

    // 전공/직무 기반 동적 bullets 생성
    const bullets: string[] = [];
    const topDims = top.map(([dim]) => dim);
    const topMajorNames = majors.slice(0, 3).map((m: any) => m.name);
    const topRoleNames = roles.slice(0, 3).map((r: any) => r.name);

    // 상위 차원 기반 bullets
    if (topDims.includes('I') && topDims.includes('E')) {
      bullets.push("분석적 사고와 전략적 기획 능력이 뛰어나 연구 및 경영 분야에서 강점을 보입니다");
    } else if (topDims.includes('I') && topDims.includes('C')) {
      bullets.push("체계적인 데이터 분석과 정책 연구에 적합한 프로파일입니다");
    } else if (topDims.includes('I')) {
      bullets.push("논리적 분석과 탐구 활동에서 높은 역량을 발휘할 수 있습니다");
    }

    if (topDims.includes('E') && topDims.includes('A')) {
      bullets.push("창의적 아이디어를 비즈니스로 전환하는 능력이 뛰어납니다");
    } else if (topDims.includes('E') && topDims.includes('S')) {
      bullets.push("팀 리더십과 조직 관리 분야에서 강점을 보입니다");
    } else if (topDims.includes('E')) {
      bullets.push("목표 지향적 업무와 경영 관리 분야에 적합합니다");
    }

    if (topDims.includes('S') && topDims.includes('A')) {
      bullets.push("창의적 교육과 상담 분야에서 뛰어난 역량을 발휘할 수 있습니다");
    } else if (topDims.includes('S')) {
      bullets.push("사람 중심의 서비스와 교육 분야에서 강점을 보입니다");
    }

    if (topDims.includes('A')) {
      bullets.push("창의적 표현과 예술 분야에서 높은 잠재력을 가지고 있습니다");
    }

    if (topDims.includes('R')) {
      bullets.push("실무 중심의 프로젝트 실행과 현장 업무에 적합합니다");
    }

    if (topDims.includes('C')) {
      bullets.push("체계적인 업무 처리와 정밀한 관리 업무에 강점이 있습니다");
    }

    // 전공 기반 추가 설명 (상위 3개 전공의 공통 특성)
    const majorKeywords: Record<string, string[]> = {
      '공학': ['기술 개발', '문제 해결', '실무 프로젝트'],
      '경영': ['경영 전략', '비즈니스 분석', '조직 관리'],
      '인문': ['문헌 연구', '글쓰기', '비판적 사고'],
      '사회': ['정책 분석', '사회 문제 해결', '연구 조사'],
      '예술': ['창의적 표현', '디자인', '콘텐츠 제작'],
      '교육': ['교육 프로그램', '학생 지도', '교육 연구']
    };

    // 추천 전공들의 특징 키워드 추출 (간단한 매핑)
    if (topMajorNames.length > 0) {
      const majorTypes = new Set<string>();
      topMajorNames.forEach((name: string) => {
        if (name.includes('공학') || name.includes('기술')) majorTypes.add('공학');
        if (name.includes('경영') || name.includes('경제') || name.includes('회계')) majorTypes.add('경영');
        if (name.includes('문학') || name.includes('언어') || name.includes('역사')) majorTypes.add('인문');
        if (name.includes('사회') || name.includes('정치') || name.includes('행정')) majorTypes.add('사회');
        if (name.includes('디자인') || name.includes('미술') || name.includes('음악')) majorTypes.add('예술');
        if (name.includes('교육')) majorTypes.add('교육');
      });

      if (majorTypes.size > 0 && bullets.length < 4) {
        const types = Array.from(majorTypes);
        if (types.includes('공학')) bullets.push("기술 기반 문제 해결과 실무 프로젝트 실행에 강점이 있습니다");
        if (types.includes('경영') && bullets.length < 4) bullets.push("비즈니스 전략 수립과 조직 운영에 적합합니다");
        if (types.includes('인문') && bullets.length < 4) bullets.push("문헌 분석과 비판적 사고 능력이 뛰어납니다");
      }
    }

    // 최대 3개까지만 bullets 표시
    const finalBullets = bullets.slice(0, 3);

    const roleLine = roles.length ? "추천 직무로는 " + topRoles + " 등이 있습니다." : "";
    return { lead, majorLine, roleLine, bullets: finalBullets };
  }


  // 간단 런타임 테스트(개발자용)
  useEffect(() => {
    // 1) 모든 문항은 A/B 텍스트를 가져야 함
    const badQ = shuffledQuestions.find((q) => !q.A || !q.B || !q.A.text || !q.B.text);
    if (badQ) console.error("문항 데이터 오류", badQ);
    // 2) 차원 키 유효성 검사
    const okDims = new Set(DIMS);
    const badDim = shuffledQuestions.find((q) => [q.A, q.B].some((c) => c.weights.some((w) => !okDims.has(w[0]))));
    if (badDim) console.error("차원 키 오류", badDim);
  }, [shuffledQuestions]);

  const inIntro = step === 0;
  // 🆕 단계별 상태 변수 업데이트
  const inCluster = isInClusterPhase;
  const inMain = isInRiasecPhase;
  const inAdaptive = isInAdaptivePhase;
  
  // 🆕 현재 문항 계산
  const currentClusterQ: ClusterQuestion | null = inCluster ? CLUSTER_QUESTIONS[step - 1] : null;
  const riasecStep = step - clusterTotal;
  const currentQ: Q | null = inMain 
    ? shuffledQuestions[riasecStep - 1] 
    : inAdaptive 
      ? adaptiveQs[riasecStep - mainTotal - 1] 
      : null;
  
  // 🆕 현재 문항의 A/B 뒤집기 상태 계산
  const isCurrentFlipped = useMemo(() => {
    if (inCluster) {
      return clusterFlipOrder[step - 1] ?? false;
    }
    if (inMain) {
      return riasecFlipOrder[riasecStep - 1] ?? false;
    }
    // 적응형 문항은 뒤집지 않음
    return false;
  }, [inCluster, inMain, step, riasecStep, clusterFlipOrder, riasecFlipOrder]);
  
  // 🆕 화면에 표시할 순서 결정 (뒤집혀 있으면 B→A 순서로 표시)
  const displayOrder: ("A" | "B")[] = isCurrentFlipped ? ["B", "A"] : ["A", "B"];
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* 점진적 진척도 (씨앗→싹→꽃→열매) */}
        {(inCluster || inMain || inAdaptive) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  key={growthStage.emoji}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl">{growthStage.emoji}</span>
                </motion.div>
                <div>
                  <span className="font-bold text-lg text-gray-800">{growthStage.name} 단계</span>
                  {phaseLabel && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      {phaseLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{progress}%</div>
                <div className="text-xs text-gray-500">
                  {step} / {totalAll} 문항
                </div>
              </div>
            </div>
            
            {/* 성장 게이지바 */}
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                className="h-full rounded-full transition-all duration-500 shadow-md"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${growthStage.color}, ${growthStage.color}dd)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              {/* 성장 단계 마커 */}
              <div className="absolute inset-0 flex items-center">
                {[0, 25, 50, 75, 100].map((marker) => (
                  <div
                    key={marker}
                    className="absolute w-0.5 h-full bg-white opacity-40"
                    style={{ left: `${marker}%` }}
                  />
                ))}
              </div>
            </div>

            {/* 진행 중 추천 (60문항 이상) */}
            {liveRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="text-xs text-gray-500 mb-2 flex items-center">
                  <span className="mr-1">💡</span>
                  현재까지의 응답을 바탕으로 한 추천
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* 전공 추천 */}
                  {liveRecommendations.majors.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-xs font-semibold text-blue-700 mb-1 flex items-center">
                        <span className="mr-1">🎓</span>
                        추천 전공
                      </div>
                      <div className="space-y-1">
                        {liveRecommendations.majors.map((major, idx) => (
                          <div 
                            key={major.key || idx} 
                            className="group relative flex items-center justify-between text-xs hover:bg-blue-100 rounded px-1 py-0.5 transition-colors"
                          >
                            <span className="text-gray-700 truncate flex-1">{major.name}</span>
                            <span className="text-blue-600 font-medium ml-2">
                              {major.matchScore}%
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExcludedMajors(prev => new Set(prev).add(major.key));
                              }}
                              className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity"
                              title="이 전공 추천받지 않기"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 직무 추천 */}
                  {liveRecommendations.roles.length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                      <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center">
                        <span className="mr-1">💼</span>
                        추천 직무
                      </div>
                      <div className="space-y-1">
                        {liveRecommendations.roles.map((role, idx) => (
                          <div 
                            key={role.key || idx} 
                            className="group relative flex items-center justify-between text-xs hover:bg-emerald-100 rounded px-1 py-0.5 transition-colors"
                          >
                            <span className="text-gray-700 truncate flex-1">{role.name}</span>
                            <span className="text-emerald-600 font-medium ml-2">
                              {Math.round(role.matchScore * 100)}%
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExcludedRoles(prev => new Set(prev).add(role.key));
                              }}
                              className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity"
                              title="이 직무 추천받지 않기"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {inIntro && (
              <motion.section 
                key="intro" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-block mb-4"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-4xl">🎯</span>
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">진로 적성검사</h2>
                  <p className="text-gray-600">나에게 맞는 전공과 직무를 찾아보세요</p>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: "🎯", title: "계열 탐색", desc: "10문항으로 관심 계열 파악" },
                    { icon: "📝", title: "적성 검사", desc: "80문항 MJU 전공 진로 적합도 검사 분석" },
                    { icon: "⚡", title: "심층 탐색", desc: "적응형 교차 문항" },
                    { icon: "📊", title: "맞춤 추천", desc: "전공·직무 연계 추천" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center border border-blue-100"
                    >
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">📋</span> 어떻게 진행되나요?
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">1.</span>
                      <span><strong>계열 탐색</strong>(10문항): 관심 계열(인문/사회/경상/공학/자연/예체능/융합)을 파악합니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">2.</span>
                      <span><strong>적성 검사</strong>(80문항): MJU 전공 진로 적합도 검사 6차원 기반 적성을 분석합니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">3.</span>
                      <span><strong>심층 탐색</strong>: 낮게 나온 차원을 중심으로 교차 문항이 진행됩니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">4.</span>
                      <span><strong>맞춤 추천</strong>: 계열 선호도 + MJU 전공 진로 적합도 검사 결과를 결합하여 전공과 연관 직무를 추천합니다.</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(1)}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    검사 시작하기 →
                  </motion.button>
                  <p className="mt-3 text-sm text-gray-500">
                    예상 소요 시간: 약 12-18분 (계열 탐색 10문항 + 적성 검사 80문항 + 심층 탐색)
                  </p>
                </div>
              </motion.section>
            )}

            {/* 🆕 계열 탐색 문항 UI */}
            {inCluster && currentClusterQ && (
              <motion.section 
                key={`cluster-${step}`} 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                {/* 계열 탐색 문항 헤더 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      계열 탐색 {step}/{clusterTotal}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-3">
                    {currentClusterQ.prompt}
                  </h2>
                  <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">1</span>
                    <span>또는</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">2</span>
                    <span>키로 빠르게 선택할 수 있습니다</span>
                  </div>
                </div>

                {/* 계열 탐색 선택지 - 랜덤 순서로 표시 */}
                <div className="grid md:grid-cols-2 gap-6">
                  {displayOrder.map((originalKey, index) => {
                    // 화면에 표시되는 레이블 (항상 A, B 순서로 보이지만 실제 내용은 뒤집힐 수 있음)
                    const displayLabel = index === 0 ? "A" : "B";
                    const colorThemes = [
                      { 
                        bg: 'from-purple-50 to-indigo-50', 
                        border: 'border-purple-300', 
                        hover: 'hover:from-purple-100 hover:to-indigo-100',
                        accent: 'bg-purple-600',
                        text: 'text-purple-700'
                      },
                      { 
                        bg: 'from-orange-50 to-amber-50', 
                        border: 'border-orange-300', 
                        hover: 'hover:from-orange-100 hover:to-amber-100',
                        accent: 'bg-orange-600',
                        text: 'text-orange-700'
                      }
                    ];
                    const theme = colorThemes[index];
                    const choice = currentClusterQ[originalKey]; // 실제 선택지 데이터
                    
                    return (
                      <motion.button
                        key={`cluster-${index}`}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePick(displayLabel as "A" | "B")}
                        className={`
                          group relative overflow-hidden
                          bg-gradient-to-br ${theme.bg} ${theme.hover}
                          border-2 ${theme.border}
                          rounded-2xl p-6 text-left
                          transition-all duration-300
                          hover:shadow-lg hover:border-opacity-100
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                        `}
                      >
                        {/* 선택지 레이블 - 화면에는 항상 A, B 순서로 표시 */}
                        <div className={`
                          inline-flex items-center justify-center
                          w-10 h-10 rounded-full ${theme.accent} text-white font-bold text-lg
                          mb-4 shadow-md
                        `}>
                          {displayLabel}
                        </div>
                        
                        {/* 선택지 텍스트 */}
                        <p className="text-lg font-medium text-gray-800 leading-relaxed">
                          {choice.text}
                        </p>
                        
                        {/* 키보드 힌트 */}
                        <div className="hidden md:block absolute bottom-3 right-3">
                          <span className={`text-xs ${theme.text} bg-white/80 px-2 py-1 rounded shadow-sm`}>
                            {index + 1}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* 둘 다 관심 없어요 버튼 */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => handleClusterSkip()}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    둘 다 관심 없어요 →
                    <span className="hidden md:inline ml-2 text-xs text-gray-300">(0키)</span>
                  </button>
                </div>
              </motion.section>
            )}

            {(inMain || inAdaptive) && currentQ && (
              <motion.section 
                key={`q-${step}`} 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                {/* 문항 헤더 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      inAdaptive 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {inAdaptive ? '심층 탐색' : '적성 검사'} {riasecStep}/{inAdaptive ? mainTotal + adaptiveQs.length : mainTotal}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-3">
                    {currentQ.prompt}
                  </h2>
                  {/* PC에서만 표시되는 키보드 단축키 안내 */}
                  <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">1</span>
                    <span>또는</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">2</span>
                    <span>키로 빠르게 선택할 수 있습니다</span>
                  </div>
                </div>

                {/* 선택지 - 2개 균형잡힌 레이아웃 (랜덤 순서로 표시) */}
                <div className="grid md:grid-cols-2 gap-6">
                  {displayOrder.map((originalKey, index) => {
                    // 화면에 표시되는 레이블 (항상 A, B 순서로 보이지만 실제 내용은 뒤집힐 수 있음)
                    const displayLabel = index === 0 ? "A" : "B";
                    const questionId = currentQ.id;
                    const hasImage = questionId >= 1 && questionId <= 6;
                    // 이미지는 원본 키에 맞게 표시
                    const imagePath = hasImage ? getImagePath(questionId, originalKey.toLowerCase() as 'a' | 'b') : null;
                    
                    // 선택지별 색상 테마
                    const colorThemes = [
                      { 
                        bg: 'from-blue-50 to-indigo-50', 
                        border: 'border-blue-300', 
                        hover: 'hover:from-blue-100 hover:to-indigo-100',
                        accent: 'bg-blue-600',
                        text: 'text-blue-700'
                      },
                      { 
                        bg: 'from-emerald-50 to-teal-50', 
                        border: 'border-emerald-300', 
                        hover: 'hover:from-emerald-100 hover:to-teal-100',
                        accent: 'bg-emerald-600',
                        text: 'text-emerald-700'
                      }
                    ];
                    const theme = colorThemes[index];
                    
                    return (
                      <motion.button
                        key={`riasec-${index}`}
                        whileHover={{ 
                          scale: 1.02,
                          y: -4,
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
                        }}
                        whileTap={{ 
                          scale: 0.98
                        }}
                        onClick={() => handlePick(displayLabel as "A" | "B")}
                        className={`relative text-left bg-gradient-to-br ${theme.bg} border-2 ${theme.border} ${theme.hover} rounded-2xl p-6 shadow-md transition-all duration-300 min-h-[280px] flex flex-col`}
                      >
                        {/* 이미지 영역 */}
                        {hasImage && imagePath && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-4 w-full flex-shrink-0"
                          >
                            <img 
                              src={imagePath} 
                              alt={`문항 ${questionId} ${displayLabel} 선택지`}
                              className="w-full h-48 object-contain rounded-xl bg-white shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </motion.div>
                        )}

                        {/* 텍스트 영역 */}
                        <div className="flex-1 flex items-center">
                          <p className={`text-lg font-semibold ${theme.text} leading-relaxed`}>
                            {currentQ[originalKey].text}
                          </p>
                        </div>

                        {/* 호버 효과 인디케이터 */}
                        <motion.div
                          className={`absolute bottom-0 left-0 right-0 h-1 ${theme.accent} rounded-b-2xl`}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    );
                  })}
                </div>

                {/* 안내 문구 */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    💡 더 본인에게 맞는 활동을 선택해주세요
                  </p>
                </div>
              </motion.section>
            )}

            {step > totalAll && result && (
              <motion.section 
                key="result" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                {/* 결과 헤더 */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-block mb-4"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-4xl">✨</span>
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">검사 완료!</h2>
                  <p className="text-gray-600 mb-4">당신의 진로 적성 분석 결과입니다</p>
                  
                  {/* 결과 코드 표시 */}
                  {resultCode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 mb-4 no-print"
                    >
                      <p className="text-sm text-gray-600 mb-2 text-center">결과 확인 코드</p>
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <code className="text-2xl font-bold text-blue-700 tracking-wider bg-white px-4 py-2 rounded-lg shadow-sm">
                          {resultCode}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(resultCode);
                            alert('코드가 복사되었습니다!');
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                        >
                          복사
                        </button>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xs text-gray-500">
                          이 코드로 언제든지 결과를 확인할 수 있습니다
                        </p>
                        <a
                          href={`?code=${resultCode}`}
                          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition"
                        >
                          🔗 결과 조회 페이지로 이동
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* RIASEC 레이더 */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">📊</span> MJU 전공 진로 적합도 검사 스파이더 차트
                    </h3>
                    <div className="w-full h-64 bg-white rounded-lg p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={riasecData} outerRadius="80%">
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#4b5563' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar name="나" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">🏆</span> 차원 정규화 순위
                    </h3>
                    <div className="space-y-3">
                      {DIMS.map((k) => ({ key: k, score: Math.round((result.norm[k] || 0) * 100) }))
                        .sort((a, b) => b.score - a.score)
                        .map((item, index) => {
                          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                          const dimLabels: Record<Dim, string> = { 
                            R: "R(현장형)", 
                            I: "I(탐구형)", 
                            A: "A(예술형)", 
                            S: "S(사회형)", 
                            E: "E(진취형)", 
                            C: "C(사무형)"
                          };
                          return (
                            <div key={item.key} className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: colors[index] }}>
                                    {index + 1}
                                  </div>
                                  <span className="font-semibold text-gray-800">{dimLabels[item.key as Dim]}</span>
                                </div>
                                <span className="text-lg font-bold text-gray-700">{item.score}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.score}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                  className="h-2 rounded-full"
                                  style={{ backgroundColor: colors[index] }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* 설명문 자동 생성 */}
                {(() => {
                  const exp = generateExplanation(result.norm, result.majors, result.roles);
                  return (
                    <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-md">
                      <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                        <span className="mr-2">💡</span> 개인화 설명
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-lg mb-3 font-medium">{exp.lead}</p>
                      <p className="text-gray-700 leading-relaxed mb-3">{exp.majorLine} {exp.roleLine}</p>
                      {exp.bullets.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {exp.bullets.map((b, i) => (
                            <li key={i} className="flex items-start text-gray-700">
                              <span className="mr-2 text-yellow-600">✓</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })()}

                {/* 전공 & 직무 추천 */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* 전공 Top 5 */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">🎓</span> 전공 추천 Top 5
                      <span className="ml-2 text-xs text-gray-400 font-normal">(클릭하여 전공 홈페이지 방문)</span>
                    </h3>
                    <div className="space-y-3">
                      {result.majors
                        .filter(m => !excludedMajors.has(m.key)) // 🆕 결과 화면에서도 제외된 전공 필터링
                        .map((m, index) => (
                        <motion.div
                          key={m.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            if (m.url) {
                              window.open(m.url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className={`bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500 transition-all group ${
                            m.url 
                              ? 'cursor-pointer hover:shadow-md hover:border-l-blue-600 hover:bg-blue-50' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800 flex items-center">
                                  {m.name}
                                  {m.url && (
                                    <span className="ml-2 text-blue-500 text-xs">🔗</span>
                                  )}
                                </span>
                                {m.college && (
                                  <span className="text-xs text-gray-500">{m.college}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {Math.round(m.score * 100)}%
                              </div>
                              {/* 🆕 전공능력 자가진단 버튼 */}
                              {onNavigate && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate("roadmap-explorer", { selectedMajor: m.key });
                                  }}
                                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 no-print"
                                  title={`${m.name} 전공능력 자가진단`}
                                >
                                  <span>📋</span>
                                  <span className="hidden sm:inline">자가진단</span>
                                </button>
                              )}
                              {/* 🆕 결과 화면에서도 제외 버튼 추가 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExcludedMajors(prev => new Set(prev).add(m.key));
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded-full hover:bg-red-50 no-print"
                                title="이 전공 제외하기"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {/* 전공 탐색 버튼 */}
                    {onNavigate && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onNavigate("roadmap-explorer")}
                          className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2 no-print"
                        >
                          <span>📂</span>
                          <span>추천 전공 상세 탐색하기</span>
                        </motion.button>
                        <p className="mt-2 text-xs text-gray-500 text-center no-print">
                          전공능력 자가진단으로 나에게 맞는 전공을 더 자세히 알아보세요
                        </p>
                      </>
                    )}
                  </div>

                  {/* 직무 Top 5 */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">💼</span> 직무 추천 Top 5
                      <span className="ml-2 text-xs text-gray-400 font-normal">(워크피디아 연동)</span>
                    </h3>
                    <div className="space-y-3">
                      {result.roles
                        .filter(r => !excludedRoles.has(r.key)) // 🆕 결과 화면에서도 제외된 직무 필터링
                        .map((r, index) => (
                        <motion.div
                          key={r.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-800">{r.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {Math.round(r.score * 100)}%
                              </div>
                              {/* 🆕 워크피디아 직업정보 연동 버튼 (직접 링크) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 워크피디아 직접 링크 또는 통합검색 URL로 이동
                                  const workpediaUrl = getWorkpediaJobUrl(r.name);
                                  window.open(workpediaUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 no-print ${
                                  getWorkpediaJobCode(r.name) 
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' 
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                }`}
                                title={`${r.name} 직업정보 보기 (워크피디아${getWorkpediaJobCode(r.name) ? ' - 직접 링크' : ''})`}
                              >
                                <span>{getWorkpediaJobCode(r.name) ? '📋' : '🔍'}</span>
                                <span className="hidden sm:inline">직무정보</span>
                              </button>
                              {/* 🆕 결과 화면에서도 제외 버튼 추가 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExcludedRoles(prev => new Set(prev).add(r.key));
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded-full hover:bg-red-50 no-print"
                                title="이 직무 제외하기"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {/* 워크피디아 안내 */}
                    <p className="mt-3 text-xs text-gray-500 text-center no-print">
                      🔗 <a href="https://www.wagework.go.kr" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">워크피디아</a>에서 직업별 상세 정보, 평균 연봉, 미래 전망을 확인하세요
                    </p>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200 no-print">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    🔄 다시 하기
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // PDF 다운로드 (간단한 구현)
                      window.print();
                    }}
                    className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    📄 PDF 다운로드
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const email = prompt('이메일 주소를 입력하세요:');
                      if (email) {
                        // 실제로는 백엔드 API를 호출해야 하지만, 여기서는 안내만 표시
                        const subject = encodeURIComponent('진로 적성검사 결과');
                        const resultUrl = `${window.location.origin}${window.location.pathname}?code=${resultCode}`;
                        const body = encodeURIComponent(`결과 확인 코드: ${resultCode}\n\n결과를 확인하려면 다음 링크를 방문하세요:\n${resultUrl}`);
                        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    📧 이메일로 보내기
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    ⬆️ 맨 위로
                  </motion.button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

        </div>
        
        {/* 🔧 디버그 패널 */}
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 top-20 w-96 max-h-[80vh] overflow-y-auto bg-gray-900 text-gray-100 rounded-xl shadow-2xl p-4 z-50 text-xs font-mono"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-yellow-400">🔧 디버그 패널</h3>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* 현재 단계 정보 */}
            <div className="mb-4 p-2 bg-gray-800 rounded-lg">
              <div className="text-yellow-300 mb-1">📍 현재 상태</div>
              <div>Step: {debugData.step} / {totalAll}</div>
              <div>Phase: {debugData.phase || '인트로'}</div>
              <div>계열 탐색: {clusterTotal}문항 | MJU 전공 진로 적합도 검사: {mainTotal}문항 | 적응형: {adaptiveQs.length}문항</div>
            </div>
            
            {/* 계열 점수 */}
            <div className="mb-4 p-2 bg-gray-800 rounded-lg">
              <div className="text-green-300 mb-2">🎯 계열 점수 (정규화)</div>
              <div className="space-y-1">
                {debugData.topClusters.map(({ cluster, score }) => (
                  <div key={cluster} className="flex items-center">
                    <span className="w-16">{cluster}</span>
                    <div className="flex-1 bg-gray-700 h-3 rounded-full overflow-hidden mx-2">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right">{(score * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-gray-400 text-[10px]">
                Raw: {Object.entries(debugData.rawClusterScores).map(([k, v]) => `${k}:${v?.toFixed(1)}`).join(' | ')}
              </div>
            </div>
            
            {/* RIASEC 점수 */}
            <div className="mb-4 p-2 bg-gray-800 rounded-lg">
              <div className="text-blue-300 mb-2">📊 MJU 전공 진로 적합도 검사 점수 (정규화)</div>
              <div className="space-y-1">
                {DIMS.map(dim => {
                  const score = debugData.normalizedRiasec[dim] || 0;
                  return (
                    <div key={dim} className="flex items-center">
                      <span className="w-8 font-bold">{dim}</span>
                      <div className="flex-1 bg-gray-700 h-3 rounded-full overflow-hidden mx-2">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right">{(score * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-gray-400 text-[10px]">
                Raw: {DIMS.map(d => `${d}:${(debugData.rawScores[d] || 0).toFixed(1)}`).join(' | ')}
              </div>
            </div>
            
            {/* 추천 전공 Top 5 */}
            {debugData.majors.length > 0 && (
              <div className="mb-4 p-2 bg-gray-800 rounded-lg">
                <div className="text-purple-300 mb-2">🎓 추천 전공 Top 5</div>
                <div className="space-y-1">
                  {debugData.majors.slice(0, 5).map((major, idx) => (
                    <div key={major.key} className="flex items-center justify-between">
                      <span className="truncate flex-1">
                        {idx + 1}. {major.name}
                        {major.clusterBonus && major.clusterBonus > 0 && (
                          <span className="ml-1 text-green-400">+{(major.clusterBonus * 100).toFixed(0)}%</span>
                        )}
                      </span>
                      <span className="text-purple-400 ml-2">{major.matchScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 추천 직무 Top 5 */}
            {debugData.roles.length > 0 && (
              <div className="mb-4 p-2 bg-gray-800 rounded-lg">
                <div className="text-orange-300 mb-2">💼 추천 직무 Top 5</div>
                <div className="space-y-1">
                  {debugData.roles.slice(0, 5).map((role, idx) => (
                    <div key={role.key} className="flex items-center justify-between">
                      <span className="truncate flex-1">
                        {idx + 1}. {role.name}
                        {role.isRelatedToMajor && (
                          <span className="ml-1 text-green-400">⭐</span>
                        )}
                      </span>
                      <span className="text-orange-400 ml-2">{(role.matchScore * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 이전 문항 버튼 */}
            {answerHistory.length > 0 && step > 1 && (
              <div className="mb-4 p-2 bg-gray-800 rounded-lg">
                <div className="text-cyan-300 mb-2">⏮️ 문항 이동</div>
                <button
                  onClick={handlePrevious}
                  disabled={answerHistory.length === 0 || step <= 1}
                  className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs font-semibold transition-colors"
                >
                  ← 이전 문항으로 돌아가기 ({answerHistory.length}개 답변됨)
                </button>
              </div>
            )}
            
            {/* 빠른 테스트 */}
            <div className="p-2 bg-gray-800 rounded-lg">
              <div className="text-red-300 mb-2">⚡ 빠른 테스트</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    // 계열 탐색 건너뛰기
                    setClusterScores({ "인문": 0, "사회": 0, "경상": 2, "공학": 1, "자연": 0, "예체능": 0, "융합": 1 });
                    setStep(clusterTotal + 1);
                    setAnswerHistory([]); // 이력 초기화
                  }}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs"
                >
                  계열 스킵 (경상)
                </button>
                <button
                  onClick={() => {
                    // RIASEC 60문항까지 건너뛰기
                    setScores({ R: 3, I: 8, A: 2, S: 4, E: 7, C: 6 });
                    setStep(clusterTotal + 60);
                    setAnswerHistory([]); // 이력 초기화
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
                >
                  60문항 스킵
                </button>
                <button
                  onClick={() => {
                    // 모든 문항 건너뛰기 (결과 보기)
                    setClusterScores({ "인문": 0, "사회": 0, "경상": 3, "공학": 2, "자연": 0, "예체능": 0, "융합": 2 });
                    setScores({ R: 5, I: 12, A: 3, S: 6, E: 10, C: 9 });
                    setAdaptiveQs([]);
                    setStep(clusterTotal + mainTotal + 1);
                    setAnswerHistory([]); // 이력 초기화
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                >
                  결과 보기
                </button>
                <button
                  onClick={handleReset}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                >
                  리셋
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* 디버그 토글 버튼 */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-colors"
          title="디버그 패널 토글"
        >
          🔧
        </button>
      </div>
    </div>
  );
}
