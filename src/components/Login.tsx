import React, { useState } from "react";
import { motion } from "framer-motion";
import { DUMMY_STUDENT, FRESHMAN_STUDENT, MIS_STUDENT, ADMIN_ACCOUNT, setCurrentStudent } from "../data/dummyData";

interface LoginProps {
  onLogin: (studentId: string, isAdmin?: boolean) => void;
  onNavigateToLanding?: () => void;
}

export default function Login({ onLogin, onNavigateToLanding }: LoginProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#1e3a8a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* 로고 영역 */}
          <div className="text-center mb-8">
            <div className="inline-block bg-[#1e3a8a] text-white rounded-full p-4 mb-4">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              학생 정보 시스템
            </h1>
            <p className="text-gray-600">Student Information System</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="studentId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                학번
              </label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="학번을 입력하세요"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1e3a8a] hover:bg-[#3b82f6] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              로그인
            </button>
          </form>

          {/* 외부사용자 버튼 */}
          {onNavigateToLanding && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200 border border-gray-300"
              >
                외부사용자
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                계정이 없으신가요? 랜딩 페이지로 이동합니다
              </p>
            </div>
          )}

          {/* 테스트 계정 안내 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
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
                    ✓ RIASEC 검사만으로 진로 탐색 체험
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

        {/* 하단 정보 */}
        <div className="text-center mt-6 text-white text-sm">
          <p className="opacity-90">
            © 2025 University Information System. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

