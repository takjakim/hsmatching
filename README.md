# 🎓 명지대학교 학생 정보 시스템

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)

통합 학생 포털 시스템 - 학생 정보 관리 및 RIASEC 기반 진로-학습 통합 분석

## 🎯 프로젝트 개요

학생들이 자신의 학적 정보를 확인하고, RIASEC+V 모델 기반으로 적합한 전공과 직무를 탐색할 수 있는 통합 웹 애플리케이션입니다.

### 주요 기능

#### 1️⃣ 학생 정보 시스템
- **로그인 시스템**: 학번과 비밀번호를 통한 인증
- **개인신상**: 학생의 기본 정보 및 연락처 확인
- **학점이수**: 학기별 성적, 평점 그래프, 성적 목록 조회
- **수강현황**: 학기별 수강 과목 목록 및 통계

#### 2️⃣ RIASEC 진로 매칭 시스템
- **적응형 문항**: 1차 결과를 바탕으로 추가 문항 제시
- **RIASEC+V 모델**: R, E, I, S, C, A, V 7차원 분석
- **3지선다**: A, B, 둘 다 관심 없음(None) 선택 가능
- **개인화 결과**: 전공 Top 3, 직무 Top 5 추천

#### 3️⃣ 진로-학습 통합 분석 (NEW! 🔥)
- **실시간 연동**: RIASEC 검사 결과와 수강 과목 데이터 실시간 연계
- **과목 RIASEC 매핑**: 모든 수강 과목에 RIASEC+V 프로파일 부여 (15개 과목)
- **학습 패턴 분석**: 수강 과목 기반 학습 프로파일 자동 계산 (학점 가중치 적용)
- **적성 일치도**: 진로 적성과 학습 경험의 일치 정도 측정 (0-100점, 코사인 유사도)
- **비교 시각화**: 레이더 차트로 진로 적성 vs 학습 경험 비교
- **Gap 분석**: 영역별 차이 분석 및 개선점 제시
- **맞춤형 과목 추천**: 적성에 맞는 미수강 과목 Top 5 추천 (8개 과목 풀)
- **맞춤형 직무 추천**: 진로 적성 기반 추천 직무 Top 8 (18개 직무 풀)
- **강점 및 추천사항**: 개인화된 학습 경로 가이드
- **결과 저장**: localStorage를 통한 검사 결과 영구 저장

## 🚀 빠른 시작

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/hsmatching.git
cd hsmatching

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속하세요.

### 테스트 계정

로그인 페이지에서 다음 두 가지 시나리오를 체험할 수 있습니다:

#### 1️⃣ 경영학과 3학년 (수강 이력 풍부)
- **학번**: `2301001`
- **비밀번호**: `business123`
- **특징**: 진로-학습 통합 분석 체험 가능

#### 2️⃣ 무전공 1학년 신입생 (수강 이력 거의 없음)
- **학번**: `2501001`
- **비밀번호**: `freshman123`
- **특징**: RIASEC 검사만으로 진로 탐색 체험

## 📊 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Deployment**: Vercel

## 📁 프로젝트 구조

```
src/
├── components/          # 공통 컴포넌트
│   ├── Login.tsx       # 로그인 화면
│   └── Layout.tsx      # 레이아웃 (헤더, 사이드바)
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx   # 대시보드
│   ├── PersonalInfo.tsx # 개인신상
│   ├── GradesInfo.tsx  # 학점이수
│   ├── CoursesInfo.tsx # 수강현황
│   └── CareerInsight.tsx # 진로-학습 통합 분석 (NEW!)
├── types/              # TypeScript 타입 정의
│   └── student.ts      # 학생, 과목, 성적 타입
├── data/               # 더미 데이터
│   └── dummyData.ts    # 학생정보, 과목(RIASEC포함), 성적
├── utils/              # 유틸리티 함수 (NEW!)
│   ├── profileAnalysis.ts # 학습 프로파일 분석 로직
│   └── roleRecommendation.ts # 직무 추천 로직
├── HSMatchingPrototype.tsx  # RIASEC 매칭 시스템
├── App.tsx             # 메인 앱 컴포넌트
└── main.tsx            # 엔트리 포인트
```

## 🎨 주요 페이지

### 1. 로그인
- 학번/비밀번호 인증
- 테스트 계정 안내
- 에러 처리

### 2. 대시보드
- 요약 통계 (평점평균, 백분위점수, 취득학점, 학년)
- 빠른 메뉴 카드
- 최근 활동 목록

### 3. 개인신상
- 기본 정보 (학번, 성명, 생년월일 등)
- 학적 정보 (학과, 학년, 학적상태)
- 연락처 정보 (전화번호, 이메일)
- 주소 정보

### 4. 학점이수
- 평점평균, 백분위점수 요약
- 학기별 평점 그래프
- 상세 성적 목록 테이블
- 통계 요약

### 5. 수강현황
- 학기별 수강 과목 목록
- 이수 구분별 통계
- 과목 상세 정보 (강좌번호, 담당교수, 시간/강의실)

### 6. 진로-학습 분석 💡 (NEW!)
- **검사 연동**: RIASEC 검사 미완료 시 검사 유도 페이지 표시
- **실시간 분석**: 검사 완료 시 자동으로 분석 페이지로 이동
- **일치도 점수**: 0-100점 (80+ 매우 일치, 60-79 대체로 일치, 60 미만 재검토)
- **레이더 차트**: 진로 적성(파란색) vs 학습 경험(초록색) 비교
- **상위 차원 분석**: 진로 적성 Top 3, 학습 경험 Top 3
- **영역별 Gap 분석**: 적성 > 학습(주황색), 학습 > 적성(파란색)
- **강점 및 추천사항**: 개인화된 피드백
- **적성 기반 과목 추천 Top 5**: 매칭도와 이유 표시
- **적성 기반 직무 추천 Top 8**: 18개 직무 중 매칭도 기반 추천
- **V(가치) 차원 특별 분석**: 사회적 가치 지향도 분석

### 7. 진로매칭 (RIASEC)
- 29개 기본 문항 + 적응형 추가 문항
- RIASEC+V 7차원 분석
- 레이더 차트 및 결과 시각화
- 전공 및 직무 추천

## 🔧 커스터마이징

### 더미 데이터 수정

`src/data/dummyData.ts` 파일에서 학생 정보, 성적, 수강 과목 데이터를 수정할 수 있습니다.

```typescript
export const DUMMY_STUDENT: Student = {
  studentId: "2301001",
  password: "business123",
  name: "김경영",
  // ... 기타 정보
};
```

### 문항 수정

`src/HSMatchingPrototype.tsx`의 `QUESTIONS` 배열에서 RIASEC 문항을 추가/수정할 수 있습니다.

### 전공/직무 추가

`src/HSMatchingPrototype.tsx`의 `MAJORS`, `ROLES` 배열에서 새로운 전공이나 직무를 추가할 수 있습니다.

## 🌐 배포

### GitHub에 업로드

```bash
# Git 초기화 및 커밋
git init
git add .
git commit -m "Initial commit: 명지대학교 학생 정보 시스템 v3.0"

# GitHub 저장소 연결 (먼저 GitHub에서 저장소 생성)
git remote add origin https://github.com/your-username/hsmatching.git
git branch -M main
git push -u origin main
```

### Vercel로 배포하기

1. [vercel.com](https://vercel.com) 접속
2. **Import Project** 클릭
3. GitHub 저장소 선택
4. Framework Preset: **Vite** 자동 감지
5. **Deploy** 클릭
6. 배포 완료! 🎉

배포 URL 예시: `https://your-project.vercel.app`

## 📱 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 라이선스

MIT License

## 🎨 브랜드 색상

명지대학교 공식 엠블럼 색상을 사용합니다:

- **Navy Blue** `#1e3a8a` - 메인 색상
- **Medium Blue** `#3b82f6` - 포인트 색상
- **Sky Blue** `#60a5fa` - 보조 색상
- **Beige** `#d4b896` - 액센트 색상

## 👥 기여

이슈나 개선 제안은 GitHub Issues를 통해 제출해주세요.

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 🌟 주요 기능 플로우

### 진로-학습 통합 분석 사용 시나리오

1. **로그인** → 대시보드에서 "RIASEC 검사 시작하기" 배너 확인
2. **진로매칭 페이지** → 29개 기본 문항 + 적응형 추가 문항 응답
3. **검사 완료** → 자동으로 "진로-학습 분석" 페이지로 이동
4. **통합 분석 확인**:
   - 일치도 점수 (예: 85점 - 매우 일치)
   - 레이더 차트로 적성 vs 학습 경험 비교
   - 영역별 Gap 분석
   - 강점 및 추천사항
   - 맞춤형 과목 추천 Top 5
   - 맞춤형 직무 추천 Top 8
5. **과목 수강** → 추천 과목 수강 후 학습 프로파일 변화 확인

### 데이터 흐름

```
[RIASEC 검사] 
    ↓ 
[검사 결과 저장 (localStorage + App state)]
    ↓
[CareerInsight 페이지]
    ├→ [진로 적성 프로파일] (검사 결과)
    ├→ [학습 프로파일] (수강 과목 × 학점 가중치)
    ├→ [코사인 유사도] → 일치도 점수
    ├→ [과목 추천] (미수강 과목 × 적성 매칭)
    └→ [직무 추천] (18개 직무 × 적성 매칭)
```

---

**개발**: KPC 대학 시스템팀  
**버전**: 3.0  
**최종 업데이트**: 2025년 10월
