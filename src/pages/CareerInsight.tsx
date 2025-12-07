import React, { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { getCurrentCourses, AVAILABLE_COURSES, CURRENT_STUDENT, getCurrentCompetency } from "../data/dummyData";
import { calculateLearningProfile, compareProfiles, recommendCourses } from "../utils/profileAnalysis";
import { recommendRoles, getRoleDescription } from "../utils/roleRecommendation";
import { recommendMajors } from "../utils/recommendMajors";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';
type RiasecResult = Record<Dim, number>;

interface CareerInsightProps {
  riasecResult: RiasecResult | null;
  onStartTest: () => void;
}

export default function CareerInsight({ riasecResult, onStartTest }: CareerInsightProps) {
  // 검사를 완료하지 않은 경우
  if (!riasecResult) {
    return (
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">🎯</span>
            진로-학습 통합 분석
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            RIASEC 진로 적성과 수강 과목 패턴을 비교 분석합니다.
          </p>
        </div>

        {/* 검사 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-8 text-center"
        >
          <div className="mb-6">
            <div className="inline-block bg-indigo-100 text-indigo-600 rounded-full p-6 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              RIASEC 진로 적성검사가 필요합니다
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              진로-학습 통합 분석을 이용하려면 먼저 RIASEC 진로 적성검사를 완료해주세요. 
              검사는 약 10-15분 정도 소요되며, 29개의 기본 문항과 적응형 추가 문항으로 구성되어 있습니다.
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 max-w-2xl mx-auto mb-6">
            <h4 className="font-semibold text-indigo-800 mb-3">검사를 완료하면</h4>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span>진로 적성과 학습 경험의 일치도 분석</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span>레이더 차트로 시각화된 비교 분석</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span>적성에 맞는 맞춤형 과목 추천 Top 5</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600 mt-1">✓</span>
                <span>개인화된 학습 경로 가이드 및 추천사항</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onStartTest}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition"
          >
            🎯 RIASEC 검사 시작하기
          </button>
        </motion.div>
      </div>
    );
  }

  const careerTestResult = riasecResult;
  const CURRENT_COURSES = getCurrentCourses();
  const competencyResult = getCurrentCompetency();

  // 학습 프로파일 계산
  const learningProfile = useMemo(() => {
    return calculateLearningProfile(CURRENT_COURSES);
  }, [CURRENT_COURSES]);

  // 프로파일 비교
  const comparison = useMemo(() => {
    return compareProfiles(careerTestResult, learningProfile.normalized);
  }, [careerTestResult, learningProfile]);

  // 추천 과목
  const recommendedCourses = useMemo(() => {
    return recommendCourses(careerTestResult, AVAILABLE_COURSES, 5);
  }, [careerTestResult]);

  // 추천 직무
  const recommendedRoles = useMemo(() => {
    return recommendRoles(careerTestResult, 8);
  }, [careerTestResult]);

  // 추천 학과 (새 알고리즘)
  const recommendedMajors = useMemo(() => {
    return recommendMajors(careerTestResult, { limit: 5 });
  }, [careerTestResult]);

  // 무전공 학생 여부 확인
  const isFreshman = CURRENT_STUDENT.department === "무전공" || CURRENT_STUDENT.grade === 1;

  // 레이더 차트 데이터 (RIASEC 라벨 한글로 표기)
  const radarData = useMemo(() => {
    const dims: Array<'R' | 'I' | 'A' | 'S' | 'E' | 'C'> = ['R', 'I', 'A', 'S', 'E', 'C'];
    const dimLabels: Record<string, string> = {
      R: "R(현장형)",
      I: "I(탐구형)",
      A: "A(예술형)",
      S: "S(사회형)",
      E: "E(진취형)",
      C: "C(사무형)"
    };
    return dims.map(dim => ({
      axis: dimLabels[dim] || dim,
      진로적성: Math.round(careerTestResult[dim] * 100),
      학습경험: Math.round(learningProfile.normalized[dim] * 100)
    }));
  }, [careerTestResult, learningProfile]);

  // 일치도에 따른 색상
  const getAlignmentColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAlignmentBgColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  // RIASEC 차원 한글 라벨
  const dimLabels: Record<Dim | string, string> = {
    R: "R(현장형)",
    I: "I(탐구형)",
    A: "A(예술형)",
    S: "S(사회형)",
    E: "E(진취형)",
    C: "C(사무형)"
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🎯</span>
          진로-학습 통합 분석
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          RIASEC 진로 적성과 수강 과목 패턴을 비교 분석합니다.
        </p>
      </div>

      {/* 인덱스 네비게이션 */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">목차</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              const element = document.getElementById('recommended-majors');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            🎓 추천 학과
          </button>
          {isFreshman && (
            <button 
              onClick={() => {
                const element = document.getElementById('recommended-roles');
                if (element) {
                  const yOffset = -120;
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
            >
              💼 추천 직무
            </button>
          )}
          <button 
            onClick={() => {
              const element = document.getElementById('profile-comparison');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            📊 프로파일 비교
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('gap-analysis');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            📈 영역별 차이 분석
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('strengths-recommendations');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            ✅ 강점 및 추천사항
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('recommended-courses');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            📚 추천 과목
          </button>
          {!isFreshman && (
            <button 
              onClick={() => {
                const element = document.getElementById('recommended-roles');
                if (element) {
                  const yOffset = -120;
                  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
            >
              💼 추천 직무
            </button>
          )}
          <button 
            onClick={() => {
              const element = document.getElementById('competency-analysis');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            📋 전공능력 연계
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('alignment-score');
              if (element) {
                const yOffset = -120;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            🎯 일치도
          </button>
        </div>
      </div>

      {/* 추천 학과 - 모든 학생에게 표시 */}
      <div id="recommended-majors" className="bg-white rounded-xl shadow-md p-6 scroll-mt-32">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          🎓 적성에 맞는 추천 학과 Top 5
        </h3>
        {recommendedMajors.length === 0 ? (
          <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center">
            RIASEC 검사를 완료하면 개인화된 학과 추천을 확인할 수 있습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedMajors.map((major, index) => (
              <div 
                key={major.key}
                className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="inline-block px-2 py-1 bg-[#1e3a8a] text-white text-xs font-bold rounded">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-gray-800">{major.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      적성 시그니처: {major.signature.replace('>', ' → ')}
                    </p>
                  </div>
                  <div className="ml-4 text-center">
                    <div className="text-2xl font-bold text-[#1e3a8a]">
                      {major.matchScore}
                    </div>
                    <div className="text-xs text-gray-600">매칭도</div>
                  </div>
                </div>
                {major.reasons?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <div className="flex flex-wrap gap-2">
                      {major.reasons.slice(0, 3).map((reason, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-white text-purple-700 px-2 py-1 rounded-full border border-purple-200"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 무전공 학생: 추천 직무 우선 표시 */}
      {isFreshman && (
        <>
          {/* 추천 직무 */}
          <div id="recommended-roles" className="bg-white rounded-xl shadow-md p-6 scroll-mt-32">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              💼 적성에 맞는 추천 직무 Top 8
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedRoles.map((role, index) => (
                <div 
                  key={role.key}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-block px-2 py-1 bg-[#3b82f6] text-white text-xs font-bold rounded">
                          #{index + 1}
                        </span>
                        <h4 className="font-bold text-gray-800">{role.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {getRoleDescription(role.key)}
                      </p>
                      {role.profileStrength && (
                        <p className="text-xs text-gray-500 italic">
                          {role.profileStrength}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-center">
                      <div className="text-2xl font-bold text-[#3b82f6]">
                        {Math.round(role.matchScore * 100)}
                      </div>
                      <div className="text-xs text-gray-600">매칭도</div>
                    </div>
                  </div>
                  {role.matchReasons.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex flex-wrap gap-2">
                        {role.matchReasons.slice(0, 3).map((reason, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-white text-blue-700 px-2 py-1 rounded-full border border-blue-200"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 레이더 차트 비교 */}
      <div id="profile-comparison" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-32">
        {/* 차트 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            RIASEC 프로파일 비교
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar 
                  name="진로 적성" 
                  dataKey="진로적성" 
                  stroke="#1e3a8a" 
                  fill="#1e3a8a" 
                  fillOpacity={0.5} 
                />
                <Radar 
                  name="학습 경험" 
                  dataKey="학습경험" 
                  stroke="#60a5fa" 
                  fill="#60a5fa" 
                  fillOpacity={0.3} 
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상위 차원 */}
        <div className="space-y-4">
          {/* 진로 적성 상위 차원 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🎯 진로 적성 상위 차원
            </h3>
            <div className="space-y-3">
              {Object.entries(careerTestResult)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([dim, value], index) => (
                  <div key={dim} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-[#1e3a8a] rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{dimLabels[dim] || dim}</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(value * 100)}점
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1e3a8a]"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 학습 경험 상위 차원 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📚 학습 경험 상위 차원
            </h3>
            <div className="space-y-3">
              {learningProfile.topDimensions.map((item, index) => (
                <div key={item.dim} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-[#60a5fa] rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{dimLabels[item.dim] || item.dim}</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(item.value * 100)}점
                        </span>
                      </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#60a5fa]"
                        style={{ width: `${item.value * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 차이(Gap) 분석 */}
      <div id="gap-analysis" className="bg-white rounded-xl shadow-md p-6 scroll-mt-32">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          📊 영역별 차이 분석
        </h3>
        <div className="space-y-3">
          {comparison.gaps.slice(0, 5).map((gap) => {
            const isPositive = gap.gap > 0;
            const absGap = Math.abs(gap.gap);
            
            return (
              <div key={gap.dim} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{gap.label}</span>
                  <span className={`text-sm font-medium ${
                    isPositive ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {isPositive ? '적성 > 학습' : '학습 > 적성'}
                  </span>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`absolute h-full ${isPositive ? 'bg-orange-500' : 'bg-blue-500'}`}
                    style={{ 
                      width: `${absGap * 100}%`,
                      left: isPositive ? '50%' : `${50 - absGap * 100}%`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-full bg-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {isPositive 
                    ? `${gap.label} 영역의 과목을 더 수강하면 좋습니다.`
                    : `${gap.label} 영역을 충분히 학습하고 있습니다.`
                  }
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 강점 및 추천사항 */}
      <div id="strengths-recommendations" className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-32">
        {/* 강점 */}
        {comparison.strengths.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center">
              <span className="mr-2">✅</span> 강점
            </h3>
            <ul className="space-y-2">
              {comparison.strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 추천사항 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center">
            <span className="mr-2">💡</span> 추천사항
          </h3>
          <ul className="space-y-2">
            {comparison.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 추천 과목 */}
      <div id="recommended-courses" className="bg-white rounded-xl shadow-md p-6 scroll-mt-32">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          🎓 적성에 맞는 추천 과목 Top 5
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCourses.map((course, index) => (
            <div 
              key={course.courseNumber}
              className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-block px-2 py-1 bg-[#1e3a8a] text-white text-xs font-bold rounded">
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-gray-800">{course.courseName}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      course.completionType === "전공" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {course.completionType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {course.courseNumber} · {course.credits}학점 · {course.professor}
                  </p>
                </div>
                <div className="ml-4 text-center">
                  <div className="text-2xl font-bold text-[#1e3a8a]">
                    {Math.round(course.matchScore * 100)}
                  </div>
                  <div className="text-xs text-gray-600">매칭도</div>
                </div>
              </div>
              {course.matchReasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <div className="flex flex-wrap gap-2">
                    {course.matchReasons.slice(0, 3).map((reason, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-white text-purple-700 px-2 py-1 rounded-full border border-purple-200"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 전공 학생: 추천 직무 */}
      {!isFreshman && (
        <div id="recommended-roles" className="bg-white rounded-xl shadow-md p-6 scroll-mt-32">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            💼 적성에 맞는 추천 직무 Top 8
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedRoles.map((role, index) => (
            <div 
              key={role.key}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-block px-2 py-1 bg-[#3b82f6] text-white text-xs font-bold rounded">
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-gray-800">{role.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getRoleDescription(role.key)}
                  </p>
                  {role.profileStrength && (
                    <p className="text-xs text-gray-500 italic">
                      {role.profileStrength}
                    </p>
                  )}
                </div>
                <div className="ml-4 text-center">
                  <div className="text-2xl font-bold text-[#3b82f6]">
                    {Math.round(role.matchScore * 100)}
                  </div>
                  <div className="text-xs text-gray-600">매칭도</div>
                </div>
              </div>
              {role.matchReasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {role.matchReasons.map((reason, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-white text-blue-700 px-2 py-1 rounded-full border border-blue-200"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      )}

      {/* 전공능력 연계 분석 */}
      <div id="competency-analysis" className="bg-white rounded-xl shadow-md p-6 scroll-mt-32">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          📋 전공능력진단과의 연계 분석
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-[#3b82f6] rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-[#1e3a8a] text-lg">전공능력 종합 점수</h4>
              <p className="text-sm text-gray-600">{competencyResult.department} · {competencyResult.testDate}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#1e3a8a]">{competencyResult.overallScore}점</div>
              <div className="text-sm text-gray-600">백분위 {competencyResult.overallPercentile}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 상위 3개 능력 */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-800 mb-3">🌟 강점 역량 Top 3</h4>
            <div className="space-y-2">
              {competencyResult.competencies
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((comp, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2">
                    <span className="text-sm text-gray-800 font-medium">{comp.competencyName}</span>
                    <span className="text-sm font-bold text-green-700">{comp.score}점</span>
                  </div>
                ))}
            </div>
          </div>

          {/* 개선 필요 능력 */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h4 className="font-semibold text-orange-800 mb-3">📈 개선 권장 영역</h4>
            <div className="space-y-2">
              {competencyResult.competencies
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map((comp, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2">
                    <span className="text-sm text-gray-800 font-medium">{comp.competencyName}</span>
                    <span className="text-sm font-bold text-orange-700">{comp.score}점</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 통합 인사이트 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
            <span className="mr-2">💡</span> 통합 인사이트
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            RIASEC 진로 적성, 수강 과목 패턴, 전공능력진단 결과를 종합하면, 
            당신의 <strong>강점은 {competencyResult.competencies.sort((a, b) => b.score - a.score)[0].competencyName}</strong>이고, 
            <strong> 학습 경험은 {learningProfile.topDimensions[0].label}</strong> 영역이 가장 발달했습니다. 
            이를 바탕으로 추천된 직무를 검토하고, 개선이 필요한 역량은 추천 과목을 통해 보완하세요.
          </p>
        </div>
      </div>

      {/* 진로-학습 일치도 (최종) */}
      <div id="alignment-score" className={`rounded-xl shadow-md p-6 border-2 scroll-mt-32 ${getAlignmentColor(comparison.alignment)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">진로-학습 일치도</h3>
            <p className="text-sm opacity-80">
              적성 검사 결과와 수강 과목 패턴의 일치 정도
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{comparison.alignment}점</div>
            <div className="text-sm font-medium mt-1">
              {comparison.alignment >= 80 ? "매우 일치" : 
               comparison.alignment >= 60 ? "대체로 일치" : "재검토 필요"}
            </div>
          </div>
        </div>
        
        {/* 진행바 */}
        <div className="w-full h-4 bg-white/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getAlignmentBgColor(comparison.alignment)} transition-all duration-500`}
            style={{ width: `${comparison.alignment}%` }}
          />
        </div>
      </div>
    </div>
  );
}

