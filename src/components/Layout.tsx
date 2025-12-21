import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CURRENT_STUDENT } from "../data/dummyData";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export default function Layout({ children, currentPage, onPageChange, onLogout, isAdmin = false }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [showRoadmapSubmenu, setShowRoadmapSubmenu] = useState(false);

  // 전주기 로드맵 서브메뉴
  const roadmapSubMenuItems = [
    { id: "roadmap-planner", label: "📐 내 커리큘럼", desc: "4년 계획 설계" },
    { id: "roadmap-guide", label: "📍 로드맵·교과목", desc: "학년별 가이드" },
    { id: "roadmap-extracurricular", label: "🏆 비교과 활동", desc: "활동 이력 관리" },
    { id: "roadmap-careers", label: "💼 추천 직무", desc: "RIASEC 기반" },
    { id: "roadmap-rolemodels", label: "⭐ 롤모델", desc: "선배와 비교" },
  ];

  // 일반 학생 메뉴
  const studentMenuItems = [
    { id: "dashboard", label: "대시보드", icon: "🏠" },
    { id: "personal", label: "개인신상", icon: "👤" },
    { id: "riasec", label: "전공직무선택", icon: "🎯" },
    { id: "roadmap-fullcycle", label: "전주기 로드맵", icon: "🎓", hasSubmenu: true },
  ];

  // 관리자 메뉴
  const adminMenuItems = [
    { id: "admin-logs", label: "응답 로그", icon: "📊" },
  ];

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  const handleMenuClick = (pageId: string) => {
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
                className="lg:hidden text-gray-700 hover:text-blue-600 p-2 rounded-lg transition"
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
              <div className="flex items-center space-x-3">
                <img 
                  src="https://myicap.mju.ac.kr/files/web1/images/common/logo.png" 
                  alt="e-Advisor 로고" 
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">e-Advisor</h1>
                  <p className="text-xs text-gray-600">MYiCap+ 데이터 기반 학생역량지원체계</p>
                  <p className="text-xs text-gray-600">
                    {isAdmin ? "관리자 시스템" : "진로·학습 통합 분석 시스템"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 사용자 정보 */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                {isAdmin ? (
                  <>
                    <p className="font-semibold text-sm text-gray-800">관리자</p>
                    <p className="text-xs text-gray-600">시스템 관리자</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm text-gray-800">{CURRENT_STUDENT.name}</p>
                    <p className="text-xs text-gray-600">
                      {CURRENT_STUDENT.studentId} · {CURRENT_STUDENT.department}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 가로 네비게이션 바 */}
          <nav className="hidden md:flex items-center space-x-1 bg-blue-50 rounded-lg p-1">
            {menuItems.map((item) => (
              item.hasSubmenu ? (
                <div 
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setShowRoadmapSubmenu(true)}
                  onMouseLeave={() => setShowRoadmapSubmenu(false)}
                >
                  <button
                    className={`px-4 py-2 rounded-md transition font-medium text-sm flex items-center gap-1 ${
                      currentPage.startsWith("roadmap")
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    {item.label}
                    <svg className={`w-4 h-4 transition-transform ${showRoadmapSubmenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* 서브메뉴 드롭다운 */}
                  <AnimatePresence>
                    {showRoadmapSubmenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                      >
                        {roadmapSubMenuItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              handleMenuClick(subItem.id);
                              setShowRoadmapSubmenu(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition flex flex-col ${
                              currentPage === subItem.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <span className="font-medium text-gray-800">{subItem.label}</span>
                            <span className="text-xs text-gray-500">{subItem.desc}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`px-4 py-2 rounded-md transition font-medium text-sm ${
                    currentPage === item.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-100"
                  }`}
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 relative">
          {/* 데스크톱 사이드바 (호버 시 활성화) */}
          <aside 
            className="hidden lg:block flex-shrink-0 relative"
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          >
            {/* 플로팅 이모지 버튼 (항상 표시) */}
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

            {/* 확장된 사이드바 (호버 시 표시) */}
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
                        className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center space-x-3 ${
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
          </aside>

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
                  <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center space-x-3 ${
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

