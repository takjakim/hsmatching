import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { getResultByCode, isValidCode } from "../utils/resultCode";
import { recommendRoles } from "../utils/roleRecommendation";
import { recommendMajors } from "../utils/recommendMajors";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export default function ResultViewer() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // URL 파라미터에서 코드 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      // 자동으로 조회
      setTimeout(() => {
        handleSearchWithCode(urlCode.toUpperCase());
      }, 100);
    }
  }, []);

  const handleSearchWithCode = (searchCode: string) => {
    setError("");
    setLoading(true);

    if (!isValidCode(searchCode)) {
      setError("올바른 코드 형식이 아닙니다. (6자리 이상 영문/숫자)");
      setLoading(false);
      return;
    }

    const foundResult = getResultByCode(searchCode.toUpperCase());
    
    if (!foundResult) {
      setError("결과를 찾을 수 없습니다. 코드를 확인해주세요.");
      setLoading(false);
      return;
    }

    setResult(foundResult);
    setCode(searchCode.toUpperCase());
    setLoading(false);
  };

  const handleSearch = () => {
    handleSearchWithCode(code);
  };

  if (result) {
    // 결과 표시
    const riasecData = result.riasecData || [];
    const dimLabels: Record<Dim, string> = { 
      R: "R(현장형)", 
      I: "I(탐구형)", 
      A: "A(예술형)", 
      S: "S(사회형)", 
      E: "E(진취형)", 
      C: "C(사무형)"
    };

    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">🔍</span>
            결과 조회
          </h2>
          <p className="text-sm text-gray-600 mt-1">코드로 저장된 검사 결과를 확인합니다.</p>
        </div>

        {/* 결과 코드 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 no-print">
          <p className="text-sm text-gray-600 mb-2">조회 코드</p>
          <code className="text-xl font-bold text-blue-700 tracking-wider">{code.toUpperCase()}</code>
          <button
            onClick={() => {
              setResult(null);
              setCode("");
              setError("");
            }}
            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
          >
            다른 코드 조회
          </button>
        </div>

        {/* 결과 표시 */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* 결과 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">진로 적성 분석 결과</h2>
            <p className="text-gray-600">당신의 진로 적성 분석 결과입니다</p>
          </div>

          {/* RIASEC 레이더 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">📊</span> RIASEC 스파이더 차트
              </h3>
              <div className="w-full h-64 bg-white rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riasecData} outerRadius="80%">
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#4b5563' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="나" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">🏆</span> 차원 정규화 순위
              </h3>
              <div className="space-y-3">
                {Object.entries(result.norm || {})
                  .map(([k, v]: [string, any]) => ({ key: k, score: Math.round((v || 0) * 100) }))
                  .sort((a, b) => b.score - a.score)
                  .map((item, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                    return (
                      <div key={item.key} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: colors[index] }}>
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-800">{dimLabels[item.key as Dim] || item.key}</span>
                          </div>
                          <span className="text-lg font-bold text-gray-700">{item.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${item.score}%`, backgroundColor: colors[index] }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* 설명 */}
          {result.explanation && (
            <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">💡</span> 개인화 설명
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg mb-3 font-medium">{result.explanation.lead}</p>
              <p className="text-gray-700 leading-relaxed mb-3">{result.explanation.majorLine} {result.explanation.roleLine}</p>
              {result.explanation.bullets && result.explanation.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {result.explanation.bullets.map((b: string, i: number) => (
                    <li key={i} className="flex items-start text-gray-700">
                      <span className="mr-2 text-yellow-600">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 전공 & 직무 추천 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 전공 Top 5 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">🎓</span> 전공 추천 Top 5
              </h3>
              <div className="space-y-3">
                {result.majors?.map((m: any, index: number) => (
                  <motion.div
                    key={m.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-800">{m.name}</span>
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(m.score * 100)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 직무 Top 5 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">💼</span> 직무 추천 Top 5
              </h3>
              <div className="space-y-3">
                {result.roles?.map((r: any, index: number) => (
                  <motion.div
                    key={r.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-gray-800">{r.name}</span>
                      </div>
                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(r.score * 100)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200 no-print">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.print()}
              className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              📄 PDF 다운로드
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const email = prompt('이메일 주소를 입력하세요:');
                if (email) {
                  const subject = encodeURIComponent('진로 적성검사 결과');
                  const resultUrl = `${window.location.origin}${window.location.pathname}?code=${code.toUpperCase()}`;
                  const body = encodeURIComponent(`결과 확인 코드: ${code.toUpperCase()}\n\n결과를 확인하려면 다음 링크를 방문하세요:\n${resultUrl}`);
                  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                }
              }}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              📧 이메일로 보내기
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🔍</span>
          결과 조회
        </h2>
        <p className="text-sm text-gray-600 mt-1">검사 완료 시 받은 코드로 결과를 확인할 수 있습니다.</p>
      </div>

      {/* 코드 입력 폼 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            결과 확인 코드
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="코드를 입력하세요 (예: ABC12345)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase"
              maxLength={20}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>안내:</strong> 검사 완료 시 받은 8자리 코드를 입력하세요.
              <br />
              코드는 90일간 유효합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






