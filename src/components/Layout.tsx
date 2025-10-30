import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { CURRENT_STUDENT } from "../data/dummyData";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export default function Layout({ children, currentPage, onPageChange, onLogout }: LayoutProps) {
  const menuItems = [
    { id: "dashboard", label: "대시보드", icon: "🏠" },
    { id: "personal", label: "개인신상", icon: "👤" },
    { id: "grades", label: "학점이수", icon: "📊" },
    { id: "courses", label: "수강현황", icon: "📚" },
    { id: "insight", label: "진로-학습 분석", icon: "💡" },
    { id: "riasec", label: "진로매칭", icon: "🎯" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white text-[#1e3a8a] rounded-lg p-2">
                <svg
                  className="w-8 h-8"
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
              <div>
                <h1 className="text-xl font-bold">학생 정보 시스템</h1>
                <p className="text-sm text-blue-200">Student Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold">{CURRENT_STUDENT.name}</p>
                <p className="text-sm text-blue-200">
                  {CURRENT_STUDENT.studentId} · {CURRENT_STUDENT.department}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 사이드바 */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-6">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
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

          {/* 메인 컨텐츠 */}
          <main className="flex-1">
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

