import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { getResultByCode, isValidCode } from "../utils/resultCode";
import { recommendRoles } from "../utils/roleRecommendation";
import { recommendMajors } from "../utils/recommendMajors";
import { getWorkpediaJobUrl, getWorkpediaJobCode } from "../data/workpediaJobMap";
import { getMajorUrl } from "../data/majorList";
import { getJobInfo, type JobInfo } from "../data/jobInfoMap";
import { getRoleDescription } from "../utils/roleRecommendation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logLogo from "../img/log_logo.png";
import logoImg from "../img/logo.png";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

// PDF 레이아웃 컴포넌트 (A4 1페이지)
function PDFLayout({ result, dimLabels, riasecData, code }: { result: any; dimLabels: Record<Dim, string>; riasecData: any[]; code: string }) {
  if (!result) return null;

  const topMajors = (result.majors || []).slice(0, 5);
  const topRoles = (result.roles || []).slice(0, 5);
  const topDimensions = Object.entries(result.norm || {})
    .map(([k, v]: [string, any]) => ({ key: k, score: Math.round((v || 0) * 100) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div style={{ width: '794px', height: '1123px', padding: '40px', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px', position: 'relative' }}>
      {/* 헤더 - 로고와 코드 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px', 
        backgroundColor: '#003d82', 
        padding: '20px 25px', 
        borderRadius: '8px',
        borderBottom: '3px solid #002d5f'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={logLogo} alt="MYiCap Logo" style={{ height: '50px', width: 'auto' }} />
          <div style={{ fontSize: '12px', color: '#ffffff', opacity: 0.9 }}>명지대학교 진로 적성 분석 시스템</div>
        </div>
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '8px 16px', 
          borderRadius: '6px', 
          border: '2px solid #ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>조회 코드</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#003d82', letterSpacing: '2px', fontFamily: 'monospace' }}>{code}</div>
        </div>
      </div>

      {/* 제목 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>진로 적성 분석 결과</h1>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>당신의 진로 적성 분석 결과입니다</p>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        {/* 좌측: RIASEC 차트 및 차원 순위 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* RIASEC 레이더 차트 */}
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #93c5fd', minHeight: '160px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937', textAlign: 'center' }}>RIASEC 스파이더 차트</h3>
            <div style={{ width: '100%', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riasecData} outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="axis" 
                    tick={{ fontSize: '10px', fill: '#4b5563', fontWeight: 500 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: '8px' }} />
                  <Radar name="나" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* 차원 순위 (간단히) */}
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>차원 순위</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topDimensions.slice(0, 6).map((item: any, index: number) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                return (
                  <div key={item.key} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        backgroundColor: colors[index], 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        flexShrink: 0,
                        padding: 0,
                        margin: 0,
                        position: 'relative'
                      }}>
                        <span style={{ 
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          lineHeight: '1'
                        }}>
                          {index + 1}
                        </span>
                      </div>
                      <span style={{ flex: '1', fontSize: '11px', fontWeight: '600', color: '#374151', minWidth: 0 }}>
                        {dimLabels[item.key as Dim] || item.key}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', minWidth: '35px', textAlign: 'right', flexShrink: 0 }}>
                        {item.score}%
                      </span>
                    </div>
                    {/* 막대 그래프 */}
                    <div style={{ 
                      width: 'calc(100% - 34px)', 
                      height: '6px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '3px', 
                      overflow: 'hidden',
                      marginLeft: '28px'
                    }}>
                      <div style={{ 
                        width: `${item.score}%`, 
                        height: '100%', 
                        backgroundColor: colors[index],
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 개인화 설명 (풍부한 내용) */}
          {result.explanation && (
            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fbbf24' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>개인화 설명</h3>
              <p style={{ fontSize: '10px', color: '#374151', lineHeight: '1.5', marginBottom: '8px', fontWeight: '500' }}>
                {result.explanation.lead}
              </p>
              <p style={{ fontSize: '10px', color: '#374151', lineHeight: '1.5', marginBottom: '8px' }}>
                {result.explanation.majorLine} {result.explanation.roleLine}
              </p>
              {result.explanation.bullets && result.explanation.bullets.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {result.explanation.bullets.map((b: string, i: number) => (
                    <div key={i} style={{ marginBottom: '4px', fontSize: '9px', color: '#4b5563', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start' }}>
                      <span style={{ color: '#f59e0b', marginRight: '6px', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* 추가 정보: 상위 전공 및 직무 간단 요약 */}
              {topMajors.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '9px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>주요 추천 전공</div>
                  <div style={{ fontSize: '8px', color: '#78350f', lineHeight: '1.4' }}>
                    {topMajors.slice(0, 3).map((m: any, idx: number) => (
                      <span key={m.key || idx}>
                        {m.name} ({Math.round(m.score * 100)}%){idx < Math.min(3, topMajors.length) - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측: 추천 전공 및 직무 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 추천 전공 Top 5 */}
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>추천 전공 Top 5</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topMajors.map((m: any, index: number) => (
                <div key={m.key || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1' }}>
                    <div style={{ 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      backgroundColor: '#3b82f6', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '9px', 
                      fontWeight: 'bold', 
                      flexShrink: 0,
                      padding: 0,
                      margin: 0,
                      position: 'relative'
                    }}>
                      <span style={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        lineHeight: '1'
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#1f2937' }}>{m.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#dbeafe', padding: '3px 6px', borderRadius: '4px' }}>
                    {Math.round(m.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 추천 직무 Top 5 */}
          <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>추천 직무 Top 5</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topRoles.map((r: any, index: number) => (
                <div key={r.key || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1' }}>
                    <div style={{ 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      backgroundColor: '#10b981', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '9px', 
                      fontWeight: 'bold', 
                      flexShrink: 0,
                      padding: 0,
                      margin: 0,
                      position: 'relative'
                    }}>
                      <span style={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        lineHeight: '1'
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#1f2937' }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669', backgroundColor: '#d1fae5', padding: '3px 6px', borderRadius: '4px' }}>
                    {Math.round(r.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '50px' }}>
        <img src={logoImg} alt="Logo" style={{ height: '35px', width: 'auto', display: 'block', maxWidth: '130px' }} crossOrigin="anonymous" />
        <div style={{ textAlign: 'right', fontSize: '9px', color: '#9ca3af', flex: '1', marginLeft: '15px' }}>
          <p style={{ marginBottom: '3px' }}>명지대학교 e-Advisor 시스템 | 진로 적성 분석 결과</p>
          <p style={{ fontSize: '8px' }}>본 결과는 참고용이며, 실제 전공 선택 시 추가적인 상담을 권장합니다.</p>
        </div>
      </div>
    </div>
  );
}

export default function ResultViewer() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAllMajors, setShowAllMajors] = useState(false);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [hoveredDimension, setHoveredDimension] = useState<Dim | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

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

  const handleSearchWithCode = async (searchCode: string) => {
    setError("");
    setLoading(true);

    if (!isValidCode(searchCode)) {
      setError("올바른 코드 형식이 아닙니다. (6자리 이상 영문/숫자)");
      setLoading(false);
      return;
    }

    try {
      const foundResult = await getResultByCode(searchCode.toUpperCase());
      
      if (!foundResult) {
        setError("결과를 찾을 수 없습니다. 코드를 확인해주세요.");
        setLoading(false);
        return;
      }

      setResult(foundResult);
      setCode(searchCode.toUpperCase());
    } catch (error) {
      console.error('Error fetching result:', error);
      setError("결과를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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

    const dimDescriptions: Record<Dim, string[]> = {
      R: [
        "실용적이고 구체적인 업무 선호",
        "기계, 도구, 동물, 식물과 함께 일하는 것 좋아함",
        "명확한 규칙과 구체적인 결과를 중시",
        "실제 제품을 만들거나 수리하는 활동 선호"
      ],
      I: [
        "지적 호기심과 탐구심이 강함",
        "관찰, 조사, 분석을 통한 문제 해결 선호",
        "독립적으로 연구하고 학습하는 것을 좋아함",
        "과학, 수학, 논리적 사고에 관심"
      ],
      A: [
        "창의적이고 표현적인 활동 선호",
        "예술, 음악, 문학 등에 관심",
        "자유롭고 유연한 환경에서 일하는 것을 좋아함",
        "새로운 아이디어와 표현 방법을 추구"
      ],
      S: [
        "사람들과 함께 일하고 도움을 주는 것 선호",
        "교육, 상담, 치료, 서비스 업무에 관심",
        "협력과 소통을 중시",
        "타인의 성장과 웰빙에 기여하고 싶어함"
      ],
      E: [
        "리더십과 영향력을 발휘하는 것을 좋아함",
        "목표 달성과 성취를 중시",
        "설득, 협상, 경영 활동에 관심",
        "역동적이고 경쟁적인 환경 선호"
      ],
      C: [
        "체계적이고 정리된 환경에서 일하는 것을 선호",
        "데이터 처리, 문서 관리, 회계 업무에 관심",
        "규칙과 절차를 따르는 것을 좋아함",
        "정확성과 세부사항에 집중"
      ]
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* 최상단 정보 바 */}
        <div className="bg-gray-700 text-white text-sm py-2">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span>시스템 문의 02-300-1684 / 취업관련 문의 02-300-1579(인문), 031-324-1554(자연)</span>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/"
                  className="hover:text-blue-300 transition"
                >
                  Home
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 헤더 */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* 로고 & 타이틀 */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://myicap.mju.ac.kr/files/web1/images/common/logo.png" 
                    alt="e-Advisor 로고" 
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">e-Advisor</h1>
                    <p className="text-xs text-gray-600">MYiCap+ 데이터 기반 학생역량지원체계</p>
                    <p className="text-xs text-gray-600">진로·학습 통합 분석 시스템</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="max-w-7xl mx-auto px-4 py-6">
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
          {/* PDF용 숨겨진 콘텐츠 */}
          <div ref={pdfContentRef} style={{ position: 'absolute', left: '-9999px', top: '0', width: '794px', height: '1123px' }}>
            <PDFLayout result={result} dimLabels={dimLabels} riasecData={riasecData} code={code} />
          </div>
          {/* 결과 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">진로 적성 분석 결과</h2>
            <p className="text-gray-600">당신의 진로 적성 분석 결과입니다</p>
          </div>

          {/* RIASEC 레이더 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md relative">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">📊</span> RIASEC 스파이더 차트
              </h3>
              <div className="w-full h-96 bg-white rounded-lg p-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riasecData} outerRadius="75%">
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="axis" 
                      tick={{ fontSize: 14, fill: '#4b5563', fontWeight: 500 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Radar name="나" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-md relative">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                <span className="mr-2">🏆</span> 차원 정규화 순위
              </h3>
              <div className="space-y-3">
                {Object.entries(result.norm || {})
                  .map(([k, v]: [string, any]) => ({ key: k, score: Math.round((v || 0) * 100) }))
                  .sort((a, b) => b.score - a.score)
                  .map((item, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                    const dim = item.key as Dim;
                    return (
                      <div 
                        key={item.key} 
                        className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative"
                        onMouseEnter={() => setHoveredDimension(dim)}
                        onMouseLeave={() => setHoveredDimension(null)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: colors[index] }}>
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-800">{dimLabels[dim] || item.key}</span>
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
              {/* 툴팁 */}
              {hoveredDimension && (
                <div className="absolute top-6 right-6 bg-white border-2 border-purple-300 rounded-lg shadow-lg p-4 max-w-xs z-10">
                  <h4 className="font-bold text-base text-gray-800 mb-2">{dimLabels[hoveredDimension]}</h4>
                  <ul className="space-y-1">
                    {dimDescriptions[hoveredDimension].map((desc, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 설명 */}
          {result.explanation && (() => {
            // 상위 3개 직무 정보 가져오기
            const topRolesWithInfo = (result.roles || []).slice(0, 3).map((r: any) => {
              const jobInfo = getJobInfo(r.name);
              const description = getRoleDescription(r.key || r.name);
              return { ...r, jobInfo, description };
            });

            // 임금 정보 파싱 (평균 임금 추출)
            const parseAverageSalary = (salaryInfo: string): string | null => {
              if (!salaryInfo) return null;
              const match = salaryInfo.match(/평균\(50%\)\s*(\d+)/);
              return match ? `${match[1]}만원` : null;
            };

            // 상위 3개 전공 정보 (개인화 설명용)
            const topMajorsForExplanation = (result.majors || []).slice(0, 3);

            return (
              <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center">
                  <span className="mr-2">💡</span> 개인화 설명
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-3 font-medium">{result.explanation.lead}</p>
                <p className="text-gray-700 leading-relaxed mb-3">{result.explanation.majorLine} {result.explanation.roleLine}</p>
                {result.explanation.bullets && result.explanation.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2 mb-6">
                    {result.explanation.bullets.map((b: string, i: number) => (
                      <li key={i} className="flex items-start text-gray-700">
                        <span className="mr-2 text-yellow-600">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 추천 전공 상세 정보 (3개만) */}
                {topMajorsForExplanation.length > 0 && (
                  <div className="mt-6 pt-6 border-t-2 border-yellow-200">
                    <h4 className="font-semibold text-base mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">🎓</span> 추천 전공 (Top 3)
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topMajorsForExplanation.map((m: any, idx: number) => {
                        const majorUrl = m.url || getMajorUrl(m.name);
                        return (
                          <div
                            key={m.key || idx}
                            onClick={() => {
                              if (majorUrl) {
                                window.open(majorUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className={`bg-white rounded-lg p-4 shadow-sm border border-yellow-200 transition-all ${
                              majorUrl ? 'cursor-pointer hover:shadow-md hover:border-blue-500 hover:bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-semibold text-gray-800 flex items-center">
                                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                  {idx + 1}
                                </span>
                                <div className="flex flex-col">
                                  <span className="flex items-center">
                                    {m.name}
                                    {majorUrl && (
                                      <span className="ml-2 text-blue-500 text-xs">🔗</span>
                                    )}
                                  </span>
                                  {m.college && (
                                    <span className="text-xs text-gray-500 mt-1">{m.college}</span>
                                  )}
                                </div>
                              </div>
                              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                {Math.round(m.score * 100)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 추천 직무 상세 정보 */}
                {topRolesWithInfo.length > 0 && (
                  <div className="mt-6 pt-6 border-t-2 border-yellow-200">
                    <h4 className="font-semibold text-base mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">📊</span> 추천 직무 상세 정보 (상위 3개)
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topRolesWithInfo.map((role: any, idx: number) => {
                        const info = role.jobInfo as JobInfo | null;
                        const avgSalary = info ? parseAverageSalary(info.salaryInfo) : null;
                        const workpediaUrl = getWorkpediaJobUrl(role.name);
                        const hasDirectLink = getWorkpediaJobCode(role.name) !== null;
                        // 설명은 jobInfo가 있으면 summary를, 없으면 getRoleDescription으로 가져온 설명을 사용
                        const roleDescription = info?.summary || role.description || "";
                        return (
                          <div key={role.key || idx} className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-semibold text-gray-800 flex items-center">
                                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                  {idx + 1}
                                </span>
                                {role.name}
                              </div>
                              {/* 직무정보 버튼 (직무 추천 Top 5와 동일한 스타일) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(workpediaUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                                  hasDirectLink
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' 
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                }`}
                                title={`${role.name} 직업정보 보기 (워크피디아${hasDirectLink ? ' - 직접 링크' : ''})`}
                              >
                                <span>{hasDirectLink ? '📋' : '🔍'}</span>
                                <span className="hidden sm:inline">직무정보</span>
                              </button>
                            </div>
                            
                            {/* 직무 설명 (항상 표시) */}
                            {roleDescription && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                  {roleDescription}
                                </p>
                              </div>
                            )}

                            {/* 상세 정보 (있는 경우에만 표시) */}
                            {info && (
                              <>
                                {avgSalary && (
                                  <div className="mb-2">
                                    <span className="text-xs text-gray-500">💰 평균 임금:</span>
                                    <span className="ml-2 font-semibold text-orange-600">{avgSalary}</span>
                                  </div>
                                )}
                                
                                {info.satisfaction && (
                                  <div className="mb-2">
                                    <span className="text-xs text-gray-500">😊 직무 만족도:</span>
                                    <span className="ml-2 font-semibold text-blue-600">{info.satisfaction}점</span>
                                  </div>
                                )}
                                
                                {info.outlook && (
                                  <div className="mb-2">
                                    <span className="text-xs text-gray-500">📈 일자리 전망:</span>
                                    <span className="ml-2 text-xs text-gray-700">{info.outlook}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 전공 추천 Top 5 */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center">
                  <span className="mr-2">🎓</span> 전공 추천 Top 5
                </h3>
                <button
                  onClick={() => setShowAllMajors(!showAllMajors)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                >
                  <span>{showAllMajors ? '접기' : '펼치기'}</span>
                  <span>{showAllMajors ? '▲' : '▼'}</span>
                </button>
              </div>
              {showAllMajors && (
                <div className="space-y-3">
                  {result.majors?.map((m: any, index: number) => {
                    const majorUrl = m.url || getMajorUrl(m.name);
                    return (
                      <motion.div
                        key={m.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          if (majorUrl) {
                            window.open(majorUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className={`bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500 transition-all group ${
                          majorUrl 
                            ? 'cursor-pointer hover:shadow-md hover:border-l-blue-600 hover:bg-blue-50' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800 flex items-center">
                                {m.name}
                                {majorUrl && (
                                  <span className="ml-2 text-blue-500 text-xs">🔗</span>
                                )}
                              </span>
                              {m.college && (
                                <span className="text-xs text-gray-500">{m.college}</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {Math.round(m.score * 100)}%
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 직무 추천 Top 5 */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center">
                  <span className="mr-2">💼</span> 직무 추천 Top 5
                  <span className="ml-2 text-xs text-gray-400 font-normal">(워크피디아 연동)</span>
                </h3>
                <button
                  onClick={() => setShowAllRoles(!showAllRoles)}
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center space-x-1"
                >
                  <span>{showAllRoles ? '접기' : '펼치기'}</span>
                  <span>{showAllRoles ? '▲' : '▼'}</span>
                </button>
              </div>
              {showAllRoles && (
                <>
                  <div className="space-y-3">
                    {result.roles?.map((r: any, index: number) => {
                      const workpediaUrl = getWorkpediaJobUrl(r.name);
                      const hasDirectLink = getWorkpediaJobCode(r.name) !== null;
                      return (
                        <motion.div
                          key={r.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-800">{r.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {Math.round(r.score * 100)}%
                              </div>
                              {/* 워크피디아 직업정보 연동 버튼 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(workpediaUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                                  hasDirectLink
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' 
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                }`}
                                title={`${r.name} 직업정보 보기 (워크피디아${hasDirectLink ? ' - 직접 링크' : ''})`}
                              >
                                <span>{hasDirectLink ? '📋' : '🔍'}</span>
                                <span className="hidden sm:inline">직무정보</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {/* 워크피디아 안내 */}
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    🔗 <a href="https://www.wagework.go.kr" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">워크피디아</a>에서 직업별 상세 정보, 평균 연봉, 미래 전망을 확인하세요
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200 no-print">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (!pdfContentRef.current) return;
                
                try {
                  // PDF용 캔버스 생성
                  const canvas = await html2canvas(pdfContentRef.current, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 794,
                    windowHeight: 1123
                  });

                  // A4 사이즈 PDF 생성 (210mm x 297mm)
                  const pdf = new jsPDF('portrait', 'mm', 'a4');
                  const pdfWidth = 210; // mm
                  const pdfHeight = 297; // mm
                  
                  // 캔버스 비율 계산
                  const canvasAspectRatio = canvas.width / canvas.height;
                  const pdfAspectRatio = pdfWidth / pdfHeight;
                  
                  let imgWidth, imgHeight, xOffset, yOffset;
                  
                  if (canvasAspectRatio > pdfAspectRatio) {
                    // 캔버스가 더 넓음 - 너비에 맞춤
                    imgWidth = pdfWidth;
                    imgHeight = pdfWidth / canvasAspectRatio;
                    xOffset = 0;
                    yOffset = (pdfHeight - imgHeight) / 2;
                  } else {
                    // 캔버스가 더 높음 - 높이에 맞춤
                    imgHeight = pdfHeight;
                    imgWidth = pdfHeight * canvasAspectRatio;
                    xOffset = (pdfWidth - imgWidth) / 2;
                    yOffset = 0;
                  }
                  
                  // 전체 내용이 한 페이지에 들어가도록 스케일 조정
                  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, yOffset, imgWidth, imgHeight);

                  pdf.save(`진로적성분석결과_${code}.pdf`);
                } catch (error) {
                  console.error('PDF 생성 오류:', error);
                  alert('PDF 생성 중 오류가 발생했습니다.');
                }
              }}
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
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">e-Advisor 시스템</h3>
                <p className="text-sm leading-relaxed">
                  MYiCap+ 데이터 기반 학생역량지원체계로<br />
                  진로·학습 통합 분석을 제공합니다.
                </p>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">문의</h3>
                <ul className="text-sm space-y-2">
                  <li>시스템 문의: 02-300-1684</li>
                  <li>취업 문의(인문): 02-300-1579</li>
                  <li>취업 문의(자연): 031-324-1554</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-4">명지대학교</h3>
                <p className="text-sm leading-relaxed">
                  인문캠퍼스: 서울특별시 서대문구 거북골로 34<br />
                  자연캠퍼스: 경기도 용인시 처인구 명지로 116
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
              <p>© {new Date().getFullYear()} 명지대학교. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 최상단 정보 바 */}
      <div className="bg-gray-700 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>시스템 문의 02-300-1684 / 취업관련 문의 02-300-1579(인문), 031-324-1554(자연)</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="hover:text-blue-300 transition"
              >
                Home
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 & 타이틀 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://myicap.mju.ac.kr/files/web1/images/common/logo.png" 
                  alt="e-Advisor 로고" 
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">e-Advisor</h1>
                  <p className="text-xs text-gray-600">MYiCap+ 데이터 기반 학생역량지원체계</p>
                  <p className="text-xs text-gray-600">진로·학습 통합 분석 시스템</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
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
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">e-Advisor 시스템</h3>
              <p className="text-sm leading-relaxed">
                MYiCap+ 데이터 기반 학생역량지원체계로<br />
                진로·학습 통합 분석을 제공합니다.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">문의</h3>
              <ul className="text-sm space-y-2">
                <li>시스템 문의: 02-300-1684</li>
                <li>취업 문의(인문): 02-300-1579</li>
                <li>취업 문의(자연): 031-324-1554</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">명지대학교</h3>
              <p className="text-sm leading-relaxed">
                인문캠퍼스: 서울특별시 서대문구 거북골로 34<br />
                자연캠퍼스: 경기도 용인시 처인구 명지로 116
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
            <p>© {new Date().getFullYear()} 명지대학교. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}







