import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { MAJORS } from "./data/majorList";

// 이미지 경로 매핑 함수 (public 폴더 사용)
function getImagePath(questionId: number, key: 'a' | 'b'): string | null {
  if (questionId < 1 || questionId > 6) return null;
  const imageName = `id${String(questionId).padStart(2, '0')}${key}.png`;
  // public 폴더는 루트 경로로 접근
  return `/img/${imageName}`;
}

/**
 * 전체 학과 커버 전공·직무 매칭 프로토타입 (A/B/None + Adaptive)
 * - 3지선다: A, B, 둘 다 관심 없음(None)
 * - 1차: 고정 문항 54개 (인문/사회/경영/공학/자연/예술/스포츠/건축/바이오) → 2차: 교차 문항(적응형, 낮은 차원 2개 중심, 최대 4문항)
 * - 모델: RIASEC + V (R,E,I,A,S,C + Values)
 * - 결과: 전공 Top3, 직무 Top5, 자동 설명문, RIASEC 레이더 + V 게이지
 * - 대상: 명지대학교 전체 학과 (인문/사회/경영/공학/자연/예술/스포츠/건축 등)
 *
 * 빌드 안정성 노트:
 * - 모든 문자열은 표준 따옴표 사용, 백슬래시 사용 금지, 이스케이프 시퀀스 미사용
 * - 한국어 UTF-8 텍스트 직접 포함 (CRA/Vite/Next 기본 설정에서 안전)
 */

// ----- 공통 차원 정의 -----
const DIMS = ["R", "E", "I", "S", "C", "A", "V"] as const;

type Dim = typeof DIMS[number];

type Choice = {
  text: string;
  weights: Array<[Dim, number]>;
};

type Q = {
  id: number;
  prompt: string;
  A: Choice;
  B: Choice;
};

// ----- 문항 세트 (전체 학과 커버: 인문/사회/경영/공학/자연/예술/스포츠/건축) -----
const QUESTIONS: Q[] = [
  // === 인문/사회/경영 계열 (1-24) ===
  { id: 1, prompt: "두 활동 중 더 끌리는 것은?", A: { text: "사람들 앞에서 메시지를 설계하고 설득력 있게 전달하기", weights: [["E", 1],["A", 0.5],["S", 0.5]] }, B: { text: "사회 현상을 데이터와 문헌으로 분석해 원인과 함의를 도출하기", weights: [["I", 0.7],["C", 0.5]] } },
  { id: 2, prompt: "팀 프로젝트에서 선호하는 역할은?", A: { text: "구성원 의견을 조율하고 방향을 제시하는 퍼실리테이터", weights: [["S", 1],["E", 0.5]] }, B: { text: "자료를 구조화하고 일정과 체크리스트로 체계화하는 코디네이터", weights: [["C", 1],["I", 0.3]] } },
  { id: 3, prompt: "회의에서 더 보람찬 순간은?", A: { text: "새로운 아이디어로 팀의 시각을 전환시켰을 때", weights: [["A", 1],["E", 0.5]] }, B: { text: "근거 자료로 논리적 합의를 이끌어냈을 때", weights: [["I", 0.7],["C", 0.5]] } },
  { id: 4, prompt: "어떤 과제가 더 의미 있나요?", A: { text: "지역 사회 문제를 이해하고 당사자와 소통하며 해결책을 공동 설계", weights: [["S", 1],["V", 0.5]] }, B: { text: "정책 문서를 분석해 대안 정책의 장단점을 비교 정리", weights: [["I", 0.7],["C", 0.5]] } },
  { id: 5, prompt: "더 흥미로운 수업은?", A: { text: "스피치와 스토리텔링으로 메시지 전략 실습", weights: [["E", 0.7],["A", 0.8]] }, B: { text: "연구방법으로 사회조사 설계와 데이터 해석", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 6, prompt: "일의 방식 선호는?", A: { text: "대중 및 이해관계자와 접점을 늘려 영향 만들기", weights: [["E", 1],["S", 0.5]] }, B: { text: "백오피스에서 체계와 규정을 정교화", weights: [["C", 1]] } },
  { id: 7, prompt: "더 끌리는 연구 스타일은?", A: { text: "현장 인터뷰와 참여관찰로 사람과 맥락을 이해", weights: [["S", 1],["V", 0.5]] }, B: { text: "공공 데이터셋을 정제하고 통계모형으로 검증", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 8, prompt: "더 맡고 싶은 실무는?", A: { text: "브랜드와 캠페인 콘셉트 기획 및 카피라이팅", weights: [["A", 1],["E", 0.7]] }, B: { text: "조직의 평가와 보상, 규정 정비 및 커뮤니케이션", weights: [["C", 1],["S", 0.5]] } },
  { id: 9, prompt: "가치 관점에서 더 끌리는 일은?", A: { text: "공익을 위한 캠페인과 정책 홍보", weights: [["V", 1],["E", 0.5],["A", 0.3]] }, B: { text: "증거 기반 정책평가로 공공자원 배분 효율화", weights: [["I", 0.7],["C", 0.5],["V", 0.3]] } },
  { id: 10, prompt: "콘텐츠를 만든다면?", A: { text: "대중에게 쉽게 전달되는 스토리와 비주얼", weights: [["A", 1],["E", 0.5]] }, B: { text: "팩트와 자료, 그래프 중심의 해설", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 11, prompt: "협업에서 강점은?", A: { text: "관계 형성과 갈등 조정, 합의 도출", weights: [["S", 1],["E", 0.3]] }, B: { text: "논리로 설득과 근거 제시, 품질 점검", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 12, prompt: "문제 상황에서 먼저 하는 일은?", A: { text: "사람들의 감정과 욕구 파악 후 소통 구조 개선", weights: [["S", 1],["V", 0.3]] }, B: { text: "규정과 사례를 찾아 기준을 세우고 적용", weights: [["C", 1],["I", 0.2]] } },
  { id: 13, prompt: "더 성취감을 주는 피드백은?", A: { text: "당신 덕분에 사람들이 움직였어요", weights: [["E", 1],["S", 0.3]] }, B: { text: "당신의 분석으로 의사결정이 명확해졌어요", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 14, prompt: "보고서 스타일 선호는?", A: { text: "스토리 중심과 사례 위주", weights: [["A", 0.8],["E", 0.5]] }, B: { text: "표와 그래프, 근거 중심", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 15, prompt: "조직 이슈에서 더 중요한 것은?", A: { text: "관계 회복과 이해관계자 조정", weights: [["S", 1]] }, B: { text: "규정 준수와 절차 일관성", weights: [["C", 1]] } },
  { id: 16, prompt: "학습 방식 선호는?", A: { text: "현장에서 배우고 바로 적용", weights: [["A", 0.6],["E", 0.4],["S", 0.3]] }, B: { text: "이론을 깊게 이해하고 체계화", weights: [["I", 0.65],["C", 0.3]] } },
  { id: 17, prompt: "회의 전 준비에서 더 중요한 것은?", A: { text: "메시지 포인트와 스토리 라인", weights: [["A", 0.8],["E", 0.6]] }, B: { text: "데이터 팩트와 참고 문헌", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 18, prompt: "업무 환경 선호는?", A: { text: "대외 접점이 많은 다이내믹 환경", weights: [["E", 0.9],["S", 0.6]] }, B: { text: "집중해서 깊이 파고드는 조용한 환경", weights: [["I", 0.65],["C", 0.3]] } },
  { id: 19, prompt: "갈등이 생기면?", A: { text: "당사자 대화를 주선하고 합의점을 찾는다", weights: [["S", 1],["E", 0.3]] }, B: { text: "정책과 규정 근거로 원칙을 제시한다", weights: [["C", 1]] } },
  { id: 20, prompt: "글쓰기 선호는?", A: { text: "카피와 헤드라인, 스토리텔링", weights: [["A", 1],["E", 0.4]] }, B: { text: "리서치 리포트와 정책 브리프", weights: [["I", 0.65],["C", 0.4]] } },
  { id: 21, prompt: "성과 측정에서 더 중요한 것은?", A: { text: "인지도와 도달, 참여 등의 영향 지표", weights: [["E", 0.8],["A", 0.4]] }, B: { text: "효율성과 정확성, 품질 등 운영 지표", weights: [["C", 0.9],["I", 0.35]] } },
  { id: 22, prompt: "문제 탐색의 첫걸음은?", A: { text: "사람을 만나 맥락과 니즈를 듣는다", weights: [["S", 1],["V", 0.3]] }, B: { text: "데이터를 모아 가설을 세운다", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 23, prompt: "사회적 임팩트에 가치를 둔다면?", A: { text: "캠페인과 커뮤니케이션으로 인식과 행동 변화를 유도", weights: [["E", 0.8],["A", 0.5],["V", 0.5]] }, B: { text: "정책과 제도 개선으로 구조적 변화를 유도", weights: [["I", 0.65],["C", 0.6],["V", 0.6]] } },
  { id: 24, prompt: "장기 커리어에서 더 끌리는 길은?", A: { text: "브랜드와 미디어, 공공외교 등 대외 커뮤니케이션 리더", weights: [["E", 0.9],["A", 0.6],["S", 0.5]] }, B: { text: "정책분석과 리서치, 운영전략 등 내부 전략 리더", weights: [["I", 0.65],["C", 0.6]] } },
  
  // === 현장/실무 계열 (25-29) ===
  { id: 25, prompt: "현장 수업이 주어진다면?", A: { text: "지역 현장에서 인터뷰와 조사를 수행", weights: [["R", 1],["S", 0.4],["I", 0.2]] }, B: { text: "기존 문헌을 검토하고 이론 정리", weights: [["I", 0.7],["C", 0.3]] } },
  { id: 26, prompt: "데이터 수집 방식 선호는?", A: { text: "직접 현장에서 관찰과 설문을 실행", weights: [["R", 1],["S", 0.3]] }, B: { text: "공개 데이터와 2차 자료를 활용", weights: [["I", 0.65],["C", 0.3]] } },
  { id: 27, prompt: "프로젝트 역할", A: { text: "현장 운영과 일정, 참여자, 공간 총괄", weights: [["R", 1],["C", 0.5]] }, B: { text: "분석과 보고서 작성 총괄", weights: [["I", 0.7],["C", 0.4]] } },
  { id: 28, prompt: "캠페인 실행", A: { text: "오프라인 행사 운영과 시민 참여 유도", weights: [["R", 1],["E", 0.5],["S", 0.4]] }, B: { text: "온라인 자료 제작과 성과 측정", weights: [["I", 0.4],["A", 0.4],["C", 0.3]] } },
  { id: 29, prompt: "문제 해결 접근", A: { text: "현장 파일럿을 빨리 돌려 피드백 받기", weights: [["R", 1],["E", 0.4]] }, B: { text: "시뮬레이션과 가설 검증 후 실행", weights: [["I", 0.65],["C", 0.3]] } },
  
  // === 공학/기술 계열 (30-35) ===
  { id: 30, prompt: "기술 문제를 해결할 때?", A: { text: "직접 실험하고 프로토타입을 만들어 테스트", weights: [["R", 1],["I", 0.35]] }, B: { text: "이론과 알고리즘을 분석해 최적해를 도출", weights: [["I", 0.7],["C", 0.5]] } },
  { id: 31, prompt: "소프트웨어 개발에서 선호하는 작업은?", A: { text: "사용자 인터페이스와 경험을 디자인하고 구현", weights: [["A", 0.7],["E", 0.5],["I", 0.4]] }, B: { text: "알고리즘 최적화와 시스템 아키텍처 설계", weights: [["I", 0.7],["C", 0.7]] } },
  { id: 32, prompt: "하드웨어 작업이 주어진다면?", A: { text: "직접 부품을 조립하고 회로를 구성", weights: [["R", 1],["I", 0.35]] }, B: { text: "설계도와 스펙을 분석해 검증", weights: [["I", 0.65],["C", 0.6]] } },
  { id: 33, prompt: "공학 프로젝트에서 더 중요한 것은?", A: { text: "실용성과 사용자 편의성, 현장 적용성", weights: [["R", 0.8],["S", 0.5],["E", 0.4]] }, B: { text: "정확성과 효율성, 표준 준수", weights: [["C", 0.9],["I", 0.5]] } },
  { id: 34, prompt: "기계나 장치를 다룰 때?", A: { text: "손으로 직접 조작하고 실험하며 배운다", weights: [["R", 1],["I", 0.2]] }, B: { text: "매뉴얼과 이론을 먼저 학습한다", weights: [["I", 0.6],["C", 0.5]] } },
  { id: 35, prompt: "시스템 오류가 발생하면?", A: { text: "직접 테스트하며 원인을 찾는다", weights: [["R", 0.9],["I", 0.4]] }, B: { text: "로그와 문서를 체계적으로 분석한다", weights: [["I", 0.65],["C", 0.7]] } },
  
  // === 자연과학 계열 (36-40) ===
  { id: 36, prompt: "실험실에서 더 흥미로운 작업은?", A: { text: "실험 장비를 직접 조작하고 관찰하며 데이터 수집", weights: [["R", 1],["I", 0.4]] }, B: { text: "이론 모델을 수식으로 정리하고 검증", weights: [["I", 0.7],["C", 0.5]] } },
  { id: 37, prompt: "과학 연구에서 선호하는 방식은?", A: { text: "실험과 관찰을 통해 새로운 현상을 발견", weights: [["R", 0.9],["I", 0.5],["A", 0.3]] }, B: { text: "기존 이론을 확장하고 수학적으로 증명", weights: [["I", 0.7],["C", 0.6]] } },
  { id: 38, prompt: "데이터를 분석할 때?", A: { text: "시각화와 그래프로 패턴을 발견", weights: [["A", 0.6],["I", 0.5]] }, B: { text: "통계적 검정과 수학적 모델링", weights: [["I", 0.7],["C", 0.7]] } },
  { id: 39, prompt: "자연 현상을 이해하는 방식은?", A: { text: "직접 관찰하고 실험으로 확인", weights: [["R", 1],["I", 0.35]] }, B: { text: "이론과 법칙을 학습하고 적용", weights: [["I", 0.65],["C", 0.5]] } },
  { id: 40, prompt: "연구 결과를 발표한다면?", A: { text: "시각 자료와 실험 사진으로 설명", weights: [["A", 0.7],["E", 0.5]] }, B: { text: "수식과 표, 논리적 증명으로 설명", weights: [["I", 0.65],["C", 0.6]] } },
  
  // === 예술/디자인 계열 (41-45) ===
  { id: 41, prompt: "창작 작업에서 더 중요한 것은?", A: { text: "개인의 감성과 표현, 독창적인 아이디어", weights: [["A", 1],["E", 0.4]] }, B: { text: "기능과 사용성, 체계적인 디자인 원칙", weights: [["C", 0.7],["I", 0.35],["A", 0.5]] } },
  { id: 42, prompt: "디자인 프로젝트에서 선호하는 작업은?", A: { text: "컨셉 개발과 비주얼 아이덴티티 창조", weights: [["A", 1],["E", 0.5]] }, B: { text: "사용자 조사와 프로토타입 테스트", weights: [["I", 0.5],["S", 0.6],["R", 0.4]] } },
  { id: 43, prompt: "예술 작품을 평가할 때?", A: { text: "감성적 반응과 미적 가치를 중시", weights: [["A", 1],["S", 0.4]] }, B: { text: "기술적 완성도와 구조적 분석", weights: [["I", 0.5],["C", 0.6]] } },
  { id: 44, prompt: "음악이나 공연에서 더 끌리는 역할은?", A: { text: "무대에서 직접 연주하고 관객과 소통", weights: [["A", 0.8],["E", 0.8],["S", 0.6]] }, B: { text: "작곡과 연출, 전체적인 기획과 구성", weights: [["A", 0.9],["I", 0.4],["C", 0.5]] } },
  { id: 45, prompt: "창작 과정에서 더 보람찬 순간은?", A: { text: "관객이나 사용자의 반응을 직접 확인", weights: [["E", 0.8],["S", 0.7],["A", 0.5]] }, B: { text: "완성된 작품의 기술적 완성도와 일관성", weights: [["A", 0.8],["C", 0.6]] } },
  
  // === 스포츠 계열 (46-48) ===
  { id: 46, prompt: "스포츠 활동에서 더 끌리는 것은?", A: { text: "직접 운동하고 경기에 참여", weights: [["R", 1],["E", 0.5]] }, B: { text: "전략 분석과 훈련 방법 연구", weights: [["I", 0.5],["C", 0.5]] } },
  { id: 47, prompt: "스포츠 관련 일에서 선호하는 역할은?", A: { text: "선수나 코치로 직접 지도하고 훈련", weights: [["R", 0.9],["S", 0.8],["E", 0.6]] }, B: { text: "스포츠 산업과 마케팅, 경영 관리", weights: [["E", 0.8],["C", 0.6],["I", 0.35]] } },
  { id: 48, prompt: "스포츠에서 더 중요한 것은?", A: { text: "팀워크와 소통, 함께 성장하는 경험", weights: [["S", 1],["E", 0.6],["R", 0.5]] }, B: { text: "기록과 성과, 체계적인 훈련 계획", weights: [["C", 0.8],["I", 0.4],["R", 0.5]] } },
  
  // === 건축 계열 (49-51) ===
  { id: 49, prompt: "건축 프로젝트에서 더 흥미로운 작업은?", A: { text: "현장에서 직접 공간을 체험하고 설계", weights: [["R", 0.9],["A", 0.7],["S", 0.5]] }, B: { text: "도면과 구조 계산, 기술적 검토", weights: [["I", 0.55],["C", 0.8]] } },
  { id: 50, prompt: "건축 설계에서 더 중요한 것은?", A: { text: "공간의 미적 가치와 사용자 경험", weights: [["A", 0.9],["S", 0.6],["E", 0.4]] }, B: { text: "구조 안전성과 건축 법규 준수", weights: [["C", 0.9],["I", 0.5],["R", 0.5]] } },
  { id: 51, prompt: "건축물을 평가할 때?", A: { text: "직접 방문해 공간을 체험하고 감상", weights: [["R", 0.8],["A", 0.8],["S", 0.5]] }, B: { text: "도면과 사양서를 분석해 구조 검토", weights: [["I", 0.55],["C", 0.8]] } },
  
  // === 바이오/식품 계열 (52-54) ===
  { id: 52, prompt: "생명과학 실험에서 더 흥미로운 것은?", A: { text: "실험을 직접 수행하고 결과를 관찰", weights: [["R", 1],["I", 0.4]] }, B: { text: "데이터 분석과 논문 리뷰로 이론 정리", weights: [["I", 0.7],["C", 0.6]] } },
  { id: 53, prompt: "식품이나 영양 관련 작업에서?", A: { text: "직접 요리하고 맛과 영양을 체험", weights: [["R", 0.9],["S", 0.6],["A", 0.4]] }, B: { text: "성분 분석과 영양학적 연구", weights: [["I", 0.65],["C", 0.6]] } },
  { id: 54, prompt: "바이오 연구에서 더 중요한 것은?", A: { text: "실험을 통해 새로운 발견을 하는 것", weights: [["R", 0.9],["I", 0.5],["A", 0.3]] }, B: { text: "이론적 모델과 논리적 검증", weights: [["I", 0.7],["C", 0.7]] } }
];

// ----- 전공 및 직무 프로파일 -----
// MAJORS는 major_list.csv 파일에서 자동으로 생성됩니다 (data/majorList.ts 참조)
export { MAJORS };

export const ROLES = [
  { key: "policyAnalyst", name: "정책분석가", vec: { I: 0.9, C: 0.7, V: 0.6 } },
  { key: "prComm", name: "PR와 커뮤니케이션", vec: { E: 0.85, A: 0.7, S: 0.6 } },
  { key: "journalist", name: "기자와 에디터", vec: { I: 0.7, A: 0.7, E: 0.6 } },
  { key: "marketResearch", name: "시장과 여론 조사분석가", vec: { I: 0.85, A: 0.5 } },
  { key: "hrSpecialist", name: "HR와 조직관리", vec: { S: 0.8, C: 0.7, E: 0.5 } },
  { key: "ngoPm", name: "NGO와 국제개발 PM", vec: { V: 0.9, S: 0.7, E: 0.5, R: 0.3 } },
  { key: "uxResearch", name: "UX 리서처", vec: { I: 0.8, S: 0.6 } },
  { key: "dataJournalist", name: "데이터 저널리스트", vec: { I: 0.85, A: 0.6 } },
  { key: "diplomat", name: "외교와 공공외교", vec: { E: 0.6, S: 0.6, V: 0.7 } },
  { key: "museumCurator", name: "박물관 큐레이터", vec: { A: 0.6, C: 0.7, I: 0.6 } },
  // 경영학과 관련 직무 추가
  { key: "marketingManager", name: "마케팅 매니저", vec: { E: 0.9, A: 0.8, S: 0.6 } },
  { key: "financialAnalyst", name: "재무 분석가", vec: { I: 0.9, C: 0.8 } },
  { key: "managementConsultant", name: "경영 컨설턴트", vec: { I: 0.8, E: 0.8, C: 0.6 } },
  { key: "productManager", name: "프로덕트 매니저", vec: { E: 0.7, I: 0.7, A: 0.6 } },
  { key: "entrepreneur", name: "창업가/사업가", vec: { E: 0.9, R: 0.6, A: 0.7, V: 0.5 } },
  { key: "businessDeveloper", name: "사업 개발 매니저", vec: { E: 0.9, S: 0.7, I: 0.5 } },
  { key: "dataScientist", name: "데이터 사이언티스트", vec: { I: 0.95, C: 0.7, R: 0.4 } },
  { key: "socialEntrepreneur", name: "사회적기업가", vec: { V: 0.95, E: 0.8, S: 0.7 } }
];

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
  const [scores, setScores] = useState<Partial<Record<Dim, number>>>({ R: 0, E: 0, I: 0, S: 0, C: 0, A: 0, V: 0 });
  const [losers, setLosers] = useState<Choice[]>([]);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [adaptiveQs, setAdaptiveQs] = useState<Q[]>([]);
  // 디버그 패널 토글 상태
  const [showDebug, setShowDebug] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  // 블록 완료 축하 메시지 표시
  const [showBlockComplete, setShowBlockComplete] = useState(false);
  // 마지막 블록 완료 시점 추적
  const [lastCompletedBlock, setLastCompletedBlock] = useState(0);
  
  // 다시 하기 함수 (문항도 다시 섞기)
  const handleReset = () => {
    setScores({ R: 0, E: 0, I: 0, S: 0, C: 0, A: 0, V: 0 });
    setStep(0);
    setLosers([]);
    setSkipped([]);
    setAdaptiveQs([]);
    setResultSaved(false);
    setShowBlockComplete(false);
    setLastCompletedBlock(0);
    setShuffledQuestions(shuffleArray(QUESTIONS)); // 문항 다시 섞기
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

  function applyWeights(next: Partial<Record<Dim, number>>, weights: Array<[Dim, number]>) {
    const copy = { ...next };
    for (let i = 0; i < weights.length; i++) {
      const d = weights[i][0];
      const v = weights[i][1];
      copy[d] = (copy[d] || 0) + v;
    }
    return copy;
  }

  function handlePick(choice: "A" | "B" | "NONE") {
    const q = step <= mainTotal ? shuffledQuestions[step - 1] : adaptiveQs[step - mainTotal - 1];
    if (!q) return;

    if (choice === "NONE") {
      setSkipped((s) => s.concat(q.id));
      setLosers((L) => L.concat([q.A, q.B]));
    } else {
      const selected = choice === "A" ? q.A : q.B;
      const other = choice === "A" ? q.B : q.A;
      setScores((prev) => applyWeights(prev, selected.weights));
      setLosers((L) => L.concat([other]));
    }

    setStep((s) => {
      const next = s + 1;
      if (s === mainTotal) {
        const generated = buildAdaptiveQuestions(scores, losers, 4);
        setAdaptiveQs(generated);
      }
      return next;
    });
  }

  function buildAdaptiveQuestions(curScores: Partial<Record<Dim, number>>, curLosers: Choice[], maxQ: number): Q[] {
    const values = DIMS.map((d) => curScores[d] || 0);
    const maxVal = Math.max(1, ...values);
    const norm: Partial<Record<Dim, number>> = {};
    DIMS.forEach((d) => { norm[d] = (curScores[d] || 0) / maxVal; });

    const lowDims = DIMS.slice().sort((a, b) => (norm[a] || 0) - (norm[b] || 0)).slice(0, 2);

    const bucketA = curLosers.filter((c) => c.weights.some((w) => w[0] === lowDims[0]));
    const bucketB = curLosers.filter((c) => c.weights.some((w) => w[0] === lowDims[1]));

    const pairs: Q[] = [];
    const n = Math.min(maxQ, Math.max(bucketA.length, bucketB.length, 0));
    for (let i = 0; i < n; i++) {
      const a = bucketA[i % Math.max(1, bucketA.length)] || curLosers[i % Math.max(1, curLosers.length)];
      const b = bucketB[i % Math.max(1, bucketB.length)] || curLosers[(i + 1) % Math.max(1, curLosers.length)];
      pairs.push({ id: 1000 + i, prompt: "덜 선호된 영역을 다시 비교해봅시다. 더 마음이 가는 활동은?", A: a, B: b });
    }

    while (pairs.length < maxQ && curLosers.length >= 2) {
      const a = curLosers[Math.floor(Math.random() * curLosers.length)];
      const b = curLosers[Math.floor(Math.random() * curLosers.length)];
      if (a !== b) pairs.push({ id: 2000 + pairs.length, prompt: "한 번 더 비교해볼까요?", A: a, B: b });
    }

    return pairs;
  }

  const result = useMemo(() => {
    if (step <= totalAll) return null;
    const maxVal = Math.max(1, ...DIMS.map((d) => scores[d] || 0));
    const normObj: Record<Dim, number> = { R: 0, E: 0, I: 0, S: 0, C: 0, A: 0, V: 0 } as Record<Dim, number>;
    DIMS.forEach((d) => { normObj[d] = (scores[d] || 0) / maxVal; });

    const majors = MAJORS.map((m) => ({ ...m, score: cosineSim(normObj, m.vec) })).sort((a, b) => b.score - a.score).slice(0, 5);
    const roles = ROLES.map((r) => ({ ...r, score: cosineSim(normObj, r.vec) })).sort((a, b) => b.score - a.score).slice(0, 5);

    return { norm: normObj, majors, roles };
  }, [step, totalAll, scores]);

  // 검사 완료 시 결과 전달
  useEffect(() => {
    if (result && !resultSaved && onComplete) {
      onComplete(result.norm);
      setResultSaved(true);
    }
  }, [result, resultSaved, onComplete]);

  function generateExplanation(norm: Record<Dim, number>, majors: any[], roles: any[]) {
    const order = Object.keys(norm).map((k) => [k, norm[k as Dim]] as [string, number]).sort((a, b) => b[1] - a[1]);
    const top = order.slice(0, 3);
    const key2ko: Record<string, string> = { R: "R(현장형)", E: "E(진취형)", I: "I(탐구형)", S: "S(사회형)", C: "C(사무형)", A: "A(예술형)", V: "V(가치)" };

    const topMajors = majors.map((m: any) => m.name).join(", ");
    const topRoles = roles.map((r: any) => r.name).slice(0, 3).join(", ");

    const lead = "당신은 " + key2ko[top[0][0]] + " 성향이 두드러지고, " + key2ko[top[1][0]] + "와 " + key2ko[top[2][0]] + " 경향도 강합니다.";
    const majorLine = "이 조합은 " + topMajors + " 전공에 잘 맞는 프로파일입니다.";

    const bullets: string[] = [];
    if ((norm.E || 0) > 0.6 && (norm.A || 0) > 0.5) bullets.push("커뮤니케이션과 브랜드, 콘텐츠 기획 적합");
    if ((norm.I || 0) > 0.6 && (norm.C || 0) > 0.5) bullets.push("정책과 리서치, 운영전략 등 분석 중심 업무 강점");
    if ((norm.S || 0) > 0.6 && (norm.C || 0) > 0.5) bullets.push("HR와 조직관리 등 규정 기반 업무 적합");
    if ((norm.R || 0) > 0.6) bullets.push("현장 실행과 프로젝트 운영에서 몰입도 높음");
    if ((norm.V || 0) > 0.6) bullets.push("공익과 사회가치 지향도가 높아 공공과 NGO 분야 적합");

    const roleLine = roles.length ? "추천 직무로는 " + topRoles + " 등이 있습니다." : "";
    return { lead, majorLine, roleLine, bullets };
  }

  // RIASEC 레이더 데이터 (V는 별도 게이지)
  const riasecData = useMemo(() => {
    if (!result) return [] as any[];
    const order: Dim[] = ["R", "I", "A", "S", "E", "C"]; // 보기 좋은 시계 배치
    const dimLabels: Record<Dim, string> = { 
      R: "R(현장형)", 
      I: "I(탐구형)", 
      A: "A(예술형)", 
      S: "S(사회형)", 
      E: "E(진취형)", 
      C: "C(사무형)",
      V: "V(가치)" 
    };
    return order.map((k) => ({ 
      axis: dimLabels[k] || k, 
      score: (result.norm[k] || 0) * 100 
    }));
  }, [result]);

  // 디버그 데이터: 현재 점수 정규화, 낮은 차원, 교차 후보 샘플 등
  const debugData = useMemo(() => {
    const values = DIMS.map((d) => scores[d] || 0);
    const maxVal = Math.max(1, ...values);
    const norm: Record<Dim, number> = { R:0,E:0,I:0,S:0,C:0,A:0,V:0 } as Record<Dim, number>;
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
      skippedCount: skipped.length,
      losersCount: losers.length,
      currentQuestionId,
      norm,
      lowDims,
      loserSample,
      adaptiveSample,
      riasecPreview: riasecData.slice(0,6)
    };
  }, [step, progress, mainTotal, totalAll, adaptiveQs, skipped, losers, scores, riasecData]);

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
  
  // 블록 완료 축하 메시지 표시
  useEffect(() => {
    if (isBlockComplete && currentBlock > lastCompletedBlock) {
      setShowBlockComplete(true);
      setLastCompletedBlock(currentBlock);
      const timer = setTimeout(() => setShowBlockComplete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isBlockComplete, currentBlock, lastCompletedBlock]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MJU e-Advisor TEST</h1>
          <span className="text-sm text-slate-500">v0.4</span>
        </header>

        {/* 블록 완료 축하 메시지 */}
        <AnimatePresence>
          {showBlockComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-4 shadow-lg text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-4xl mb-2"
              >
                🎉
              </motion.div>
              <p className="font-bold text-lg">{BLOCK_SIZE}개 완료!</p>
              <p className="text-sm opacity-90">잘하고 있어요! 계속 화이팅! 💪</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 점진적 진척도 (씨앗→싹→꽃→열매) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.span
                key={growthStage.emoji}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-3xl"
              >
                {growthStage.emoji}
              </motion.span>
              <span className="font-semibold text-slate-700">{growthStage.name} 단계</span>
            </div>
            {inMain && step > 0 && (
              <span className="text-sm text-slate-500">
                {currentBlockProgress} / {currentBlockEnd - currentBlockStart + 1}
              </span>
            )}
          </div>
          
          {/* 성장 게이지바 */}
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                backgroundColor: growthStage.color,
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
                  className="absolute w-1 h-full bg-white opacity-30"
                  style={{ left: `${marker}%` }}
                />
              ))}
            </div>
          </div>
          
          {/* 전체 진행도 (작게) */}
          {step > 0 && (
            <div className="mt-2 text-xs text-slate-500 text-center">
              전체 {step} / {totalAll} 문항 ({progress}%)
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {inIntro && (
              <motion.section key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-semibold mb-2">어떻게 진행되나요?</h2>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  <li>각 문항에서 더 본인에게 맞는 활동을 고르거나, 둘 다 관심 없음(None)을 선택할 수 있어요.</li>
                  <li>1차 문항 종료 후 낮게 나온 차원을 중심으로 선택받지 않았던 옵션들을 교차 비교합니다.</li>
                  <li>선택은 R,E,I,S,C,A,V 점수로 환산됩니다. 마지막에 전공 Top 3와 직무 Top 5, 개인화 설명을 제공합니다.</li>
                </ul>
                <div className="mt-6">
                  <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl bg-[#1e3a8a] text-white font-medium hover:bg-[#3b82f6]">시작하기</button>
                </div>
              </motion.section>
            )}

            {(inMain || inAdaptive) && currentQ && (
              <motion.section key={`q-${step}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-2xl shadow p-6">
                <p className="text-sm text-slate-500 mb-1">{inMain ? `문항 ${step} / ${mainTotal}` : `교차 문항 ${step - mainTotal} / ${adaptiveQs.length}`}</p>
                <h2 className="text-lg md:text-xl font-semibold mb-4">{currentQ.prompt}</h2>

                <div className="grid md:grid-cols-3 gap-4">
                  {(["A", "B"] as const).map((key) => {
                    // 문항 1~6번에 대해 이미지 경로 생성
                    const questionId = currentQ.id;
                    const hasImage = questionId >= 1 && questionId <= 6;
                    
                    // 이미지 경로 생성
                    let imagePath: string | null = null;
                    if (hasImage) {
                      imagePath = getImagePath(questionId, key.toLowerCase() as 'a' | 'b');
                    }
                    
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: "0 10px 25px rgba(59, 130, 246, 0.2)",
                          borderColor: "#3b82f6"
                        }}
                        whileTap={{ 
                          scale: 0.96,
                          boxShadow: "0 5px 15px rgba(59, 130, 246, 0.3)"
                        }}
                        onClick={() => handlePick(key)}
                        className={`text-left bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-200 ${hasImage ? 'flex flex-col items-center' : ''}`}
                      >
                        {hasImage && imagePath && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-4 w-full"
                          >
                            <img 
                              src={imagePath} 
                              alt={`문항 ${questionId} ${key} 선택지`}
                              className="w-full h-auto rounded-xl object-contain max-h-64 bg-slate-100"
                              onError={(e) => {
                                // 이미지 로드 실패 시 숨기기
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </motion.div>
                        )}
                        <div className="w-full">
                          <motion.div
                            initial={{ opacity: 0.7 }}
                            whileHover={{ opacity: 1 }}
                            className="text-xs uppercase tracking-wide text-slate-500 mb-2 font-semibold"
                          >
                            선택 {key}
                          </motion.div>
                          <motion.div
                            initial={{ color: "#1e293b" }}
                            whileHover={{ color: "#0f172a" }}
                            className="text-slate-800 font-medium leading-relaxed"
                          >
                            {currentQ[key].text}
                          </motion.div>
                        </div>
                      </motion.button>
                    );
                  })}
                  <motion.button
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(148, 163, 184, 0.2)",
                      borderColor: "#94a3b8"
                    }}
                    whileTap={{ 
                      scale: 0.96,
                      boxShadow: "0 5px 15px rgba(148, 163, 184, 0.3)"
                    }}
                    onClick={() => handlePick("NONE")}
                    className="text-left bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 shadow-sm transition-all duration-200"
                  >
                    <motion.div
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                      className="text-xs uppercase tracking-wide text-slate-500 mb-2 font-semibold"
                    >
                      선택 없음
                    </motion.div>
                    <motion.div
                      initial={{ color: "#475569" }}
                      whileHover={{ color: "#334155" }}
                      className="text-slate-600"
                    >
                      둘 다 관심 없음
                    </motion.div>
                  </motion.button>
                </div>

                {skipped.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">지금까지 관심 없음 선택: {skipped.length}개</p>
                )}
              </motion.section>
            )}

            {step > totalAll && result && (
              <motion.section key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-semibold mb-4">추천 결과</h2>

                {/* RIASEC 레이더 + V 게이지 */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold mb-2 text-slate-700">RIASEC 스파이더 차트</h3>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={riasecData} outerRadius="80%">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="axis" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="나" dataKey="score" stroke="#1e3a8a" fill="#3b82f6" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">V(가치/공공성)는 아래 별도 게이지로 표시합니다.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold mb-2 text-slate-700">V(가치/공공성) 게이지</h3>
                    <div className="h-3 w-full bg-white border rounded-full overflow-hidden">
                      <div className="h-full bg-[#d4b896]" style={{ width: `${Math.round((result.norm.V || 0) * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-right text-sm text-slate-600">{Math.round((result.norm.V || 0) * 100)}%</div>
                  </div>
                </div>

                {/* 설명문 자동 생성 */}
                {(() => {
                  const exp = generateExplanation(result.norm, result.majors, result.roles);
                  return (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2 text-slate-700">개인화 설명</h3>
                      <p className="text-slate-700 leading-relaxed">{exp.lead}</p>
                      <p className="text-slate-700 leading-relaxed">{exp.majorLine} {exp.roleLine}</p>
                      {exp.bullets.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-slate-700">
                          {exp.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                        </ul>
                      )}
                    </div>
                  );
                })()}

                {/* 전공 Top 5 */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-slate-700">전공 추천 Top 5</h3>
                  <ol className="space-y-2 list-decimal pl-5">
                    {result.majors.map((m) => (
                      <li key={m.key} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-slate-500 text-sm">유사도 {Math.round(m.score * 100)}%</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* 직무 Top 5 */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-slate-700">직무 추천 Top 5</h3>
                  <ol className="space-y-2 list-decimal pl-5">
                    {result.roles.map((r) => (
                      <li key={r.key} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-slate-500 text-sm">유사도 {Math.round(r.score * 100)}%</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={handleReset} className="px-4 py-2 rounded-xl bg-[#1e3a8a] text-white font-medium hover:bg-[#3b82f6]">다시 하기</button>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50">맨 위로</button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 개발자용 간단 테스트 케이스 */}
          <details className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <summary className="cursor-pointer font-medium">개발자 테스트 케이스</summary>
            <div className="mt-3 text-sm space-y-2 text-slate-700">
              <div>TC1: 문항 수 = {QUESTIONS.length} (기대: 54, 현재 섞인 순서로 진행)</div>
              <div>TC2: 차원 키 유효성 = {QUESTIONS.every((q) => [q.A, q.B].every((c) => c.weights.every((w) => DIMS.includes(w[0] as Dim)))) ? "OK" : "ERROR"}</div>
              <div>TC3: 결과 계산 안전성 = {(function(){ const s: any = { R:1,E:1,I:1,S:1,C:1,A:1,V:1 }; return cosineSim(s, s) === 1 ? "OK" : "WARN"; })()}</div>
              <div>TC4: 레이더 데이터 축 수 = {(function(){ const dummy = { norm: { R:1,E:1,I:1,S:1,C:1,A:1,V:1 } } as any; const arr = ["R","I","A","S","E","C"].map((k)=>({axis:k,score:(dummy.norm[k]||0)*100})); return arr.length; })()} (기대: 6)</div>
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
                    <pre>{JSON.stringify({ step: debugData.step, progress: debugData.progress, mainTotal: debugData.mainTotal, adaptiveTotal: debugData.adaptiveTotal, skippedCount: debugData.skippedCount, losersCount: debugData.losersCount, currentQuestionId: debugData.currentQuestionId }, null, 2)}</pre>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">정규화 점수(R,E,I,S,C,A,V) & 낮은 차원</div>
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
