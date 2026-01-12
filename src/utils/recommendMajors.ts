import { MAJORS } from "../data/majorList";
import type { ClusterType } from "../data/questionPool";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';
type RiasecResult = Partial<Record<Dim, number>>;

interface MajorProfile {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
  cluster?: ClusterType;
  college?: string;
  url?: string; // 전공 홈페이지 URL
}

export interface RecommendedMajor extends MajorProfile {
  matchScore: number;
  signature: string;
  reasons: string[];
  clusterBonus?: number; // 계열 일치 보너스
}

const DIMS: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C', 'V'];

interface PreparedVector {
  vector: Record<Dim, number>;
  normalized: Record<Dim, number>;
  magnitude: number;
}

function clamp(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function prepareVector(source: RiasecResult | undefined): PreparedVector {
  const vector = {} as Record<Dim, number>;
  let sumSquares = 0;

  DIMS.forEach((dim) => {
    const value = clamp(source?.[dim]);
    vector[dim] = value;
    sumSquares += value * value;
  });

  const magnitude = Math.sqrt(sumSquares);
  const normalized = {} as Record<Dim, number>;

  if (magnitude === 0) {
    DIMS.forEach((dim) => {
      normalized[dim] = 0;
    });
    return { vector, normalized, magnitude: 0 };
  }

  DIMS.forEach((dim) => {
    normalized[dim] = vector[dim] / magnitude;
  });

  return { vector, normalized, magnitude };
}

function getSortedDims(vector: Record<Dim, number>) {
  return [...DIMS].sort((a, b) => vector[b] - vector[a]);
}

function cosineSimilarity(a: Record<Dim, number>, b: Record<Dim, number>) {
  let dot = 0;
  DIMS.forEach((dim) => {
    dot += a[dim] * b[dim];
  });
  return dot;
}

function getSignature(vector: Record<Dim, number>) {
  const sorted = getSortedDims(vector);
  const primary = sorted[0] ?? 'R';
  const secondary = sorted[1] ?? sorted[0] ?? 'R';
  return `${primary}>${secondary}`;
}

function buildReasons(topDims: Dim[], majorVec: Record<Dim, number>) {
  const labels: Record<Dim, string> = {
    R: "현장형",
    I: "탐구형",
    A: "예술형",
    S: "사회형",
    E: "진취형",
    C: "사무형",
    V: "가치형"
  };

  return topDims
    .filter((dim) => majorVec[dim] >= 0.55)
    .map((dim) => `${labels[dim]} 강점`);
}

interface RecommendOptions {
  limit?: number;
  clusterScores?: Partial<Record<ClusterType, number>>; // 🆕 계열 점수
}

// 🆕 인접 계열 매핑 (유사한 계열 간 부분 보너스)
const ADJACENT_CLUSTERS: Record<ClusterType, ClusterType[]> = {
  "인문": ["사회", "예체능"],
  "사회": ["인문", "경상"],
  "경상": ["사회", "융합"],
  "공학": ["자연", "융합"],
  "자연": ["공학", "융합"],
  "예체능": ["인문", "융합"],
  "융합": ["공학", "자연", "경상"]
};

export function recommendMajors(
  careerTestResult: RiasecResult | null | undefined,
  options: RecommendOptions = {}
): RecommendedMajor[] {
  const limit = Math.max(1, options.limit ?? 5);
  const clusterScores = options.clusterScores;

  if (!careerTestResult) {
    return [];
  }

  const userVector = prepareVector(careerTestResult);
  if (userVector.magnitude === 0) {
    return [];
  }

  const sortedUserDims = getSortedDims(userVector.vector);
  const topDims = sortedUserDims.slice(0, 3) as Dim[];
  const lowDims = sortedUserDims.filter((dim) => userVector.vector[dim] <= 0.2);
  const primaryDim = sortedUserDims[0];

  const scoredMajors = MAJORS.map((major) => {
    const majorVector = prepareVector(major.vec);
    if (majorVector.magnitude === 0) {
      return null;
    }

    const baseCos = cosineSimilarity(userVector.normalized, majorVector.normalized);

    const synergy = topDims.reduce((score, dim, idx) => {
      const userVal = userVector.vector[dim];
      if (userVal < 0.35) {
        return score;
      }
      const weight = idx === 0 ? 0.35 : idx === 1 ? 0.25 : 0.15;
      const closeness = 1 - Math.min(1, Math.abs(userVal - majorVector.vector[dim]));
      return score + weight * closeness;
    }, 0);

    const shortagePenalty = topDims.reduce((penalty, dim) => {
      const userVal = userVector.vector[dim];
      const majorVal = majorVector.vector[dim];
      if (userVal >= 0.5 && majorVal < userVal * 0.55) {
        return penalty + (userVal - majorVal) * 0.25;
      }
      return penalty;
    }, 0);

    const overloadPenalty = lowDims.reduce((penalty, dim) => {
      const majorVal = majorVector.vector[dim];
      if (majorVal >= 0.55) {
        return penalty + (majorVal - 0.55) * 0.4;
      }
      return penalty;
    }, 0);

    const balancePenalty = DIMS.reduce((penalty, dim) => {
      return penalty + Math.abs(userVector.vector[dim] - majorVector.vector[dim]) * 0.03;
    }, 0);

    const diversityBonus =
      majorVector.vector[primaryDim] >= 0.6 ? 0.02 * (majorVector.vector[primaryDim] - 0.6) * 10 : 0;

    // 🆕 계열 일치도 보너스 계산
    let clusterBonus = 0;
    if (clusterScores && major.cluster) {
      const majorCluster = major.cluster as ClusterType;
      const userClusterScore = clusterScores[majorCluster] || 0;
      
      if (userClusterScore >= 0.7) {
        // 정확히 일치하는 계열에 높은 보너스
        clusterBonus = 0.15;
      } else if (userClusterScore >= 0.4) {
        // 어느 정도 관심 있는 계열에 중간 보너스
        clusterBonus = 0.08;
      } else {
        // 인접 계열 체크
        const adjacentClusters = ADJACENT_CLUSTERS[majorCluster] || [];
        const hasAdjacentInterest = adjacentClusters.some(adj => (clusterScores[adj] || 0) >= 0.5);
        if (hasAdjacentInterest) {
          clusterBonus = 0.05;
        }
      }
    }

    // 🆕 점수 공식 수정: 계열 일치도 반영 (30%)
    // 기존: baseCos * 0.55 + synergy * 0.35
    // 변경: baseCos * 0.45 + synergy * 0.25 + clusterBonus (최대 0.30)
    const rawScore = clusterScores 
      ? baseCos * 0.45 + synergy * 0.25 + clusterBonus * 2 + diversityBonus - (shortagePenalty + overloadPenalty + balancePenalty)
      : baseCos * 0.55 + synergy * 0.35 + diversityBonus - (shortagePenalty + overloadPenalty + balancePenalty);
    
    const normalizedScore = Math.max(0, Math.min(1, rawScore));

    return {
      ...major,
      matchScore: Math.round(normalizedScore * 100),
      rawScore: normalizedScore,
      signature: getSignature(majorVector.vector),
      reasons: buildReasons(topDims, majorVector.vector),
      clusterBonus: clusterBonus
    };
  })
    .filter((major): major is RecommendedMajor & { rawScore: number } => Boolean(major))
    .sort((a, b) => {
      if (b.rawScore === a.rawScore) {
        return a.name.localeCompare(b.name, "ko");
      }
      return b.rawScore - a.rawScore;
    })
    .map(({ rawScore, ...rest }) => rest);

  if (scoredMajors.length === 0) {
    return [];
  }

  const signatureBuckets = new Map<string, RecommendedMajor[]>();
  scoredMajors.forEach((major) => {
    if (!signatureBuckets.has(major.signature)) {
      signatureBuckets.set(major.signature, []);
    }
    signatureBuckets.get(major.signature)!.push(major);
  });

  const bucketLeaders = Array.from(signatureBuckets.entries())
    .map(([signature, majors]) => ({
      signature,
      leader: majors[0]
    }))
    .sort((a, b) => b.leader.matchScore - a.leader.matchScore);

  const recommendations: RecommendedMajor[] = [];
  const usedKeys = new Set<string>();

  bucketLeaders.forEach(({ leader }) => {
    if (recommendations.length >= limit) return;
    if (!usedKeys.has(leader.key)) {
      recommendations.push(leader);
      usedKeys.add(leader.key);
    }
  });

  if (recommendations.length < limit) {
    scoredMajors.forEach((major) => {
      if (recommendations.length >= limit) return;
      if (!usedKeys.has(major.key)) {
        recommendations.push(major);
        usedKeys.add(major.key);
      }
    });
  }

  if (recommendations.length < limit) {
    MAJORS.forEach((major) => {
      if (recommendations.length >= limit) return;
      if (!usedKeys.has(major.key)) {
        recommendations.push({
          ...major,
          matchScore: 0,
          signature: getSignature(prepareVector(major.vec).vector),
          reasons: []
        });
        usedKeys.add(major.key);
      }
    });
  }

  return recommendations.slice(0, limit);
}

