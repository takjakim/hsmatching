# 🚀 GitHub 업로드 가이드

## ✅ 업로드 전 체크리스트

- [x] `.gitignore` 파일 생성 완료
- [x] `LICENSE` 파일 추가 완료
- [x] `README.md` 업데이트 완료
- [x] `PILOT_DEMO.md` 시연 가이드 작성 완료
- [x] `CONTRIBUTING.md` 기여 가이드 작성 완료
- [x] 모든 코드 린트 에러 없음
- [x] 명지대학교 브랜드 색상 적용 완료

---

## 📦 GitHub에 업로드하는 방법

### 방법 1: 터미널에서 직접 업로드

```bash
# 1. 프로젝트 폴더로 이동
cd "/Users/jahkim/Library/CloudStorage/GoogleDrive-gimwogus@gmail.com/내 드라이브/obsidian/Brain/001. KPC/KPC대학_명지대_시스템/hsmatching-main"

# 2. Git 초기화
git init

# 3. 모든 파일 추가 (.gitignore에 명시된 파일은 제외됨)
git add .

# 4. 첫 커밋
git commit -m "Initial commit: 명지대학교 학생 정보 시스템 v3.0

- 학생 정보 시스템 (로그인, 개인신상, 학점이수, 수강현황)
- RIASEC 진로 매칭 시스템
- 진로-학습 통합 분석 시스템
- 명지대학교 브랜드 색상 적용
- 두 가지 학생 시나리오 (3학년 vs 1학년 신입생)
"

# 5. GitHub에서 새 저장소 생성 후 (예: hsmatching)
# 원격 저장소 연결
git remote add origin https://github.com/your-username/hsmatching.git

# 6. 메인 브랜치로 변경
git branch -M main

# 7. GitHub에 푸시
git push -u origin main
```

### 방법 2: GitHub Desktop 사용 (GUI)

1. **GitHub Desktop** 앱 실행
2. **File → Add Local Repository** 클릭
3. 프로젝트 폴더 선택
4. **Publish repository** 클릭
5. 저장소 이름 입력 (예: `hsmatching`)
6. Public/Private 선택
7. **Publish** 클릭

---

## 🌐 Vercel 자동 배포 설정

GitHub에 올린 후:

1. [vercel.com](https://vercel.com) 접속
2. **Import Project** 클릭
3. GitHub 저장소 선택 (`hsmatching`)
4. **Framework Preset**: Vite 자동 감지
5. **Deploy** 클릭
6. 자동으로 배포 완료!

배포 URL: `https://your-project.vercel.app`

---

## 📝 저장소 설정 추천

### Repository 설정

- **Name**: `hsmatching` 또는 `myongji-student-portal`
- **Description**: 
  ```
  명지대학교 학생 정보 시스템 - RIASEC 진로 매칭 및 학습-진로 통합 분석
  ```
- **Topics**: 
  - `riasec`
  - `career-matching`
  - `student-portal`
  - `react`
  - `typescript`
  - `vite`
  - `tailwindcss`

### README Badges 추가 (선택사항)

```markdown
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
```

---

## 🔒 주의사항

### ✅ 이미 처리됨

- `.gitignore`로 `node_modules`, `dist` 등 제외
- 더미 데이터만 사용 (실제 학생 정보 없음)
- 테스트 계정 정보는 공개 가능

### ⚠️ 향후 실제 시스템으로 전환 시

- 환경 변수로 API 엔드포인트 관리
- 실제 학생 데이터베이스 연동
- 인증 토큰 관리
- HTTPS 필수

---

## 📊 현재 프로젝트 상태

### 포함된 파일 (GitHub에 올라갈 파일)

```
✅ src/                    # 소스 코드
✅ public/                 # 정적 파일 (없음)
✅ package.json            # 의존성 목록
✅ tsconfig.json           # TypeScript 설정
✅ vite.config.ts          # Vite 설정
✅ tailwind.config.js      # Tailwind 설정
✅ index.html              # HTML 템플릿
✅ README.md               # 프로젝트 설명
✅ PILOT_DEMO.md           # 시연 가이드
✅ CONTRIBUTING.md         # 기여 가이드
✅ LICENSE                 # MIT 라이선스
✅ .gitignore              # Git 제외 목록
✅ vercel.json             # Vercel 배포 설정
```

### 제외될 파일 (.gitignore)

```
❌ node_modules/          # 의존성 패키지
❌ dist/                  # 빌드 결과물
❌ .env                   # 환경 변수
❌ *.log                  # 로그 파일
❌ .DS_Store              # macOS 시스템 파일
```

---

## 🎯 다음 단계

1. **GitHub 업로드**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: 명지대학교 학생 정보 시스템 v3.0"
   git remote add origin https://github.com/your-username/hsmatching.git
   git push -u origin main
   ```

2. **Vercel 배포**
   - GitHub 저장소 연결
   - 자동 배포

3. **협업 설정**
   - Collaborators 추가
   - Branch protection rules 설정

---

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요!

**준비 완료! 이제 GitHub에 올리면 됩니다! 🚀**

