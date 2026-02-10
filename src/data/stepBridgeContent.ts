// Step-specific content configuration for StepBridgePage

export type StepTransition = '1to2' | '2to3' | '3to4' | '4to5';

export interface StepBridgeContentConfig {
  header: {
    completedStep: number;
    title: string;
    subtitle: string;
    bgGradient: string;
  };
  resultSection: {
    title: string;
    subtitle: string;
  };
  nextStep: {
    number: number;
    title: string;
    description: string;
    benefits: string[];
    estimatedTime: string;
    ctaText: string;
  };
  backAction: {
    text: string;
    navigateTo: string;
  };
}

export const STEP_BRIDGE_CONTENT: Record<StepTransition, StepBridgeContentConfig> = {
  '1to2': {
    header: {
      completedStep: 1,
      title: 'MJU 전공 진로 적합도 검사 완료!',
      subtitle: '나의 진로 적성 유형을 확인했어요',
      bgGradient: 'from-blue-500 to-indigo-600'
    },
    resultSection: {
      title: '나의 RIASEC 유형',
      subtitle: '추천 전공'
    },
    nextStep: {
      number: 2,
      title: '핵심역량진단',
      description: '명지대학교 6대 핵심역량을 자가진단하고, 나의 강점과 개발이 필요한 역량을 확인해보세요.',
      benefits: [
        '나의 강점 역량 파악하기',
        '개발이 필요한 역량 발견하기',
        '맞춤형 성장 방향 확인하기'
      ],
      estimatedTime: '약 5-10분',
      ctaText: '2단계: 핵심역량진단 시작하기'
    },
    backAction: {
      text: '결과 상세 보기',
      navigateTo: 'insight'
    }
  },

  '2to3': {
    header: {
      completedStep: 2,
      title: '핵심역량진단 완료!',
      subtitle: '나의 핵심역량 프로필을 확인했어요',
      bgGradient: 'from-purple-500 to-pink-600'
    },
    resultSection: {
      title: '나의 핵심역량',
      subtitle: '상위 역량'
    },
    nextStep: {
      number: 3,
      title: '전공탐색기',
      description: 'RIASEC 결과 기반 추천 전공에 대해 자가진단을 진행하고, 나에게 가장 잘 맞는 전공을 찾아보세요.',
      benefits: [
        '추천 전공 적합도 확인하기',
        '전공별 필요 역량 파악하기',
        '나에게 맞는 최적 전공 발견하기'
      ],
      estimatedTime: '전공당 약 3-5분',
      ctaText: '3단계: 전공탐색기 시작하기'
    },
    backAction: {
      text: '역량 결과 보기',
      navigateTo: 'competency-result'
    }
  },

  '3to4': {
    header: {
      completedStep: 3,
      title: '전공능력진단 완료!',
      subtitle: '전공 적합도 자가진단을 완료했어요',
      bgGradient: 'from-emerald-500 to-teal-600'
    },
    resultSection: {
      title: '전공 진단 결과',
      subtitle: '가장 적합한 전공'
    },
    nextStep: {
      number: 4,
      title: '롤모델 탐색',
      description: '진단 결과를 기반으로 비슷한 경로를 걸은 선배들의 커리어를 탐색하고, 나만의 롤모델을 찾아보세요.',
      benefits: [
        '실제 졸업생 취업 사례 확인하기',
        '나와 비슷한 유형의 선배 발견하기',
        '구체적인 커리어 경로 참고하기'
      ],
      estimatedTime: '약 5-10분',
      ctaText: '4단계: 롤모델 탐색 시작하기'
    },
    backAction: {
      text: '진단 결과 보기',
      navigateTo: 'roadmap-explorer'
    }
  },

  '4to5': {
    header: {
      completedStep: 4,
      title: '롤모델 탐색 완료!',
      subtitle: '나만의 롤모델을 선택했어요',
      bgGradient: 'from-amber-500 to-orange-600'
    },
    resultSection: {
      title: '선택한 롤모델',
      subtitle: '롤모델 요약'
    },
    nextStep: {
      number: 5,
      title: '커리큘럼 플래너',
      description: '롤모델의 학습 경로를 참고하여 나만의 4년 커리큘럼을 설계하고, 목표를 향해 나아가세요.',
      benefits: [
        '롤모델 기반 과목 추천받기',
        '학기별 학습 계획 수립하기',
        '비교과 활동 로드맵 확인하기'
      ],
      estimatedTime: '자유롭게 활용',
      ctaText: '5단계: 커리큘럼 플래너 시작하기'
    },
    backAction: {
      text: '롤모델 다시 보기',
      navigateTo: 'roadmap-rolemodels'
    }
  }
};
