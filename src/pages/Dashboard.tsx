import React from "react";
import { motion } from "framer-motion";
import { CURRENT_STUDENT, getCurrentGrades } from "../data/dummyData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";

interface DashboardProps {
  onNavigate: (page: string) => void;
  riasecCompleted?: boolean;
}

export default function Dashboard({ onNavigate, riasecCompleted = false }: DashboardProps) {
  const currentGrades = getCurrentGrades();
  
  // 역량 데이터 (더미)
  const competencyData = [
    { axis: "융합역량", value: 75 },
    { axis: "실용역량", value: 68 },
    { axis: "창의역량", value: 82 },
    { axis: "자기주도역량", value: 70 },
    { axis: "어우름역량", value: 65 },
    { axis: "배려역량", value: 78 }
  ];

  const competencyBarData = [
    { name: "융합역량", value: 75, color: "#10b981" },
    { name: "실용역량", value: 68, color: "#eab308" },
    { name: "창의역량", value: 82, color: "#ef4444" },
    { name: "자기주도역량", value: 70, color: "#3b82f6" },
    { name: "어우름역량", value: 65, color: "#f97316" },
    { name: "배려역량", value: 78, color: "#a855f7" }
  ];

  return (
    <div className="space-y-6">
      {/* 나의 역량성취도 카드 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            나의 역량성취도
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 레이더 차트 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">핵심역량 성취도 결과</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={competencyData} outerRadius="80%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="역량" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 바 차트 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">핵심역량 비교과 이수시간</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competencyBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {competencyBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {competencyBarData.map((item) => (
                <div key={item.name} className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => onNavigate("courses")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                이수교양교과 내역 확인
              </button>
              <button
                onClick={() => onNavigate("riasec")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                핵심역량진단 참여
              </button>
            </div>
            {riasecCompleted && (
              <p className="mt-2 text-xs text-gray-500 text-center">
                이번 학기 진단 참여 일자 : {new Date().toISOString().split('T')[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 사용자 프로필 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-4xl">👤</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{CURRENT_STUDENT.name}</h3>
            <p className="text-sm text-gray-600 mb-4">({CURRENT_STUDENT.studentId})</p>
            <div className="grid grid-cols-2 gap-2 w-full mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">명지 SNS</p>
                <p className="text-sm font-semibold text-gray-800">0</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">친구요청</p>
                <p className="text-sm font-semibold text-gray-800">0</p>
              </div>
            </div>
            <div className="w-full space-y-2">
              <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 rounded-lg p-3 text-left flex items-center justify-between transition">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🔔</span>
                  <span className="text-sm font-medium text-gray-700">Letter 현황</span>
                </div>
                <span className="text-xs text-red-600 font-semibold">미확인 2건</span>
              </button>
              <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 rounded-lg p-3 text-left flex items-center justify-between transition">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🏆</span>
                  <span className="text-sm font-medium text-gray-700">보유마일리지</span>
                </div>
                <span className="text-xs text-blue-600 font-semibold">70 M</span>
              </button>
              <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 rounded-lg p-3 text-left flex items-center justify-between transition">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">✓</span>
                  <span className="text-sm font-medium text-gray-700">My Certification</span>
                </div>
                <span className="text-xs text-gray-500">나의 인증현황</span>
              </button>
            </div>
          </div>
        </div>

        {/* 인증 달성률 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">인증 달성률</h3>
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * 0.15} ${2 * Math.PI * 56}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">15.0%</p>
                    <p className="text-xs text-gray-600">달성</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">핵심역량인증 달성률</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * 0.08} ${2 * Math.PI * 56}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">8.0%</p>
                    <p className="text-xs text-gray-600">달성</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">인성인증 달성률</p>
            </div>
          </div>
        </div>

        {/* 신기술 인증 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">신기술·(첨단)산업분야 인증</h3>
          <div className="space-y-2">
            {[
              "항공우주, 미래자동차",
              "생명건강 (바이오헬스)",
              "차세대 반도체",
              "디지털",
              "환경·에너지"
            ].map((item, index) => (
              <button
                key={index}
                className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg p-3 text-left transition"
              >
                <span className="text-sm font-medium text-gray-700">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 카드들 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 진단결과 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6 relative">
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🥇</span>
            <div>
              <h3 className="font-semibold text-gray-800">핵심역량진단 결과</h3>
              <p className="text-sm text-gray-600 mt-1">RIASEC 기반 진로 적성 분석</p>
            </div>
          </div>
          {riasecCompleted ? (
            <button
              onClick={() => onNavigate("insight")}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              결과 보기 →
            </button>
          ) : (
            <button
              onClick={() => onNavigate("riasec")}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              진단 시작하기 →
            </button>
          )}
        </div>

        {/* 상담현황 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6 relative">
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">[교수상담]</p>
              <p className="font-semibold text-gray-800 mt-1">2025-08-01(FRI) 김교수</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              상담 완료
            </button>
          </div>
        </div>

        {/* 포트폴리오 카드 */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full -mr-16 -mt-16 opacity-20" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">나의 포트폴리오</h3>
            <p className="text-sm text-blue-100 mb-4">미리 작성하는 이력서/자소서</p>
            <p className="text-sm font-medium mb-4">나의 Story를 만들자</p>
            <button
              onClick={() => onNavigate("insight")}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              시작하기 →
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 세로 버튼들 */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 hidden lg:flex flex-col space-y-2 z-40">
        {[
          { label: "비교과 프로그램 만족도 조사", color: "bg-blue-600" },
          { label: "비교과 활동 기준 조회", color: "bg-green-600" },
          { label: "비교과 활동 등록", color: "bg-orange-600" },
          { label: "비교과 프로그램 이수증", color: "bg-blue-500" }
        ].map((item, index) => (
          <button
            key={index}
            className={`${item.color} hover:opacity-90 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition transform hover:scale-105`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
