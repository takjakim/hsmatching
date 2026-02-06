import React, { useState } from "react";
import { motion } from "framer-motion";
import { ADMIN_ACCOUNT } from "../data/dummyData";
import { verifyAdmin, loginStudent } from "../../lib/supabase";
import logLogo from "../img/log_logo.png";
import { AdminUser } from "../types/admin";

// 테스트용 학생 계정 (DB에 저장된 계정 정보) - 테스트학생 1~10
const TEST_STUDENT_ACCOUNTS = Array.from({ length: 10 }, (_, i) => ({
  studentId: `602510${String(i + 1).padStart(2, '0')}`,
  password: 'test1234',
  name: `테스트학생${i + 1}`,
  department: '무전공',
  grade: 1,
}));

interface LoginProps {
  onLogin: (studentId: string, isAdmin?: boolean, adminUser?: AdminUser) => void;
}

// 테스트용 관리자 계정들
const TEST_ADMIN_ACCOUNTS: Record<string, { password: string; user: AdminUser }> = {
  'admin': {
    password: 'admin123',
    user: {
      username: 'admin',
      name: '시스템관리자',
      role: 'admin',
    }
  },
  'prof_cs': {
    password: 'prof123',
    user: {
      username: 'prof_cs',
      name: '김교수',
      role: 'professor',
      department: '컴퓨터공학전공',
      college: 'ICT융합대학',
    }
  },
  'prof_biz': {
    password: 'prof123',
    user: {
      username: 'prof_biz',
      name: '이교수',
      role: 'professor',
      department: '경영학전공',
      college: '경영대학',
    }
  },
  'staff': {
    password: 'staff123',
    user: {
      username: 'staff',
      name: '박직원',
      role: 'staff',
      department: '비교과교육센터',
      college: '교무처',
    }
  },
};

export default function Login({ onLogin }: LoginProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 테스트 관리자 계정 체크
      const testAdmin = TEST_ADMIN_ACCOUNTS[studentId];
      if (testAdmin && testAdmin.password === password) {
        setIsLoading(false);
        onLogin(studentId, true, testAdmin.user);
        return;
      }

      // 관리자 계정 체크 (DB 우선)
      try {
        const result = await verifyAdmin(studentId, password);
        if (result.valid) {
          setIsLoading(false);
          // DB에서 role 정보를 가져올 수 있으면 사용
          const adminUser: AdminUser = {
            username: studentId,
            name: result.name || '관리자',
            role: (result as any).role || 'admin',
            department: (result as any).department,
            college: (result as any).college,
          };
          onLogin(studentId, true, adminUser);
          return;
        }
      } catch {
        // DB 실패 시 하드코딩 fallback
        if (studentId === ADMIN_ACCOUNT.studentId && password === ADMIN_ACCOUNT.password) {
          setIsLoading(false);
          onLogin(ADMIN_ACCOUNT.studentId, true, TEST_ADMIN_ACCOUNTS['admin'].user);
          return;
        }
      }

      // 학생 계정 체크 (DB 조회)
      const studentData = await loginStudent(studentId, password);
      if (studentData) {
        onLogin(studentData.student_id, false);
      } else {
        setError("학번 또는 비밀번호가 일치하지 않습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (studentType: 'admin' | 'professor_cs' | 'professor_biz' | 'staff' | number) => {
    setIsLoading(true);
    setError("");

    try {
      if (studentType === 'admin') {
        onLogin('admin', true, TEST_ADMIN_ACCOUNTS['admin'].user);
      } else if (studentType === 'professor_cs') {
        onLogin('prof_cs', true, TEST_ADMIN_ACCOUNTS['prof_cs'].user);
      } else if (studentType === 'professor_biz') {
        onLogin('prof_biz', true, TEST_ADMIN_ACCOUNTS['prof_biz'].user);
      } else if (studentType === 'staff') {
        onLogin('staff', true, TEST_ADMIN_ACCOUNTS['staff'].user);
      } else if (typeof studentType === 'number') {
        // 테스트 학생 계정 (인덱스로 접근)
        const account = TEST_STUDENT_ACCOUNTS[studentType];
        const studentData = await loginStudent(account.studentId, account.password);
        if (studentData) {
          onLogin(studentData.student_id, false);
        } else {
          setError("테스트 계정 로그인 실패. DB에 계정이 있는지 확인하세요.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 파란색 배너 영역 */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 h-[280px] overflow-hidden">
        {/* 3D 배경 요소들 */}
        <div className="absolute inset-0">
          {/* 흰색 큐브 블록들 */}
          <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-white/30 transform rotate-12 translate-y-8"></div>
          <div className="absolute bottom-0 left-1/3 w-12 h-12 bg-white/20 transform -rotate-12 translate-y-4"></div>
          <div className="absolute bottom-0 right-1/4 w-20 h-20 bg-white/25 transform rotate-45 translate-y-12"></div>
          <div className="absolute bottom-0 right-1/3 w-14 h-14 bg-white/30 transform -rotate-45 translate-y-6"></div>
          
          {/* 투명 구슬 오브젝트 */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-cyan-300/15 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/2 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
        </div>

        {/* 브랜딩 컨텐츠 */}
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          {/* 로고 */}
          <div className="flex items-center">
            <img 
              src={logLogo} 
              alt="명지대학교 로고" 
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* 시스템 제목 */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">MYiCap</h1>
            <p className="text-white/90 text-sm mb-1">MYONGJI CAPABILITY PLUS</p>
            <p className="text-white text-lg font-medium">명지역량통합관리시스템</p>
          </div>
        </div>

        {/* 3D 아이콘들 */}
        <div className="absolute bottom-8 right-16 flex gap-4 items-end">
          <div className="w-12 h-12 bg-cyan-400/40 rounded-lg transform rotate-12"></div>
          <div className="w-10 h-10 bg-blue-300/50 rounded-full"></div>
          <div className="w-14 h-14 bg-white/30 rounded transform -rotate-12"></div>
        </div>
      </div>

      {/* 하단 로그인 폼 영역 */}
      <div className="flex-1 bg-gray-100 flex items-start justify-center pt-12 pb-12 px-6">
        <div className="w-full max-w-4xl">
          {/* 로그인 폼 */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">학생 로그인</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="flex gap-4 items-start">
                {/* 입력 필드 영역 */}
                <div className="flex-1 space-y-4">
                  {/* 아이디 */}
                  <div className="flex items-center gap-4">
                    <label htmlFor="studentId" className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                      아이디
                    </label>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="아이디를 입력하세요"
                        required
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div className="flex items-center gap-4">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                      비밀번호
                    </label>
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm pr-10"
                        placeholder="비밀번호를 입력하세요"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          ) : (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm ml-24"
                    >
                      {error}
                    </motion.div>
                  )}
                </div>

                {/* 로그인 버튼 */}
                <div className="flex-shrink-0">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-8 px-6 rounded-md transition duration-150 min-w-[100px] h-full"
                  >
                    {isLoading ? "확인 중..." : "로그인"}
                  </button>
                </div>
              </div>
            </form>

            {/* 안내 문구 */}
            <div className="mt-6 space-y-1 text-[13px] text-gray-600 ml-24">
              <p>■ Myicap+시스템을 이용하기 위해서는 명지대학교 통합 아이디가 필요합니다.</p>
              <p>
                ■ 아이디/비밀번호 찾기는 명지대학교 포털 홈페이지(
                <a
                  href="https://portal.mju.ac.kr/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://portal.mju.ac.kr/
                </a>
                )를 이용해 주시기 바랍니다.
              </p>
            </div>
          </div>

          {/* 테스트 계정 안내 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3 block"
            >
              {showHint ? "테스트 계정 숨기기 ▲" : "테스트 계정 보기 ▼"}
            </button>
            
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                {/* 테스트 학생 계정 1~10 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-semibold text-gray-700 mb-3">테스트 학생 계정 (무전공 1학년)</p>
                  <div className="grid grid-cols-5 gap-2">
                    {TEST_STUDENT_ACCOUNTS.map((account, index) => (
                      <button
                        key={account.studentId}
                        onClick={() => quickLogin(index)}
                        disabled={isLoading}
                        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-2 rounded transition"
                      >
                        {account.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-gray-600 text-xs">
                    <p><span className="font-medium">학번:</span> 60251001 ~ 60251010</p>
                    <p><span className="font-medium">비밀번호:</span> test1234 (공통)</p>
                  </div>
                </div>

                {/* 관리자 섹션 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-500 mb-3">관리자 계정</p>

                  {/* 전공 교수 - 컴퓨터공학 */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-700">👨‍🏫 컴퓨터공학 교수</p>
                      <button
                        onClick={() => quickLogin('professor_cs')}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded"
                      >
                        빠른 로그인
                      </button>
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">아이디:</span> prof_cs
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">비밀번호:</span> prof123
                    </p>
                    <p className="text-xs text-emerald-700 mt-2">
                      ✓ 컴퓨터공학 전공 학생 결과만 조회
                    </p>
                  </div>

                  {/* 전공 교수 - 경영학 */}
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-sm mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-700">👨‍🏫 경영학 교수</p>
                      <button
                        onClick={() => quickLogin('professor_biz')}
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded"
                      >
                        빠른 로그인
                      </button>
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">아이디:</span> prof_biz
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">비밀번호:</span> prof123
                    </p>
                    <p className="text-xs text-teal-700 mt-2">
                      ✓ 경영학 전공 학생 결과만 조회
                    </p>
                  </div>

                  {/* 비교과 담당직원 */}
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-700">👩‍💼 비교과 담당직원</p>
                      <button
                        onClick={() => quickLogin('staff')}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                      >
                        빠른 로그인
                      </button>
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">아이디:</span> staff
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">비밀번호:</span> staff123
                    </p>
                    <p className="text-xs text-indigo-700 mt-2">
                      ✓ 전체 학생 결과 및 통계 조회
                    </p>
                  </div>

                  {/* 시스템 관리자 */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-700">🔧 시스템 관리자</p>
                      <button
                        onClick={() => quickLogin('admin')}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                      >
                        빠른 로그인
                      </button>
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">아이디:</span> {ADMIN_ACCOUNT.studentId}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">비밀번호:</span> {ADMIN_ACCOUNT.password}
                    </p>
                    <p className="text-xs text-purple-700 mt-2">
                      ✓ 모든 기능 접근 가능
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
