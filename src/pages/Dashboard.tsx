import React from "react";
import { motion } from "framer-motion";
import { CURRENT_STUDENT, getCurrentGrades } from "../data/dummyData";

interface DashboardProps {
  onNavigate: (page: string) => void;
  riasecCompleted?: boolean;
}

export default function Dashboard({ onNavigate, riasecCompleted = false }: DashboardProps) {
  const currentGrades = getCurrentGrades();
  
  const quickStats = [
    {
      label: "평점평균",
      value: currentGrades.averageGpa.toFixed(2),
      color: "bg-[#1e3a8a]",
      icon: "📈"
    },
    {
      label: "백분위점수",
      value: currentGrades.percentileScore.toFixed(1),
      color: "bg-[#3b82f6]",
      icon: "🎯"
    },
    {
      label: "취득학점",
      value: `${currentGrades.totalAcquiredCredits}`,
      color: "bg-[#60a5fa]",
      icon: "📚"
    },
    {
      label: "학년",
      value: `${CURRENT_STUDENT.grade}학년`,
      color: "bg-[#d4b896]",
      icon: "🎓"
    }
  ];

  const menuCards = [
    {
      id: "personal",
      title: "개인신상",
      description: "기본 정보 및 연락처 확인",
      icon: "👤",
      color: "from-[#1e3a8a] to-[#3b82f6]"
    },
    {
      id: "grades",
      title: "학점이수",
      description: "성적 및 평점 조회",
      icon: "📊",
      color: "from-[#3b82f6] to-[#60a5fa]"
    },
    {
      id: "courses",
      title: "수강현황",
      description: "수강 과목 목록 확인",
      icon: "📚",
      color: "from-[#60a5fa] to-[#3b82f6]"
    },
    {
      id: "insight",
      title: "진로-학습 분석",
      description: "적성과 수강 과목 패턴 비교",
      icon: "💡",
      color: "from-[#1e3a8a] to-[#60a5fa]"
    },
    {
      id: "riasec",
      title: "진로매칭",
      description: "RIASEC 기반 전공·직무 추천",
      icon: "🎯",
      color: "from-[#d4b896] to-[#3b82f6]"
    }
  ];

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          안녕하세요, {CURRENT_STUDENT.name}님! 👋
        </h2>
        <p className="text-gray-600">
          {CURRENT_STUDENT.department} {CURRENT_STUDENT.grade}학년 ({CURRENT_STUDENT.studentId})
        </p>
        {CURRENT_STUDENT.grade === 1 && (
          <p className="text-sm text-blue-600 mt-2">
            🎓 신입생 환영합니다! RIASEC 검사를 통해 나에게 맞는 전공과 진로를 탐색해보세요.
          </p>
        )}
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.color} text-white rounded-xl shadow-lg p-6`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-sm font-medium">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* 메뉴 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuCards.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(card.id)}
            className={`bg-gradient-to-r ${card.color} text-white rounded-xl shadow-lg p-6 text-left transition`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="bg-white/20 rounded-lg p-3">
                <span className="text-3xl">{card.icon}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
            <p className="text-white/90 text-sm">{card.description}</p>
          </motion.button>
        ))}
      </div>

      {/* RIASEC 검사 안내 (미완료 시) */}
      {!riasecCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <span className="mr-2">🎯</span> RIASEC 진로 적성검사
              </h3>
              <p className="text-indigo-100 mb-4">
                진로 적성검사를 완료하면 맞춤형 과목 추천과 학습 경로 분석을 받을 수 있습니다!
              </p>
              <button
                onClick={() => onNavigate("riasec")}
                className="bg-white text-[#1e3a8a] hover:bg-[#60a5fa] hover:text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                검사 시작하기 →
              </button>
            </div>
            <div className="ml-6 hidden md:block">
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 최근 활동 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📌 최근 활동</h3>
        <div className="space-y-3">
          {[
            riasecCompleted && { date: "2025-10-30", text: "진로 적성검사 완료", type: "success" },
            { date: "2025-10-28", text: "2025년 2학기 수강신청 완료", type: "success" },
            { date: "2025-08-20", text: "2025년 1학기 성적 조회 가능", type: "info" }
          ].filter(Boolean).map((activity, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className={`w-2 h-2 rounded-full ${
                activity!.type === "success" ? "bg-green-500" : "bg-blue-500"
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity!.text}</p>
                <p className="text-xs text-gray-500">{activity!.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

