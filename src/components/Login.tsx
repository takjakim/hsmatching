import React, { useState } from "react";
import { motion } from "framer-motion";
import { DUMMY_STUDENT, FRESHMAN_STUDENT, MIS_STUDENT, ADMIN_ACCOUNT, setCurrentStudent } from "../data/dummyData";
import logLogo from "../img/log_logo.png";

interface LoginProps {
  onLogin: (studentId: string, isAdmin?: boolean) => void;
  onNavigateToLanding?: () => void;
}

export default function Login({ onLogin, onNavigateToLanding }: LoginProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 관리자 계정 체크
    if (studentId === ADMIN_ACCOUNT.studentId && password === ADMIN_ACCOUNT.password) {
      onLogin(ADMIN_ACCOUNT.studentId, true);
    } 
    // 학생 계정 체크 (경영학과, 무전공 신입생, 경영정보학과)
    else if (studentId === DUMMY_STUDENT.studentId && password === DUMMY_STUDENT.password) {
      setCurrentStudent(DUMMY_STUDENT.studentId);
      onLogin(DUMMY_STUDENT.studentId, false);
    } else if (studentId === FRESHMAN_STUDENT.studentId && password === FRESHMAN_STUDENT.password) {
      setCurrentStudent(FRESHMAN_STUDENT.studentId);
      onLogin(FRESHMAN_STUDENT.studentId, false);
    } else if (studentId === MIS_STUDENT.studentId && password === MIS_STUDENT.password) {
      setCurrentStudent(MIS_STUDENT.studentId);
      onLogin(MIS_STUDENT.studentId, false);
    } else {
      setError("학번 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  const quickLogin = (studentType: 'senior' | 'freshman' | 'mis' | 'admin') => {
    if (studentType === 'admin') {
      onLogin(ADMIN_ACCOUNT.studentId, true);
    } else if (studentType === 'senior') {
      setCurrentStudent(DUMMY_STUDENT.studentId);
      onLogin(DUMMY_STUDENT.studentId, false);
    } else if (studentType === 'mis') {
      setCurrentStudent(MIS_STUDENT.studentId);
      onLogin(MIS_STUDENT.studentId, false);
    } else {
      setCurrentStudent(FRESHMAN_STUDENT.studentId);
      onLogin(FRESHMAN_STUDENT.studentId, false);
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
                    className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-8 px-6 rounded-md transition duration-150 min-w-[100px] h-full"
                  >
                    로그인
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

          {/* 외부사용자 버튼 */}
          {onNavigateToLanding && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-md transition duration-200 border border-gray-200"
              >
                외부사용자
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                계정이 없으신가요? 랜딩 페이지로 이동합니다
              </p>
            </div>
          )}

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
                {/* 기존 학생 */}
                <div className="p-4 bg-blue-50 border border-[#3b82f6] rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-700">경영학과 3학년 (수강 이력 풍부)</p>
                    <button
                      onClick={() => quickLogin('senior')}
                      className="text-xs bg-[#1e3a8a] hover:bg-[#3b82f6] text-white px-3 py-1 rounded"
                    >
                      빠른 로그인
                    </button>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">학번:</span> {DUMMY_STUDENT.studentId}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">비밀번호:</span> {DUMMY_STUDENT.password}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ 진로-학습 통합 분석 체험 가능
                  </p>
                </div>

                {/* 신입생 */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-700">무전공 1학년 신입생 (교양만 수강)</p>
                    <button
                      onClick={() => quickLogin('freshman')}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      빠른 로그인
                    </button>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">학번:</span> {FRESHMAN_STUDENT.studentId}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">비밀번호:</span> {FRESHMAN_STUDENT.password}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ MJU 전공 진로 적합도 검사만으로 진로 탐색 체험
                  </p>
                </div>

                {/* 경영정보학과 학생 (전주기 시뮬레이션) */}
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-700">🎓 경영정보학과 2학년 (전주기 가이드)</p>
                    <button
                      onClick={() => quickLogin('mis')}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded"
                    >
                      빠른 로그인
                    </button>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">학번:</span> {MIS_STUDENT.studentId}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">비밀번호:</span> {MIS_STUDENT.password}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ 무전공 입학 → 경영정보학과 선택 시나리오
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    ✓ 1~4학년 전주기 커리큘럼 및 진로 로드맵 체험
                  </p>
                </div>

                {/* 관리자 */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-700">관리자 계정</p>
                    <button
                      onClick={() => quickLogin('admin')}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                    >
                      빠른 로그인
                    </button>
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">학번:</span> {ADMIN_ACCOUNT.studentId}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">비밀번호:</span> {ADMIN_ACCOUNT.password}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ 검사 응답 로그 조회 및 관리
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
