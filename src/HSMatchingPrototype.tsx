import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { MAJORS } from "./data/majorList";
import { QUESTION_POOL, Dim, Choice, Question as Q } from "./data/questionPool";
import { OCC_ROLES } from "./data/occMatching";
import { generateResultCode, saveResultWithCode } from "./utils/resultCode";
import { recommendRoles } from "./utils/roleRecommendation";
import { recommendMajors } from "./utils/recommendMajors";

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
// MAJORS는 major_list.csv 파일에서 자동으로 생성됩니다 (data/majorList.ts 참조)
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
}

export default function HSMatchingPrototype({ onComplete }: HSMatchingPrototypeProps = {}) {
  // 문항을 랜덤으로 섞어서 저장 (컴포넌트 마운트 시 초기화, 다시 하기 버튼으로 재섞기 가능)
  const [shuffledQuestions, setShuffledQuestions] = useState<Q[]>(() => shuffleArray(QUESTIONS));

  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Partial<Record<Dim, number>>>({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
  const [losers, setLosers] = useState<Choice[]>([]);
  const [adaptiveQs, setAdaptiveQs] = useState<Q[]>([]);
  // 디버그 패널 토글 상태
  const [showDebug, setShowDebug] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  // 블록 완료 축하 메시지 표시
  const [showBlockComplete, setShowBlockComplete] = useState(false);
  // 마지막 블록 완료 시점 추적
  const [lastCompletedBlock, setLastCompletedBlock] = useState(0);
  // 결과 코드
  const [resultCode, setResultCode] = useState<string | null>(null);
  // 제외된 전공/직무 목록
  const [excludedMajors, setExcludedMajors] = useState<Set<string>>(new Set());
  const [excludedRoles, setExcludedRoles] = useState<Set<string>>(new Set());
  
  // 다시 하기 함수 (문항도 다시 섞기)
  const handleReset = () => {
    setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    setStep(0);
    setLosers([]);
    setAdaptiveQs([]);
    setResultSaved(false);
    setShowBlockComplete(false);
    setLastCompletedBlock(0);
    setShuffledQuestions(shuffleArray(QUESTIONS)); // 문항 다시 섞기
    setExcludedMajors(new Set());
    setExcludedRoles(new Set());
  };

  const mainTotal = shuffledQuestions.length;
  const totalAll = mainTotal + adaptiveQs.length;
  
  // 블록 단위 설정 (5문항씩)
  const BLOCK_SIZE = 5;
  const totalBlocks = Math.ceil(mainTotal / BLOCK_SIZE);
  const currentBlock = step > 0 ? Math.ceil(step / BLOCK_SIZE) : 0;
  const currentBlockStart = step > 0 ? (currentBlock - 1) * BLOCK_SIZE + 1 : 0;
  const currentBlockEnd = step > 0 ? Math.min(currentBlock * BLOCK_SIZE, mainTotal) : 0;

  // 성장 단계 계산 (씨앗→싹→꽃→열매)
  const growthStage = useMemo(() => {
    const progressRatio = step / (totalAll || mainTotal);
    if (progressRatio < 0.25) return { emoji: '🌱', name: '씨앗', color: '#10b981' }; // 초록
    if (progressRatio < 0.5) return { emoji: '🌿', name: '싹', color: '#22c55e' }; // 밝은 초록
    if (progressRatio < 0.75) return { emoji: '🌺', name: '꽃', color: '#f59e0b' }; // 주황
    if (progressRatio < 1) return { emoji: '🌻', name: '만개', color: '#eab308' }; // 노랑
    return { emoji: '🍎', name: '열매', color: '#ef4444' }; // 빨강
  }, [step, mainTotal, totalAll]);

  const progress = useMemo(() => {
    const denom = totalAll || mainTotal;
    const current = Math.min(Math.max(step, 0), denom);
    return Math.round((current / denom) * 100);
  }, [step, mainTotal, totalAll]);

  // 진행 중 추천 (60문항 이상일 때)
  const liveRecommendations = useMemo(() => {
    if (step < 60) return null;
    
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
    
    // 전공 추천 (상위 3개, 제외된 항목 필터링)
    const allMajors = recommendMajors(normalized, { limit: 10 });
    const topMajors = allMajors.filter(major => !excludedMajors.has(major.key)).slice(0, 3);

    return {
      roles: topRoles,
      majors: topMajors
    };
  }, [step, scores, excludedMajors, excludedRoles]);

  function applyWeights(next: Partial<Record<Dim, number>>, weights: Array<[Dim, number]>) {
    const copy = { ...next };
    for (let i = 0; i < weights.length; i++) {
      const d = weights[i][0];
      const v = weights[i][1];
      copy[d] = (copy[d] || 0) + v;
    }
    return copy;
  }

  function handlePick(choice: "A" | "B") {
    const q = step <= mainTotal ? shuffledQuestions[step - 1] : adaptiveQs[step - mainTotal - 1];
    if (!q) return;

    let nextScores = scores;
    let nextLosers = losers;

    const selected = choice === "A" ? q.A : q.B;
    const other = choice === "A" ? q.B : q.A;
    nextScores = applyWeights(scores, selected.weights);
    nextLosers = losers.concat([other]);
    setScores(nextScores);
    setLosers(nextLosers);

    if (step === mainTotal) {
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
      const inMain = step >= 1 && step <= mainTotal;
      const inAdaptive = step > mainTotal && step <= totalAll;
      
      if (inMain || inAdaptive) {
        if (e.key === '1') {
          e.preventDefault();
          handlePick('A');
        } else if (e.key === '2') {
          e.preventDefault();
          handlePick('B');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [step, mainTotal, totalAll, shuffledQuestions, adaptiveQs, scores, losers]);

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

  const result = useMemo(() => {
    if (step <= totalAll) return null;
    const maxVal = Math.max(1, ...DIMS.map((d) => scores[d] || 0));
    const normObj = DIMS.reduce((acc, d) => {
      acc[d] = (scores[d] || 0) / maxVal;
      return acc;
    }, {} as Record<Dim, number>);

    // 제외된 항목을 필터링하여 추천
    const allMajors = MAJORS.map((m) => ({ ...m, score: cosineSim(normObj, m.vec) }))
      .filter(m => !excludedMajors.has(m.key))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    const allRoles = ROLES.map((r) => ({ ...r, score: cosineSim(normObj, r.vec) }))
      .filter(r => !excludedRoles.has(r.key))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { norm: normObj, majors: allMajors, roles: allRoles };
  }, [step, totalAll, scores, excludedMajors, excludedRoles]);

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
      saveResultWithCode(fullResult, code);
      
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
    const key2ko: Record<string, string> = { R: "R(현장형)", E: "E(진취형)", I: "I(탐구형)", S: "S(사회형)", C: "C(사무형)", A: "A(예술형)" };

    const topMajors = majors.map((m: any) => m.name).join(", ");
    const topRoles = roles.map((r: any) => r.name).slice(0, 3).join(", ");

    const lead = "당신은 " + key2ko[top[0][0]] + " 성향이 두드러지고, " + key2ko[top[1][0]] + "와 " + key2ko[top[2][0]] + " 경향도 강합니다.";
    const majorLine = "이 조합은 " + topMajors + " 전공에 잘 맞는 프로파일입니다.";

    const bullets: string[] = [];
    if ((norm.E || 0) > 0.6 && (norm.A || 0) > 0.5) bullets.push("커뮤니케이션과 브랜드, 콘텐츠 기획 적합");
    if ((norm.I || 0) > 0.6 && (norm.C || 0) > 0.5) bullets.push("정책과 리서치, 운영전략 등 분석 중심 업무 강점");
    if ((norm.S || 0) > 0.6 && (norm.C || 0) > 0.5) bullets.push("HR와 조직관리 등 규정 기반 업무 적합");
    if ((norm.R || 0) > 0.6) bullets.push("현장 실행과 프로젝트 운영에서 몰입도 높음");

    const roleLine = roles.length ? "추천 직무로는 " + topRoles + " 등이 있습니다." : "";
    return { lead, majorLine, roleLine, bullets };
  }

  // 디버그 데이터: 현재 점수 정규화, 낮은 차원, 교차 후보 샘플 등
  const debugData = useMemo(() => {
    const values = DIMS.map((d) => scores[d] || 0);
    const maxVal = Math.max(1, ...values);
    const norm: Record<Dim, number> = { R:0,I:0,A:0,S:0,E:0,C:0 } as Record<Dim, number>;
    DIMS.forEach((d) => { norm[d] = (scores[d] || 0) / maxVal; });
    const lowDims = DIMS.slice().sort((a,b) => (norm[a]||0) - (norm[b]||0)).slice(0,2);
    const loserSample = losers.slice(0, 5).map((c) => c.text);
    const adaptiveSample = adaptiveQs.slice(0, 3).map((q) => ({ id:q.id, A:q.A.text, B:q.B.text }));

    // currentQuestionId 을 계산할 때 currentQ 나 inIntro 같은 아직 초기화되지 않은 상수를 참조하지 않도록 직접 계산
    let currentQuestionId: number | null = null;
    if (step >= 1 && step <= mainTotal) {
      currentQuestionId = shuffledQuestions[step - 1]?.id ?? null;
    } else if (step > mainTotal && step <= totalAll) {
      currentQuestionId = adaptiveQs[step - mainTotal - 1]?.id ?? null;
    }

    return {
      step,
      progress,
      mainTotal,
      adaptiveTotal: adaptiveQs.length,
      losersCount: losers.length,
      currentQuestionId,
      norm,
      lowDims,
      loserSample,
      adaptiveSample,
      riasecPreview: riasecData.slice(0,6)
    };
  }, [step, progress, mainTotal, totalAll, adaptiveQs, losers, scores, riasecData]);

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
  const inMain = step >= 1 && step <= mainTotal;
  const inAdaptive = step > mainTotal && step <= totalAll;
  const currentQ: Q | null = inMain ? shuffledQuestions[step - 1] : inAdaptive ? adaptiveQs[step - mainTotal - 1] : null;
  
  // 블록 진행도 계산 (inMain 선언 이후)
  const currentBlockProgress = inMain && step > 0 ? step - currentBlockStart + 1 : 0;
  const isBlockComplete = inMain && step > 0 && step % BLOCK_SIZE === 0 && step <= mainTotal;
  
  // 블록 완료 축하 메시지 표시 (비활성화)
  // useEffect(() => {
  //   if (isBlockComplete && currentBlock > lastCompletedBlock) {
  //     setShowBlockComplete(true);
  //     setLastCompletedBlock(currentBlock);
  //     const timer = setTimeout(() => setShowBlockComplete(false), 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isBlockComplete, currentBlock, lastCompletedBlock]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-center justify-between bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-4">
            <img 
              src="https://myicap.mju.ac.kr/files/web1/images/common/logo.png" 
              alt="MYiCap 로고" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">MJU e-Advisor</h1>
              <p className="text-sm text-gray-500">진로 적성검사 시스템</p>
            </div>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">v0.5</span>
        </header>

        {/* 점진적 진척도 (씨앗→싹→꽃→열매) */}
        {(inMain || inAdaptive) && (
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

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: "📝", title: "80문항", desc: "강제선택형 문항으로 구성" },
                    { icon: "⚡", title: "적응형", desc: "1차 후 교차 문항 진행" },
                    { icon: "📊", title: "RIASEC", desc: "6차원 기반 분석" }
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
                      <span>각 문항에서 더 본인에게 맞는 활동을 <strong>A</strong> 또는 <strong>B</strong> 중 하나로 선택합니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">2.</span>
                      <span>1차 문항(80개) 종료 후 낮게 나온 차원을 중심으로 교차 문항이 진행됩니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">3.</span>
                      <span>선택은 <strong>R(현장형), I(탐구형), A(예술형), S(사회형), E(진취형), C(사무형)</strong> 점수로 환산됩니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-blue-600 font-bold">4.</span>
                      <span>마지막에 전공 Top 3와 직무 Top 5, 개인화된 설명을 제공합니다.</span>
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
                    예상 소요 시간: 약 10-15분
                  </p>
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

                {/* 선택지 - 2개 균형잡힌 레이아웃 */}
                <div className="grid md:grid-cols-2 gap-6">
                  {(["A", "B"] as const).map((key, index) => {
                    const questionId = currentQ.id;
                    const hasImage = questionId >= 1 && questionId <= 6;
                    const imagePath = hasImage ? getImagePath(questionId, key.toLowerCase() as 'a' | 'b') : null;
                    
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
                        key={key}
                        whileHover={{ 
                          scale: 1.02,
                          y: -4,
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
                        }}
                        whileTap={{ 
                          scale: 0.98
                        }}
                        onClick={() => handlePick(key)}
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
                              alt={`문항 ${questionId} ${key} 선택지`}
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
                            {currentQ[key].text}
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
                      <span className="mr-2">📊</span> RIASEC 스파이더 차트
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
                    </h3>
                    <div className="space-y-3">
                      {result.majors.map((m, index) => (
                        <motion.div
                          key={m.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-800">{m.name}</span>
                            </div>
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                              {Math.round(m.score * 100)}%
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 직무 Top 5 */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">💼</span> 직무 추천 Top 5
                    </h3>
                    <div className="space-y-3">
                      {result.roles.map((r, index) => (
                        <motion.div
                          key={r.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-800">{r.name}</span>
                            </div>
                            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                              {Math.round(r.score * 100)}%
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
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

          {/* 개발자용 간단 테스트 케이스 */}
          <details className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <summary className="cursor-pointer font-medium">개발자 테스트 케이스</summary>
            <div className="mt-3 text-sm space-y-2 text-slate-700">
              <div>TC1: 문항 수 = {QUESTIONS.length} (기대: 80, 현재 섞인 순서로 진행)</div>
              <div>TC2: 차원 키 유효성 = {QUESTIONS.every((q) => [q.A, q.B].every((c) => c.weights.every((w) => DIMS.includes(w[0] as Dim)))) ? "OK" : "ERROR"}</div>
              <div>TC3: 결과 계산 안전성 = {(function(){ const s: any = { R:1,I:1,A:1,S:1,E:1,C:1 }; return cosineSim(s, s) === 1 ? "OK" : "WARN"; })()}</div>
              <div>TC4: 레이더 데이터 축 수 = {(function(){ const dummy = { norm: { R:1,I:1,A:1,S:1,E:1,C:1 } } as any; const arr = ["R","I","A","S","E","C"].map((k)=>({axis:k,score:(dummy.norm[k]||0)*100})); return arr.length; })()} (기대: 6)</div>
            </div>
          </details>

          {/* 디버그 패널 (실행 환경에서도 토글 가능) */}
          <div className="mt-6">
            <button onClick={() => setShowDebug((v) => !v)} className="px-3 py-1 rounded-lg text-sm border border-slate-300 bg-white hover:bg-slate-50">
              {showDebug ? "디버그 닫기" : "🔍 디버그 보기"}
            </button>
            {showDebug && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono overflow-auto">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold mb-1">상태 요약</div>
                    <pre>{JSON.stringify({ step: debugData.step, progress: debugData.progress, mainTotal: debugData.mainTotal, adaptiveTotal: debugData.adaptiveTotal, losersCount: debugData.losersCount, currentQuestionId: debugData.currentQuestionId }, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">정규화 점수(R,I,A,S,E,C) & 낮은 차원</div>
                    <pre>{JSON.stringify({ norm: debugData.norm, lowDims: debugData.lowDims }, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">선택받지 못한 옵션 샘플</div>
                    <pre>{JSON.stringify(debugData.loserSample, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">어댑티브 문항 샘플</div>
                    <pre>{JSON.stringify(debugData.adaptiveSample, null, 2)}</pre>
                  </div>
                  <div className="md:col-span-2">
                    <div className="font-semibold mb-1">RIASEC 프리뷰(레이더 데이터)</div>
                    <pre>{JSON.stringify(debugData.riasecPreview, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
