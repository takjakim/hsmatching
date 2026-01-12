# Vercel 데이터베이스 연동 가이드

## 개요

현재 관리자 페이지는 localStorage를 사용하여 검사 결과를 저장하고 있습니다. Vercel Postgres를 사용하여 데이터베이스에 저장/불러오기 기능을 추가합니다.

---

## 1. Vercel Postgres 설정

### 1.1 Vercel 대시보드에서 Postgres 생성

1. Vercel 대시보드 → 프로젝트 선택
2. **Storage** 탭 클릭
3. **Create Database** → **Postgres** 선택
4. 데이터베이스 이름 설정 (예: `e-advisor-db`)
5. 지역 선택 (예: `Seoul (ap-northeast-2)`)

### 1.2 환경 변수 설정

Vercel 대시보드에서 자동으로 생성되는 환경 변수:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

이 변수들은 자동으로 프로젝트에 추가됩니다.

---

## 2. 데이터베이스 스키마 설계

### 2.1 테이블 구조

```sql
-- 검사 결과 테이블
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  result JSONB NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_created_at (created_at)
);

-- 코드 목록 인덱스 테이블 (빠른 조회용)
CREATE TABLE result_codes (
  code VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
);
```

---

## 3. 프로젝트 구조

```
hsmatching/
├── api/                    # Vercel Serverless Functions
│   ├── results/
│   │   ├── save.ts        # 결과 저장
│   │   ├── get.ts         # 결과 조회
│   │   └── list.ts        # 결과 목록
│   └── admin/
│       └── logs.ts        # 관리자 로그 조회
├── lib/
│   └── db.ts              # 데이터베이스 연결 유틸리티
└── src/
    └── utils/
        └── resultCode.ts  # API 호출로 변경
```

---

## 4. 구현 단계

### Step 1: 데이터베이스 연결 라이브러리 설치

```bash
npm install @vercel/postgres @vercel/node
```

### Step 2: 데이터베이스 초기화

1. Vercel 대시보드 → 프로젝트 → Storage → Postgres → **SQL Editor**
2. `sql/init.sql` 파일의 내용을 복사하여 실행
3. 테이블 생성 확인

### Step 3: 환경 변수 설정

Vercel 대시보드에서 자동으로 설정되지만, 확인:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

프론트엔드 환경 변수 추가:
- `VITE_USE_DATABASE=true` (데이터베이스 사용 시)

### Step 4: 배포 및 테스트

1. 코드 커밋 및 푸시
2. Vercel 자동 배포
3. API 엔드포인트 테스트:
   - `POST /api/results/save`
   - `GET /api/results/get?code=ABC12345`
   - `GET /api/results/list`
   - `GET /api/admin/logs`

### Step 5: 데이터베이스 활성화

프로덕션 환경에서:
1. Vercel 대시보드 → Settings → Environment Variables
2. `VITE_USE_DATABASE` = `true` 추가
3. 재배포

---

## 5. 주의사항

1. **비용**: Vercel Postgres는 사용량에 따라 비용이 발생합니다.
2. **보안**: API 엔드포인트에 인증 추가 권장
3. **마이그레이션**: 기존 localStorage 데이터는 수동으로 마이그레이션 필요

---

## 6. 대안: Supabase 사용

Vercel Postgres 대신 Supabase를 사용할 수도 있습니다:
- 무료 티어 제공
- 더 많은 기능 (인증, 실시간 등)
- Vercel과 통합 가능
