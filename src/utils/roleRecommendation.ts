// 직무 추천 유틸리티

import { ROLES } from "../HSMatchingPrototype";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';
const DIMS: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C', 'V'];

interface Role {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
}

interface RecommendedRole extends Role {
  matchScore: number;
  matchReasons: string[];
  profileStrength: string;
}

const DIM_LABELS: Record<Dim, string> = {
  R: '현장형',
  I: '분석형',
  A: '창의형',
  S: '사회형',
  E: '설득형',
  C: '관습형',
  V: '가치형'
};

/**
 * 코사인 유사도 계산
 */
function cosineSimilarity(vecA: Record<Dim, number>, vecB: Partial<Record<Dim, number>>): number {
  let dot = 0, a2 = 0, b2 = 0;
  
  DIMS.forEach((dim) => {
    const a = vecA[dim] || 0;
    const b = vecB[dim] || 0;
    dot += a * b;
    a2 += a * a;
    b2 += b * b;
  });
  
  const denom = Math.sqrt(a2) * Math.sqrt(b2);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * 진로 적성 기반 직무 추천
 */
export function recommendRoles(
  careerProfile: Record<Dim, number>,
  topN: number = 8
): RecommendedRole[] {
  return ROLES
    .map(role => {
      const matchScore = cosineSimilarity(careerProfile, role.vec);
      
      // 매칭 이유 분석
      const matchReasons: string[] = [];
      const strongDims: string[] = [];
      
      DIMS.forEach(dim => {
        const careerVal = careerProfile[dim] || 0;
        const roleVal = role.vec[dim] || 0;
        
        if (careerVal > 0.7 && roleVal > 0.7) {
          matchReasons.push(`${DIM_LABELS[dim]} 성향 일치`);
          strongDims.push(DIM_LABELS[dim]);
        } else if (careerVal > 0.6 && roleVal > 0.6) {
          strongDims.push(DIM_LABELS[dim]);
        }
      });

      // 프로파일 강점 요약
      let profileStrength = "";
      if (strongDims.length > 0) {
        profileStrength = `${strongDims.slice(0, 3).join(", ")} 성향이 강한 직무`;
      }

      return {
        ...role,
        matchScore,
        matchReasons,
        profileStrength
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}

/**
 * 직무별 필요 역량 설명
 */
export function getRoleDescription(roleKey: string): string {
  const descriptions: Record<string, string> = {
    marketingManager: "시장 조사, 브랜드 전략 수립, 캠페인 기획 및 실행을 담당합니다.",
    financialAnalyst: "재무 데이터 분석, 투자 평가, 재무 모델링을 수행합니다.",
    managementConsultant: "기업의 경영 문제를 진단하고 해결 방안을 제시합니다.",
    productManager: "제품 기획, 개발 조율, 시장 출시 전략을 수립합니다.",
    entrepreneur: "새로운 비즈니스를 창업하고 성장시킵니다.",
    businessDeveloper: "신규 사업 기회 발굴 및 파트너십 구축을 담당합니다.",
    dataScientist: "빅데이터 분석을 통해 비즈니스 인사이트를 도출합니다.",
    socialEntrepreneur: "사회 문제 해결과 경제적 가치 창출을 동시에 추구합니다.",
    policyAnalyst: "정책을 분석하고 평가하여 개선 방안을 제시합니다.",
    prComm: "기업 이미지 관리, 미디어 대응, 홍보 전략을 수립합니다.",
    journalist: "뉴스 취재, 기사 작성, 편집을 담당합니다.",
    marketResearch: "시장 조사 설계, 데이터 수집 및 분석을 수행합니다.",
    hrSpecialist: "채용, 교육, 평가, 보상 등 인사 업무를 총괄합니다.",
    ngoPm: "국제 개발 프로젝트를 기획하고 실행합니다.",
    uxResearch: "사용자 조사를 통해 제품 개선 방향을 제시합니다.",
    dataJournalist: "데이터 분석과 저널리즘을 결합한 심층 보도를 합니다.",
    diplomat: "국가 간 외교 업무와 국제 관계를 담당합니다.",
    museumCurator: "전시 기획, 소장품 관리, 교육 프로그램을 운영합니다."
  };

  return descriptions[roleKey] || "해당 직무에 대한 설명이 없습니다.";
}

