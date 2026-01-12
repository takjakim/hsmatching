# Supabase 빠른 시작 가이드

## ✅ 지금 해야 할 일

### 1단계: Supabase 테이블 생성

1. Vercel 대시보드에서 **"Open in Supabase"** 버튼 클릭
2. Supabase 대시보드 → 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. `sql/supabase_init.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭 (또는 Ctrl+Enter)
6. ✅ 성공 메시지 확인

### 2단계: 의존성 설치

터미널에서 실행:

```bash
cd "/Users/jahkim/Library/CloudStorage/GoogleDrive-gimwogus@gmail.com/내 드라이브/obsidian/Brain/001. KPC/012. KPC대학_2025_과업수주/KPC대학_명지대_시스템/hsmatching"
npm install @supabase/supabase-js
```

### 3단계: 환경 변수 확인

Vercel 대시보드에서 자동으로 생성된 환경 변수 확인:
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅

### 4단계: 코드 수정 확인

이미 다음 파일들이 Supabase를 사용하도록 수정되었습니다:
- ✅ `lib/supabase.ts` - Supabase 클라이언트 및 함수
- ✅ `api/results/save.ts` - Supabase 사용
- ✅ `api/results/get.ts` - Supabase 사용
- ✅ `api/results/list.ts` - Supabase 사용
- ✅ `api/admin/logs.ts` - Supabase 사용

### 5단계: 배포 및 테스트

```bash
# 빌드
npm run build

# Vercel에 배포 (또는 git push)
vercel --prod
```

---

## 🔍 테이블 생성 확인

Supabase 대시보드에서:
1. 왼쪽 메뉴 → **Table Editor** 클릭
2. `test_results` 테이블이 보이는지 확인
3. `result_codes` 테이블이 보이는지 확인

---

## ⚠️ 주의사항

### Vercel Postgres vs Supabase

현재 코드는 **두 가지 모두 지원**합니다:
- `lib/db.ts` - Vercel Postgres용
- `lib/supabase.ts` - Supabase용

API 파일들은 현재 **Supabase를 사용**하도록 설정되어 있습니다.

Vercel Postgres를 사용하려면:
- API 파일들에서 import 경로를 `lib/db`로 변경

---

## 🧪 테스트

배포 후 다음 URL로 테스트:

1. **결과 저장 테스트**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/results/save \
     -H "Content-Type: application/json" \
     -d '{"code":"TEST1234","result":{"norm":{"R":0.5,"I":0.8}},"deviceInfo":{}}'
   ```

2. **결과 조회 테스트**:
   ```bash
   curl https://your-domain.vercel.app/api/results/get?code=TEST1234
   ```

3. **관리자 로그 테스트**:
   ```bash
   curl https://your-domain.vercel.app/api/admin/logs?limit=10
   ```

---

## 📝 다음 단계

1. ✅ Supabase 테이블 생성
2. ✅ 의존성 설치
3. ⏳ 코드 배포
4. ⏳ 테스트
