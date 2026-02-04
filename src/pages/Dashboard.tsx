import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CURRENT_STUDENT,
  getCurrentGrades,
  ROLE_MODELS,
  compareWithRoleModel,
  getCoursesByGradeUpTo
} from "../data/dummyData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import ConnectionLinks from "../components/ConnectionLinks";

interface DashboardProps {
  onNavigate: (page: string) => void;
  riasecCompleted?: boolean;
  riasecResult?: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null;
}

export default function Dashboard({ onNavigate, riasecCompleted = false, riasecResult }: DashboardProps) {
  const currentGrades = getCurrentGrades();

  // 롤모델 유사도 계산
  const coursesForComparison = getCoursesByGradeUpTo(CURRENT_STUDENT.grade);
  const roleModelComparisons = ROLE_MODELS.map(roleModel =>
    compareWithRoleModel(coursesForComparison, roleModel)
  );
  const bestRoleModelMatch = Math.max(...roleModelComparisons.map(r => r.matchPercentage), 0);

  // 커리큘럼 완료율 계산 (총 120학점 기준)
  const curriculumProgress = Math.min(Math.round((currentGrades.totalAcquiredCredits / 120) * 100), 100);

  // 5단계 진행 상태 (실제로는 백엔드에서 가져와야 함)
  const roadmapSteps = [
    {
      step: 1,
      title: "MJU 전공 진로 적합도 검사",
      description: "진로 적성 검사",
      icon: "🎯",
      completed: riasecCompleted,
      progress: riasecCompleted ? 100 : 0,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      action: () => onNavigate("riasec"),
      actionLabel: riasecCompleted ? "결과 보기" : "검사 시작"
    },
    { 
      step: 2, 
      title: "핵심역량진단", 
      description: "인재상 성장 지원",
      icon: "💪",
      completed: true,
      progress: 100,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
      action: () => onNavigate("competency"),
      actionLabel: "결과 보기"
    },
    { 
      step: 3, 
      title: "전공능력진단", 
      description: "추천 전공 자가진단",
      icon: "📚",
      completed: false,
      progress: 0,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      action: () => onNavigate("roadmap-explorer"),
      actionLabel: "자가진단 시작"
    },
    {
      step: 4,
      title: "롤모델 탐색",
      description: riasecCompleted && bestRoleModelMatch > 0
        ? `최고 유사도: ${bestRoleModelMatch.toFixed(1)}%`
        : "선배 커리어 탐색",
      icon: "⭐",
      completed: false,
      progress: riasecCompleted ? bestRoleModelMatch : 0,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-300",
      action: () => onNavigate("roadmap-fullcycle"),
      actionLabel: "탐색 시작"
    },
    {
      step: 5,
      title: "커리큘럼 플래너",
      description: `${currentGrades.totalAcquiredCredits}/120 학점 이수`,
      icon: "📊",
      completed: false,
      progress: curriculumProgress,
      color: "from-cyan-500 to-teal-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-300",
      action: () => onNavigate("roadmap-fullcycle"),
      actionLabel: "관리하기"
    }
  ];

  // 전체 진행률 계산
  const totalProgress = Math.round(roadmapSteps.reduce((acc, step) => acc + step.progress, 0) / roadmapSteps.length);
  
  // 완료된 단계 수
  const completedSteps = roadmapSteps.filter(step => step.completed).length;

  // 목표 진로 (RIASEC 결과 기반, 더미 데이터)
  const targetCareer = riasecCompleted ? "데이터 분석가" : null;

  // 역량 데이터 (더미)
  const competencyData = [
    { axis: "융합역량", value: 75 },
    { axis: "실용역량", value: 68 },
    { axis: "창의역량", value: 82 },
    { axis: "자기주도역량", value: 70 },
    { axis: "어우름역량", value: 65 },
    { axis: "배려역량", value: 78 }
  ];

  // RIASEC 결과를 차트 데이터로 변환
  const riasecChartData = riasecResult ? [
    { axis: "R (현실형)", value: Math.round(riasecResult.R * 100) },
    { axis: "I (탐구형)", value: Math.round(riasecResult.I * 100) },
    { axis: "A (예술형)", value: Math.round(riasecResult.A * 100) },
    { axis: "S (사회형)", value: Math.round(riasecResult.S * 100) },
    { axis: "E (진취형)", value: Math.round(riasecResult.E * 100) },
    { axis: "C (관습형)", value: Math.round(riasecResult.C * 100) }
  ] : null;

  return (
    <div className="space-y-6">
      {/* 상단 환영 메시지 및 전체 진행률 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              안녕하세요, {CURRENT_STUDENT.name}님!
            </h1>
            <p className="text-blue-100 mb-4">
              {CURRENT_STUDENT.department} {CURRENT_STUDENT.grade}학년 · 학번 {CURRENT_STUDENT.studentId}
            </p>
            {targetCareer ? (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="font-medium">목표 진로: {targetCareer}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span>MJU 전공 진로 적합도 검사를 통해 목표 진로를 설정해보세요!</span>
              </div>
            )}
          </div>
          
          {/* 전체 진행률 원형 차트 */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 md:w-36 md:h-36">
              <svg className="w-28 h-28 md:w-36 md:h-36 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="md:hidden"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="hidden md:block"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="md:hidden"
                  stroke="white"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - totalProgress / 100)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - totalProgress / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="hidden md:block"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - totalProgress / 100)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - totalProgress / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.p
                    className="text-2xl md:text-3xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {totalProgress}%
                  </motion.p>
                  <p className="text-xs text-blue-100">e-advisor 진행률</p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-blue-100">
              {completedSteps}/5단계 완료
            </p>
          </div>
        </div>
      </motion.div>

      {/* 5단계 진로 로드맵 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">나의 진로 로드맵</h2>
            <p className="text-sm text-gray-500 mt-1">5단계를 완료하고 목표 진로에 도달하세요!</p>
          </div>
          <button
            onClick={() => onNavigate("roadmap-fullcycle")}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 min-h-[44px]"
          >
            전체 보기 →
          </button>
        </div>

        {/* 5단계 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {roadmapSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${step.bgColor} ${step.borderColor} border-2 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group`}
              onClick={step.action}
            >
              {/* 완료 체크마크 */}
              {step.completed && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              
              {/* 단계 번호 */}
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm mb-3`}>
                {step.step}
              </div>
              
              {/* 아이콘 */}
              <div className="text-2xl md:text-3xl mb-2">{step.icon}</div>

              {/* 제목 */}
              <h3 className="font-bold text-gray-800 text-xs md:text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{step.description}</p>
              
              {/* 진행률 바 */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <motion.div
                  className={`h-full bg-gradient-to-r ${step.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${step.progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{step.progress}%</span>
                <span className={`text-xs font-medium ${step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.completed ? '완료' : '진행중'}
                </span>
              </div>

              {/* 호버 시 액션 버튼 */}
              <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {step.actionLabel}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 연결선 (데스크톱에서만) */}
        <div className="hidden md:flex items-center justify-center mt-4 px-12">
          <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full relative">
            {roadmapSteps.map((step, index) => (
              <div
                key={step.step}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}
                style={{ left: `${(index / (roadmapSteps.length - 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            ))}
          </div>
        </div>

        {/* 지원 서비스 바로가기 */}
        <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">지원 서비스 바로가기</h3>
          <ConnectionLinks variant="horizontal" />
        </div>
      </div>

      {/* 진단 현황 요약 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* RIASEC 검사 결과 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              MJU 전공 진로 적합도 검사
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              riasecCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {riasecCompleted ? '완료' : '미완료'}
            </span>
          </div>
          
          {riasecChartData ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riasecChartData} outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="MJU 전공 진로 적합도 검사" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
              <p className="text-sm text-gray-500 text-center">
                검사를 완료하고<br />나의 진로 유형을 확인하세요
              </p>
            </div>
          )}
          
          <button
            onClick={() => onNavigate(riasecCompleted ? "insight" : "riasec")}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition min-h-[44px]"
          >
            {riasecCompleted ? "결과 상세 보기 →" : "검사 시작하기 →"}
          </button>
        </motion.div>

        {/* 핵심역량 진단 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              핵심역량진단
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              완료
            </span>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencyData} outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="역량" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <button
            onClick={() => onNavigate("competency")}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-medium transition min-h-[44px]"
          >
            결과 상세 보기 →
          </button>
        </motion.div>

        {/* 전공능력 진단 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              전공능력진단
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              미완료
            </span>
          </div>
          
          <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-lg">
            <p className="text-sm text-gray-500 text-center">
              추천 전공 자가진단을 통해<br />전공을 탐색해보세요
            </p>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">현재 전공</p>
              <p className="font-medium text-gray-700">{CURRENT_STUDENT.department}</p>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate("roadmap-explorer")}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-sm font-medium transition min-h-[44px]"
          >
            자가진단 시작하기 →
          </button>
        </motion.div>
      </div>


      {/* 빠른 액션 버튼들 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { icon: "📂", label: "전공 탐색", desc: "추천 전공 자가진단", action: () => onNavigate("roadmap-explorer"), iconBg: "bg-indigo-100", iconColor: "text-indigo-600", borderColor: "border-indigo-200" },
          { icon: "📐", label: "커리큘럼 플래너", desc: "4년 계획 설계", action: () => onNavigate("roadmap-fullcycle"), iconBg: "bg-blue-100", iconColor: "text-blue-600", borderColor: "border-blue-200" },
          { icon: "⭐", label: "롤모델 탐색", desc: "선배 커리어 분석", action: () => onNavigate("roadmap-fullcycle"), iconBg: "bg-amber-100", iconColor: "text-amber-600", borderColor: "border-amber-200" },
          { icon: "📊", label: "성적 현황", desc: "학점 및 이수 현황", action: () => onNavigate("grades"), iconBg: "bg-green-100", iconColor: "text-green-600", borderColor: "border-green-200" },
          { icon: "👤", label: "개인정보", desc: "프로필 관리", action: () => onNavigate("personal"), iconBg: "bg-purple-100", iconColor: "text-purple-600", borderColor: "border-purple-200" }
        ].map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            onClick={item.action}
            className={`bg-white/60 backdrop-blur-sm border border-white/30 shadow-md rounded-2xl p-4 text-left hover:shadow-lg transition-all hover:scale-[1.02] group min-h-[120px] flex flex-col`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 ${item.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-xl md:text-2xl">{item.icon}</span>
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">{item.label}</h4>
            <p className="text-xs md:text-sm text-gray-500">{item.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* 하단 정보 카드들 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 목표 달성 현황 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">목표 달성 현황</h3>
          <div className="space-y-4">
            {[
              { label: "진로 탐색", value: riasecCompleted ? 100 : 0, color: "bg-blue-500" },
              { label: "역량 개발", value: 100, color: "bg-purple-500" },
              { label: "전공 심화", value: 0, color: "bg-green-500" },
              { label: "경력 준비", value: 8, color: "bg-amber-500" }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.9 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 추천 액션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-4">다음 추천 액션</h3>
          <div className="space-y-3">
            {!riasecCompleted && (
              <button
                onClick={() => onNavigate("riasec")}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
              >
                <p className="font-medium">MJU 전공 진로 적합도 검사 완료하기</p>
                <p className="text-sm text-white/70">진로 적성을 파악하세요</p>
              </button>
            )}
            <button
              onClick={() => onNavigate("roadmap-fullcycle")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
            >
              <p className="font-medium">커리큘럼 계획 세우기</p>
              <p className="text-sm text-white/70">4년 로드맵을 설계하세요</p>
            </button>
            <button
              onClick={() => onNavigate("roadmap-fullcycle")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition min-h-[64px]"
            >
              <p className="font-medium">롤모델 선배 찾기</p>
              <p className="text-sm text-white/70">성공한 선배의 경로를 참고하세요</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
