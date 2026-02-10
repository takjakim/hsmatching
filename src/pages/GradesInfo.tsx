import React from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getCurrentGrades } from "../data/dummyData";

export default function GradesInfo() {
  const CURRENT_GRADES = getCurrentGrades();
  
  // 그래프 데이터 준비
  const chartData = CURRENT_GRADES.records.map((record) => ({
    semester: `${record.year}-${record.semester}학기`,
    평점: record.gpa,
    백분위: record.percentile
  }));

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📊</span>
          학점이수
        </h2>
        <p className="text-sm text-gray-600 mt-1">학기별 성적 및 학점 이수 현황을 확인할 수 있습니다.</p>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "평점평균", value: CURRENT_GRADES.averageGpa.toFixed(2), color: "bg-blue-600" },
          { label: "백분위점수", value: CURRENT_GRADES.percentileScore.toFixed(1), color: "bg-blue-600" },
          { label: "신청학점", value: CURRENT_GRADES.totalRegisteredCredits, color: "bg-blue-600" },
          { label: "취득학점", value: CURRENT_GRADES.totalAcquiredCredits, color: "bg-blue-600" }
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} text-white rounded-xl shadow-md p-6`}>
            <p className="text-sm text-white/80 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 평점 누계 그래프 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">평점 누계</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semester" />
              <YAxis domain={[0, 4.5]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="평점"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 성적 목록 테이블 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">성적목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">년도/학기</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">학년</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">신청학점</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">취득학점</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">교양취득</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">전공취득</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">교직취득</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">평점(백분위)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">학사경고</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">학기석차</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">전체석차</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">학기포기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {CURRENT_GRADES.records.map((record, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {record.year}/{record.semester}학기
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{record.grade}학년</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">{record.registeredCredits}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">{record.acquiredCredits}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">{record.generalCredits}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">{record.majorCredits}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">{record.teachingCredits}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right">
                    <span className="font-medium">{record.gpa.toFixed(2)}</span>
                    <span className="text-gray-500"> ({record.percentile.toFixed(1)})</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={record.academicWarning}
                      disabled
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-center">{record.semesterRank}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-center">{record.overallRank}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={record.semesterWithdrawal}
                      disabled
                      className="rounded border-gray-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">최고 평점</h4>
          <p className="text-2xl font-bold text-blue-600">
            {Math.max(...CURRENT_GRADES.records.map(r => r.gpa)).toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {CURRENT_GRADES.records.find(r => r.gpa === Math.max(...CURRENT_GRADES.records.map(r => r.gpa)))?.year}/
            {CURRENT_GRADES.records.find(r => r.gpa === Math.max(...CURRENT_GRADES.records.map(r => r.gpa)))?.semester}학기
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">평균 백분위</h4>
          <p className="text-2xl font-bold text-green-600">
            {(CURRENT_GRADES.records.reduce((sum, r) => sum + r.percentile, 0) / CURRENT_GRADES.records.length).toFixed(1)}
          </p>
          <p className="text-xs text-green-600 mt-1">상위권 유지</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-2">총 이수 학기</h4>
          <p className="text-2xl font-bold text-purple-600">
            {CURRENT_GRADES.records.length}
          </p>
          <p className="text-xs text-purple-600 mt-1">학기</p>
        </div>
      </div>
    </div>
  );
}

