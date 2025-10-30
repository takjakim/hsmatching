import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CURRENT_STUDENT } from "../data/dummyData";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export default function Layout({ children, currentPage, onPageChange, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "대시보드", icon: "🏠" },
    { id: "personal", label: "개인신상", icon: "👤" },
    { id: "grades", label: "학점이수", icon: "📊" },
    { id: "courses", label: "수강현황", icon: "📚" },
    { id: "competency", label: "전공능력진단", icon: "📋" },
    { id: "insight", label: "진로-학습 분석", icon: "💡" },
    { id: "riasec", label: "진로매칭", icon: "🎯" },
  ];

  const handleMenuClick = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false); // 모바일에서 메뉴 선택 시 닫기
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 & 햄버거 메뉴 */}
            <div className="flex items-center space-x-4">
              {/* 모바일 햄버거 메뉴 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
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
                <div className="bg-white text-[#1e3a8a] rounded-lg p-2">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8"
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
                <div className="hidden md:block">
                  <h1 className="text-lg md:text-xl font-bold">학생 정보 시스템</h1>
                  <p className="text-xs md:text-sm text-blue-200">Student Portal</p>
                </div>
              </div>
            </div>
            
            {/* 사용자 정보 & 로그아웃 */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right">
                <p className="font-semibold text-sm md:text-base">{CURRENT_STUDENT.name}</p>
                <p className="text-xs text-blue-200 hidden sm:block">
                  {CURRENT_STUDENT.studentId} · {CURRENT_STUDENT.department}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-xs md:text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 relative">
          {/* 데스크톱 사이드바 */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center space-x-3 ${
                      currentPage === item.id
                        ? "bg-[#1e3a8a] text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
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
                  <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white p-4 sticky top-0">
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
                            ? "bg-[#1e3a8a] text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
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

