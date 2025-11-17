import { MAJORS } from "../data/majorList";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';
type RiasecResult = Partial<Record<Dim, number>>;

interface MajorProfile {
  key: string;
  name: string;
  vec: Partial<Record<Dim, number>>;
}

export interface RecommendedMajor extends MajorProfile {
  matchScore: number;
  signature: string;
  reasons: string[];
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
}

export function recommendMajors(
  careerTestResult: RiasecResult | null | undefined,
  options: RecommendOptions = {}
): RecommendedMajor[] {
  const limit = Math.max(1, options.limit ?? 5);

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

    const rawScore = baseCos * 0.55 + synergy * 0.35 + diversityBonus - (shortagePenalty + overloadPenalty + balancePenalty);
    const normalizedScore = Math.max(0, Math.min(1, rawScore));

    return {
      ...major,
      matchScore: Math.round(normalizedScore * 100),
      rawScore: normalizedScore,
      signature: getSignature(majorVector.vector),
      reasons: buildReasons(topDims, majorVector.vector)
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

