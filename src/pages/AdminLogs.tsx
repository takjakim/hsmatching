import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { getCodeList, getResultByCode, getFullResultByCode } from "../utils/resultCode";
import { formatDeviceInfo, DeviceInfo } from "../utils/deviceInfo";

interface ResultLog {
  code: string;
  createdAt: string;
  result: any;
  deviceInfo?: DeviceInfo;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<ResultLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "code">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLoading(true);
    const codeList = getCodeList();
    const allLogs: ResultLog[] = [];

    codeList.forEach(({ code, createdAt }) => {
      // 전체 데이터 가져오기 (기기 정보 포함)
      const fullData = getFullResultByCode(code);
      if (fullData && fullData.result) {
        allLogs.push({
          code,
          createdAt,
          result: fullData.result,
          deviceInfo: fullData.deviceInfo
        });
      }
    });

    setLogs(allLogs);
    setLoading(false);
  };

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = logs;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(log => {
        const searchLower = searchTerm.toLowerCase();
        const codeMatch = log.code.toLowerCase().includes(searchLower);
        const resultMatch = JSON.stringify(log.result).toLowerCase().includes(searchLower);
        const deviceMatch = log.deviceInfo ? 
          JSON.stringify(log.deviceInfo).toLowerCase().includes(searchLower) ||
          formatDeviceInfo(log.deviceInfo).browser.toLowerCase().includes(searchLower) ||
          formatDeviceInfo(log.deviceInfo).os.toLowerCase().includes(searchLower) ||
          formatDeviceInfo(log.deviceInfo).device.toLowerCase().includes(searchLower) ||
          (log.deviceInfo.fingerprint || "").toLowerCase().includes(searchLower)
          : false;
        return codeMatch || resultMatch || deviceMatch;
      });
    }

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comparison = a.code.localeCompare(b.code);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [logs, searchTerm, sortBy, sortOrder]);

  const exportToCSV = () => {
    const headers = ["코드", "생성일시", "R", "I", "A", "S", "E", "C", "추천전공1", "추천전공2", "추천전공3", "추천직무1", "추천직무2", "추천직무3", "브라우저", "OS", "기기타입", "화면해상도", "기기지문"];
    const rows = filteredAndSortedLogs.map(log => {
      const norm = log.result.norm || {};
      const majors = (log.result.majors || []).slice(0, 3).map((m: any) => m.name);
      const roles = (log.result.roles || []).slice(0, 3).map((r: any) => r.name);
      
      let deviceInfo = { browser: "", os: "", device: "", screen: "", other: "" };
      if (log.deviceInfo) {
        deviceInfo = formatDeviceInfo(log.deviceInfo);
      }
      
      return [
        log.code,
        new Date(log.createdAt).toLocaleString("ko-KR"),
        Math.round((norm.R || 0) * 100),
        Math.round((norm.I || 0) * 100),
        Math.round((norm.A || 0) * 100),
        Math.round((norm.S || 0) * 100),
        Math.round((norm.E || 0) * 100),
        Math.round((norm.C || 0) * 100),
        majors[0] || "",
        majors[1] || "",
        majors[2] || "",
        roles[0] || "",
        roles[1] || "",
        roles[2] || "",
        deviceInfo.browser,
        deviceInfo.os,
        deviceInfo.device,
        deviceInfo.screen,
        log.deviceInfo?.fingerprint || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `검사응답로그_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const data = filteredAndSortedLogs.map(log => ({
      code: log.code,
      createdAt: log.createdAt,
      riasec: log.result.norm || {},
      recommendedMajors: (log.result.majors || []).map((m: any) => ({
        name: m.name,
        score: m.matchScore || m.score
      })),
      recommendedRoles: (log.result.roles || []).map((r: any) => ({
        name: r.name,
        score: r.matchScore || r.score
      })),
      deviceInfo: log.deviceInfo || null
    }));

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `검사응답로그_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">📊</span>
              검사 응답 로그
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              총 {logs.length}개의 검사 결과가 저장되어 있습니다.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              📥 CSV 다운로드
            </button>
            <button
              onClick={exportToJSON}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              📥 JSON 다운로드
            </button>
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
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
              placeholder="코드 또는 내용 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬 기준
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "code")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="date">생성일시</option>
              <option value="code">코드</option>
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

      {/* 로그 테이블 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기기 정보</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RIASEC 점수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천 전공</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천 직무</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세보기</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "검색 결과가 없습니다." : "저장된 검사 결과가 없습니다."}
                  </td>
                </tr>
              ) : (
                filteredAndSortedLogs.map((log, index) => {
                  const norm = log.result.norm || {};
                  const topMajors = (log.result.majors || []).slice(0, 3);
                  const topRoles = (log.result.roles || []).slice(0, 3);
                  
                  // 기기 정보 포맷팅
                  let deviceInfo = { browser: "알 수 없음", os: "알 수 없음", device: "알 수 없음", screen: "", other: "" };
                  if (log.deviceInfo) {
                    deviceInfo = formatDeviceInfo(log.deviceInfo);
                  }
                  
                  return (
                    <motion.tr
                      key={log.code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-sm font-mono text-blue-600">{log.code}</code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">브라우저:</span>
                            <span className="text-gray-600">{deviceInfo.browser}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">OS:</span>
                            <span className="text-gray-600">{deviceInfo.os}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">기기:</span>
                            <span className="text-gray-600">{deviceInfo.device}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">화면:</span>
                            <span className="text-gray-600">{deviceInfo.screen}</span>
                          </div>
                          {log.deviceInfo?.fingerprint && (
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-700">지문:</span>
                              <code className="text-gray-600 text-xs">{log.deviceInfo.fingerprint}</code>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 text-xs">
                          {Object.entries(norm).map(([dim, score]: [string, any]) => (
                            <span key={dim} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {dim}: {Math.round(score * 100)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {topMajors.length > 0 ? (
                            topMajors.map((m: any, i: number) => (
                              <div key={i} className="text-gray-700">
                                {i + 1}. {m.name} ({m.matchScore || Math.round(m.score * 100)}%)
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">없음</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {topRoles.length > 0 ? (
                            topRoles.map((r: any, i: number) => (
                              <div key={i} className="text-gray-700">
                                {i + 1}. {r.name} ({Math.round((r.matchScore || r.score) * 100)}%)
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">없음</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={`?code=${log.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          보기 →
                        </a>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">통계</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-sm text-gray-600">총 검사 수</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {new Set(logs.map(log => new Date(log.createdAt).toLocaleDateString())).size}
              </div>
              <div className="text-sm text-gray-600">검사 일수</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(logs.length / Math.max(1, new Set(logs.map(log => new Date(log.createdAt).toLocaleDateString())).size))}
              </div>
              <div className="text-sm text-gray-600">일평균 검사 수</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {new Date(logs[0]?.createdAt || Date.now()).toLocaleDateString("ko-KR")}
              </div>
              <div className="text-sm text-gray-600">최근 검사일</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
