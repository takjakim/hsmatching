import React, { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { RiasecScores, ValueScores, SelfEfficacy } from '../../types/pilot';
import { MAJORS } from '../../data/majorList';
import { RIASEC_DATA, RiasecCode } from '../../data/riasecData';
import { recommendRoles } from '../../utils/roleRecommendation';
import { getWorkpediaJobUrl } from '../../data/workpediaJobMap';

// Supplementary survey result data - display-ready types
interface SupplementaryData {
  valueScores?: ValueScores;
  careerDecision?: {
    level: string;        // '확정' | '탐색' | '미결정'
    confidence: number;   // 0-1 scale for display
  };
  selfEfficacy?: SelfEfficacy;
  preferences?: {
    fieldPreference?: string;
    workStyle?: string;
    environmentPreference?: string;
  };
  roleModel?: {
    name?: string;
    traits?: string[];
  };
  valueRanking?: Record<string, number>;
}

interface RiasecResultProps {
  scores: RiasecScores;
  onContinue?: () => void;
  onSkip?: () => void;
  onNavigate?: (page: string) => void;
  onRestart?: () => void;
  onStartSupplementary?: () => void;  // 보완검사 시작 (건너뛴 경우)
  participantName?: string;
  supplementaryData?: SupplementaryData;
  isComplete?: boolean;  // true if survey is complete (shows different UI)
  interestedMajorKeys?: string[];
}

// Unified color palette - Light theme matching other question components
const COLORS = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#E8B86D',
  muted: '#94A3B8',
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  chart: {
    fill: 'rgba(30, 58, 95, 0.2)',
    stroke: '#1E3A5F',
  },
  card: {
    bg: '#FFFFFF',
    border: '#E2E8F0',
  },
  // Print-friendly colors for PDF export
  pdf: {
    primary: '#1E3A5F',
    secondary: '#4A6FA5',
    accent: '#E8B86D',
    text: {
      primary: '#1E293B',
      secondary: '#475569',
    }
  }
};

// Use shared RIASEC data - build RIASEC_LABELS from it
const RIASEC_LABELS: Record<string, { name: string; fullName: string; color: string; description: string; careers: string[] }> = Object.fromEntries(
  Object.entries(RIASEC_DATA).map(([code, data]) => [
    code,
    {
      name: data.name,
      fullName: data.fullName,
      color: data.color,
      description: data.description,
      careers: data.representativeCareers.slice(0, 5),
    },
  ])
);

// Major descriptions for top recommendations - 풍부한 전공 소개
export const MAJOR_DESCRIPTIONS: Record<string, string> = {
  // Engineering & Tech
  '컴퓨터공학전공': '컴퓨터 과학의 핵심 이론부터 최신 기술까지 체계적으로 학습합니다. 자료구조, 알고리즘, 운영체제, 데이터베이스 등 기초 이론과 함께 AI, 클라우드, 보안 등 첨단 분야를 다룹니다. 정보처리기사, AWS/Azure 자격증 등을 취득할 수 있으며, IT 기업, 스타트업, 금융권 등 폭넓은 분야로 진출합니다.',
  '정보통신공학전공': '5G, 6G 이동통신부터 IoT, 네트워크 보안까지 통신 기술 전반을 학습합니다. 무선통신, 신호처리, 네트워크 프로토콜 등의 이론과 함께 실습 중심의 교육을 제공합니다. 정보통신기사, 네트워크관리사 등의 자격증 취득이 가능하며, 통신사, 네트워크 장비업체, IT 기업에서 활동합니다.',
  '전자공학전공': '반도체, 전자회로, 임베디드 시스템 등 전자공학의 핵심 분야를 학습합니다. 아날로그/디지털 회로 설계, 마이크로프로세서, 신호처리 등 이론과 실습을 병행하며, 전자기사 자격증 취득이 가능합니다. 삼성, SK하이닉스 등 대기업과 스마트폰, 가전, 자동차 전장 분야로 진출합니다.',
  '전기공학전공': '전력 시스템 설계부터 신재생에너지까지 전기공학 전 분야를 다룹니다. 전력전자, 제어공학, 전기기기 등을 학습하며, 전기기사·전기공사기사 자격증을 취득할 수 있습니다. 한국전력, 발전회사, 전기설비업체, 신재생에너지 기업 등에서 핵심 인재로 활동합니다.',
  '기계공학전공': '기계 설계, 열역학, 유체역학, 재료역학 등 기계공학의 4대 역학을 기반으로 CAD/CAM, 로봇공학, 자동화 시스템을 학습합니다. 기계설계기사, 일반기계기사 등 국가자격증 취득이 가능하며, 자동차, 항공, 중공업, 로봇 산업 등 제조업 전반에서 활동합니다.',
  '로봇공학전공': '로봇 설계, 제어 시스템, 인공지능을 융합한 미래지향적 학문입니다. 기구학, 센서공학, 머신러닝 기반 로봇 제어 등을 학습하며, 산업용 로봇, 서비스 로봇, 의료 로봇 등 다양한 분야의 전문가를 양성합니다. 4차 산업혁명 시대 핵심 인재로 성장할 수 있습니다.',
  '반도체공학부': '대한민국 핵심 산업인 반도체의 설계부터 제조 공정까지 전 과정을 학습합니다. 반도체 소자 물리, 집적회로 설계, 공정 기술, 패키징 등을 다루며, 삼성전자, SK하이닉스 등 국내 대기업과 글로벌 반도체 기업 취업에 유리합니다. 반도체설계기사 등 전문 자격증 취득이 가능합니다.',
  '화학공학전공': '화학 반응 공정 설계부터 신소재 개발, 환경 기술까지 폭넓게 학습합니다. 열역학, 반응공학, 분리공정, 공정제어 등의 핵심 과목과 바이오, 에너지, 환경 분야 응용을 다룹니다. 화공기사 자격증 취득 후 석유화학, 제약, 화장품, 배터리 산업 등으로 진출합니다.',
  '신소재공학전공': '금속, 세라믹, 고분자, 복합재료 등 첨단 소재의 개발과 응용을 학습합니다. 소재의 구조-물성 관계를 이해하고 반도체 소재, 이차전지, 디스플레이 소재 등 미래 산업 핵심 소재를 연구합니다. 재료기사 자격증 취득이 가능하며, 소재·부품·장비 산업의 핵심 인력으로 활동합니다.',
  '건설환경공학전공': '도로, 교량, 터널 등 사회기반시설과 환경 시스템을 설계·시공하는 전문가를 양성합니다. 구조역학, 지반공학, 수리학, 환경공학 등을 학습하며, 토목기사·환경기사 자격증을 취득할 수 있습니다. 건설사, 엔지니어링 회사, 공공기관에서 국가 인프라 구축에 기여합니다.',
  '환경시스템공학전공': '환경오염 방지, 폐기물 처리, 수질·대기 관리, 지속가능발전을 학습합니다. 환경영향평가, 환경정책, 기후변화 대응 등 환경 문제 해결 역량을 기릅니다. 환경기사, 폐기물처리기사 등의 자격증 취득이 가능하며, 환경부, 환경공단, 환경컨설팅 기업에서 활동합니다.',
  '스마트모빌리티공학전공': '자율주행, 전기차, 커넥티드카 등 미래 모빌리티 기술을 종합적으로 학습합니다. 차량 동역학, 센서 융합, V2X 통신, 배터리 시스템 등을 다루며, 현대·기아차, 자율주행 스타트업, 모빌리티 플랫폼 기업 등에서 미래 자동차 산업을 이끄는 인재로 성장합니다.',
  '산업경영공학과': '생산시스템 최적화, 품질경영, 데이터 분석, 경영과학을 융합한 학문입니다. 통계적 품질관리, 생산계획, 물류관리, 인간공학 등을 학습하며, 품질경영기사, 경영지도사 자격증을 취득할 수 있습니다. 제조업, 물류, 컨설팅 기업에서 효율화와 혁신을 이끄는 전문가로 활동합니다.',

  // Software & AI
  '응용소프트웨어전공': '웹, 모바일, 클라우드 등 다양한 플랫폼의 소프트웨어 개발 역량을 기릅니다. 프로그래밍 언어, 소프트웨어 공학, 데이터베이스, 웹/앱 개발 등을 체계적으로 학습합니다. 정보처리기사 자격증 취득 후 IT기업, 금융권, 게임사 등에서 개발자·아키텍트로 활동합니다.',
  '데이터사이언스전공': '빅데이터 시대의 핵심 인재를 양성하는 전공입니다. 통계학, 머신러닝, 데이터마이닝, 시각화 등을 학습하며, Python, R, SQL 등 분석 도구를 활용합니다. 데이터분석전문가(ADP), 빅데이터분석기사 등의 자격증 취득이 가능하며, 데이터 기반 의사결정을 지원하는 전문가로 성장합니다.',
  '인공지능전공': '딥러닝, 자연어처리, 컴퓨터비전, 강화학습 등 AI 핵심 기술을 심도있게 학습합니다. 수학적 기초부터 최신 AI 모델 구현까지 체계적 커리큘럼을 제공하며, AI 연구소, 빅테크 기업, AI 스타트업 등에서 AI 시대를 선도하는 인재로 활동합니다.',
  '디지털콘텐츠디자인학과': '기술과 디자인의 융합으로 혁신적인 디지털 경험을 창출합니다. UX/UI 디자인, 인터랙션 디자인, 3D 모델링, 모션그래픽 등을 학습하며, 게임, 메타버스, AR/VR 콘텐츠 기업에서 창의적인 디자이너로 활동합니다.',

  // Natural Sciences
  '물리학과': '자연현상의 근본 원리를 탐구하고 첨단 과학기술의 기초를 다집니다. 역학, 전자기학, 양자역학, 통계역학 등을 학습하며, 논리적 사고력과 문제해결 능력을 기릅니다. 연구소, 반도체·디스플레이 기업, 금융공학 분야 등 다양한 분야로 진출합니다.',
  '수학과': '순수수학과 응용수학을 균형있게 학습하여 논리적 사고력의 기반을 다집니다. 해석학, 대수학, 기하학, 확률론 등을 배우며, 수학교사 자격증, 보험계리사, 금융공학 분야 자격증 취득이 가능합니다. 교육계, 금융권, IT기업, 연구소 등에서 활동합니다.',
  '화학나노학전공': '분자 수준의 화학반응과 나노기술을 융합한 첨단 학문입니다. 유기화학, 무기화학, 물리화학, 나노소재합성 등을 학습하며, 화학분석기사 자격증을 취득할 수 있습니다. 제약, 화장품, 반도체 소재, 바이오 분야 연구개발직으로 진출합니다.',
  '융합에너지학전공': '태양광, 풍력, 수소에너지, 에너지저장시스템 등 신재생에너지 전 분야를 학습합니다. 에너지 변환, 저장, 효율화 기술을 다루며, 에너지관리기사 자격증 취득이 가능합니다. 탄소중립 시대의 핵심 인재로서 에너지 기업, 연구소, 공기업에서 활동합니다.',
  '식품영양학전공': '1966년 국내 최초 교육부 인가를 받은 전통있는 전공으로, 영양교육, 임상영양, 식품과학, 발효학, 단체급식 등을 학습합니다. 영양사 면허, 위생사, 영양교사 자격증 등을 취득할 수 있으며, 병원, 학교, 식품기업, 연구소에서 건강 전문가로 활동합니다.',
  '시스템생명과학전공': '생명현상을 시스템적 관점에서 이해하고 바이오기술을 학습합니다. 분자생물학, 유전공학, 바이오인포매틱스, 합성생물학 등을 다루며, 생물공학기사 자격증 취득이 가능합니다. 제약·바이오기업, 연구소, 의료기관에서 생명과학 전문가로 활동합니다.',

  // Business & Economics
  '경영학전공': '마케팅, 재무, 인사조직, 생산운영 등 경영학 전 분야를 체계적으로 학습합니다. 사례연구, 팀프로젝트 중심의 실무교육과 함께 경영지도사, 유통관리사, AICPA 등 다양한 자격증 취득을 지원합니다. 대기업, 금융권, 컨설팅펌, 스타트업 등 다양한 분야로 진출합니다.',
  '글로벌비즈니스학전공': '국제경영, 글로벌 마케팅, 해외직접투자, 다문화경영 등을 학습합니다. 영어 강의 비중이 높고 해외 교환학생 기회가 풍부하며, 무역영어, 국제무역사 자격증 취득이 가능합니다. 다국적기업, 무역회사, 국제기구에서 글로벌 비즈니스 전문가로 활동합니다.',
  '경영정보학과': 'IT와 경영을 융합하여 디지털 전환을 이끄는 인재를 양성합니다. ERP, 비즈니스 애널리틱스, 정보시스템 설계, 디지털 마케팅 등을 학습하며, 정보처리기사, SQLD 등 자격증 취득이 가능합니다. IT기업, 컨설팅펌, 금융권 등에서 활동합니다.',
  '국제통상학전공': '국제무역이론, 통상정책, FTA, 글로벌 공급망 관리 등을 학습합니다. 무역실무, 관세, 외환 등 실무 역량을 기르며, 관세사, 무역영어, 국제무역사 자격증 취득이 가능합니다. 무역회사, 물류기업, 정부기관, 국제기구에서 통상전문가로 활동합니다.',
  '경제학전공': '미시·거시경제학, 계량경제학, 금융경제학 등을 학습하여 경제현상 분석 역량을 기릅니다. 데이터 분석, 정책 평가 능력을 갖추며, 경제분석사, 투자자산운용사 등 자격증 취득이 가능합니다. 금융권, 경제연구소, 공공기관, 언론사 등에서 활동합니다.',
  '응용통계학전공': '통계이론, 데이터분석, 예측모델링, 실험설계 등을 학습합니다. R, SAS, Python 등 분석도구 활용 능력을 기르며, 사회조사분석사, 빅데이터분석기사 자격증 취득이 가능합니다. 마케팅리서치, 금융, 제약, IT 기업에서 데이터 전문가로 활동합니다.',
  '회계세무학과': '재무회계, 관리회계, 세무회계, 회계감사 등을 체계적으로 학습합니다. 공인회계사(CPA), 세무사, 감정평가사 등 전문자격시험 준비를 지원하며, 회계법인, 세무법인, 기업 재경팀, 금융기관에서 회계·세무 전문가로 활동합니다.',
  '부동산학과': '부동산 경제, 개발, 투자, 법규, 감정평가 등을 종합적으로 학습합니다. 공인중개사, 감정평가사, 주택관리사 등 자격증 취득을 지원하며, 부동산 개발사, 자산운용사, 건설사, 정부기관에서 부동산 전문가로 활동합니다.',
  '미래융합경영학과': '4차 산업혁명 시대의 새로운 비즈니스 모델을 탐구하고 창출합니다. 플랫폼 비즈니스, 디지털 혁신, 사회적 기업, 스타트업 경영 등을 학습하며, 창업과 혁신을 주도하는 융합형 경영인재로 성장합니다.',

  // Social Sciences & Law
  '행정학전공': '공공정책, 행정관리, 조직이론, 재정학 등을 학습하여 공익을 실현하는 인재를 양성합니다. 행정사, 사회조사분석사 자격증 취득이 가능하며, 7·9급 공무원, 공공기관, 정책연구소 진출에 유리합니다. 국가와 지역사회 발전에 기여하는 행정전문가로 활동합니다.',
  '정치외교학전공': '정치이론, 국제관계, 비교정치, 한국정치 등을 학습합니다. 국제정세 분석 능력과 외교적 역량을 기르며, 외교관후보자시험, 국제기구 채용시험 준비를 지원합니다. 외교부, 국제기구, NGO, 언론사, 정책연구소 등에서 활동합니다.',
  '법학과': '헌법, 민법, 형법, 상법 등 기본 법률과 특별법을 체계적으로 학습합니다. 변호사, 판사, 검사 등 법조인 진출을 위한 로스쿨 준비와 법무사, 공인노무사 등 자격증 취득을 지원합니다. 법률사무소, 기업 법무팀, 공공기관에서 법률전문가로 활동합니다.',
  '법무행정학과': '법학과 행정학을 융합하여 공공부문의 법률행정 전문가를 양성합니다. 행정법, 사회보장법, 노동법 등을 학습하며, 법무사, 행정사, 공인노무사 자격증 취득이 가능합니다. 법원, 검찰, 지자체, 공공기관에서 활동합니다.',
  '사회복지학과': '사회복지정책, 실천론, 조사론, 행정론 등을 학습하여 취약계층을 돕는 전문가를 양성합니다. 사회복지사 1급, 정신건강사회복지사 자격증을 취득할 수 있으며, 복지관, 병원, 기업CSR팀, 정부기관에서 사회복지 전문가로 활동합니다.',
  '심리치료학과': '상담심리, 임상심리, 발달심리, 심리평가 등을 학습하여 정신건강 전문가를 양성합니다. 임상심리사, 상담심리사, 청소년상담사 자격증 취득이 가능하며, 병원, 상담센터, 학교, 기업EAP에서 심리치료 전문가로 활동합니다.',
  '청소년지도학전공': '청소년 발달, 상담, 활동 프로그램 기획 등을 학습합니다. 청소년지도사, 청소년상담사 국가자격증을 취득할 수 있으며, 청소년수련관, 학교, 지자체, 청소년 관련 기관에서 청소년의 건전한 성장을 돕는 전문가로 활동합니다.',
  '아동학전공': '아동발달, 보육, 부모교육, 아동복지 등을 학습합니다. 보육교사, 아동상담사, 놀이치료사 자격증 취득이 가능하며, 어린이집, 유치원, 아동복지시설, 기업체 직장어린이집에서 아동 전문가로 활동합니다.',

  // Humanities & Languages
  '국어국문학전공': '한국어학과 한국문학을 깊이있게 연구하며 언어와 문화의 본질을 탐구합니다. 문학창작, 언어분석, 고전연구 등을 학습하며, 국어교사, 문학평론가, 작가, 편집자, 카피라이터 등으로 활동합니다. 언론사, 출판사, 교육기관 등 다양한 분야로 진출합니다.',
  '영어영문학전공': '영미문학, 영어학, 영어교육을 종합적으로 학습합니다. 원어민 수준의 영어능력과 문화이해력을 기르며, 영어교사, TESOL, 통번역사 자격증 취득이 가능합니다. 교육기관, 외국계기업, 무역회사, 국제기구에서 영어전문가로 활동합니다.',
  '중어중문학전공': '중국어와 중국문학, 문화를 심도있게 학습합니다. HSK 고급 취득을 지원하며, 통번역사, 관광통역안내사 자격증 취득이 가능합니다. 무역회사, 중국관련 기업, 외교부, 한중 문화교류 기관 등에서 중국전문가로 활동합니다.',
  '일어일문학전공': '일본어와 일본문학, 문화를 체계적으로 학습합니다. JLPT N1 취득을 지원하며, 통번역사, 관광통역안내사 자격증 취득이 가능합니다. 일본계기업, 무역회사, 여행사, 문화교류기관에서 일본전문가로 활동합니다.',
  '아랍지역학전공': '아랍어와 중동지역의 정치, 경제, 문화를 종합적으로 학습합니다. 아랍어 통번역 능력을 기르며, 외교부, 무역회사, 에너지기업, 국제기구, 언론사 등에서 중동전문가로 활동합니다. 희소성 높은 지역전문가로 취업 경쟁력이 높습니다.',
  '글로벌한국어학전공': '외국인을 위한 한국어교육과 한국문화 보급 전문가를 양성합니다. 한국어교원 2급 자격증을 취득할 수 있으며, 국내외 대학 한국어학당, 세종학당, 다문화가정센터, 해외 교육기관에서 한국어교사로 활동합니다.',
  '문예창작학과': '시, 소설, 희곡, 시나리오 등 문학창작의 이론과 실제를 학습합니다. 작가 데뷔 지원, 문학상 응모 등 실질적인 작가 양성 프로그램을 운영하며, 작가, 시나리오작가, 방송작가, 출판편집자 등으로 활동합니다.',
  '미술사·역사학전공': '미술사와 역사학을 융합하여 문화유산의 가치를 탐구합니다. 학예사, 문화재관리사 자격증 취득이 가능하며, 박물관, 미술관, 문화재청, 연구소, 경매회사에서 큐레이터, 역사연구원, 문화재전문가로 활동합니다.',
  '문헌정보학전공': '정보의 수집, 조직, 보존, 서비스를 학습하는 정보전문가 양성 학문입니다. 사서자격증, 기록물관리사 자격증 취득이 가능하며, 도서관, 기록관, 정보센터, IT기업 정보관리부서에서 정보전문가로 활동합니다.',
  '글로벌문화콘텐츠학전공': '한류, 문화산업, 콘텐츠 기획·마케팅을 학습합니다. 문화콘텐츠 분석, 기획, 유통 역량을 기르며, 엔터테인먼트사, 게임사, 방송사, 문화재단, 관광공사에서 문화콘텐츠 전문가로 활동합니다.',

  // Arts & Design
  '비주얼커뮤니케이션디자인전공': '그래픽디자인, 타이포그래피, 브랜딩, 광고디자인을 학습합니다. 시각디자인기사, 컴퓨터그래픽스운용기능사 자격증 취득이 가능하며, 디자인에이전시, 광고회사, 기업 디자인팀, 프리랜서 디자이너로 활동합니다.',
  '인더스트리얼디자인전공': '제품디자인, UX디자인, 서비스디자인을 학습합니다. 사용자 중심 디자인 사고와 3D모델링, 프로토타이핑 역량을 기르며, 제품디자인기사 자격증 취득이 가능합니다. 가전, 자동차, IT기업, 디자인컨설팅펌에서 활동합니다.',
  '영상애니메이션디자인전공': '2D/3D 애니메이션, 영상제작, 모션그래픽, VFX를 학습합니다. Maya, After Effects, Cinema 4D 등 전문 툴을 익히며, 애니메이션스튜디오, 게임회사, 영상제작사, 광고회사에서 애니메이터·영상디자이너로 활동합니다.',
  '패션디자인전공': '패션디자인, 의류제작, 패턴설계, 트렌드분석을 학습합니다. 패션디자인산업기사 자격증 취득이 가능하며, 패션브랜드, 의류제조사, 패션잡지사, 스타일리스트로 활동합니다. 자신만의 브랜드 런칭도 지원합니다.',
  '멀티디자인학과': '시각, 제품, 영상, 디지털 등 다양한 디자인 분야를 융합하여 학습합니다. 다학제적 디자인 역량을 기르며, 디자인 에이전시, 기업 디자인팀, 스타트업 등에서 멀티미디어 디자이너로 폭넓게 활동합니다.',
  '공간디자인학과': '인테리어디자인, 전시디자인, 환경디자인을 학습합니다. 실내건축기사, 전시디자인산업기사 자격증 취득이 가능하며, 인테리어회사, 건축사사무소, 전시기획사, 공간디자인스튜디오에서 공간디자이너로 활동합니다.',
  '건축학전공': '5년제 건축학 인증 프로그램으로 건축설계, 구조, 환경, 도시계획을 학습합니다. 건축사 자격시험 응시자격을 취득할 수 있으며, 건축사사무소, 건설사, 설계사무소, 공공기관에서 건축가로 활동합니다.',
  '전통건축전공': '한국 전통건축의 설계, 시공, 보수 기술을 학습하는 국내 유일의 전공입니다. 문화재수리기술자 자격증 취득이 가능하며, 문화재청, 문화재수리업체, 전통건축설계사무소에서 전통건축 전문가로 활동합니다.',

  // Music & Performance
  '건반음악전공': '피아노 연주, 반주, 음악이론, 교수법을 학습합니다. 연주자, 반주자, 음악교사로서의 역량을 기르며, 콩쿠르 참가, 연주회 개최를 지원합니다. 연주자, 음악학원, 학교 음악교사, 교회음악가 등으로 활동합니다.',
  '보컬뮤직전공': '발성, 보컬테크닉, 공연실습, 음악이론을 학습합니다. K-POP부터 재즈, 뮤지컬까지 다양한 장르를 다루며, 가수, 보컬트레이너, 음악치료사, 합창지휘자 등으로 활동합니다.',
  '작곡전공': '음악이론, 화성학, 대위법, 관현악법, 전자음악을 학습합니다. 클래식 작곡부터 영화음악, K-POP 작곡까지 폭넓게 다루며, 작곡가, 편곡가, 음악감독, 사운드디자이너로 활동합니다.',
  '연극·영화전공': '연기, 연출, 영화제작, 시나리오 창작을 학습합니다. 실제 공연과 영화제작 프로젝트를 통해 실무역량을 기르며, 배우, 영화감독, 연출가, 방송PD, 시나리오작가 등으로 활동합니다.',
  '뮤지컬공연전공': '연기, 보컬, 댄스를 종합적으로 훈련하는 뮤지컬 전문인 양성 과정입니다. 실제 공연 참여를 통해 무대경험을 쌓으며, 뮤지컬배우, 연출가, 안무가, 음악감독 등으로 활동합니다.',

  // Sports
  '체육학전공': '운동생리학, 스포츠심리학, 운동역학, 체육교육학을 학습합니다. 체육교사, 생활체육지도사, 건강운동관리사 자격증 취득이 가능하며, 학교, 체육관, 스포츠센터, 프로구단에서 체육전문가로 활동합니다.',
  '스포츠산업학전공': '스포츠마케팅, 이벤트경영, 스포츠미디어, 레저산업을 학습합니다. 스포츠경영관리사 자격증 취득이 가능하며, 프로스포츠구단, 스포츠마케팅회사, 스포츠미디어, 레저기업에서 활동합니다.',
  '스포츠지도학전공': '트레이닝방법론, 스포츠코칭, 운동처방, 재활을 학습합니다. 전문스포츠지도사, 건강운동관리사 자격증 취득이 가능하며, 프로구단, 실업팀, 스포츠센터, 재활센터에서 지도자·트레이너로 활동합니다.',
  '바둑학과': '국내 유일의 바둑 전문 학과로 기전, 포석, 바둑이론, 바둑교육학을 학습합니다. 프로기사 입단을 지원하며, 바둑도장, 학교 바둑강사, 바둑TV해설가, 바둑AI개발 등 다양한 분야에서 활동합니다.',

  // Media
  '디지털미디어학부': '방송, 영상, 뉴미디어 콘텐츠 제작과 미디어 비즈니스를 학습합니다. 영상제작, 편집, 스토리텔링 역량을 기르며, 방송사PD, 영상크리에이터, 미디어기업, 광고회사에서 미디어전문가로 활동합니다.',

  // Others
  '창의융합인재학부': '문·이과 경계를 넘어 다양한 학문을 자유롭게 융합하여 학습합니다. 학생 주도의 융합전공 설계가 가능하며, 창의적 문제해결, 협업, 소통 역량을 기릅니다. 4차 산업혁명 시대가 요구하는 융합형 인재로 다양한 분야에서 활동합니다.',
  '아너칼리지(전공자유대학)': '1학년 동안 다양한 전공을 탐색한 후 2학년에 전공을 선택하는 자기설계형 교육과정입니다. 멘토링, 진로상담, 특화 프로그램을 제공하며, 자신에게 맞는 전공을 찾아 융합적 사고를 가진 인재로 성장합니다.',
  '자율전공학부(인문)': '인문·사회 분야 전공을 1년간 탐색한 후 선택하는 과정입니다. 다양한 학문적 경험을 통해 자신의 적성을 발견하고, 폭넓은 인문학적 소양과 비판적 사고력을 기릅니다.',
  '자율전공학부(자연)': '자연과학·공학 분야 전공을 1년간 탐색한 후 선택하는 과정입니다. 수학, 과학 기초를 튼튼히 다지고 다양한 이공계 전공을 경험하며, 과학적 사고력과 문제해결 능력을 기릅니다.',
  '계약학과': '기업과 대학이 협력하여 산업 맞춤형 인재를 양성하는 과정입니다. 재학 중 기업 실습과 취업이 연계되며, 해당 분야의 실무역량을 갖춘 전문가로 성장합니다.',
};

// Major career paths
export const MAJOR_CAREERS: Record<string, string[]> = {
  // Engineering & Tech
  '컴퓨터공학전공': ['소프트웨어 개발자', '시스템 엔지니어', 'AI 연구원', '보안 전문가'],
  '정보통신공학전공': ['네트워크 엔지니어', '통신 전문가', 'IoT 개발자', '5G 기술자'],
  '전자공학전공': ['반도체 엔지니어', '회로 설계자', '전자제품 개발자', '임베디드 개발자'],
  '전기공학전공': ['전력 엔지니어', '제어 전문가', '신재생에너지 전문가', '전기설비 기술자'],
  '기계공학전공': ['기계 설계자', '생산 기술자', '자동차 엔지니어', '로봇 개발자'],
  '로봇공학전공': ['로봇 개발자', '제어 시스템 엔지니어', 'AI 로봇 전문가', '자동화 엔지니어'],
  '반도체공학부': ['반도체 설계자', '공정 엔지니어', '반도체 연구원', '장비 엔지니어'],
  '화학공학전공': ['화학 엔지니어', '공정 설계자', '환경 기술자', '소재 개발자'],
  '신소재공학전공': ['소재 연구원', '배터리 전문가', '디스플레이 엔지니어', '반도체 소재 개발자'],
  '건설환경공학전공': ['토목 엔지니어', '구조 설계자', '환경 컨설턴트', '건설 관리자'],
  '환경시스템공학전공': ['환경 컨설턴트', '폐기물 처리 전문가', '환경 정책 연구원', '환경 엔지니어'],
  '스마트모빌리티공학전공': ['자율주행 개발자', '전기차 엔지니어', '스마트 교통 전문가', '모빌리티 서비스 기획자'],
  '산업경영공학과': ['생산 관리자', '품질 경영 전문가', '데이터 분석가', 'SCM 전문가'],

  // Software & AI
  '응용소프트웨어전공': ['앱 개발자', '웹 개발자', '풀스택 개발자', '소프트웨어 아키텍트'],
  '데이터사이언스전공': ['데이터 분석가', '데이터 엔지니어', '머신러닝 엔지니어', '비즈니스 분석가'],
  '인공지능전공': ['AI 연구원', '딥러닝 엔지니어', '자연어처리 전문가', '컴퓨터 비전 전문가'],
  '디지털콘텐츠디자인학과': ['UX/UI 디자이너', '인터랙티브 디자이너', '디지털 콘텐츠 기획자', '미디어 아티스트'],

  // Natural Sciences
  '물리학과': ['물리학 연구원', 'R&D 엔지니어', '데이터 사이언티스트', '과학 교육자'],
  '수학과': ['수학 교육자', '금융 애널리스트', '데이터 과학자', '암호학 전문가'],
  '화학나노학전공': ['화학 연구원', '나노 기술자', '신약 개발자', '분석 화학자'],
  '융합에너지학전공': ['에너지 연구원', '신재생에너지 전문가', '에너지 컨설턴트', '배터리 개발자'],
  '식품영양학전공': ['영양사', '식품 연구원', '식품 안전 전문가', '임상 영양사'],
  '시스템생명과학전공': ['생명과학 연구원', '바이오 엔지니어', '의생명 연구원', '바이오테크 전문가'],

  // Business & Economics
  '경영학전공': ['경영 컨설턴트', '마케팅 매니저', '재무 분석가', '스타트업 창업가'],
  '글로벌비즈니스학전공': ['국제 경영 전문가', '글로벌 마케터', '무역 전문가', '해외 영업 매니저'],
  '경영정보학과': ['비즈니스 분석가', 'ERP 컨설턴트', 'IT 기획자', '데이터 분석가'],
  '국제통상학전공': ['무역 전문가', '통상 정책 분석가', '국제 비즈니스 컨설턴트', '관세사'],
  '경제학전공': ['경제 분석가', '금융 애널리스트', '정책 연구원', '투자 분석가'],
  '응용통계학전공': ['통계 분석가', '데이터 사이언티스트', '리서치 전문가', '보험계리사'],
  '회계세무학과': ['회계사', '세무사', '재무 분석가', '회계 컨설턴트'],
  '부동산학과': ['부동산 컨설턴트', '자산 관리자', '부동산 개발 전문가', '감정평가사'],
  '미래융합경영학과': ['비즈니스 혁신가', '스타트업 창업가', '신사업 개발자', '융합 경영 전문가'],

  // Social Sciences & Law
  '행정학전공': ['공무원', '공공기관 전문가', '정책 연구원', '행정 컨설턴트'],
  '정치외교학전공': ['외교관', '정치 분석가', 'NGO 활동가', '국제기구 직원'],
  '법학과': ['변호사', '판사', '검사', '법무법인 변호사'],
  '법무행정학과': ['법률 행정 전문가', '공공기관 법무', '기업 법무', '행정사'],
  '사회복지학과': ['사회복지사', '상담사', '복지 정책 전문가', 'NGO 활동가'],
  '심리치료학과': ['심리상담사', '임상심리사', '심리치료사', '정신건강 전문가'],
  '청소년지도학전공': ['청소년 지도사', '청소년 상담사', '교육 기획자', '청소년 프로그램 개발자'],
  '아동학전공': ['보육교사', '아동 상담사', '아동복지 전문가', '유아교육 전문가'],

  // Humanities & Languages
  '국어국문학전공': ['작가', '편집자', '국어 교사', '출판 기획자'],
  '영어영문학전공': ['통번역가', '영어 교육자', '국제업무 담당자', '콘텐츠 크리에이터'],
  '중어중문학전공': ['중국어 통번역가', '중국 비즈니스 전문가', '중국어 교육자', '무역 전문가'],
  '일어일문학전공': ['일본어 통번역가', '일본 업무 전문가', '일본어 교육자', '문화 교류 코디네이터'],
  '아랍지역학전공': ['아랍어 통번역가', '중동 전문가', '국제업무 담당자', '외교 전문가'],
  '글로벌한국어학전공': ['한국어 교사', '문화 교류 전문가', '한국어 콘텐츠 기획자', '다문화 상담사'],
  '문예창작학과': ['소설가', '시인', '극작가', '콘텐츠 작가'],
  '미술사·역사학전공': ['큐레이터', '역사 연구원', '문화재 전문가', '박물관 학예사'],
  '문헌정보학전공': ['사서', '정보 관리자', '디지털 아키비스트', '정보 검색 전문가'],
  '글로벌문화콘텐츠학전공': ['콘텐츠 기획자', '문화 마케터', '문화 프로듀서', '문화산업 전문가'],

  // Arts & Design
  '비주얼커뮤니케이션디자인전공': ['그래픽 디자이너', '브랜드 디자이너', '아트 디렉터', 'UI/UX 디자이너'],
  '인더스트리얼디자인전공': ['제품 디자이너', 'UX 디자이너', '산업 디자이너', '디자인 컨설턴트'],
  '영상애니메이션디자인전공': ['애니메이터', '영상 크리에이터', '모션 그래픽 디자이너', '영상 감독'],
  '패션디자인전공': ['패션 디자이너', '스타일리스트', '패션 MD', '패션 에디터'],
  '멀티디자인학과': ['멀티미디어 디자이너', '브랜드 디자이너', '디지털 콘텐츠 디자이너', 'UX/UI 디자이너'],
  '공간디자인학과': ['인테리어 디자이너', '공간 기획자', '환경 디자이너', '전시 디자이너'],
  '건축학전공': ['건축가', '도시 설계사', '건축 컨설턴트', '건축 설계 전문가'],
  '전통건축전공': ['전통 건축 전문가', '문화재 복원가', '한옥 설계자', '문화재 보존 전문가'],

  // Music & Performance
  '건반음악전공': ['피아니스트', '음악 교육자', '반주자', '음악 치료사'],
  '보컬뮤직전공': ['가수', '보컬 트레이너', '세션 싱어', '음악 강사'],
  '작곡전공': ['작곡가', '음악 프로듀서', '편곡가', '사운드 디자이너'],
  '연극·영화전공': ['배우', '영화감독', '연출가', '영화 프로듀서'],
  '뮤지컬공연전공': ['뮤지컬 배우', '공연 예술가', '안무가', '무대 감독'],

  // Sports
  '체육학전공': ['체육 교사', '스포츠 지도자', '트레이너', '운동처방사'],
  '스포츠산업학전공': ['스포츠 마케터', '이벤트 기획자', '스포츠 에이전트', 'e스포츠 매니저'],
  '스포츠지도학전공': ['스포츠 트레이너', '코치', '퍼스널 트레이너', '재활 트레이너'],
  '바둑학과': ['프로 기사', '바둑 지도사', '바둑 해설가', '바둑 교육자'],

  // Media
  '디지털미디어학부': ['미디어 크리에이터', 'PD', '영상 제작자', '디지털 콘텐츠 기획자'],

  // Others
  '창의융합인재학부': ['융합 전문가', '창의적 문제 해결사', '혁신가', '다학제 연구자'],
  '아너칼리지(전공자유대학)': ['융합형 인재', '다학제 전문가', '창의적 문제 해결사', '혁신가'],
  '자율전공학부(인문)': ['인문학 전문가', '인문 컨설턴트', '문화 기획자', '교육 전문가'],
  '자율전공학부(자연)': ['과학 연구원', 'R&D 전문가', '기술 컨설턴트', '과학 교육자'],
  '계약학과': ['산학협력 전문가', '기업 맞춤형 인재', '실무 전문가', '산업 현장 전문가'],
};

// Holland's Hexagonal Model - Type Relationships
// Adjacent types share similarities, opposite types are contrasting
const HOLLAND_HEXAGON: Record<RiasecCode, { adjacent: RiasecCode[]; opposite: RiasecCode }> = {
  R: { adjacent: ['I', 'C'], opposite: 'S' },
  I: { adjacent: ['R', 'A'], opposite: 'E' },
  A: { adjacent: ['I', 'S'], opposite: 'C' },
  S: { adjacent: ['A', 'E'], opposite: 'R' },
  E: { adjacent: ['S', 'C'], opposite: 'I' },
  C: { adjacent: ['E', 'R'], opposite: 'A' },
};

// RIASEC Type-specific strengths, activities, and environments for richer explanations
const RIASEC_MATCH_CONTEXT: Record<RiasecCode, {
  coreStrengths: string[];
  typicalActivities: string[];
  learningStyle: string;
  workEnvironment: string;
  growthAreas: string[];
}> = {
  R: {
    coreStrengths: ['실용적 문제해결', '도구·기계 활용', '체계적 작업 수행', '손재주와 정밀함'],
    typicalActivities: ['제품 설계 및 제작', '기계 조작', '건설·조립 작업', '현장 실습'],
    learningStyle: '직접 해보며 배우는 실습 중심 학습',
    workEnvironment: '구체적 결과물이 보이는 실무 환경',
    growthAreas: ['기술적 전문성', '문제해결 능력', '프로젝트 완수력'],
  },
  I: {
    coreStrengths: ['분석적 사고', '지적 호기심', '논리적 추론', '깊이 있는 탐구'],
    typicalActivities: ['연구·실험 수행', '데이터 분석', '이론 검증', '문제 원인 규명'],
    learningStyle: '이론과 원리를 파악하는 탐구 중심 학습',
    workEnvironment: '자율적으로 연구할 수 있는 학문적 환경',
    growthAreas: ['전문 지식', '연구 역량', '비판적 사고력'],
  },
  A: {
    coreStrengths: ['창의적 표현', '독창성', '미적 감각', '비정형적 사고'],
    typicalActivities: ['디자인·창작', '예술적 표현', '컨셉 기획', '콘텐츠 제작'],
    learningStyle: '자유로운 실험과 표현을 통한 창작 중심 학습',
    workEnvironment: '창의성을 존중하는 자유로운 환경',
    growthAreas: ['예술적 역량', '창의적 문제해결', '자기표현력'],
  },
  S: {
    coreStrengths: ['대인관계', '공감능력', '협업 역량', '커뮤니케이션'],
    typicalActivities: ['상담·조언', '교육·지도', '팀 협업', '사회적 지원'],
    learningStyle: '토론과 협력을 통한 상호작용 중심 학습',
    workEnvironment: '사람들과 함께 일하는 협력적 환경',
    growthAreas: ['리더십', '갈등해결', '사회적 영향력'],
  },
  E: {
    coreStrengths: ['설득력', '추진력', '리더십', '목표 지향성'],
    typicalActivities: ['프로젝트 주도', '협상·영업', '조직 관리', '의사결정'],
    learningStyle: '실전 경험과 도전을 통한 성과 중심 학습',
    workEnvironment: '성과와 경쟁이 있는 역동적 환경',
    growthAreas: ['경영 역량', '네트워킹', '전략적 사고'],
  },
  C: {
    coreStrengths: ['정확성', '체계적 관리', '세부사항 주의', '효율성 추구'],
    typicalActivities: ['데이터 정리', '문서 관리', '절차 수립', '품질 검증'],
    learningStyle: '체계적 커리큘럼을 통한 단계적 학습',
    workEnvironment: '명확한 규칙과 절차가 있는 안정적 환경',
    growthAreas: ['전문 자격', '운영 역량', '시스템 관리'],
  },
};

// Major category contexts for more specific explanations
const MAJOR_CATEGORY_CONTEXT: Record<string, {
  category: string;
  fieldCharacteristics: string;
  keySkillAreas: string[];
}> = {
  // Engineering
  '컴퓨터공학전공': { category: 'engineering', fieldCharacteristics: '논리적 알고리즘 설계와 시스템 구축', keySkillAreas: ['프로그래밍', '시스템 설계', '문제 분해'] },
  '전자공학전공': { category: 'engineering', fieldCharacteristics: '전자회로와 신호처리 기술 개발', keySkillAreas: ['회로 설계', '시스템 분석', '하드웨어 구현'] },
  '기계공학전공': { category: 'engineering', fieldCharacteristics: '기계 시스템의 설계와 최적화', keySkillAreas: ['설계', '해석', '제조 공정'] },
  '건축학전공': { category: 'architecture', fieldCharacteristics: '공간의 기능성과 심미성을 융합한 설계', keySkillAreas: ['공간 설계', '구조 이해', '미적 표현'] },
  '화학공학전공': { category: 'engineering', fieldCharacteristics: '화학 반응 공정의 설계와 최적화', keySkillAreas: ['공정 설계', '소재 분석', '품질 관리'] },
  // Science
  '물리학과': { category: 'science', fieldCharacteristics: '자연 현상의 근본 원리 탐구', keySkillAreas: ['이론 분석', '실험 설계', '수리적 모델링'] },
  '화학나노학전공': { category: 'science', fieldCharacteristics: '분자 수준의 물질 연구와 응용', keySkillAreas: ['실험 분석', '물질 합성', '나노기술'] },
  '수학과': { category: 'science', fieldCharacteristics: '추상적 논리와 수리적 증명', keySkillAreas: ['논리적 추론', '문제 해결', '모델링'] },
  // Business
  '경영학전공': { category: 'business', fieldCharacteristics: '조직 운영과 전략적 의사결정', keySkillAreas: ['전략 수립', '조직 관리', '비즈니스 분석'] },
  '경제학전공': { category: 'business', fieldCharacteristics: '경제 현상의 분석과 정책 이해', keySkillAreas: ['경제 분석', '데이터 해석', '정책 평가'] },
  '회계세무학과': { category: 'business', fieldCharacteristics: '재무 정보의 체계적 관리', keySkillAreas: ['재무 분석', '세무 처리', '감사'] },
  // Social
  '사회복지학과': { category: 'social', fieldCharacteristics: '개인과 지역사회의 복지 증진', keySkillAreas: ['상담', '프로그램 기획', '사례 관리'] },
  '심리치료학과': { category: 'social', fieldCharacteristics: '심리적 치유와 정신건강 지원', keySkillAreas: ['상담 기법', '심리 평가', '치료 계획'] },
  '행정학전공': { category: 'social', fieldCharacteristics: '공공 정책의 기획과 실행', keySkillAreas: ['정책 분석', '조직 관리', '공공 서비스'] },
  // Arts
  '비주얼커뮤니케이션디자인전공': { category: 'arts', fieldCharacteristics: '시각적 메시지의 창의적 전달', keySkillAreas: ['시각 디자인', '브랜딩', '타이포그래피'] },
  '영상애니메이션디자인전공': { category: 'arts', fieldCharacteristics: '움직임과 스토리텔링의 시각화', keySkillAreas: ['애니메이션', '영상 편집', '모션 그래픽'] },
  '연극·영화전공': { category: 'arts', fieldCharacteristics: '무대와 스크린을 통한 예술적 표현', keySkillAreas: ['연기', '연출', '스토리텔링'] },
  // AI/Data
  '인공지능전공': { category: 'tech', fieldCharacteristics: '지능형 시스템의 설계와 구현', keySkillAreas: ['머신러닝', '알고리즘', '데이터 처리'] },
  '데이터사이언스전공': { category: 'tech', fieldCharacteristics: '데이터 기반 인사이트 도출', keySkillAreas: ['데이터 분석', '통계', '시각화'] },
  '응용소프트웨어전공': { category: 'tech', fieldCharacteristics: '실용적 소프트웨어의 설계와 개발', keySkillAreas: ['프로그래밍', '소프트웨어 아키텍처', '문제해결'] },
  '디지털콘텐츠디자인학과': { category: 'tech_arts', fieldCharacteristics: '기술과 창의성의 융합을 통한 디지털 경험 설계', keySkillAreas: ['UX/UI 디자인', '인터랙션 설계', '프로토타이핑'] },

  // More Engineering
  '정보통신공학전공': { category: 'engineering', fieldCharacteristics: '통신 시스템과 네트워크 인프라 구축', keySkillAreas: ['네트워크 설계', '통신 프로토콜', '시스템 최적화'] },
  '전기공학전공': { category: 'engineering', fieldCharacteristics: '전력 시스템과 에너지 변환 기술 개발', keySkillAreas: ['전력 설계', '제어 시스템', '에너지 관리'] },
  '로봇공학전공': { category: 'engineering', fieldCharacteristics: '자율 시스템과 지능형 기계의 개발', keySkillAreas: ['로봇 설계', '제어 알고리즘', '센서 통합'] },
  '반도체공학부': { category: 'engineering', fieldCharacteristics: '반도체 소자와 집적회로의 설계', keySkillAreas: ['소자 설계', '공정 기술', '회로 분석'] },
  '신소재공학전공': { category: 'engineering', fieldCharacteristics: '첨단 소재의 개발과 특성 분석', keySkillAreas: ['소재 분석', '물성 연구', '응용 개발'] },
  '건설환경공학전공': { category: 'engineering', fieldCharacteristics: '사회 인프라와 환경 시스템 설계', keySkillAreas: ['구조 해석', '환경 평가', '프로젝트 관리'] },
  '환경시스템공학전공': { category: 'engineering', fieldCharacteristics: '환경 문제 해결을 위한 공학적 접근', keySkillAreas: ['환경 분석', '처리 시스템', '지속가능 설계'] },
  '스마트모빌리티공학전공': { category: 'engineering', fieldCharacteristics: '미래 이동수단과 교통 시스템 혁신', keySkillAreas: ['자율주행', '전기차 기술', '시스템 통합'] },
  '산업경영공학과': { category: 'engineering_business', fieldCharacteristics: '생산 시스템의 효율화와 최적화', keySkillAreas: ['공정 설계', '품질 관리', '데이터 기반 의사결정'] },

  // More Science
  '융합에너지학전공': { category: 'science', fieldCharacteristics: '미래 에너지원의 연구와 개발', keySkillAreas: ['에너지 분석', '실험 연구', '시스템 설계'] },
  '식품영양학전공': { category: 'science_social', fieldCharacteristics: '식품 과학과 인체 영양의 연구', keySkillAreas: ['영양 분석', '식품 연구', '건강 상담'] },
  '시스템생명과학전공': { category: 'science', fieldCharacteristics: '생명 현상의 통합적 이해와 응용', keySkillAreas: ['생명 연구', '바이오 기술', '데이터 분석'] },

  // More Business
  '글로벌비즈니스학전공': { category: 'business', fieldCharacteristics: '글로벌 시장에서의 비즈니스 전략 수립', keySkillAreas: ['국제 경영', '시장 분석', '전략 기획'] },
  '경영정보학과': { category: 'business_tech', fieldCharacteristics: 'IT 기술을 활용한 비즈니스 혁신', keySkillAreas: ['시스템 분석', '비즈니스 인텔리전스', '디지털 전환'] },
  '국제통상학전공': { category: 'business', fieldCharacteristics: '국제 무역과 통상 정책의 이해', keySkillAreas: ['무역 분석', '협상', '정책 이해'] },
  '응용통계학전공': { category: 'science_business', fieldCharacteristics: '데이터 기반 의사결정과 예측', keySkillAreas: ['통계 분석', '모델링', '데이터 해석'] },
  '부동산학과': { category: 'business', fieldCharacteristics: '부동산 시장과 자산 관리', keySkillAreas: ['시장 분석', '투자 평가', '자산 관리'] },
  '미래융합경영학과': { category: 'business', fieldCharacteristics: '미래 산업을 위한 혁신적 경영', keySkillAreas: ['트렌드 분석', '혁신 전략', '융합 사고'] },

  // More Social Sciences
  '정치외교학전공': { category: 'social', fieldCharacteristics: '정치 현상과 국제 관계의 분석', keySkillAreas: ['정치 분석', '외교', '정책 연구'] },
  '법학과': { category: 'social', fieldCharacteristics: '법률 체계의 이해와 적용', keySkillAreas: ['법률 분석', '논리적 사고', '분쟁 해결'] },
  '법무행정학과': { category: 'social', fieldCharacteristics: '법률과 행정의 실무적 융합', keySkillAreas: ['법률 실무', '행정 절차', '민원 처리'] },
  '청소년지도학전공': { category: 'social', fieldCharacteristics: '청소년 성장과 발달의 지원', keySkillAreas: ['청소년 상담', '프로그램 기획', '지도력'] },
  '아동학전공': { category: 'social', fieldCharacteristics: '아동 발달과 교육의 전문적 이해', keySkillAreas: ['발달 이해', '교육 설계', '상담'] },

  // Humanities & Languages
  '국어국문학전공': { category: 'humanities', fieldCharacteristics: '한국어와 문학의 깊이 있는 탐구', keySkillAreas: ['문학 분석', '글쓰기', '언어 연구'] },
  '영어영문학전공': { category: 'humanities', fieldCharacteristics: '영어권 문화와 언어의 전문적 이해', keySkillAreas: ['언어 능력', '문학 분석', '문화 이해'] },
  '중어중문학전공': { category: 'humanities', fieldCharacteristics: '중국어와 중국 문화의 전문적 탐구', keySkillAreas: ['중국어', '문화 이해', '통역/번역'] },
  '일어일문학전공': { category: 'humanities', fieldCharacteristics: '일본어와 일본 문화의 전문적 탐구', keySkillAreas: ['일본어', '문화 이해', '통역/번역'] },
  '아랍지역학전공': { category: 'humanities', fieldCharacteristics: '아랍 세계와 문화의 전문적 이해', keySkillAreas: ['아랍어', '지역 연구', '문화 분석'] },
  '글로벌한국어학전공': { category: 'humanities_social', fieldCharacteristics: '한국어 교육과 문화 전파', keySkillAreas: ['한국어 교육', '교수법', '문화 교류'] },
  '문예창작학과': { category: 'arts_humanities', fieldCharacteristics: '창작 문학과 스토리텔링의 예술', keySkillAreas: ['창작 글쓰기', '스토리텔링', '비평'] },
  '미술사·역사학전공': { category: 'humanities', fieldCharacteristics: '미술과 역사의 학문적 탐구', keySkillAreas: ['역사 연구', '미술 분석', '비평적 사고'] },
  '문헌정보학전공': { category: 'humanities_tech', fieldCharacteristics: '정보 조직과 지식 관리', keySkillAreas: ['정보 관리', '데이터 분류', '연구 지원'] },
  '글로벌문화콘텐츠학전공': { category: 'humanities_business', fieldCharacteristics: '문화 콘텐츠의 기획과 마케팅', keySkillAreas: ['콘텐츠 기획', '문화 마케팅', '글로벌 전략'] },

  // More Arts & Design
  '인더스트리얼디자인전공': { category: 'arts', fieldCharacteristics: '제품의 기능과 미학의 융합 설계', keySkillAreas: ['제품 디자인', '사용자 연구', '프로토타이핑'] },
  '패션디자인전공': { category: 'arts', fieldCharacteristics: '패션 트렌드와 의류 디자인', keySkillAreas: ['패션 디자인', '트렌드 분석', '소재 연구'] },
  '멀티디자인학과': { category: 'arts', fieldCharacteristics: '다양한 매체를 아우르는 통합 디자인', keySkillAreas: ['멀티미디어', '브랜딩', '디지털 디자인'] },
  '공간디자인학과': { category: 'arts', fieldCharacteristics: '인테리어와 환경 디자인', keySkillAreas: ['공간 설계', '환경 디자인', '시각화'] },
  '전통건축전공': { category: 'architecture', fieldCharacteristics: '한국 전통 건축의 계승과 현대화', keySkillAreas: ['전통 설계', '문화재 이해', '복원 기술'] },

  // Music & Performance
  '건반음악전공': { category: 'arts_music', fieldCharacteristics: '피아노 연주와 음악적 표현', keySkillAreas: ['연주 기술', '음악 해석', '표현력'] },
  '보컬뮤직전공': { category: 'arts_music', fieldCharacteristics: '성악과 보컬 퍼포먼스', keySkillAreas: ['발성 기술', '무대 퍼포먼스', '음악 해석'] },
  '작곡전공': { category: 'arts_music', fieldCharacteristics: '음악 창작과 편곡', keySkillAreas: ['작곡', '화성학', '사운드 디자인'] },
  '뮤지컬공연전공': { category: 'arts', fieldCharacteristics: '종합 무대 예술의 창작과 공연', keySkillAreas: ['공연 예술', '연기', '안무'] },

  // Sports
  '체육학전공': { category: 'sports', fieldCharacteristics: '체육 과학과 운동 지도', keySkillAreas: ['운동 과학', '지도법', '체력 평가'] },
  '스포츠산업학전공': { category: 'sports_business', fieldCharacteristics: '스포츠 비즈니스와 마케팅', keySkillAreas: ['스포츠 마케팅', '이벤트 기획', '산업 분석'] },
  '스포츠지도학전공': { category: 'sports', fieldCharacteristics: '전문 운동 지도와 코칭', keySkillAreas: ['코칭', '트레이닝', '선수 관리'] },
  '바둑학과': { category: 'sports_strategy', fieldCharacteristics: '바둑의 전략적 사고와 교육', keySkillAreas: ['전략적 사고', '교육', '대국 분석'] },

  // Media
  '디지털미디어학부': { category: 'media', fieldCharacteristics: '디지털 미디어 콘텐츠의 기획과 제작', keySkillAreas: ['콘텐츠 제작', '미디어 기획', '디지털 스토리텔링'] },
};

// Simple deterministic hash based on string for consistent selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 3-code position explanations for RIASEC combinations
const CODE_POSITION_EXPLANATIONS: Record<RiasecCode, {
  primary: string;      // When this is the 1st code (dominant)
  secondary: string;    // When this is the 2nd code (supportive)
  tertiary: string;     // When this is the 3rd code (influencing)
}> = {
  R: {
    primary: '현실적이고 실용적인 접근을 가장 중시합니다. 눈에 보이는 결과물을 만들고, 도구와 기술을 직접 다루는 활동에서 가장 큰 성취감을 느낍니다. 이론보다 실습을, 추상보다 구체를 선호하는 것이 핵심 특징입니다.',
    secondary: '주된 관심사를 현실에서 구현하는 실행력을 제공합니다. 아이디어를 실제로 작동하는 결과물로 바꾸는 능력이 있으며, 기술적 문제 해결에 강점이 있습니다.',
    tertiary: '학습과 활동에 실용성을 더합니다. 이론적 지식을 실제 상황에 적용하려는 성향이 있어, 배운 것을 현실에서 활용하는 데 관심을 기울입니다.',
  },
  I: {
    primary: '지적 호기심과 분석적 사고가 핵심입니다. 현상의 원리를 깊이 탐구하고, 논리적으로 문제를 분석하며, 증거에 기반한 결론을 도출하는 것을 중시합니다. 복잡한 문제를 체계적으로 풀어가는 과정 자체에서 만족을 얻습니다.',
    secondary: '주된 활동에 분석력과 비판적 사고를 더합니다. 단순히 실행하는 것을 넘어 "왜 그런지"를 이해하려 하며, 데이터와 논리에 기반한 의사결정을 선호합니다.',
    tertiary: '깊이 있는 학습과 근본 원리 이해에 대한 관심을 부여합니다. 표면적인 이해를 넘어 본질을 파악하려는 성향이 있어, 전문성을 키우는 데 도움이 됩니다.',
  },
  A: {
    primary: '창의성과 자기표현이 가장 중요합니다. 독창적인 아이디어를 구현하고, 틀에 박히지 않은 새로운 방식을 추구하며, 미적 감각을 활용한 창작 활동에서 가장 빛납니다. 자유로운 환경에서 영감을 발휘하는 것을 선호합니다.',
    secondary: '주된 관심사에 창의적 관점과 미적 감각을 더합니다. 기존의 방식에서 벗어나 새로운 해결책을 모색하며, 결과물의 심미적 완성도에도 관심을 기울입니다.',
    tertiary: '독창성과 유연한 사고를 학습과 활동에 불어넣습니다. 정해진 틀 안에서도 자신만의 색깔을 표현하려 하며, 다양한 관점에서 문제를 바라보는 경향이 있습니다.',
  },
  S: {
    primary: '사람과의 관계와 도움이 핵심 가치입니다. 타인을 돕고, 가르치고, 협력하는 활동에서 가장 큰 보람을 느낍니다. 공감 능력이 뛰어나며, 대인관계를 통해 사회적 가치를 만들어가는 것을 중시합니다.',
    secondary: '주된 활동에 협력적 태도와 대인관계 역량을 더합니다. 혼자보다 함께 일할 때 더 효과적이며, 팀원들과의 소통과 조화를 중요하게 생각합니다.',
    tertiary: '사회적 책임감과 공동체 의식을 부여합니다. 자신의 활동이 타인에게 미치는 영향을 고려하며, 관계 형성과 네트워킹에 자연스러운 관심을 보입니다.',
  },
  E: {
    primary: '리더십과 목표 달성이 핵심입니다. 사람들을 설득하고 이끌며, 조직이나 프로젝트를 주도하는 역할에서 능력을 발휘합니다. 도전적인 목표를 세우고 성과를 만들어내는 것에 열정을 가지고 있습니다.',
    secondary: '주된 관심사에 추진력과 실행력을 더합니다. 아이디어를 현실로 만들기 위해 적극적으로 움직이며, 기회를 포착하고 행동으로 옮기는 데 강점이 있습니다.',
    tertiary: '도전 정신과 성취 지향성을 부여합니다. 현재에 안주하지 않고 더 높은 목표를 향해 나아가려 하며, 경쟁적인 상황에서 동기부여를 받는 경향이 있습니다.',
  },
  C: {
    primary: '체계성과 정확성이 가장 중요합니다. 명확한 절차와 규칙 안에서 효율적으로 일하며, 세부사항을 꼼꼼하게 관리하는 데 탁월합니다. 안정적이고 예측 가능한 환경에서 높은 생산성을 발휘합니다.',
    secondary: '주된 활동에 조직력과 효율성을 더합니다. 계획을 세우고 체계적으로 실행하는 능력이 있으며, 데이터와 정보를 정리하고 관리하는 데 강점을 보입니다.',
    tertiary: '질서와 안정에 대한 선호를 부여합니다. 업무나 학습에서 구조화된 접근을 선호하며, 일관성과 정확성을 추구하는 성향이 있습니다.',
  },
};

// Generate rich match reason based on Holland theory and major context
function generateMatchReason(
  userScores: RiasecScores,
  majorVec: Partial<Record<string, number>>,
  majorName: string,
  displayName: string = '회원님'
): string {
  const dims: Array<keyof RiasecScores> = ['R', 'I', 'A', 'S', 'E', 'C'];

  // Find top 3 dimensions for user and major
  const userTop = [...dims]
    .map((d) => ({ dim: d, score: userScores[d] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const majorTop = [...dims]
    .map((d) => ({ dim: d, score: majorVec[d] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const userPrimary = userTop[0].dim;
  const userSecondary = userTop[1].dim;
  const majorPrimary = majorTop[0].dim;
  const majorSecondary = majorTop[1].dim;

  const userTopDims = userTop.map((t) => t.dim);
  const majorTopDims = majorTop.slice(0, 2).map((t) => t.dim);
  const overlap = userTopDims.filter((d) => majorTopDims.includes(d));

  // Get context data
  const userPrimaryCtx = RIASEC_MATCH_CONTEXT[userPrimary];
  const majorPrimaryCtx = RIASEC_MATCH_CONTEXT[majorPrimary];
  const majorCategoryCtx = MAJOR_CATEGORY_CONTEXT[majorName];
  const hexagon = HOLLAND_HEXAGON[userPrimary];

  // Use deterministic hash for consistent selections
  const hash = hashString(majorName + userPrimary + majorPrimary);

  // Calculate congruence level
  const isHighCongruence = overlap.length >= 2;
  const isMediumCongruence = overlap.length === 1;
  const isAdjacent = hexagon.adjacent.includes(majorPrimary);
  const isOpposite = hexagon.opposite === majorPrimary;

  // Build rich explanation
  const explanations: string[] = [];

  if (isHighCongruence) {
    // High congruence: Both primary types match
    const matchedTypes = overlap.map(d => RIASEC_LABELS[d].name).join('·');
    const userStrength = userPrimaryCtx.coreStrengths[hash % 2];
    const activity = majorPrimaryCtx.typicalActivities[hash % 2];

    explanations.push(
      `${matchedTypes} 성향이 전공의 핵심 요구역량과 정확히 일치합니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.fieldCharacteristics}을(를) 다루는 이 전공에서 ${displayName}의 '${userStrength}' 강점이 '${activity}' 활동에 직접 발휘됩니다.`
      );
    } else {
      explanations.push(
        `${displayName}의 '${userStrength}' 강점이 전공 학습의 '${activity}' 활동에서 큰 시너지를 만듭니다.`
      );
    }

    explanations.push(
      `Holland 이론에 따르면, 이러한 높은 적합도는 학업 만족도와 성취도를 높이는 핵심 요인입니다.`
    );
  } else if (isMediumCongruence) {
    // Medium congruence: One type matches
    const matchedType = RIASEC_LABELS[overlap[0]];
    const userStrength = RIASEC_MATCH_CONTEXT[overlap[0]].coreStrengths[0];
    const nonOverlap = majorTopDims.find(d => !overlap.includes(d)) || majorSecondary;
    const growthType = RIASEC_LABELS[nonOverlap];
    const growthArea = RIASEC_MATCH_CONTEXT[nonOverlap].growthAreas[0];

    explanations.push(
      `${displayName}의 ${matchedType.name} 특성(${userStrength})이 이 전공의 주요 학습 활동과 맞닿아 있습니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.fieldCharacteristics}을(를) 배우며, ${majorCategoryCtx.keySkillAreas.slice(0, 2).join(', ')} 역량을 키울 수 있습니다.`
      );
    }

    explanations.push(
      `또한 ${growthType.name} 요소를 통해 '${growthArea}' 능력도 함께 발전시킬 기회가 됩니다.`
    );
  } else if (isAdjacent) {
    // Adjacent types on Holland's hexagon - natural progression
    const userTypeLabel = RIASEC_LABELS[userPrimary];
    const majorTypeLabel = RIASEC_LABELS[majorPrimary];

    explanations.push(
      `${displayName}의 ${userTypeLabel.name} 성향은 ${majorTypeLabel.name} 중심의 이 전공과 자연스럽게 연결됩니다.`
    );

    explanations.push(
      `Holland 육각형 모델에서 이 두 유형은 인접해 있어, ${userPrimaryCtx.learningStyle}에서 ${majorPrimaryCtx.workEnvironment}으로의 확장이 원활합니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.keySkillAreas[0]} 등의 역량을 기존 강점 위에 쌓아갈 수 있습니다.`
      );
    }
  } else if (isOpposite) {
    // Opposite types - complementary growth opportunity
    const userTypeLabel = RIASEC_LABELS[userPrimary];
    const majorTypeLabel = RIASEC_LABELS[majorPrimary];
    const userStrength = userPrimaryCtx.coreStrengths[0];
    const newArea = majorPrimaryCtx.growthAreas[0];

    explanations.push(
      `${userTypeLabel.name} 특성의 '${userStrength}' 강점을 ${majorTypeLabel.name} 영역에 적용하면 차별화된 경쟁력이 됩니다.`
    );

    explanations.push(
      `이 전공에서 '${newArea}' 같은 새로운 역량을 개발하면, 기존 강점과 결합해 독보적인 전문성을 갖출 수 있습니다.`
    );
  } else {
    // General case
    const userTypeLabel = RIASEC_LABELS[userPrimary];
    const majorTypeLabel = RIASEC_LABELS[majorPrimary];
    const userStrength = userPrimaryCtx.coreStrengths[hash % userPrimaryCtx.coreStrengths.length];

    explanations.push(
      `${displayName}의 ${userTypeLabel.name} 특성 중 '${userStrength}'이(가) 이 전공의 ${majorTypeLabel.name} 요소와 만나 시너지를 발휘합니다.`
    );

    if (majorCategoryCtx) {
      explanations.push(
        `${majorCategoryCtx.fieldCharacteristics}을(를) 학습하며 ${majorCategoryCtx.keySkillAreas.slice(0, 2).join(', ')} 역량을 강화할 수 있습니다.`
      );
    } else {
      explanations.push(
        `${majorPrimaryCtx.workEnvironment}에서 활동하며 새로운 관점과 역량을 개발할 기회입니다.`
      );
    }
  }

  return explanations.join(' ');
}

// Calculate similarity between user scores and major profile
// Uses cosine similarity on normalized profiles + profile-shape penalty
function calculateMajorMatch(userScores: RiasecScores, majorVec: Partial<Record<string, number>>): number {
  const dims: Array<keyof RiasecScores> = ['R', 'I', 'A', 'S', 'E', 'C'];
  const maxUser = Math.max(...dims.map(d => userScores[d])) || 1;
  const maxMajor = Math.max(...dims.map(d => majorVec[d] || 0)) || 1;

  // Normalize both to 0-1 relative to own max
  const userNorm = dims.map(d => userScores[d] / maxUser);
  const majorNorm = dims.map(d => (majorVec[d] || 0) / maxMajor);

  // Cosine similarity
  let dot = 0, magU = 0, magM = 0;
  for (let i = 0; i < 6; i++) {
    dot += userNorm[i] * majorNorm[i];
    magU += userNorm[i] * userNorm[i];
    magM += majorNorm[i] * majorNorm[i];
  }
  if (magU === 0 || magM === 0) return 0;
  const cosine = dot / (Math.sqrt(magU) * Math.sqrt(magM));

  // Profile-shape distance penalty: penalize when top dimensions don't align
  // Find user's top 3 dims and check if major emphasizes them too
  const userRanked = dims
    .map((d, i) => ({ dim: d, val: userNorm[i] }))
    .sort((a, b) => b.val - a.val);
  const majorRanked = dims
    .map((d, i) => ({ dim: d, val: majorNorm[i] }))
    .sort((a, b) => b.val - a.val);

  const userTop3 = new Set(userRanked.slice(0, 3).map(x => x.dim));
  const majorTop3 = new Set(majorRanked.slice(0, 3).map(x => x.dim));
  let overlap = 0;
  userTop3.forEach(d => { if (majorTop3.has(d)) overlap++; });
  const topBonus = overlap / 3; // 0, 0.33, 0.67, or 1.0

  // Weighted mean distance (Euclidean) — low = good match
  let sumSqDiff = 0;
  for (let i = 0; i < 6; i++) {
    const diff = userNorm[i] - majorNorm[i];
    sumSqDiff += diff * diff;
  }
  const dist = Math.sqrt(sumSqDiff / 6);
  const distScore = 1 - dist; // closer = higher

  // Final: blend cosine (shape), distScore (magnitude closeness), topBonus (peak alignment)
  return cosine * 0.4 + distScore * 0.3 + topBonus * 0.3;
}

// Cosine similarity between two RIASEC vectors
function cosineSimilarity(vecA: Partial<Record<string, number>>, vecB: Partial<Record<string, number>>): number {
  const dims = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
  let dot = 0, magA = 0, magB = 0;
  dims.forEach(d => {
    const a = vecA[d] || 0;
    const b = vecB[d] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Average RIASEC vector from a list of major keys
function averageInterestVector(majorKeys: string[]): Partial<Record<string, number>> {
  const dims = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
  if (majorKeys.length === 0) return {};
  const sum: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  let count = 0;
  majorKeys.forEach(key => {
    const major = MAJORS.find(m => m.key === key);
    if (major) {
      dims.forEach(d => { sum[d] += major.vec[d] || 0; });
      count++;
    }
  });
  if (count === 0) return {};
  dims.forEach(d => { sum[d] /= count; });
  return sum;
}

const RiasecResult: React.FC<RiasecResultProps> = ({
  scores,
  onContinue,
  onSkip,
  onNavigate,
  onRestart,
  onStartSupplementary,
  participantName,
  supplementaryData,
  isComplete = false,
  interestedMajorKeys = [],
}) => {
  // Helper to get display name
  const displayName = participantName || '회원님';
  const dimensions: Array<keyof RiasecScores> = ['R', 'I', 'A', 'S', 'E', 'C'];
  const [selectedMajorIndex, setSelectedMajorIndex] = useState<number>(0);
  const [expandedProfiles, setExpandedProfiles] = useState<Set<number>>(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [showPDFView, setShowPDFView] = useState<boolean>(false);
  const [applySupplementary, setApplySupplementary] = useState<boolean>(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // PDF Export function - captures pages separately
  const handleExportPDF = useCallback(async () => {
    if (isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    setShowPDFView(true);

    // Wait for PDF view to render
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const page1Element = document.getElementById('pdf-page-1');
      const page2Element = document.getElementById('pdf-page-2');
      const page3Element = document.getElementById('pdf-page-3');
      const page4Element = document.getElementById('pdf-page-4');
      const page5Element = document.getElementById('pdf-page-5');

      if (!page1Element || !page2Element) {
        throw new Error('PDF content not found');
      }

      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 8;
      const contentWidth = a4Width - (margin * 2);
      const contentHeight = a4Height - (margin * 2);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Capture and add Page 1
      const canvas1 = await html2canvas(page1Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const img1Data = canvas1.toDataURL('image/png');
      // Calculate dimensions - fit to page while maintaining aspect ratio
      let img1Width = contentWidth;
      let img1Height = (canvas1.height * contentWidth) / canvas1.width;

      // If height exceeds page, scale down to fit
      if (img1Height > contentHeight) {
        const scale = contentHeight / img1Height;
        img1Height = contentHeight;
        img1Width = contentWidth * scale;
      }

      // Center horizontally if scaled down
      const x1 = margin + (contentWidth - img1Width) / 2;
      pdf.addImage(
        img1Data,
        'PNG',
        x1,
        margin,
        img1Width,
        img1Height
      );

      // Add Page 2
      pdf.addPage();

      const canvas2 = await html2canvas(page2Element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const img2Data = canvas2.toDataURL('image/png');
      // Calculate dimensions - fit to page while maintaining aspect ratio
      let img2Width = contentWidth;
      let img2Height = (canvas2.height * contentWidth) / canvas2.width;

      // If height exceeds page, scale down to fit
      if (img2Height > contentHeight) {
        const scale = contentHeight / img2Height;
        img2Height = contentHeight;
        img2Width = contentWidth * scale;
      }

      // Center horizontally if scaled down
      const x2 = margin + (contentWidth - img2Width) / 2;
      pdf.addImage(
        img2Data,
        'PNG',
        x2,
        margin,
        img2Width,
        img2Height
      );

      // Add Page 3 if supplementary data exists
      if (page3Element && supplementaryData) {
        pdf.addPage();

        const canvas3 = await html2canvas(page3Element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });

        const img3Data = canvas3.toDataURL('image/png');
        let img3Width = contentWidth;
        let img3Height = (canvas3.height * contentWidth) / canvas3.width;

        if (img3Height > contentHeight) {
          const scale = contentHeight / img3Height;
          img3Height = contentHeight;
          img3Width = contentWidth * scale;
        }

        const x3 = margin + (contentWidth - img3Width) / 2;
        pdf.addImage(
          img3Data,
          'PNG',
          x3,
          margin,
          img3Width,
          img3Height
        );
      }

      // Add Page 4 - Before/After Comparison
      if (page4Element && supplementaryData) {
        pdf.addPage();

        const canvas4 = await html2canvas(page4Element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });

        const img4Data = canvas4.toDataURL('image/png');
        let img4Width = contentWidth;
        let img4Height = (canvas4.height * contentWidth) / canvas4.width;

        if (img4Height > contentHeight) {
          const scale = contentHeight / img4Height;
          img4Height = contentHeight;
          img4Width = contentWidth * scale;
        }

        const x4 = margin + (contentWidth - img4Width) / 2;
        pdf.addImage(
          img4Data,
          'PNG',
          x4,
          margin,
          img4Width,
          img4Height
        );
      }

      // Add Page 5 - 추천 직무
      if (page5Element) {
        pdf.addPage();

        const canvas5 = await html2canvas(page5Element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });

        const img5Data = canvas5.toDataURL('image/png');
        let img5Width = contentWidth;
        let img5Height = (canvas5.height * contentWidth) / canvas5.width;

        if (img5Height > contentHeight) {
          const scale = contentHeight / img5Height;
          img5Height = contentHeight;
          img5Width = contentWidth * scale;
        }

        const x5 = margin + (contentWidth - img5Width) / 2;
        pdf.addImage(
          img5Data,
          'PNG',
          x5,
          margin,
          img5Width,
          img5Height
        );
      }

      // Generate filename
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filename = participantName
        ? `RIASEC_결과_${participantName}_${dateStr}.pdf`
        : `RIASEC_결과_${dateStr}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingPDF(false);
      setShowPDFView(false);
    }
  }, [isGeneratingPDF, participantName]);

  const toggleProfile = (index: number) => {
    setExpandedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Calculate adjusted scores using z-score standardization
  // Weight: RIASEC 0.9, Self-efficacy 0.3
  const adjustedScores = useMemo(() => {
    if (!supplementaryData?.selfEfficacy) return scores;

    // 1. Calculate RIASEC z-scores
    const riasecValues = dimensions.map(d => scores[d]);
    const riasecMean = riasecValues.reduce((a, b) => a + b, 0) / riasecValues.length;
    const riasecStd = Math.sqrt(
      riasecValues.reduce((sum, val) => sum + Math.pow(val - riasecMean, 2), 0) / riasecValues.length
    ) || 1; // prevent division by zero

    // 2. Calculate self-efficacy z-scores
    const efficacyValues = dimensions.map(d => supplementaryData.selfEfficacy?.[d] || 3);
    const efficacyMean = efficacyValues.reduce((a, b) => a + b, 0) / efficacyValues.length;
    const efficacyStd = Math.sqrt(
      efficacyValues.reduce((sum, val) => sum + Math.pow(val - efficacyMean, 2), 0) / efficacyValues.length
    ) || 1;

    // 3. Combine with weights: RIASEC 0.9 + Efficacy 0.3
    const adjusted: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    dimensions.forEach(dim => {
      const riasecZ = (scores[dim] - riasecMean) / riasecStd;
      const efficacyZ = ((supplementaryData.selfEfficacy?.[dim] || 3) - efficacyMean) / efficacyStd;

      // Combined z-score
      const combinedZ = (riasecZ * 0.9) + (efficacyZ * 0.3);

      // Convert back to original scale (using RIASEC mean/std as reference)
      adjusted[dim] = Math.round(riasecMean + combinedZ * riasecStd);
    });

    return adjusted;
  }, [scores, supplementaryData?.selfEfficacy]);

  // Use adjusted or original scores based on toggle
  const activeScores = applySupplementary && supplementaryData ? adjustedScores : scores;

  const sortedDimensions = [...dimensions]
    .map(dim => ({ dim, score: activeScores[dim] }))
    .sort((a, b) => b.score - a.score);

  const top3 = sortedDimensions.slice(0, 3);
  const riasecCode = top3.map(t => t.dim).join('');

  // Field preference boost mapping
  const fieldToCollegeMap: Record<string, string[]> = {
    '공학': ['공과대학', 'ICT융합대학'],
    '자연과학': ['자연과학대학', 'ICT융합대학'],
    '사회과학': ['사회과학대학', '경영대학', '법과대학'],
    '의약/보건': ['약학대학', '자연과학대학'],
    '인문': ['인문대학'],
    '예술/체육': ['예술대학'],
    '경상': ['경영대학'],
  };

  // Calculate major match with supplementary boost
  const calculateAdjustedMajorMatch = (
    userScores: RiasecScores,
    majorVec: Partial<Record<string, number>>,
    majorCollege: string
  ) => {
    let baseScore = calculateMajorMatch(userScores, majorVec);

    if (applySupplementary && supplementaryData?.preferences?.fieldPreference) {
      const preferredColleges = fieldToCollegeMap[supplementaryData.preferences.fieldPreference] || [];
      if (preferredColleges.some(c => majorCollege.includes(c))) {
        baseScore *= 1.15; // 15% boost for preferred field
      }
    }

    return Math.min(baseScore, 1); // Cap at 1.0
  };

  // Original recommendations (without supplementary)
  const interestVec = useMemo(() => averageInterestVector(interestedMajorKeys), [interestedMajorKeys]);

  const originalMajors = useMemo(() => {
    return MAJORS
      .map(major => {
        let matchScore = calculateMajorMatch(scores, major.vec);
        // Apply interested major bonus
        if (interestedMajorKeys.length > 0) {
          if (interestedMajorKeys.includes(major.key)) {
            matchScore += 0.08; // Direct selection bonus
          } else if (Object.keys(interestVec).length > 0) {
            matchScore += cosineSimilarity(major.vec, interestVec) * 0.12; // Similarity bonus
          }
          matchScore = Math.min(matchScore, 1.0);
        }
        return {
          ...major,
          matchScore,
          description: MAJOR_DESCRIPTIONS[major.name] || `${major.name}에서는 ${major.college} 계열의 전문 지식과 역량을 키울 수 있습니다.`,
          matchReason: generateMatchReason(scores, major.vec, major.name, displayName),
        };
      })
      .filter(m => m.matchScore > 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [scores, displayName, interestedMajorKeys, interestVec]);

  // Adjusted recommendations (with supplementary applied)
  const adjustedMajors = useMemo(() => {
    if (!supplementaryData) return originalMajors;

    return MAJORS
      .map(major => {
        let matchScore = calculateAdjustedMajorMatch(adjustedScores, major.vec, major.college);
        // Apply interested major bonus
        if (interestedMajorKeys.length > 0) {
          if (interestedMajorKeys.includes(major.key)) {
            matchScore += 0.08;
          } else if (Object.keys(interestVec).length > 0) {
            matchScore += cosineSimilarity(major.vec, interestVec) * 0.12;
          }
          matchScore = Math.min(matchScore, 1.0);
        }
        return {
          ...major,
          matchScore,
          description: MAJOR_DESCRIPTIONS[major.name] || `${major.name}에서는 ${major.college} 계열의 전문 지식과 역량을 키울 수 있습니다.`,
          matchReason: generateMatchReason(adjustedScores, major.vec, major.name, displayName),
        };
      })
      .filter(m => m.matchScore > 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [adjustedScores, supplementaryData, displayName, interestedMajorKeys, interestVec]);

  // Active recommendations based on toggle
  const recommendedMajors = applySupplementary ? adjustedMajors : originalMajors;

  // Get selected major for dual radar chart
  const selectedMajor = recommendedMajors[selectedMajorIndex] || recommendedMajors[0];

  // 🆕 직무 추천 계산 (RIASEC + 전공 연관성)
  const recommendedRoles = useMemo(() => {
    const topMajor = recommendedMajors[0];
    // 전공 정보가 있으면 전공-직무 연관성 반영
    if (topMajor) {
      return recommendRoles(
        activeScores,
        8, // 상위 8개 직무
        topMajor.key,
        topMajor.cluster
      );
    }
    // 전공 정보가 없으면 순수 RIASEC 기반 추천
    return recommendRoles(activeScores, 8);
  }, [activeScores, recommendedMajors]);

  // Standardize both profiles to 0-100 scale based on their own max values
  // This makes the shapes comparable rather than the absolute values
  const userMax = Math.max(...dimensions.map(d => activeScores[d])) || 1;
  const majorMax = selectedMajor ? Math.max(...dimensions.map(d => selectedMajor.vec[d] || 0)) || 1 : 1;

  // Chart data with both profiles standardized to percentage of their own max
  const chartData = dimensions.map(dim => ({
    dimension: RIASEC_LABELS[dim].name,
    userScore: Math.round((activeScores[dim] / userMax) * 100),
    majorScore: selectedMajor ? Math.round(((selectedMajor.vec[dim] || 0) / majorMax) * 100) : 0,
  }));

  // Generate 3-code explanation
  const codeExplanation = {
    first: CODE_POSITION_EXPLANATIONS[top3[0].dim].primary,
    second: CODE_POSITION_EXPLANATIONS[top3[1].dim].secondary,
    third: CODE_POSITION_EXPLANATIONS[top3[2].dim].tertiary,
  };

  return (
    <div
      className="min-h-screen py-8 px-4 lg:py-12 lg:px-8"
      style={{ backgroundColor: COLORS.bg, wordBreak: 'keep-all' }}
    >

      {/* PDF Content Container */}
      <div ref={pdfContentRef} className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto relative"
        >
          {/* PDF Export Button - 결과 컨텐츠 우측 상단 */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="absolute top-0 right-0 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition-all duration-300"
            style={{
              backgroundColor: isGeneratingPDF ? '#F1F5F9' : COLORS.surface,
              color: isGeneratingPDF ? COLORS.muted : COLORS.text.primary,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {isGeneratingPDF ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF 저장</span>
              </>
            )}
          </motion.button>
          {/* Participant Name Header */}
          {participantName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <p className="text-sm mb-2" style={{ color: COLORS.text.muted }}>검사자</p>
              <h2
                className="text-2xl lg:text-3xl font-bold"
                style={{ color: COLORS.primary }}
              >
                {participantName}
              </h2>
              <p className="text-sm mt-2" style={{ color: COLORS.text.muted }}>
                검사일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </motion.div>
          )}

          {/* Hero Section - PC: Two columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left: Profile Header with Code Explanation */}
              <div
                className="lg:w-1/2 px-6 py-8 lg:px-10 lg:py-12 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
              >
                <div className="relative z-10">
                  {/* Header */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xs font-medium tracking-widest uppercase mb-4"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    MJU 전공 진로 적합도 유형
                  </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-baseline gap-3 mb-6"
                >
                  <h1
                    className="text-5xl lg:text-6xl font-bold tracking-wider text-white"
                    style={{
                      fontFamily: "'Pretendard', sans-serif",
                      letterSpacing: '0.15em',
                      textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                    }}
                  >
                    {riasecCode}
                  </h1>
                  <span
                    className="text-lg lg:text-xl font-medium"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    형 인재입니다.
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-2 mb-8"
                >
                  {top3.map((t) => (
                    <span
                      key={t.dim}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {RIASEC_LABELS[t.dim].name}
                    </span>
                  ))}
                </motion.div>

                {/* 3-Code Explanation inside hero - Enhanced */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 pt-6 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {/* First Code */}
                  <div
                    className="flex items-start gap-4 p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg"
                      style={{
                        backgroundColor: RIASEC_LABELS[top3[0].dim].color,
                        boxShadow: `0 4px 20px ${RIASEC_LABELS[top3[0].dim].color}50`,
                      }}
                    >
                      <span className="text-white">{top3[0].dim}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                        핵심 특성 · {RIASEC_LABELS[top3[0].dim].name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {codeExplanation.first}
                      </p>
                    </div>
                  </div>

                  {/* Second Code */}
                  <div className="flex items-start gap-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: RIASEC_LABELS[top3[1].dim].color }}
                    >
                      <span className="text-white">{top3[1].dim}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        보조 특성 · {RIASEC_LABELS[top3[1].dim].name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {codeExplanation.second}
                      </p>
                    </div>
                  </div>

                  {/* Third Code */}
                  <div className="flex items-start gap-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ backgroundColor: RIASEC_LABELS[top3[2].dim].color }}
                    >
                      <span className="text-white">{top3[2].dim}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        영향 특성 · {RIASEC_LABELS[top3[2].dim].name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {codeExplanation.third}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <p className="text-xs font-medium tracking-wide mt-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  RIASEC Profile · 75문항 검사 결과
                </p>
              </div>
            </div>

            {/* Right: Radar Chart */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
              {/* Supplementary Profile Toggle - only show when data exists */}
              {isComplete && supplementaryData && (
                <div className="w-full mb-4">
                  <button
                    onClick={() => setApplySupplementary(!applySupplementary)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                    style={{
                      backgroundColor: applySupplementary ? `${COLORS.primary}10` : COLORS.surface,
                      border: `1px solid ${applySupplementary ? COLORS.primary : COLORS.card.border}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-5 rounded-full relative transition-all duration-300"
                        style={{
                          backgroundColor: applySupplementary ? COLORS.primary : '#CBD5E1',
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                          style={{
                            left: applySupplementary ? '22px' : '2px',
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: applySupplementary ? COLORS.primary : COLORS.text.secondary }}
                      >
                        보완 프로파일 적용
                      </span>
                    </div>
                    {applySupplementary && (
                      <span
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ backgroundColor: COLORS.primary, color: '#FFFFFF' }}
                      >
                        적용됨
                      </span>
                    )}
                  </button>
                  <p className="text-xs mt-2 px-1" style={{ color: COLORS.text.muted }}>
                    자기효능감과 선호 분야를 반영하여 추천 결과를 조정합니다
                  </p>
                </div>
              )}

              <div className="w-full h-80 lg:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} margin={{ top: 30, right: 50, bottom: 30, left: 50 }}>
                    <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: COLORS.text.secondary, fontSize: 14, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: COLORS.text.muted, fontSize: 11 }}
                      tickCount={5}
                      axisLine={false}
                    />
                    {/* User profile */}
                    <Radar
                      name={applySupplementary && supplementaryData ? "보완 적용 프로파일" : "나의 프로파일"}
                      dataKey="userScore"
                      stroke={applySupplementary && supplementaryData ? COLORS.accent : COLORS.primary}
                      fill={applySupplementary && supplementaryData ? 'rgba(232, 184, 109, 0.2)' : COLORS.chart.fill}
                      strokeWidth={2}
                    />
                    {/* Major profile */}
                    {selectedMajor && (
                      <Radar
                        name={selectedMajor.name}
                        dataKey="majorScore"
                        stroke={COLORS.accent}
                        fill="rgba(251, 191, 36, 0.2)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    )}
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}`, name]}
                      contentStyle={{
                        backgroundColor: COLORS.surface,
                        border: `1px solid ${COLORS.card.border}`,
                        borderRadius: '12px',
                        padding: '10px 14px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      labelStyle={{ color: COLORS.text.primary }}
                      itemStyle={{ color: COLORS.text.secondary }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => (
                        <span style={{ color: COLORS.text.secondary, fontSize: '12px' }}>{value}</span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* Major selector for dual chart */}
              {recommendedMajors.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {recommendedMajors.map((major, idx) => (
                    <button
                      key={major.key}
                      onClick={() => setSelectedMajorIndex(idx)}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300"
                      style={{
                        backgroundColor: selectedMajorIndex === idx ? COLORS.primary : COLORS.surface,
                        color: selectedMajorIndex === idx ? '#FFFFFF' : COLORS.text.secondary,
                        border: `1px solid ${selectedMajorIndex === idx ? COLORS.primary : COLORS.card.border}`,
                        boxShadow: selectedMajorIndex === idx ? `0 4px 12px ${COLORS.primary}30` : 'none',
                      }}
                    >
                      {idx + 1}. {major.name}
                    </button>
                  ))}
                </div>
              )}
              {/* Chart explanation */}
              <p className="text-center mt-4 px-4" style={{ color: COLORS.text.muted, fontSize: '10px', lineHeight: '1.4' }}>
                ※ 두 프로파일 모두 상대적 비율로 표준화되어 형태를 비교합니다.
                각 축의 100%는 해당 프로파일 내 가장 높은 점수를 기준으로 합니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommended Majors - Full Width with Enhanced Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2
                className="text-2xl lg:text-3xl font-bold"
                style={{
                  color: COLORS.primary,
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                추천 학과
              </h2>
              <p className="text-sm mt-2" style={{ color: COLORS.text.muted }}>
                {applySupplementary && supplementaryData
                  ? '보완 프로파일 적용 · 자기효능감 및 선호 분야 반영'
                  : 'RIASEC 프로파일 기반 맞춤 추천'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {applySupplementary && supplementaryData && (
                <span
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: `${COLORS.accent}15`,
                    color: COLORS.accent,
                    border: `1px solid ${COLORS.accent}30`,
                  }}
                >
                  보완 적용
                </span>
              )}
              <span
                className="text-xs font-bold px-4 py-2 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                  color: '#FFFFFF',
                }}
              >
                TOP {recommendedMajors.length}
              </span>
            </div>
          </div>

          {/* Comparison indicator when supplementary changes recommendations */}
          {applySupplementary && supplementaryData && (
            (() => {
              const originalNames = originalMajors.map(m => m.name);
              const adjustedNames = adjustedMajors.map(m => m.name);
              const hasChanges = originalNames.join(',') !== adjustedNames.join(',');
              const newMajors = adjustedNames.filter(n => !originalNames.includes(n));

              if (!hasChanges) return null;

              return (
                <div
                  className="mb-6 p-4 rounded-xl"
                  style={{
                    backgroundColor: `${COLORS.accent}08`,
                    border: `1px solid ${COLORS.accent}20`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.primary }}>
                        보완 프로파일 적용으로 추천이 변경되었습니다
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                        자기효능감과 선호 분야를 반영한 결과입니다
                      </p>
                    </div>
                    {newMajors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: COLORS.text.muted }}>새로 추천:</span>
                        {newMajors.map((name, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{
                              backgroundColor: COLORS.accent,
                              color: '#FFFFFF',
                            }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {recommendedMajors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {recommendedMajors.map((major, index) => {
                const matchPercent = (major.matchScore * 100).toFixed(0);
                const medalColors = [
                  { bg: COLORS.accent, text: '#FFFFFF', glow: `${COLORS.accent}40` },
                  { bg: '#94A3B8', text: '#FFFFFF', glow: 'rgba(148, 163, 184, 0.3)' },
                  { bg: '#CD7F32', text: '#FFFFFF', glow: 'rgba(205, 127, 50, 0.3)' },
                ];
                const medal = medalColors[index] || { bg: '#F1F5F9', text: COLORS.text.secondary, glow: 'none' };
                const careerPaths = MAJOR_CAREERS[major.name] || ['관련 직무 정보 준비중'];
                const isExpanded = expandedProfiles.has(index);

                return (
                  <motion.div
                    key={major.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="p-6 rounded-2xl transition-all duration-300 flex flex-col cursor-pointer relative overflow-hidden"
                    style={{
                      border: selectedMajorIndex === index ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.card.border}`,
                      backgroundColor: selectedMajorIndex === index ? `${COLORS.primary}08` : COLORS.surface,
                      boxShadow: selectedMajorIndex === index
                        ? `0 8px 24px ${COLORS.primary}20`
                        : '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    onClick={() => setSelectedMajorIndex(index)}
                  >
                    {/* Top accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{
                        background: index === 0 ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` : medal.bg,
                      }}
                    />

                    {/* Header row */}
                    <div className="flex items-start justify-between mb-5 mt-2">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl"
                          style={{
                            background: index === 0 ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` : medal.bg,
                            color: medal.text,
                            boxShadow: `0 4px 12px ${medal.glow}`,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg" style={{ color: COLORS.text.primary }}>
                            {major.name}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: COLORS.text.muted }}>
                            {major.college}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: COLORS.primary }}
                        >
                          {matchPercent}%
                        </span>
                        <p className="text-xs" style={{ color: COLORS.text.muted }}>
                          적합도
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-relaxed mb-5 flex-grow" style={{ color: COLORS.text.secondary }}>
                      {major.description}
                    </p>

                    {/* Career Paths */}
                    <div className="mb-5">
                      <h4 className="text-xs font-bold mb-3" style={{ color: COLORS.text.primary }}>
                        주요 진로
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {careerPaths.slice(0, 4).map((career, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{
                              backgroundColor: `${COLORS.primary}20`,
                              color: COLORS.primary,
                              border: `1px solid ${COLORS.primary}30`,
                            }}
                          >
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Match reason */}
                    <div
                      className="px-4 py-3 rounded-xl text-xs leading-relaxed mb-4"
                      style={{
                        backgroundColor: `${COLORS.secondary}15`,
                        color: COLORS.text.secondary,
                        border: `1px solid ${COLORS.secondary}25`,
                      }}
                    >
                      <span className="font-bold" style={{ color: COLORS.secondary }}>왜 맞을까요?</span> {major.matchReason}
                    </div>

                    {/* Collapsible RIASEC Profile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProfile(index);
                      }}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        color: COLORS.text.muted,
                        backgroundColor: '#F8FAFC',
                        border: `1px solid ${COLORS.card.border}`,
                      }}
                    >
                      <span>RIASEC 프로파일 {isExpanded ? '숨기기' : '보기'}</span>
                      <motion.svg
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-2.5">
                            {dimensions.map(dim => {
                              const dimValue = (major.vec[dim] || 0) * 100;
                              const label = RIASEC_LABELS[dim];
                              return (
                                <div key={dim} className="flex items-center gap-3">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                    style={{ backgroundColor: label.color }}
                                  >
                                    {dim}
                                  </div>
                                  <div
                                    className="flex-1 h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: '#E2E8F0' }}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${dimValue}%` }}
                                      transition={{ duration: 0.4 }}
                                      className="h-full rounded-full"
                                      style={{ backgroundColor: label.color }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium w-10 text-right" style={{ color: COLORS.text.secondary }}>
                                    {dimValue.toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* External link */}
                    {major.url && (
                      <a
                        href={major.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium transition-all duration-200 hover:opacity-80"
                        style={{
                          color: COLORS.primary,
                          backgroundColor: `${COLORS.primary}15`,
                          border: `1px solid ${COLORS.primary}30`,
                        }}
                      >
                        학과 홈페이지 방문
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F1F5F9' }}>
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: COLORS.primary }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p style={{ color: COLORS.text.muted }}>추천 학과를 계산 중입니다...</p>
            </div>
          )}
        </motion.div>

        {/* 🆕 추천 직무 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-xl lg:text-2xl font-bold"
                style={{
                  color: COLORS.primary,
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                추천 직무
              </h2>
              <p className="text-sm mt-1" style={{ color: COLORS.text.muted }}>
                RIASEC 적성과 추천 전공을 기반으로 분석한 적합 직무입니다
              </p>
            </div>
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold self-start"
              style={{
                background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                color: '#FFFFFF',
              }}
            >
              TOP {recommendedRoles.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedRoles.map((role, index) => {
              const matchPercent = Math.round(role.matchScore * 100);
              const workpediaUrl = getWorkpediaJobUrl(role.name);

              return (
                <motion.div
                  key={role.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-5 rounded-2xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.card.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background: role.isRelatedToMajor
                        ? `linear-gradient(135deg, ${COLORS.accent} 0%, #F59E0B 100%)`
                        : `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                    }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{
                          background: index < 3
                            ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                            : '#E2E8F0',
                          color: index < 3 ? '#FFFFFF' : COLORS.text.secondary,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm leading-tight" style={{ color: COLORS.text.primary }}>
                          {role.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: '#E2E8F0' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchPercent}%` }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold" style={{ color: COLORS.primary }}>
                      {matchPercent}%
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {role.isRelatedToMajor && (
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: `${COLORS.accent}20`,
                          color: '#B45309',
                          border: `1px solid ${COLORS.accent}40`,
                        }}
                      >
                        ✨ 전공 연관
                      </span>
                    )}
                    {role.matchReasons.slice(0, 1).map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: `${COLORS.primary}10`,
                          color: COLORS.text.secondary,
                        }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Profile Strength */}
                  {role.profileStrength && (
                    <p className="text-xs leading-relaxed mb-3" style={{ color: COLORS.text.muted }}>
                      {role.profileStrength}
                    </p>
                  )}

                  {/* External Link */}
                  {workpediaUrl && (
                    <a
                      href={workpediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:opacity-80"
                      style={{
                        color: COLORS.secondary,
                        backgroundColor: `${COLORS.secondary}10`,
                        border: `1px solid ${COLORS.secondary}20`,
                      }}
                    >
                      직업 상세정보
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>

        </motion.div>

        {/* Top Type Descriptions - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-6 lg:p-8 mb-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.card.border}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            className="text-xl lg:text-2xl font-bold mb-8"
            style={{
              color: COLORS.primary,
              fontFamily: "'Pretendard', sans-serif",
            }}
          >
            나의 주요 흥미 특성
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {top3.map((item, index) => {
              const label = RIASEC_LABELS[item.dim];
              return (
                <motion.div
                  key={item.dim}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="p-6 rounded-2xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.card.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: label.color }}
                  />

                  <div className="flex items-center gap-4 mb-5 mt-1">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                      style={{
                        backgroundColor: label.color,
                        boxShadow: `0 6px 20px ${label.color}50`,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: COLORS.text.primary }}>
                        {item.dim} · {label.name}
                      </h3>
                      <span className="text-xs" style={{ color: COLORS.text.muted }}>
                        {label.fullName}
                      </span>
                    </div>
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: COLORS.text.secondary }}
                  >
                    {label.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {label.careers.map(career => (
                      <span
                        key={career}
                        className="text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                          border: `1px solid ${label.color}30`,
                        }}
                      >
                        {career}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Supplementary Survey Results - Only shown when isComplete and supplementaryData exists */}
        {isComplete && supplementaryData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-3xl p-6 lg:p-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.card.border}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-xl lg:text-2xl font-bold"
                style={{ color: COLORS.primary }}
              >
                보완 프로파일 분석
              </h3>
              <span
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: `${COLORS.secondary}15`, color: COLORS.secondary }}
              >
                심층 분석
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Value Scores Card */}
              {supplementaryData.valueScores && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    직업가치관
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(supplementaryData.valueScores)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([key, score], idx) => {
                        const koreanLabels: Record<string, string> = {
                          achievement: '성취',
                          recognition: '인정',
                          independence: '자율',
                          social: '사회공헌',
                          security: '안정',
                          economic: '경제',
                          growth: '성장',
                        };
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                              {idx + 1}. {koreanLabels[key] || key}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(score / 5) * 100}%`,
                                    backgroundColor: idx === 0 ? COLORS.accent : idx === 1 ? COLORS.secondary : COLORS.muted,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                                {score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Career Decision Card */}
              {supplementaryData.careerDecision && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    진로결정 상태
                  </h4>
                  <div className="space-y-3">
                    <div
                      className="text-center py-3 px-4 rounded-xl"
                      style={{
                        backgroundColor: supplementaryData.careerDecision.level === '확정'
                          ? '#10B98120' : supplementaryData.careerDecision.level === '탐색'
                          ? `${COLORS.accent}20` : '#EF444420',
                        color: supplementaryData.careerDecision.level === '확정'
                          ? '#10B981' : supplementaryData.careerDecision.level === '탐색'
                          ? COLORS.accent : '#EF4444',
                      }}
                    >
                      <p className="text-lg font-bold">{supplementaryData.careerDecision.level}</p>
                      <p className="text-xs mt-1">결정 수준</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.text.muted }}>확신도</span>
                      <span className="font-medium" style={{ color: COLORS.primary }}>
                        {Math.round(supplementaryData.careerDecision.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Self-Efficacy Card */}
              {supplementaryData.selfEfficacy && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    RIASEC별 자기효능감
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['R', 'I', 'A', 'S', 'E', 'C'] as const).map((code) => {
                      const score = supplementaryData.selfEfficacy?.[code] || 0;
                      return (
                        <div
                          key={code}
                          className="text-center p-2 rounded-lg"
                          style={{ backgroundColor: `${RIASEC_LABELS[code].color}15` }}
                        >
                          <div
                            className="w-6 h-6 mx-auto rounded-md flex items-center justify-center text-xs font-bold text-white mb-1"
                            style={{ backgroundColor: RIASEC_LABELS[code].color }}
                          >
                            {code}
                          </div>
                          <p className="text-sm font-semibold" style={{ color: RIASEC_LABELS[code].color }}>
                            {score.toFixed(1)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preferences Card */}
              {supplementaryData.preferences && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    선호 스타일
                  </h4>
                  <div className="space-y-2">
                    {supplementaryData.preferences.fieldPreference && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }}>
                          분야
                        </span>
                        <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                          {supplementaryData.preferences.fieldPreference}
                        </span>
                      </div>
                    )}
                    {supplementaryData.preferences.workStyle && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}10`, color: COLORS.secondary }}>
                          업무
                        </span>
                        <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                          {supplementaryData.preferences.workStyle}
                        </span>
                      </div>
                    )}
                    {supplementaryData.preferences.environmentPreference && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${COLORS.accent}10`, color: COLORS.accent }}>
                          환경
                        </span>
                        <span className="text-sm font-medium" style={{ color: COLORS.text.secondary }}>
                          {supplementaryData.preferences.environmentPreference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Value Ranking Card */}
              {supplementaryData.valueRanking && Object.keys(supplementaryData.valueRanking).length > 0 && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    가치 우선순위
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(supplementaryData.valueRanking)
                      .sort(([, a], [, b]) => a - b)
                      .map(([value, rank]) => (
                        <div key={value} className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{
                              backgroundColor: rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#CD7F32',
                            }}
                          >
                            {rank}
                          </span>
                          <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                            {value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Role Model Card */}
              {supplementaryData.roleModel && (supplementaryData.roleModel.name || (supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0)) && (
                <div
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.card.border}` }}
                >
                  <h4 className="font-semibold mb-3" style={{ color: COLORS.primary }}>
                    롤모델
                  </h4>
                  {supplementaryData.roleModel.name && (
                    <p className="text-lg font-semibold mb-2" style={{ color: COLORS.primary }}>
                      {supplementaryData.roleModel.name}
                    </p>
                  )}
                  {supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {supplementaryData.roleModel.traits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            backgroundColor: `${COLORS.accent}15`,
                            color: COLORS.accent,
                          }}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons - Conditional based on isComplete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl p-8 lg:p-12 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: '0 8px 30px rgba(30, 58, 95, 0.2)',
          }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="lg:max-w-lg">
              {isComplete ? (
                <>
                  <h2
                    className="text-2xl lg:text-3xl font-bold mb-4 text-white"
                    style={{ fontFamily: "'Pretendard', sans-serif" }}
                  >
                    {displayName}님의 프로파일 분석이 완료되었습니다
                  </h2>
                  <p className="leading-relaxed text-white/85">
                    RIASEC 검사와 보완 설문 결과를 바탕으로 맞춤형 진로 분석이 제공되었습니다
                  </p>
                </>
              ) : (
                <>
                  <h2
                    className="text-2xl lg:text-3xl font-bold mb-4 text-white"
                    style={{ fontFamily: "'Pretendard', sans-serif" }}
                  >
                    더 정확한 분석을 원하시나요?
                  </h2>
                  <p className="leading-relaxed text-white/85">
                    보완 설문을 통해 직업가치관, 자기효능감 등 추가적인 분석이 가능합니다
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isComplete ? (
                <>
                  {/* 보완검사 안한 경우: 보완검사하기 버튼, 한 경우: 메인으로 버튼 */}
                  {!supplementaryData && onStartSupplementary ? (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartSupplementary}
                      className="px-10 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: COLORS.primary,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      보완검사하기
                    </motion.button>
                  ) : onNavigate && (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate('dashboard')}
                      className="px-10 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: COLORS.primary,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      메인으로
                    </motion.button>
                  )}
                  {onRestart && (
                    <motion.button
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onRestart}
                      className="px-10 py-4 rounded-2xl font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      다시 검사하기
                    </motion.button>
                  )}
                </>
              ) : (
                <>
                  {onContinue && (
                    <motion.button
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onContinue}
                      className="px-10 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: COLORS.primary,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      보완문항 응답하기
                    </motion.button>
                  )}
                  {onSkip && (
                    <motion.button
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onSkip}
                      className="px-10 py-4 rounded-2xl font-semibold transition-all duration-300"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      지금은 건너뛰기
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-sm" style={{ color: COLORS.text.muted }}>
            RIASEC 검사 결과는 참고용이며, 전문 상담과 함께 활용하시기 바랍니다
          </p>
        </div>
      </motion.div>
      </div> {/* End of pdfContentRef */}

      {/* PDF Export View - Hidden, rendered only during PDF generation */}
      {showPDFView && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* ==================== PAGE 1 (가독성 개선 - 컴팩트) ==================== */}
          <div
            id="pdf-page-1"
            style={{
              width: '800px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: 'keep-all',
            }}
          >
            {/* PDF Header */}
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.pdf.primary} 0%, ${COLORS.pdf.secondary} 100%)`,
              padding: '16px 24px',
              borderRadius: '10px',
              marginBottom: '16px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>MJU 전공 진로 적합도 검사</p>
                  <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>RIASEC 검사 결과보고서</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {participantName && (
                    <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{participantName}</p>
                  )}
                  <p style={{ fontSize: '12px', opacity: 0.85 }}>
                    {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: RIASEC Code & Chart Side by Side */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.pdf.primary, marginBottom: '12px' }}>
                1. 나의 흥미 프로파일
              </h2>

              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Left: Code & Explanation */}
                <div style={{ flex: 1 }}>
                  {/* Big Code Display */}
                  <div style={{
                    background: `linear-gradient(135deg, ${COLORS.pdf.primary} 0%, ${COLORS.pdf.secondary} 100%)`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '12px',
                  }}>
                    <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>나의 RIASEC CODE</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '30px', fontWeight: 'bold', letterSpacing: '5px' }}>{riasecCode}</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>형 인재입니다.</span>
                    </div>
                  </div>

                  {/* Code Explanation - 가독성 개선 */}
                  {top3.map((t, idx) => (
                    <div key={t.dim} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      marginBottom: idx < 2 ? '8px' : 0,
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}>
                      {/* Badge with SVG */}
                      <svg width="26" height="26" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <rect width="26" height="26" rx="5" fill={RIASEC_LABELS[t.dim].color} />
                        <text x="13" y="13" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="bold">
                          {t.dim}
                        </text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B', marginBottom: '2px' }}>
                          {idx === 0 ? '주요' : idx === 1 ? '보조' : '잠재'}: {RIASEC_LABELS[t.dim].name}
                        </p>
                        <p style={{ fontSize: '10px', color: '#334155', lineHeight: '1.45', margin: 0 }}>
                          {idx === 0 ? codeExplanation.first : idx === 1 ? codeExplanation.second : codeExplanation.third}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: SVG Radar Chart */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                  <svg viewBox="0 0 300 260" style={{ width: '100%', height: 'auto' }}>
                    {/* Background hexagon grid */}
                    {[100, 80, 60, 40, 20].map((r) => (
                      <polygon
                        key={r}
                        points={dimensions.map((_, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const x = 150 + r * Math.cos(angle);
                          const y = 130 + r * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Axis lines */}
                    {dimensions.map((_, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      return (
                        <line
                          key={i}
                          x1="150"
                          y1="130"
                          x2={150 + 100 * Math.cos(angle)}
                          y2={130 + 100 * Math.sin(angle)}
                          stroke="#E2E8F0"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* User profile polygon */}
                    <polygon
                      points={dimensions.map((dim, i) => {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const value = (scores[dim] / userMax) * 100;
                        const x = 150 + value * Math.cos(angle);
                        const y = 130 + value * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="rgba(30, 58, 95, 0.3)"
                      stroke={COLORS.pdf.primary}
                      strokeWidth="2"
                    />

                    {/* Major profile polygon (if selected) */}
                    {selectedMajor && (
                      <polygon
                        points={dimensions.map((dim, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const value = ((selectedMajor.vec[dim] || 0) / majorMax) * 100;
                          const x = 150 + value * Math.cos(angle);
                          const y = 130 + value * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="rgba(232, 184, 109, 0.3)"
                        stroke={COLORS.pdf.accent}
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                    )}

                    {/* Data points */}
                    {dimensions.map((dim, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      const value = (scores[dim] / userMax) * 100;
                      const x = 150 + value * Math.cos(angle);
                      const y = 130 + value * Math.sin(angle);
                      return (
                        <circle
                          key={dim}
                          cx={x}
                          cy={y}
                          r="4"
                          fill={COLORS.pdf.primary}
                        />
                      );
                    })}

                    {/* Labels */}
                    {dimensions.map((dim, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      const x = 150 + 115 * Math.cos(angle);
                      const y = 130 + 115 * Math.sin(angle);
                      return (
                        <g key={dim}>
                          <circle cx={x} cy={y} r="14" fill={RIASEC_LABELS[dim].color} />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {dim}
                          </text>
                        </g>
                      );
                    })}

                    {/* Legend */}
                    <g transform="translate(150, 245)" textAnchor="middle">
                      <rect x="-70" y="-5" width="10" height="10" fill="rgba(30, 58, 95, 0.3)" stroke={COLORS.pdf.primary} strokeWidth="1" rx="2" />
                      <text x="-55" y="0" fontSize="10" fill="#334155" dominantBaseline="central" textAnchor="start">나의 프로파일</text>
                      {selectedMajor && (
                        <>
                          <rect x="15" y="-5" width="10" height="10" fill="rgba(232, 184, 109, 0.3)" stroke={COLORS.pdf.accent} strokeWidth="1" rx="2" />
                          <text x="30" y="0" fontSize="10" fill="#334155" dominantBaseline="central" textAnchor="start">{selectedMajor.name}</text>
                        </>
                      )}
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Section 2: Score Details */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              padding: '16px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.pdf.primary, marginBottom: '12px' }}>
                2. 유형별 상세 점수
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {sortedDimensions.map((item, idx) => (
                  <div key={item.dim} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    border: `2px solid ${idx < 3 ? RIASEC_LABELS[item.dim].color : '#E2E8F0'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {/* Badge with SVG */}
                      <svg width="24" height="24" style={{ flexShrink: 0 }}>
                        <rect width="24" height="24" rx="5" fill={RIASEC_LABELS[item.dim].color} />
                        <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="bold">
                          {item.dim}
                        </text>
                      </svg>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B' }}>
                        {RIASEC_LABELS[item.dim].name} ({RIASEC_LABELS[item.dim].fullName})
                      </span>
                      {idx < 3 && (
                        <svg width="40" height="18" style={{ marginLeft: 'auto' }}>
                          <rect width="40" height="18" rx="4" fill={RIASEC_LABELS[item.dim].color} />
                          <text x="20" y="9" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="600">
                            TOP {idx + 1}
                          </text>
                        </svg>
                      )}
                    </div>
                    <p style={{ fontSize: '10px', color: '#334155', marginBottom: '8px', lineHeight: '1.4' }}>
                      {RIASEC_LABELS[item.dim].description}
                    </p>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(item.score / Math.max(...sortedDimensions.map(d => d.score))) * 100}%`,
                        height: '100%',
                        backgroundColor: RIASEC_LABELS[item.dim].color,
                        borderRadius: '3px',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: '#64748B' }}>
                        대표 직업: {RIASEC_LABELS[item.dim].careers.slice(0, 3).join(', ')}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.primary }}>
                        {item.score.toFixed(1)}점
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ==================== PAGE 2 (가독성 개선 - 컴팩트) ==================== */}
          <div
            id="pdf-page-2"
            style={{
              width: '800px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: 'keep-all',
            }}
          >
            {/* Section 3: Recommended Majors */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '16px' }}>
                3. 추천 전공 분석
              </h2>

              {recommendedMajors.map((major, idx) => (
                <div key={major.name} style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                  border: '1px solid #E2E8F0',
                }}>
                  {/* Major Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    {/* Ranking badge with SVG for perfect centering */}
                    <svg width="36" height="36" style={{ flexShrink: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={COLORS.primary} />
                          <stop offset="100%" stopColor={COLORS.secondary} />
                        </linearGradient>
                      </defs>
                      <rect width="36" height="36" rx="10" fill={`url(#grad-${idx})`} />
                      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="18" fontWeight="bold">
                        {idx + 1}
                      </text>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.primary, margin: 0 }}>
                          {major.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: COLORS.muted }}>
                          {major.college}
                        </span>
                        {/* Match score badge with SVG for perfect centering */}
                        <svg width="75" height="22">
                          <rect width="75" height="22" rx="10" fill={COLORS.accent} />
                          <text x="37.5" y="11" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="600">
                            적합도 {Math.round(major.matchScore * 100)}%
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Major Content Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '16px' }}>
                    {/* Left: Description & Match Reason */}
                    <div>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '10px',
                        border: '1px solid #E2E8F0',
                      }}>
                        <p style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                          전공 소개
                        </p>
                        <p style={{ fontSize: '11px', color: '#334155', lineHeight: '1.5' }}>
                          {major.description}
                        </p>
                      </div>
                      <div style={{
                        backgroundColor: '#F0FDF4',
                        borderRadius: '8px',
                        padding: '12px',
                        borderLeft: `3px solid #10B981`,
                      }}>
                        <p style={{ fontSize: '10px', color: '#166534', fontWeight: '600', marginBottom: '6px' }}>
                          왜 맞을까요?
                        </p>
                        <p style={{ fontSize: '11px', color: '#15803D', lineHeight: '1.5' }}>
                          {major.matchReason}
                        </p>
                      </div>
                    </div>

                    {/* Right: Mini Radar Comparison */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '10px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <p style={{ fontSize: '9px', fontWeight: '600', color: '#64748B', marginBottom: '6px', textAlign: 'center' }}>
                        프로파일 비교
                      </p>
                      <svg viewBox="0 0 160 140" style={{ width: '100%', height: 'auto' }}>
                        {/* Mini hexagon grid */}
                        {[50, 35, 20].map((r) => (
                          <polygon
                            key={r}
                            points={dimensions.map((_, i) => {
                              const angle = (Math.PI / 3) * i - Math.PI / 2;
                              const x = 80 + r * Math.cos(angle);
                              const y = 60 + r * Math.sin(angle);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="0.5"
                          />
                        ))}

                        {/* User profile */}
                        <polygon
                          points={dimensions.map((dim, i) => {
                            const angle = (Math.PI / 3) * i - Math.PI / 2;
                            const value = (scores[dim] / userMax) * 50;
                            const x = 80 + value * Math.cos(angle);
                            const y = 60 + value * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="rgba(30, 58, 95, 0.25)"
                          stroke={COLORS.primary}
                          strokeWidth="1.5"
                        />

                        {/* Major profile */}
                        <polygon
                          points={dimensions.map((dim, i) => {
                            const angle = (Math.PI / 3) * i - Math.PI / 2;
                            const majorMaxVal = Math.max(...dimensions.map(d => major.vec[d] || 0)) || 1;
                            const value = ((major.vec[dim] || 0) / majorMaxVal) * 50;
                            const x = 80 + value * Math.cos(angle);
                            const y = 60 + value * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="rgba(232, 184, 109, 0.25)"
                          stroke={COLORS.accent}
                          strokeWidth="1.5"
                          strokeDasharray="3,1"
                        />

                        {/* Labels */}
                        {dimensions.map((dim, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const x = 80 + 60 * Math.cos(angle);
                          const y = 60 + 60 * Math.sin(angle);
                          return (
                            <text
                              key={dim}
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={RIASEC_LABELS[dim].color}
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {dim}
                            </text>
                          );
                        })}

                        {/* Mini Legend */}
                        <g transform="translate(10, 125)">
                          <rect x="0" y="0" width="8" height="8" fill="rgba(30, 58, 95, 0.25)" stroke={COLORS.primary} strokeWidth="0.5" />
                          <text x="12" y="4" fontSize="7" fill="#334155" dominantBaseline="central">나</text>
                          <rect x="30" y="0" width="8" height="8" fill="rgba(232, 184, 109, 0.25)" stroke={COLORS.accent} strokeWidth="0.5" />
                          <text x="42" y="4" fontSize="7" fill="#334155" dominantBaseline="central">전공</text>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PDF Footer */}
            <div style={{
              borderTop: '2px solid #E2E8F0',
              paddingTop: '14px',
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <p style={{ fontSize: '9px', color: '#64748B' }}>
                명지대학교 진로교육 프로그램 · RIASEC 검사 결과보고서
              </p>
              <p style={{ fontSize: '9px', color: '#64748B' }}>
                본 결과는 참고용이며, 전문 상담과 함께 활용하시기 바랍니다.
              </p>
            </div>
          </div>

          {/* ==================== PAGE 3: SUPPLEMENTARY PROFILE ==================== */}
          {supplementaryData && (
            <div
              id="pdf-page-3"
              style={{
                width: '800px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
                wordBreak: 'keep-all',
              }}
            >
              {/* Page Header */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '8px' }}>
                  4. 보완 프로파일 분석
                </h2>
                <p style={{ fontSize: '10px', color: '#64748B' }}>
                  심층 설문을 통해 수집된 직업가치관, 진로결정 수준, 자기효능감 등 추가 분석 결과입니다.
                </p>
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Column 1 */}
                <div>
                  {/* Value Scores Card */}
                  {supplementaryData.valueScores && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        직업가치관
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(supplementaryData.valueScores)
                          .sort(([, a], [, b]) => b - a)
                          .map(([key, score], idx) => {
                            const koreanLabels: Record<string, string> = {
                              achievement: '성취',
                              recognition: '인정',
                              independence: '자율',
                              social: '사회공헌',
                              security: '안정',
                              economic: '경제',
                              growth: '성장',
                            };
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', color: '#334155' }}>
                                  {idx + 1}. {koreanLabels[key] || key}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '80px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    backgroundColor: '#E2E8F0',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{
                                      width: `${(score / 5) * 100}%`,
                                      height: '100%',
                                      borderRadius: '4px',
                                      backgroundColor: idx < 3 ? COLORS.accent : COLORS.muted,
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '12px', color: '#64748B', width: '28px', textAlign: 'right', fontWeight: '500' }}>
                                    {score.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Self-Efficacy Card */}
                  {supplementaryData.selfEfficacy && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        RIASEC별 자기효능감
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {(['R', 'I', 'A', 'S', 'E', 'C'] as const).map((code) => {
                          const efficacyScore = supplementaryData.selfEfficacy?.[code] || 0;
                          return (
                            <div
                              key={code}
                              style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderRadius: '8px',
                                backgroundColor: `${RIASEC_LABELS[code].color}15`,
                              }}
                            >
                              <div style={{
                                width: '24px',
                                height: '24px',
                                margin: '0 auto 6px',
                                borderRadius: '6px',
                                backgroundColor: RIASEC_LABELS[code].color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{code}</span>
                              </div>
                              <p style={{ fontSize: '12px', fontWeight: 'bold', color: RIASEC_LABELS[code].color }}>
                                {efficacyScore.toFixed(1)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '9px', color: '#64748B', marginTop: '10px', textAlign: 'center' }}>
                        RIASEC 점수와 결합하여 보정된 추천에 반영됩니다 (가중치: 0.3)
                      </p>
                    </div>
                  )}

                  {/* Value Ranking Card */}
                  {supplementaryData.valueRanking && Object.keys(supplementaryData.valueRanking).length > 0 && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        가치 우선순위
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(supplementaryData.valueRanking)
                          .sort(([, a], [, b]) => a - b)
                          .map(([value, rank]) => (
                            <div key={value} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <svg width="28" height="28">
                                <circle cx="14" cy="14" r="14" fill={rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#CD7F32'} />
                                <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="bold">
                                  {rank}
                                </text>
                              </svg>
                              <span style={{ fontSize: '13px', color: '#334155' }}>
                                {value}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2 */}
                <div>
                  {/* Career Decision Card */}
                  {supplementaryData.careerDecision && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        진로결정 상태
                      </h3>
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        borderRadius: '12px',
                        backgroundColor: supplementaryData.careerDecision.level === '확정'
                          ? '#10B98120' : supplementaryData.careerDecision.level === '탐색'
                          ? `${COLORS.accent}20` : '#EF444420',
                        marginBottom: '16px',
                      }}>
                        <p style={{
                          fontSize: '26px',
                          fontWeight: 'bold',
                          color: supplementaryData.careerDecision.level === '확정'
                            ? '#10B981' : supplementaryData.careerDecision.level === '탐색'
                            ? COLORS.accent : '#EF4444',
                          marginBottom: '6px',
                        }}>
                          {supplementaryData.careerDecision.level}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748B' }}>결정 수준</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#64748B' }}>확신도</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '100px',
                            height: '8px',
                            borderRadius: '4px',
                            backgroundColor: '#E2E8F0',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${supplementaryData.careerDecision.confidence * 100}%`,
                              height: '100%',
                              borderRadius: '4px',
                              backgroundColor: supplementaryData.careerDecision.level === '확정' ? '#10B981' : COLORS.accent,
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary }}>
                            {Math.round(supplementaryData.careerDecision.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preferences Card */}
                  {supplementaryData.preferences && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        선호 스타일
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {supplementaryData.preferences.fieldPreference && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: `${COLORS.primary}15`,
                              color: COLORS.primary,
                              fontWeight: '600',
                            }}>
                              분야
                            </span>
                            <span style={{ fontSize: '13px', color: '#334155' }}>
                              {supplementaryData.preferences.fieldPreference}
                            </span>
                          </div>
                        )}
                        {supplementaryData.preferences.workStyle && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: `${COLORS.secondary}15`,
                              color: COLORS.secondary,
                              fontWeight: '600',
                            }}>
                              업무
                            </span>
                            <span style={{ fontSize: '13px', color: '#334155' }}>
                              {supplementaryData.preferences.workStyle}
                            </span>
                          </div>
                        )}
                        {supplementaryData.preferences.environmentPreference && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: `${COLORS.accent}15`,
                              color: COLORS.accent,
                              fontWeight: '600',
                            }}>
                              환경
                            </span>
                            <span style={{ fontSize: '13px', color: '#334155' }}>
                              {supplementaryData.preferences.environmentPreference}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Role Model Card */}
                  {supplementaryData.roleModel && (supplementaryData.roleModel.name || (supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0)) && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #E2E8F0',
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                        롤모델
                      </h3>
                      {supplementaryData.roleModel.name && (
                        <p style={{ fontSize: '17px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '14px' }}>
                          {supplementaryData.roleModel.name}
                        </p>
                      )}
                      {supplementaryData.roleModel.traits && supplementaryData.roleModel.traits.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {supplementaryData.roleModel.traits.map((trait, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '12px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                backgroundColor: `${COLORS.accent}15`,
                                color: COLORS.accent,
                              }}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Adjusted Score Comparison */}
                  {supplementaryData.selfEfficacy && (
                    <div style={{
                      backgroundColor: '#EFF6FF',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '16px',
                      border: '1px solid #BFDBFE',
                    }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E40AF', marginBottom: '12px' }}>
                        보정 점수 비교
                      </h3>
                      <p style={{ fontSize: '9px', color: '#3B82F6', marginBottom: '12px' }}>
                        RIASEC(0.9) + 자기효능감(0.3) Z-score 기반 보정
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dimensions.map((dim) => {
                          const originalScore = scores[dim];
                          const adjustedScore = adjustedScores[dim];
                          const diff = adjustedScore - originalScore;
                          return (
                            <div key={dim} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  backgroundColor: RIASEC_LABELS[dim].color,
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  {dim}
                                </span>
                                <span style={{ fontSize: '12px', color: '#334155' }}>
                                  {RIASEC_LABELS[dim].name}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#64748B' }}>
                                  {originalScore.toFixed(1)}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748B' }}>→</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.primary }}>
                                  {adjustedScore.toFixed(1)}
                                </span>
                                {diff !== 0 && (
                                  <span style={{
                                    fontSize: '11px',
                                    color: diff > 0 ? '#10B981' : '#EF4444',
                                    fontWeight: '600',
                                  }}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF Footer */}
              <div style={{
                borderTop: '2px solid #E2E8F0',
                paddingTop: '18px',
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontSize: '11px', color: '#64748B' }}>
                  명지대학교 진로교육 프로그램 · 보완 프로파일 분석 결과
                </p>
                <p style={{ fontSize: '11px', color: '#64748B' }}>
                  본 결과는 참고용이며, 전문 상담과 함께 활용하시기 바랍니다.
                </p>
              </div>
            </div>
          )}

          {/* ==================== PAGE 4: BEFORE/AFTER COMPARISON ==================== */}
          {supplementaryData && (
            <div
              id="pdf-page-4"
              style={{
                width: '800px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
                wordBreak: 'keep-all',
              }}
            >
              {/* Page Header */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '8px' }}>
                  5. 보완 프로파일 적용 전/후 비교
                </h2>
                <p style={{ fontSize: '10px', color: '#64748B' }}>
                  자기효능감을 반영한 보정 점수와 전공 추천 변화를 비교합니다. (RIASEC 0.9 + 자기효능감 0.3 가중치 적용)
                </p>
              </div>

              {/* Two Column Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Column: Before (Original) */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #E2E8F0',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: COLORS.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>전</span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary }}>
                      보완 프로파일 적용 전
                    </h3>
                  </div>

                  {/* Original Radar Chart */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <svg viewBox="0 0 200 180" style={{ width: '180px', height: '160px' }}>
                      {/* Hexagon grid */}
                      {[60, 45, 30].map((r) => (
                        <polygon
                          key={r}
                          points={dimensions.map((_, i) => {
                            const angle = (Math.PI / 3) * i - Math.PI / 2;
                            const x = 100 + r * Math.cos(angle);
                            const y = 80 + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="0.5"
                        />
                      ))}
                      {/* Original profile */}
                      <polygon
                        points={dimensions.map((dim, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const maxVal = Math.max(...dimensions.map(d => scores[d])) || 1;
                          const value = (scores[dim] / maxVal) * 60;
                          const x = 100 + value * Math.cos(angle);
                          const y = 80 + value * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="rgba(30, 58, 95, 0.3)"
                        stroke={COLORS.primary}
                        strokeWidth="2"
                      />
                      {/* Labels */}
                      {dimensions.map((dim, i) => {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const x = 100 + 75 * Math.cos(angle);
                        const y = 80 + 75 * Math.sin(angle);
                        return (
                          <g key={dim}>
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={RIASEC_LABELS[dim].color}
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {dim}
                            </text>
                            <text
                              x={x}
                              y={y + 12}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={COLORS.muted}
                              fontSize="8"
                            >
                              {scores[dim].toFixed(1)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Original Major Recommendations */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '12px' }}>
                      추천 전공
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {originalMajors.map((major, idx) => (
                        <div
                          key={major.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <svg width="22" height="22">
                            <circle cx="11" cy="11" r="11" fill={COLORS.primary} />
                            <text x="11" y="11" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="bold">
                              {idx + 1}
                            </text>
                          </svg>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E293B' }}>
                              {major.name}
                            </p>
                            <p style={{ fontSize: '9px', color: '#64748B' }}>
                              {major.college}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: COLORS.primary,
                            backgroundColor: `${COLORS.primary}15`,
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}>
                            {Math.round(major.matchScore * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: After (Adjusted) */}
                <div style={{
                  backgroundColor: '#EFF6FF',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid #3B82F6',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>후</span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1E40AF' }}>
                      보완 프로파일 적용 후
                    </h3>
                  </div>

                  {/* Adjusted Radar Chart */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <svg viewBox="0 0 200 180" style={{ width: '180px', height: '160px' }}>
                      {/* Hexagon grid */}
                      {[60, 45, 30].map((r) => (
                        <polygon
                          key={r}
                          points={dimensions.map((_, i) => {
                            const angle = (Math.PI / 3) * i - Math.PI / 2;
                            const x = 100 + r * Math.cos(angle);
                            const y = 80 + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#BFDBFE"
                          strokeWidth="0.5"
                        />
                      ))}
                      {/* Adjusted profile */}
                      <polygon
                        points={dimensions.map((dim, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const maxVal = Math.max(...dimensions.map(d => adjustedScores[d])) || 1;
                          const value = (adjustedScores[dim] / maxVal) * 60;
                          const x = 100 + value * Math.cos(angle);
                          const y = 80 + value * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="rgba(59, 130, 246, 0.3)"
                        stroke="#3B82F6"
                        strokeWidth="2"
                      />
                      {/* Labels */}
                      {dimensions.map((dim, i) => {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const x = 100 + 75 * Math.cos(angle);
                        const y = 80 + 75 * Math.sin(angle);
                        const diff = adjustedScores[dim] - scores[dim];
                        return (
                          <g key={dim}>
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={RIASEC_LABELS[dim].color}
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {dim}
                            </text>
                            <text
                              x={x}
                              y={y + 12}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={diff !== 0 ? (diff > 0 ? '#10B981' : '#EF4444') : COLORS.muted}
                              fontSize="8"
                              fontWeight={diff !== 0 ? 'bold' : 'normal'}
                            >
                              {adjustedScores[dim].toFixed(1)}
                              {diff !== 0 && ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Adjusted Major Recommendations */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E40AF', marginBottom: '12px' }}>
                      추천 전공
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {adjustedMajors.map((major, idx) => {
                        const originalIdx = originalMajors.findIndex(m => m.name === major.name);
                        const isNew = originalIdx === -1;
                        const rankChange = originalIdx !== -1 ? originalIdx - idx : null;
                        return (
                          <div
                            key={major.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              backgroundColor: isNew ? '#DBEAFE' : '#FFFFFF',
                              borderRadius: '8px',
                              border: `1px solid ${isNew ? '#3B82F6' : '#BFDBFE'}`,
                            }}
                          >
                            <svg width="22" height="22">
                              <circle cx="11" cy="11" r="11" fill="#3B82F6" />
                              <text x="11" y="11" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="bold">
                                {idx + 1}
                              </text>
                            </svg>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E293B' }}>
                                  {major.name}
                                </p>
                                {isNew && (
                                  <span style={{
                                    fontSize: '8px',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#3B82F6',
                                    color: 'white',
                                    fontWeight: '600',
                                  }}>NEW</span>
                                )}
                                {rankChange !== null && rankChange !== 0 && (
                                  <span style={{
                                    fontSize: '8px',
                                    color: rankChange > 0 ? '#10B981' : '#EF4444',
                                    fontWeight: 'bold',
                                  }}>
                                    {rankChange > 0 ? `▲${rankChange}` : `▼${Math.abs(rankChange)}`}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '9px', color: '#64748B' }}>
                                {major.college}
                              </p>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 'bold',
                              color: '#1E40AF',
                              backgroundColor: '#DBEAFE',
                              padding: '4px 8px',
                              borderRadius: '6px',
                            }}>
                              {Math.round(major.matchScore * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Box */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#FEF3C7',
                borderRadius: '12px',
                border: '1px solid #F59E0B',
              }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#B45309', marginBottom: '12px' }}>
                  변화 요약
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309' }}>
                      {dimensions.filter(d => adjustedScores[d] !== scores[d]).length}
                    </p>
                    <p style={{ fontSize: '11px', color: '#92400E' }}>점수 변화 영역</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309' }}>
                      {adjustedMajors.filter(m => !originalMajors.find(om => om.name === m.name)).length}
                    </p>
                    <p style={{ fontSize: '11px', color: '#92400E' }}>새로운 추천 전공</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309' }}>
                      {(() => {
                        const changes = adjustedMajors.filter((m, idx) => {
                          const origIdx = originalMajors.findIndex(om => om.name === m.name);
                          return origIdx !== -1 && origIdx !== idx;
                        }).length;
                        return changes;
                      })()}
                    </p>
                    <p style={{ fontSize: '11px', color: '#92400E' }}>순위 변동 전공</p>
                  </div>
                </div>
              </div>

              {/* PDF Footer */}
              <div style={{
                borderTop: '2px solid #E2E8F0',
                paddingTop: '14px',
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontSize: '9px', color: '#64748B' }}>
                  명지대학교 진로교육 프로그램 · 보완 프로파일 적용 전/후 비교
                </p>
                <p style={{ fontSize: '9px', color: '#64748B' }}>
                  본 결과는 참고용이며, 전문 상담과 함께 활용하시기 바랍니다.
                </p>
              </div>
            </div>
          )}

          {/* ==================== PAGE 5: 추천 직무 ==================== */}
          <div
            id="pdf-page-5"
            style={{
              width: '800px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
              wordBreak: 'keep-all',
            }}
          >
            {/* Page Header */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: COLORS.primary, marginBottom: '8px' }}>
                {supplementaryData ? '6' : '4'}. 추천 직무
              </h2>
              <p style={{ fontSize: '10px', color: '#64748B' }}>
                RIASEC 적성과 추천 전공을 기반으로 분석한 적합 직무입니다
              </p>
            </div>

            {/* Jobs Grid - 2 columns, 4 rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {recommendedRoles.slice(0, 8).map((role, idx) => {
                const matchPercent = Math.round(role.matchScore * 100);
                return (
                  <div
                    key={role.key}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '14px',
                      border: role.isRelatedToMajor ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Rank Badge */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: idx < 3 ? COLORS.primary : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{idx + 1}</span>
                      </div>

                      {/* Job Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>
                            {role.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
                          </h3>
                          {role.isRelatedToMajor && (
                            <span style={{
                              fontSize: '8px',
                              fontWeight: 'bold',
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              전공연관
                            </span>
                          )}
                        </div>

                        {/* Match Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: '#E2E8F0',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${matchPercent}%`,
                              height: '100%',
                              backgroundColor: role.isRelatedToMajor ? '#F59E0B' : COLORS.primary,
                              borderRadius: '3px',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.primary }}>
                            {matchPercent}%
                          </span>
                        </div>

                        {/* Match Reasons */}
                        {role.matchReasons.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {role.matchReasons.slice(0, 2).map((reason, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '11px',
                                  color: '#334155',
                                  backgroundColor: '#F1F5F9',
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                }}
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PDF Footer - 더 큰 폰트 */}
            <div style={{
              borderTop: '2px solid #E2E8F0',
              paddingTop: '18px',
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <p style={{ fontSize: '11px', color: '#64748B' }}>
                명지대학교 진로교육 프로그램 · 추천 직무 분석
              </p>
              <p style={{ fontSize: '11px', color: '#64748B' }}>
                본 결과는 참고용이며, 전문 상담과 함께 활용하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiasecResult;
