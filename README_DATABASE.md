# Vercel 데이터베이스 연동 완료 가이드

## ✅ 구현 완료 사항

1. **데이터베이스 유틸리티** (`lib/db.ts`)
   - 검사 결과 저장/조회 함수
   - 코드 목록 조회
   - 관리자 로그 조회

2. **API 엔드포인트** (`api/` 폴더)
   - `POST /api/results/save` - 결과 저장
   - `GET /api/results/get?code=XXX` - 결과 조회
   - `GET /api/results/list` - 코드 목록
   - `GET /api/admin/logs` - 관리자 로그

3. **프론트엔드 통합**
   - `src/utils/resultCode.ts` - 데이터베이스/로컬스토리지 자동 전환
   - `src/pages/AdminLogs.tsx` - 데이터베이스에서 로드
   - `src/HSMatchingPrototype.tsx` - 비동기 저장

4. **데이터베이스 스키마** (`sql/init.sql`)
   - 테이블 생성 SQL 스크립트

---

## 🚀 빠른 시작

### 1단계: Vercel Postgres 생성

1. Vercel 대시보드 → 프로젝트 선택
2. **Storage** 탭 → **Create Database** → **Postgres**
3. 데이터베이스 이름: `e-advisor-db`
4. 지역: `Seoul (ap-northeast-2)` 권장

### 2단계: 데이터베이스 초기화

1. Vercel 대시보드 → Storage → Postgres → **SQL Editor**
2. `sql/init.sql` 파일 내용 복사하여 실행
3. 테이블 생성 확인

### 3단계: 환경 변수 설정

Vercel에서 자동으로 설정되지만 확인:
- `POSTGRES_URL` ✅
- `POSTGRES_PRISMA_URL` ✅
- `POSTGRES_URL_NON_POOLING` ✅

프론트엔드 환경 변수 추가:
- Settings → Environment Variables
- `VITE_USE_DATABASE` = `true` (Production, Preview, Development 모두)

### 4단계: 배포 및 테스트

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# Vercel에 배포 (또는 git push)
vercel --prod
```

### 5단계: API 테스트

```bash
# 결과 저장 테스트
curl -X POST https://your-domain.vercel.app/api/results/save \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST1234","result":{"norm":{"R":0.5,"I":0.8}},"deviceInfo":{}}'

# 결과 조회 테스트
curl https://your-domain.vercel.app/api/results/get?code=TEST1234

# 관리자 로그 테스트
curl https://your-domain.vercel.app/api/admin/logs?limit=10
```

---

## 📋 주요 기능

### 자동 폴백 메커니즘

- 데이터베이스 연결 실패 시 자동으로 localStorage 사용
- `VITE_USE_DATABASE=false`이면 항상 localStorage
- 점진적 마이그레이션 가능

### 데이터 구조

```typescript
// test_results 테이블
{
  code: string;           // 8자리 고유 코드
  result: JSONB;          // 검사 결과 (RIASEC, 전공, 직무 등)
  device_info: JSONB;     // 기기 정보
  created_at: TIMESTAMP;  // 생성일시
  expires_at: TIMESTAMP;  // 만료일시 (90일)
}
```

---

## 🔧 문제 해결

### 데이터베이스 연결 오류

**증상**: `POSTGRES_URL is not set`

**해결**:
1. Vercel 대시보드에서 Postgres 연결 확인
2. 환경 변수 자동 설정 확인
3. 재배포

### API 404 오류

**증상**: `/api/results/save` 404

**해결**:
1. `api/` 폴더가 프로젝트 루트에 있는지 확인
2. Vercel Functions 설정 확인
3. 재배포

### 타입 오류

**증상**: `@vercel/node` 타입 오류

**해결**:
```bash
npm install --save-dev @types/node
```

---

## 📊 데이터베이스 사용량 모니터링

Vercel 대시보드 → Storage → Postgres에서 확인:
- 저장된 행 수
- 쿼리 실행 횟수
- 데이터베이스 크기

---

## 🔐 보안 권장사항

1. **관리자 API 인증 추가**
   ```typescript
   // api/admin/logs.ts에 추가
   const adminToken = req.headers.authorization;
   if (adminToken !== process.env.ADMIN_SECRET) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **환경 변수 보호**
   - `ADMIN_SECRET` 등 민감한 정보는 환경 변수로 관리
   - Vercel 대시보드에서만 설정

3. **CORS 설정**
   - 필요시 특정 도메인만 허용하도록 수정

---

## 📝 다음 단계

1. ✅ 데이터베이스 연결 완료
2. ⏳ 관리자 인증 추가
3. ⏳ 데이터 마이그레이션 스크립트 작성
4. ⏳ 만료된 데이터 자동 삭제 (Cron Job)
