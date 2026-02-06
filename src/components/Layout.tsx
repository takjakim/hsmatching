import React, { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CURRENT_STUDENT } from "../data/dummyData";
import { getStudentByStudentId, StudentData } from "../../lib/supabase";

interface StepStatus {
  step1Complete: boolean;  // RIASEC 검사 완료
  step2Complete: boolean;  // 핵심역량진단 완료
  step3Complete: boolean;  // 전공능력진단 완료 (선택적)
  step4Complete: boolean;  // 롤모델 탐색 완료 (선택적)
}

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  currentStudentId?: string | null;
  stepStatus?: StepStatus;
}

export default function Layout({ children, currentPage, onPageChange, onLogout, isAdmin = false, currentStudentId, stepStatus }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // DB에서 학생 정보 가져오기
  useEffect(() => {
    async function fetchStudent() {
      if (currentStudentId && !isAdmin) {
        const data = await getStudentByStudentId(currentStudentId);
        setStudentData(data);
      }
    }
    fetchStudent();
  }, [currentStudentId, isAdmin]);

  // 학생 정보 (DB 우선, 없으면 더미 데이터 폴백)
  const studentName = studentData?.name || CURRENT_STUDENT.name;
  const studentId = studentData?.student_id || CURRENT_STUDENT.studentId;
  const studentDepartment = studentData?.department || CURRENT_STUDENT.department;

  // 일반 학생 메뉴 (나열 형태, 번호 없음)
  const studentMenuItems = [
    { id: "dashboard", label: "메인", icon: "🏠" },
    { id: "riasec", label: "전공 진로 적합도 검사", icon: "🎯" },
    { id: "competency", label: "핵심역량진단", icon: "💪" },
    { id: "roadmap-explorer", label: "전공능력진단", icon: "📚" },
    { id: "roadmap-rolemodels", label: "롤모델 탐색", icon: "⭐" },
    { id: "roadmap-planner", label: "커리큘럼 플래너", icon: "📊" },
    { id: "roadmap-extracurricular", label: "비교과 활동", icon: "🏆" },
  ];

  // 관리자 메뉴
  const adminMenuItems = [
    { id: "admin-logs", label: "응답 로그", icon: "📊" },
  ];

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  // 페이지별 필요한 이전 단계 체크
  const getRequiredStep = (pageId: string): { required: boolean; message: string } | null => {
    if (isAdmin || !stepStatus) return null;

    switch (pageId) {
      case 'competency':
        // 2단계: 1단계(RIASEC) 완료 필요
        if (!stepStatus.step1Complete) {
          return { required: true, message: '핵심역량진단을 시작하려면 먼저 "전공 진로 적합도 검사"를 완료해주세요.' };
        }
        break;
      case 'roadmap-explorer':
        // 3단계: 2단계(핵심역량) 완료 필요
        if (!stepStatus.step2Complete) {
          return { required: true, message: '전공능력진단을 시작하려면 먼저 "핵심역량진단"을 완료해주세요.' };
        }
        break;
      case 'roadmap-rolemodels':
        // 4단계: 2단계 완료 필요 (3단계는 선택)
        if (!stepStatus.step2Complete) {
          return { required: true, message: '롤모델 탐색을 시작하려면 먼저 "핵심역량진단"을 완료해주세요.' };
        }
        break;
      case 'roadmap-planner':
      case 'roadmap-fullcycle':
        // 5단계: 2단계 완료 필요
        if (!stepStatus.step2Complete) {
          return { required: true, message: '커리큘럼 플래너를 시작하려면 먼저 "핵심역량진단"을 완료해주세요.' };
        }
        break;
    }
    return null;
  };

  const handleMenuClick = (pageId: string) => {
    // 이전 단계 완료 여부 체크
    const requirement = getRequiredStep(pageId);
    if (requirement) {
      setWarningMessage(requirement.message);
      // 3초 후 자동으로 경고 메시지 숨김
      setTimeout(() => setWarningMessage(null), 4000);
      return; // 이동 차단
    }

    onPageChange(pageId);
    setIsMobileMenuOpen(false); // 모바일에서 메뉴 선택 시 닫기
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 최상단 정보 바 */}
      <div className="bg-gray-700 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>시스템 문의 02-300-1684 / 취업관련 문의 02-300-1579(인문), 031-324-1554(자연)</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onPageChange("dashboard")}
                className="hover:text-blue-300 transition"
              >
                Home
              </button>
              <button
                onClick={onLogout}
                className="hover:text-blue-300 transition"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* 로고 & 타이틀 */}
            <div className="flex items-center space-x-4">
              {/* 모바일 햄버거 메뉴 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-700 hover:text-blue-600 p-2 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              {/* 로고 */}
              <div className="flex items-center space-x-2 md:space-x-3">
                <img
                  src="https://myicap.mju.ac.kr/files/web1/images/common/logo.png"
                  alt="e-Advisor 로고"
                  className="h-10 md:h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-gray-800">e-Advisor</h1>
                  <p className="text-xs text-gray-600 hidden sm:block">MYiCap+ 데이터 기반 학생역량지원체계</p>
                  <p className="text-xs text-gray-600">
                    {isAdmin ? "관리자 시스템" : "진로·학습 통합 분석 시스템"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 사용자 정보 */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right hidden sm:block">
                {isAdmin ? (
                  <>
                    <p className="font-semibold text-sm text-gray-800">관리자</p>
                    <p className="text-xs text-gray-600">시스템 관리자</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm text-gray-800">{studentName}</p>
                    <p className="text-xs text-gray-600">
                      {studentId} · {studentDepartment}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 가로 네비게이션 바 */}
          <nav className="hidden md:flex items-center space-x-1 bg-blue-50 rounded-lg p-1">
            {menuItems.map((item) => {
              const isLocked = !!getRequiredStep(item.id);
              const isActive = currentPage === item.id || (item.id === "roadmap-planner" && currentPage === "roadmap-fullcycle");

              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`px-2 md:px-3 py-2 rounded-md transition font-medium text-xs md:text-sm min-h-[44px] whitespace-nowrap flex items-center gap-1 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : isLocked
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-blue-100"
                  }`}
                >
                  {isLocked && <span className="text-xs">🔒</span>}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 경고 메시지 토스트 */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] max-w-md mx-4"
          >
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl shadow-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-800 mb-1">이전 단계를 먼저 완료해주세요</p>
                <p className="text-sm text-amber-700">{warningMessage}</p>
              </div>
              <button
                onClick={() => setWarningMessage(null)}
                className="flex-shrink-0 text-amber-600 hover:text-amber-800 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 relative">
          {/* 데스크톱 사이드바 (호버 시 활성화) - 임시 주석처리 */}
          {/* <aside
            className="hidden lg:block flex-shrink-0 relative"
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          >
            <div className="sticky top-32">
              <div className="flex flex-col space-y-2">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-lg transition-all duration-200 flex items-center justify-center text-2xl shadow-md ${
                      currentPage === item.id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-blue-50"
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                  </motion.button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {isSidebarHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-14 top-0 w-56 bg-white rounded-xl shadow-lg p-4 z-50"
                >
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center space-x-3 min-h-[56px] ${
                          currentPage === item.id
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </aside> */}

          {/* 모바일 사이드바 (오버레이) */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* 배경 오버레이 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden fixed inset-0 bg-black/50 z-40"
                />
                
                {/* 모바일 메뉴 */}
                <motion.aside
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-50 overflow-y-auto"
                >
                  {/* 모바일 메뉴 헤더 */}
                  <div className="bg-blue-600 text-white p-4 sticky top-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg">메뉴</h2>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 모바일 메뉴 아이템 */}
                  <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                      const isLocked = !!getRequiredStep(item.id);
                      const isActive = currentPage === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center space-x-3 min-h-[56px] ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md"
                              : isLocked
                              ? "text-gray-400 bg-gray-50"
                              : "text-gray-700 hover:bg-blue-50"
                          }`}
                        >
                          <span className="text-xl">{isLocked ? "🔒" : item.icon}</span>
                          <span>{item.label}</span>
                          {isLocked && <span className="text-xs text-gray-400 ml-auto">잠금</span>}
                        </button>
                      );
                    })}
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* 메인 컨텐츠 */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

