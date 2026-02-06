// 명지대학교 핵심역량 6가지
export type CompetencyType =
  | 'convergence'    // 융합역량
  | 'practical'      // 실용역량
  | 'creative'       // 창의역량
  | 'selfDirected'   // 자기주도역량
  | 'harmony'        // 어우름역량
  | 'care';          // 배려역량

export interface CompetencyInfo {
  type: CompetencyType;
  name: string;
  description: string;
  color: string;
}

export const COMPETENCY_INFO: Record<CompetencyType, CompetencyInfo> = {
  convergence: {
    type: 'convergence',
    name: '융합역량',
    description: '다양한 분야의 지식과 기술을 통합하여 새로운 가치를 창출하는 능력',
    color: '#3B82F6', // blue
  },
  practical: {
    type: 'practical',
    name: '실용역량',
    description: '이론적 지식을 실제 상황에 적용하고 문제를 해결하는 능력',
    color: '#10B981', // green
  },
  creative: {
    type: 'creative',
    name: '창의역량',
    description: '새로운 아이디어를 발상하고 혁신적인 방법으로 문제를 해결하는 능력',
    color: '#8B5CF6', // purple
  },
  selfDirected: {
    type: 'selfDirected',
    name: '자기주도역량',
    description: '스스로 목표를 설정하고 계획을 수립하여 실행하는 능력',
    color: '#F59E0B', // amber
  },
  harmony: {
    type: 'harmony',
    name: '어우름역량',
    description: '다양한 구성원들과 협력하고 조화롭게 소통하는 능력',
    color: '#EC4899', // pink
  },
  care: {
    type: 'care',
    name: '배려역량',
    description: '타인을 이해하고 공감하며 사회적 책임을 다하는 능력',
    color: '#06B6D4', // cyan
  },
};

export interface CompetencyQuestion {
  id: string;
  text: string;
  competency: CompetencyType;
  reverse?: boolean; // 역채점 문항
}

// 핵심역량진단 문항 (각 역량당 5문항 = 총 30문항)
export const COMPETENCY_QUESTIONS: CompetencyQuestion[] = [
  // 융합역량 (5문항)
  {
    id: 'conv_1',
    text: '나는 여러 분야의 지식을 연결하여 새로운 아이디어를 떠올리는 것을 좋아한다.',
    competency: 'convergence',
  },
  {
    id: 'conv_2',
    text: '나는 다른 전공이나 분야의 수업에도 관심이 있다.',
    competency: 'convergence',
  },
  {
    id: 'conv_3',
    text: '나는 복잡한 문제를 해결할 때 다양한 관점에서 접근한다.',
    competency: 'convergence',
  },
  {
    id: 'conv_4',
    text: '나는 기존의 방식에 새로운 아이디어를 접목시키는 것에 흥미를 느낀다.',
    competency: 'convergence',
  },
  {
    id: 'conv_5',
    text: '나는 서로 다른 분야의 사람들과 협업할 때 시너지를 낼 수 있다고 생각한다.',
    competency: 'convergence',
  },

  // 실용역량 (5문항)
  {
    id: 'prac_1',
    text: '나는 배운 내용을 실제 상황에 적용하는 것을 좋아한다.',
    competency: 'practical',
  },
  {
    id: 'prac_2',
    text: '나는 이론보다는 실습이나 프로젝트 활동을 선호한다.',
    competency: 'practical',
  },
  {
    id: 'prac_3',
    text: '나는 문제가 생기면 직접 해결책을 찾아 실행하는 편이다.',
    competency: 'practical',
  },
  {
    id: 'prac_4',
    text: '나는 실제로 사용할 수 있는 결과물을 만드는 것에 보람을 느낀다.',
    competency: 'practical',
  },
  {
    id: 'prac_5',
    text: '나는 현장 경험이나 인턴십이 학습에 중요하다고 생각한다.',
    competency: 'practical',
  },

  // 창의역량 (5문항)
  {
    id: 'crea_1',
    text: '나는 새롭고 독창적인 아이디어를 내는 것을 즐긴다.',
    competency: 'creative',
  },
  {
    id: 'crea_2',
    text: '나는 기존의 방식에 의문을 제기하고 더 나은 방법을 찾으려 한다.',
    competency: 'creative',
  },
  {
    id: 'crea_3',
    text: '나는 예상치 못한 상황에서도 유연하게 대처할 수 있다.',
    competency: 'creative',
  },
  {
    id: 'crea_4',
    text: '나는 다양한 가능성을 열어두고 실험해보는 것을 좋아한다.',
    competency: 'creative',
  },
  {
    id: 'crea_5',
    text: '나는 남들과 다른 시각으로 사물이나 현상을 바라보는 편이다.',
    competency: 'creative',
  },

  // 자기주도역량 (5문항)
  {
    id: 'self_1',
    text: '나는 스스로 목표를 세우고 계획을 수립하여 실행한다.',
    competency: 'selfDirected',
  },
  {
    id: 'self_2',
    text: '나는 다른 사람의 지시 없이도 할 일을 찾아서 한다.',
    competency: 'selfDirected',
  },
  {
    id: 'self_3',
    text: '나는 실패해도 포기하지 않고 다시 도전하는 편이다.',
    competency: 'selfDirected',
  },
  {
    id: 'self_4',
    text: '나는 나의 강점과 약점을 파악하고 개선하려고 노력한다.',
    competency: 'selfDirected',
  },
  {
    id: 'self_5',
    text: '나는 필요한 정보나 자료를 스스로 찾아서 학습한다.',
    competency: 'selfDirected',
  },

  // 어우름역량 (5문항)
  {
    id: 'harm_1',
    text: '나는 팀 프로젝트에서 다른 구성원들과 잘 협력한다.',
    competency: 'harmony',
  },
  {
    id: 'harm_2',
    text: '나는 다양한 배경을 가진 사람들과 소통하는 것이 즐겁다.',
    competency: 'harmony',
  },
  {
    id: 'harm_3',
    text: '나는 갈등 상황에서 중재 역할을 하는 편이다.',
    competency: 'harmony',
  },
  {
    id: 'harm_4',
    text: '나는 다른 사람의 의견을 경청하고 존중한다.',
    competency: 'harmony',
  },
  {
    id: 'harm_5',
    text: '나는 공동의 목표를 위해 내 의견을 조율할 수 있다.',
    competency: 'harmony',
  },

  // 배려역량 (5문항)
  {
    id: 'care_1',
    text: '나는 다른 사람의 입장에서 생각하려고 노력한다.',
    competency: 'care',
  },
  {
    id: 'care_2',
    text: '나는 도움이 필요한 사람을 보면 먼저 나서서 돕는다.',
    competency: 'care',
  },
  {
    id: 'care_3',
    text: '나는 사회적 약자나 소외된 사람들에게 관심이 있다.',
    competency: 'care',
  },
  {
    id: 'care_4',
    text: '나는 환경이나 지역사회 문제에 관심을 가지고 있다.',
    competency: 'care',
  },
  {
    id: 'care_5',
    text: '나는 봉사활동이나 사회공헌 활동에 참여하는 것이 중요하다고 생각한다.',
    competency: 'care',
  },
];

// 문항 섞기 (역량별로 고르게 분포)
export function getShuffledQuestions(): CompetencyQuestion[] {
  const competencies: CompetencyType[] = ['convergence', 'practical', 'creative', 'selfDirected', 'harmony', 'care'];
  const questionsByCompetency: Record<CompetencyType, CompetencyQuestion[]> = {
    convergence: [],
    practical: [],
    creative: [],
    selfDirected: [],
    harmony: [],
    care: [],
  };

  // 역량별로 문항 분류
  COMPETENCY_QUESTIONS.forEach(q => {
    questionsByCompetency[q.competency].push(q);
  });

  // 각 역량에서 하나씩 번갈아가며 가져오기
  const shuffled: CompetencyQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    for (const comp of competencies) {
      if (questionsByCompetency[comp][i]) {
        shuffled.push(questionsByCompetency[comp][i]);
      }
    }
  }

  return shuffled;
}

// 점수 계산 (5점 리커트 척도 기준)
export interface CompetencyScores {
  convergence: number;
  practical: number;
  creative: number;
  selfDirected: number;
  harmony: number;
  care: number;
  total: number;
}

export function calculateCompetencyScores(answers: Record<string, number>): CompetencyScores {
  const scores: CompetencyScores = {
    convergence: 0,
    practical: 0,
    creative: 0,
    selfDirected: 0,
    harmony: 0,
    care: 0,
    total: 0,
  };

  const counts: Record<CompetencyType, number> = {
    convergence: 0,
    practical: 0,
    creative: 0,
    selfDirected: 0,
    harmony: 0,
    care: 0,
  };

  COMPETENCY_QUESTIONS.forEach(q => {
    if (answers[q.id] !== undefined) {
      let score = answers[q.id];
      if (q.reverse) {
        score = 6 - score; // 5점 척도 역채점
      }
      scores[q.competency] += score;
      counts[q.competency]++;
    }
  });

  // 평균 계산 (100점 만점으로 환산)
  const competencies: CompetencyType[] = ['convergence', 'practical', 'creative', 'selfDirected', 'harmony', 'care'];
  let totalScore = 0;
  let totalCount = 0;

  competencies.forEach(comp => {
    if (counts[comp] > 0) {
      // 5점 척도를 100점 만점으로 환산
      scores[comp] = Math.round((scores[comp] / counts[comp]) * 20);
      totalScore += scores[comp];
      totalCount++;
    }
  });

  scores.total = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;

  return scores;
}
