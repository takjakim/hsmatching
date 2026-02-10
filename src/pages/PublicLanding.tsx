import React from "react";
import { motion } from "framer-motion";

interface PublicLandingProps {
  onStartTest: () => void;
  onViewResult: () => void;
  onLogin?: () => void;
}

export default function PublicLanding({ onStartTest, onViewResult, onLogin }: PublicLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-5xl">🎯</span>
            </div>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            진로 적성검사
          </h1>
          <p className="text-xl text-gray-600">
            MJU 전공 진로 적합도 검사 기반으로 나에게 맞는 전공과 직무를 찾아보세요
          </p>
        </div>

        {/* 주요 기능 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: "📝", title: "80문항", desc: "강제선택형 문항으로 구성" },
            { icon: "⚡", title: "적응형", desc: "1차 후 교차 문항 진행" },
            { icon: "📊", title: "MJU 전공 진로 적합도 검사", desc: "6차원 기반 분석" }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 text-center border border-blue-100 shadow-md"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartTest}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🚀</span>
              <div className="text-left">
                <div>검사 시작하기</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewResult}
            className="bg-white border-2 border-blue-600 text-blue-600 font-bold text-lg py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🔍</span>
              <div className="text-left">
                <div>결과 조회하기</div>
                <div className="text-sm font-normal opacity-70">코드로 결과 확인</div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📋</span> 검사 안내
          </h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="mr-2 text-blue-600 font-bold">•</span>
              <span>각 문항에서 더 본인에게 맞는 활동을 <strong>A</strong> 또는 <strong>B</strong> 중 하나로 선택합니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600 font-bold">•</span>
              <span>검사 완료 시 <strong>8자리 결과 코드</strong>가 발급됩니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600 font-bold">•</span>
              <span>결과 코드로 언제든지 결과를 확인하거나 PDF로 다운로드할 수 있습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600 font-bold">•</span>
              <span>결과는 <strong>90일간</strong> 보관됩니다.</span>
            </li>
          </ul>
        </div>

        {/* 관리자 로그인 링크 */}
        {onLogin && (
          <div className="mt-8 text-center">
            <button
              onClick={onLogin}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              학생 로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}







