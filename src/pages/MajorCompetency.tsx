import React, { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { getCurrentCompetency, CURRENT_STUDENT } from "../data/dummyData";

export default function MajorCompetency() {
  const competencyResult = getCurrentCompetency();

  // 레이더 차트 데이터
  const radarData = useMemo(() => {
    return competencyResult.competencies.map(c => ({
      competency: c.competencyName.length > 6 ? c.competencyName.substring(0, 6) : c.competencyName,
      점수: c.score,
      백분위: c.percentile
    }));
  }, [competencyResult]);

  // 막대 차트 데이터
  const barData = useMemo(() => {
    return competencyResult.competencies.map(c => ({
      name: c.competencyName,
      점수: c.score,
      백분위: c.percentile
    }));
  }, [competencyResult]);

  // 레벨별 색상
  const getLevelColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
      case 'low':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
    }
  };

  const getLevelText = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return '우수';
      case 'medium': return '보통';
      case 'low': return '개선필요';
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📋</span>
          전공능력진단검사
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {competencyResult.department} 전공능력 및 핵심역량 진단 결과
        </p>
      </div>

      {/* 종합 점수 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">종합 점수</h3>
          <div className="flex items-end space-x-2">
            <span className="text-5xl font-bold text-blue-600">{competencyResult.overallScore}</span>
            <span className="text-2xl mb-2 text-gray-500">/ 100</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            검사일: {competencyResult.testDate}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">백분위 순위</h3>
          <div className="flex items-end space-x-2">
            <span className="text-5xl font-bold text-blue-600">{competencyResult.overallPercentile}</span>
            <span className="text-2xl mb-2 text-gray-500">%</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            상위 {(100 - competencyResult.overallPercentile).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 레이더 차트 & 막대 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 레이더 차트 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">능력 프로파일</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="competency" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar 
                  name="점수" 
                  dataKey="점수" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.4} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 막대 차트 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">영역별 점수</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="점수" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 상세 능력 카드 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">능력별 상세 결과</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competencyResult.competencies.map((comp, index) => {
            const colors = getLevelColor(comp.level);
            return (
              <div 
                key={index}
                className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-gray-800">{comp.competencyName}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                        {getLevelText(comp.level)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{comp.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">점수</span>
                    <span className="font-bold text-gray-800">{comp.score}점</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">백분위</span>
                    <span className="font-bold text-gray-800">{comp.percentile}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${comp.percentile}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 강점 및 개선사항 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 강점 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center">
            <span className="mr-2">✅</span> 강점
          </h3>
          <ul className="space-y-3">
            {competencyResult.strengths.map((strength, index) => (
              <li key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 mt-0.5 flex-shrink-0">●</span>
                <span className="text-gray-700 text-sm">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 개선사항 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-orange-700 mb-4 flex items-center">
            <span className="mr-2">📈</span> 개선 권장사항
          </h3>
          <ul className="space-y-3">
            {competencyResult.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-orange-600 mt-0.5 flex-shrink-0">●</span>
                <span className="text-gray-700 text-sm">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 학생별 특별 메시지 */}
      {CURRENT_STUDENT.grade === 1 ? (
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">💡</span> 신입생을 위한 안내
          </h3>
          <p className="text-gray-700 leading-relaxed mb-3">
            신입생으로서 기초 능력을 점검했습니다. 이 결과를 바탕으로 1학년 동안 부족한 역량을 
            개발하고, RIASEC 진로 적성검사와 함께 자신에게 맞는 전공을 탐색해보세요.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">추천 활동:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 다양한 전공 체험 프로그램 참여</li>
              <li>• 교양 과목을 통한 폭넓은 학습</li>
              <li>• RIASEC 검사로 진로 적성 파악</li>
              <li>• 동아리 활동으로 협업 능력 개발</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">🎯</span> 전공 역량 활용 가이드
          </h3>
          <p className="text-gray-700 leading-relaxed mb-3">
            {competencyResult.department} 전공 능력이 전반적으로 우수합니다. 
            이러한 강점을 살려 관련 직무에 도전하거나, 개선이 필요한 영역을 보완하여 
            더욱 경쟁력 있는 인재로 성장할 수 있습니다.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">다음 단계:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 진로-학습 분석에서 적성과 전공능력 연계 확인</li>
              <li>• 개선 영역 관련 심화 과목 수강</li>
              <li>• 인턴십이나 프로젝트로 실무 경험 쌓기</li>
              <li>• 강점 역량을 활용한 포트폴리오 구축</li>
            </ul>
          </div>
        </div>
      )}

      {/* 능력 수준별 통계 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">능력 수준 분포</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { 
              level: 'high' as const, 
              label: '우수', 
              count: competencyResult.competencies.filter(c => c.level === 'high').length,
              color: 'bg-green-600'
            },
            { 
              level: 'medium' as const, 
              label: '보통', 
              count: competencyResult.competencies.filter(c => c.level === 'medium').length,
              color: 'bg-yellow-600'
            },
            { 
              level: 'low' as const, 
              label: '개선필요', 
              count: competencyResult.competencies.filter(c => c.level === 'low').length,
              color: 'bg-red-600'
            }
          ].map((stat) => (
            <div key={stat.level} className={`${stat.color} text-white rounded-xl shadow-md p-5 text-center`}>
              <p className="text-sm opacity-90 mb-2">{stat.label}</p>
              <p className="text-4xl font-bold">{stat.count}</p>
              <p className="text-xs opacity-80 mt-1">개 영역</p>
            </div>
          ))}
        </div>
      </div>

      {/* 다운로드 및 공유 */}
      <div className="flex justify-end space-x-3">
        <button className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition">
          PDF 다운로드
        </button>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-md">
          상담 신청하기
        </button>
      </div>
    </div>
  );
}




