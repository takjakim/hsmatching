# 인문/사회 전공·직무 매칭 프로토타입

RIASEC+V 모델 기반 적응형 진로 탐색 도구

## 🎯 프로젝트 개요

29개의 기본 문항과 적응형 추가 문항을 통해 개인의 성향을 분석하고, 인문/사회 계열 전공과 직무를 추천하는 웹 애플리케이션입니다.

### 주요 특징

- **적응형 문항**: 1차 결과를 바탕으로 낮은 점수 차원을 중심으로 추가 문항 제시
- **RIASEC+V 모델**: 기존 RIASEC에 가치(Values) 차원을 추가한 7차원 분석
- **3지선다**: A, B, 둘 다 관심 없음(None) 선택 가능
- **개인화 결과**: 전공 Top 3, 직무 Top 5, 맞춤형 설명 제공

## 🚀 배포 방법

### Vercel로 배포하기

1. **GitHub 저장소 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/hs-matching.git
   git push -u origin main
   ```

2. **Vercel 배포**
   - [vercel.com](https://vercel.com) 접속
   - "New Project" 클릭
   - GitHub 저장소 연결
   - 자동으로 배포 완료!

### 로컬에서 테스트

```bash
# 의존성 설치 (선택사항)
npm install

# 로컬 서버 실행
npx serve .
# 또는
python -m http.server 8000
```

## 📊 기술 스택

- **Frontend**: React 18 (CDN)
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일/데스크톱 최적화
- **부드러운 애니메이션**: 페이지 전환과 상호작용
- **직관적 인터페이스**: 단계별 진행 표시
- **접근성**: 키보드 네비게이션 지원

## 📈 분석 모델

### RIASEC+V 차원

- **R (Realistic)**: 현장형 - 실무 중심, 구체적 작업
- **I (Investigative)**: 분석형 - 연구, 데이터 분석
- **A (Artistic)**: 창의형 - 콘텐츠, 디자인, 기획
- **S (Social)**: 사회형 - 사람과의 상호작용
- **E (Enterprising)**: 설득형 - 리더십, 커뮤니케이션
- **C (Conventional)**: 관습형 - 체계, 규정, 운영
- **V (Values)**: 가치형 - 공익, 사회적 의미

### 매칭 알고리즘

1. **가중치 적용**: 선택한 답변의 차원별 가중치 누적
2. **정규화**: 최대값 기준으로 0-1 범위로 정규화
3. **코사인 유사도**: 개인 프로파일과 전공/직무 프로파일 간 유사도 계산
4. **순위 결정**: 유사도 기준 상위 항목 선별

## 🔧 커스터마이징

### 문항 수정
`index.html`의 `QUESTIONS` 배열에서 문항을 추가/수정할 수 있습니다.

### 전공/직무 추가
`MAJORS`, `ROLES` 배열에서 새로운 전공이나 직무를 추가할 수 있습니다.

### 스타일 변경
Tailwind CSS 클래스를 수정하여 디자인을 변경할 수 있습니다.

## 📱 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 라이선스

MIT License

## 👥 기여

이슈나 개선 제안은 GitHub Issues를 통해 제출해주세요.

---

**개발**: KPC 대학 시스템팀  
**버전**: 1.0  
**최종 업데이트**: 2024년
