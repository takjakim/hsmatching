// 학습 프로파일 분석 유틸리티

import { Course } from "../types/student";
import type { Dim } from "../data/questionPool";

const DIMS: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export interface LearningProfile {
  normalized: Record<Dim, number>;
  raw: Record<Dim, number>;
  topDimensions: Array<{ dim: Dim; value: number; label: string }>;
}

export interface ProfileComparison {
  careerProfile: Record<Dim, number>;
  learningProfile: Record<Dim, number>;
  alignment: number; // 0-100 일치도
  gaps: Array<{ dim: Dim; gap: number; label: string }>;
  strengths: string[];
  recommendations: string[];
}

const DIM_LABELS: Record<Dim, string> = {
  R: '현장형 (Realistic)',
  I: '분석형 (Investigative)',
  A: '창의형 (Artistic)',
  S: '사회형 (Social)',
  E: '설득형 (Enterprising)',
  C: '관습형 (Conventional)'
};

/**
 * 수강한 과목들로부터 학습 프로파일 계산
 */
export function calculateLearningProfile(courses: Course[]): LearningProfile {
  const raw: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, V: 0 };
  let totalCredits = 0;

  // 학점 가중치로 과목 RIASEC 점수 누적
  courses.forEach((course) => {
    if (course.riasecProfile) {
      const weight = course.credits;
      totalCredits += weight;
      
      DIMS.forEach((dim) => {
        if (course.riasecProfile![dim]) {
          raw[dim] += course.riasecProfile![dim] * weight;
        }
      });
    }
  });

  // 정규화 (0-1 범위)
  const maxVal = Math.max(1, ...DIMS.map(d => raw[d]));
  const normalized: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, V: 0 };
  DIMS.forEach((dim) => {
    normalized[dim] = raw[dim] / maxVal;
  });

  // 상위 3개 차원
  const topDimensions = DIMS
    .map(dim => ({ dim, value: normalized[dim], label: DIM_LABELS[dim] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return { normalized, raw, topDimensions };
}

/**
 * 코사인 유사도 계산
 */
function cosineSimilarity(vecA: Record<Dim, number>, vecB: Record<Dim, number>): number {
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
 * 진로 적성 프로파일과 학습 프로파일 비교
 */
export function compareProfiles(
  careerProfile: Record<Dim, number>,
  learningProfile: Record<Dim, number>
): ProfileComparison {
  // 일치도 계산 (코사인 유사도를 100점 척도로)
  const alignment = Math.round(cosineSimilarity(careerProfile, learningProfile) * 100);

  // 차이(Gap) 계산
  const gaps = DIMS
    .map(dim => ({
      dim,
      gap: careerProfile[dim] - learningProfile[dim],
      label: DIM_LABELS[dim]
    }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  // 강점 분석 (진로 적성과 학습 패턴이 모두 높은 차원)
  const strengths: string[] = [];
  DIMS.forEach(dim => {
    if (careerProfile[dim] > 0.6 && learningProfile[dim] > 0.6) {
      strengths.push(`${DIM_LABELS[dim]}: 적성과 학습 경험이 모두 강함`);
    }
  });

  // 추천사항 생성
  const recommendations: string[] = [];
  
  // 1. 적성은 높지만 학습 경험 부족
  gaps.forEach(gap => {
    if (gap.gap > 0.3) {
      recommendations.push(
        `${gap.label} 영역의 과목을 더 수강하면 적성을 살릴 수 있습니다.`
      );
    }
  });

  // 2. 학습 경험은 많지만 적성이 낮음
  gaps.forEach(gap => {
    if (gap.gap < -0.3) {
      recommendations.push(
        `${gap.label} 영역을 많이 학습했지만, 다른 영역도 탐색해보세요.`
      );
    }
  });

  // 3. 일치도에 따른 조언
  if (alignment >= 80) {
    recommendations.push('적성과 학습 경로가 잘 일치합니다. 현재 방향을 유지하세요.');
  } else if (alignment >= 60) {
    recommendations.push('전반적으로 좋은 방향이나, 일부 조정이 필요합니다.');
  } else {
    recommendations.push('적성 검사 결과를 바탕으로 수강 과목을 재검토해보세요.');
  }

  return {
    careerProfile,
    learningProfile,
    alignment,
    gaps,
    strengths,
    recommendations
  };
}

/**
 * 적성에 맞는 과목 추천
 */
export function recommendCourses(
  careerProfile: Record<Dim, number>,
  availableCourses: Course[],
  topN: number = 5
): Array<Course & { matchScore: number; matchReasons: string[] }> {
  return availableCourses
    .filter(course => course.riasecProfile) // RIASEC 프로파일이 있는 과목만
    .map(course => {
      const matchScore = cosineSimilarity(careerProfile, course.riasecProfile!);
      
      // 매칭 이유 분석
      const matchReasons: string[] = [];
      DIMS.forEach(dim => {
        const careerVal = careerProfile[dim] || 0;
        const courseVal = course.riasecProfile![dim] || 0;
        
        if (careerVal > 0.6 && courseVal > 0.6) {
          matchReasons.push(`${DIM_LABELS[dim]} 성향에 잘 맞음`);
        }
      });

      return {
        ...course,
        matchScore,
        matchReasons
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}

