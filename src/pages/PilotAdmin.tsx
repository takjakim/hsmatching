import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { getAllPilotResults, PilotResult } from "../../lib/supabase";
import RiasecResult from "../components/pilot/RiasecResult";
import * as XLSX from "xlsx";

interface PilotAdminProps {
  onNavigate: (page: string) => void;
}

export default function PilotAdmin({ onNavigate }: PilotAdminProps) {
  const [results, setResults] = useState<PilotResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedResult, setSelectedResult] = useState<PilotResult | null>(null);
  const [modalView, setModalView] = useState<"profile" | "json">("profile");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await getAllPilotResults();
      setResults(data);
    } catch (error) {
      console.error("Error loading pilot results:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    let filtered = results;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter((result) => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = (result.name || "").toLowerCase().includes(searchLower);
        const emailMatch = (result.email || "").toLowerCase().includes(searchLower);
        const codeMatch = result.code.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch || codeMatch;
      });
    }

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        comparison = (a.name || "").localeCompare(b.name || "");
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [results, searchTerm, sortBy, sortOrder]);

  const exportToCSV = () => {
    const headers = ["코드", "이름", "이메일", "R", "I", "A", "S", "E", "C", "보완검사여부", "생성일"];
    const rows = filteredAndSortedResults.map((result) => {
      const riasec = result.riasec_scores || {};
      const skipped = result.skipped_supplementary ? "건너뜀" : "완료";

      return [
        result.code,
        result.name || "",
        result.email || "",
        riasec.R || 0,
        riasec.I || 0,
        riasec.A || 0,
        riasec.S || 0,
        riasec.E || 0,
        riasec.C || 0,
        skipped,
        new Date(result.created_at).toLocaleString("ko-KR")
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `파일럿결과_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXLSX = () => {
    const rows = filteredAndSortedResults.map((result) => {
      const riasec = result.riasec_scores || {} as any;
      const vs = result.value_scores || {};
      const cd = result.career_decision || {};
      const se = result.self_efficacy || {};
      const pref = result.preferences || {};

      return {
        "코드": result.code,
        "이름": result.name || "",
        "학번": result.student_id || "",
        "이메일": result.email || "",
        "R": riasec.R || 0,
        "I": riasec.I || 0,
        "A": riasec.A || 0,
        "S": riasec.S || 0,
        "E": riasec.E || 0,
        "C": riasec.C || 0,
        "보완검사": result.skipped_supplementary ? "건너뜀" : "완료",
        "진로결정상태": cd.status || "",
        "진로결정점수": cd.score || "",
        "자기효능감": typeof se === "object" ? JSON.stringify(se) : se || "",
        "가치관점수": typeof vs === "object" ? JSON.stringify(vs) : vs || "",
        "선호분야": pref.fieldPreference || "",
        "근무스타일": pref.workStyle || "",
        "근무환경": pref.workEnvironment || "",
        "원시응답": JSON.stringify(result.raw_answers || {}),
        "RIASEC응답": JSON.stringify(result.riasec_answers || {}),
        "생성일": new Date(result.created_at).toLocaleString("ko-KR"),
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "파일럿결과");
    XLSX.writeFile(wb, `파일럿결과_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Statistics calculation
  const statistics = useMemo(() => {
    const total = results.length;
    const completedSupplementary = results.filter((r) => !r.skipped_supplementary).length;
    const completionRate = total > 0 ? (completedSupplementary / total) * 100 : 0;

    // RIASEC 3-code type distribution
    const typeDistribution: Record<string, number> = {};
    results.forEach((result) => {
      if (result.riasec_scores) {
        const riasec = result.riasec_scores as { R: number; I: number; A: number; S: number; E: number; C: number };
        const sorted = Object.entries(riasec).sort(([, a], [, b]) => b - a);
        if (sorted.length >= 3) {
          const code3 = sorted.slice(0, 3).map(([d]) => d).join("");
          typeDistribution[code3] = (typeDistribution[code3] || 0) + 1;
        }
      }
    });

    return {
      total,
      completionRate: Math.round(completionRate),
      typeDistribution
    };
  }, [results]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">📋</span>
              파일럿 설문 관리
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              총 {results.length}개의 파일럿 설문 결과가 저장되어 있습니다.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onNavigate("admin-logs")}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
            >
              ← 검사 로그
            </button>
            <button
              onClick={exportToXLSX}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
            >
              📥 XLSX 다운로드
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              📥 CSV 다운로드
            </button>
            <button
              onClick={loadResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 이메일 또는 코드 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬 기준
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "name")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="date">생성일</option>
              <option value="name">이름</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬 순서
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RIASEC 점수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보완검사</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "검색 결과가 없습니다." : "저장된 파일럿 설문 결과가 없습니다."}
                  </td>
                </tr>
              ) : (
                filteredAndSortedResults.map((result, index) => {
                  const riasec = result.riasec_scores || {};
                  const skipped = result.skipped_supplementary;

                  return (
                    <motion.tr
                      key={result.code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedResult(result)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-sm font-mono text-blue-600">{result.code}</code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {result.name || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {result.email || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 text-xs">
                          {Object.entries(riasec).map(([dim, score]: [string, any]) => (
                            <span key={dim} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {dim}: {typeof score === 'number' ? Math.round(score) : score}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded ${
                          skipped
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {skipped ? "건너뜀" : "완료"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(result.created_at).toLocaleString("ko-KR")}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">통계</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
              <div className="text-sm text-gray-600">총 응답수</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{statistics.completionRate}%</div>
              <div className="text-sm text-gray-600">보완검사 완료율</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(statistics.typeDistribution).length}
              </div>
              <div className="text-sm text-gray-600">유형 종류</div>
            </div>
          </div>

          {/* RIASEC Type Distribution */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">RIASEC 유형 분포</h4>
            <div className="space-y-2">
              {Object.entries(statistics.typeDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = ((count / statistics.total) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex items-center space-x-3">
                      <div className="w-12 text-sm font-semibold text-gray-700">{type}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {count}명
                          </span>
                        </div>
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">{percentage}%</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedResult && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => { setSelectedResult(null); setModalView("profile"); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedResult.name || selectedResult.code} 상세 정보
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setModalView("profile")}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      modalView === "profile"
                        ? "bg-white shadow text-blue-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    프로파일
                  </button>
                  <button
                    onClick={() => setModalView("json")}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      modalView === "json"
                        ? "bg-white shadow text-blue-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setSelectedResult(null); setModalView("profile"); }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-70px)]">
              {modalView === "json" ? (
                <div className="p-6">
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedResult, null, 2)}
                  </pre>
                </div>
              ) : selectedResult.riasec_scores ? (
                (() => {
                  const decisionLevelMap: Record<string, string> = {
                    decided: '확정',
                    exploring: '탐색',
                    undecided: '미결정',
                  };
                  const supplementaryData = selectedResult.skipped_supplementary ? undefined : (() => {
                    const vs = selectedResult.value_scores;
                    const cd = selectedResult.career_decision;
                    const se = selectedResult.self_efficacy;
                    const pref = selectedResult.preferences;
                    const ra = selectedResult.raw_answers || {};
                    if (!vs && !cd && !se && !pref) return undefined;
                    return {
                      valueScores: vs || undefined,
                      careerDecision: cd ? {
                        level: decisionLevelMap[cd.status] || '탐색',
                        confidence: (cd.score || 0) / 5,
                      } : undefined,
                      selfEfficacy: se || undefined,
                      preferences: pref ? {
                        fieldPreference: pref.fieldPreference,
                        workStyle: pref.workStyle,
                        environmentPreference: pref.workEnvironment,
                      } : undefined,
                      roleModel: ra['R01'] ? {
                        name: ra['R01'] as string,
                        traits: ra['R02'] as string[],
                      } : undefined,
                      valueRanking: ra['K01'] as Record<string, number> | undefined,
                    };
                  })();
                  return (
                    <RiasecResult
                      scores={selectedResult.riasec_scores}
                      participantName={selectedResult.name || undefined}
                      supplementaryData={supplementaryData}
                      isComplete={true}
                    />
                  );
                })()
              ) : (
                <div className="p-6 text-center text-gray-500">
                  RIASEC 점수 데이터가 없습니다.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
