import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recommendMajors } from "../utils/recommendMajors";
import { getMajorCompetencyData, DEFAULT_COMPETENCY_DATA, MajorCompetencyData, MajorCompetency } from "../data/majorCompetencyData";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type RiasecResult = Record<Dim, number>;

// 자가진단 응답 타입 (리커트 5점 척도)
type SelfAssessmentScore = 1 | 2 | 3 | 4 | 5;

interface Props {
  onNavigate?: (page: string) => void;
  riasecResult?: RiasecResult | null;
}

export default function MajorExplorer({ onNavigate, riasecResult }: Props) {
  // 추천 전공 (상위 3개)
  const recommendedMajors = useMemo(() => {
    if (!riasecResult) return [];
    return recommendMajors(riasecResult, { limit: 3 });
  }, [riasecResult]);

  // 선택된 전공 인덱스 (파일철 탭)
  const [selectedMajorIndex, setSelectedMajorIndex] = useState(0);

  // 자가진단 응답 저장
  const [assessments, setAssessments] = useState<Record<string, Record<string, SelfAssessmentScore>>>({});

  // 현재 선택된 전공
  const selectedMajor = recommendedMajors[selectedMajorIndex];

  // 현재 전공의 능력 데이터 (CSV 기반)
  const competencyData = useMemo((): MajorCompetencyData | null => {
    if (!selectedMajor) return null;
    
    // CSV 데이터에서 찾기
    const csvData = getMajorCompetencyData(selectedMajor.name);
    if (csvData) {
      return csvData;
    }
    
    // 없으면 기본 데이터 사용
    return {
      majorName: selectedMajor.name,
      college: selectedMajor.college || "소속 대학",
      majorCode: "",
      competencies: DEFAULT_COMPETENCY_DATA
    };
  }, [selectedMajor]);

  // 응답 처리
  const handleAssessment = (majorKey: string, questionKey: string, score: SelfAssessmentScore) => {
    setAssessments(prev => ({
      ...prev,
      [majorKey]: {
        ...(prev[majorKey] || {}),
        [questionKey]: score
      }
    }));
  };

  // 현재 전공의 진단 결과 계산
  const calculateResults = (majorKey: string, competencies: MajorCompetency[]) => {
    const majorAssessment = assessments[majorKey] || {};
    const totalQuestions = competencies.reduce((sum, c) => sum + c.questions.length, 0);
    const answeredQuestions = Object.keys(majorAssessment).length;
    const totalScore = Object.values(majorAssessment).reduce((sum, score) => sum + score, 0);
    const avgScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      avgScore,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
    };
  };

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  // RIASEC 검사가 완료되지 않은 경우
  if (!riasecResult || recommendedMajors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">전공 탐색</h2>
          <p className="text-gray-600 mb-6">
            RIASEC 진로적성검사를 완료하면<br />
            나에게 맞는 전공을 탐색할 수 있습니다.
          </p>
          <button
            onClick={() => onNavigate?.("riasec")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            RIASEC 검사 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <span className="mr-2">📂</span>
          나에게 맞는 전공 탐색
        </h2>
        <p className="text-indigo-100 mt-1">
          RIASEC 검사 결과 기반 추천 전공 {recommendedMajors.length}개에 대해 전공능력 자가진단을 해보세요
        </p>
        <p className="text-indigo-200 text-sm mt-2">
          💡 리커트 5점 척도: 1(전혀 그렇지 않다) ~ 5(매우 그렇다)
        </p>
      </div>

      {/* 파일철 탭 UI */}
      <div className="relative">
        {/* 탭 헤더 (파일철 스타일) */}
        <div className="flex -mb-px relative z-10">
          {recommendedMajors.map((major, index) => {
            const isSelected = index === selectedMajorIndex;
            const majorData = getMajorCompetencyData(major.name);
            const competencies = majorData?.competencies || DEFAULT_COMPETENCY_DATA;
            const results = calculateResults(major.key, competencies);
            
            // 파일철 색상
            const colors = [
              { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", tab: "bg-blue-100" },
              { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", tab: "bg-emerald-100" },
              { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", tab: "bg-amber-100" }
            ];
            const color = colors[index];

            return (
              <button
                key={major.key}
                onClick={() => setSelectedMajorIndex(index)}
                className={`
                  relative px-4 py-3 rounded-t-xl border-2 border-b-0 transition-all
                  ${isSelected 
                    ? `${color.bg} ${color.border} ${color.text} -mb-[2px] z-20` 
                    : `bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-50`
                  }
                  ${index > 0 ? '-ml-2' : ''}
                `}
                style={{ 
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  minWidth: '160px'
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {index === 0 ? "📁" : index === 1 ? "📂" : "📁"}
                  </span>
                  <div className="text-left">
                    <div className={`font-semibold text-sm truncate max-w-[100px] ${isSelected ? color.text : ''}`}>
                      {major.name.length > 8 ? major.name.substring(0, 8) + "..." : major.name}
                    </div>
                    <div className="text-xs opacity-70">
                      {results.answeredQuestions > 0 
                        ? `${Math.round(results.percentage)}% 완료`
                        : "미진단"
                      }
                    </div>
                  </div>
                </div>
                {/* 매칭도 배지 */}
                <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                  isSelected ? 'bg-white shadow' : 'bg-gray-200'
                } ${color.text}`}>
                  {major.matchScore}%
                </div>
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 (파일철 본체) */}
        <AnimatePresence mode="wait">
          {selectedMajor && competencyData && (
            <motion.div
              key={selectedMajor.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`
                bg-white rounded-b-xl rounded-tr-xl shadow-lg border-2 p-6
                ${selectedMajorIndex === 0 ? 'border-blue-300' : 
                  selectedMajorIndex === 1 ? 'border-emerald-300' : 'border-amber-300'}
              `}
            >
              {/* 전공 정보 헤더 */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-gray-800">{selectedMajor.name}</h3>
                    {selectedMajor.url && (
                      <button
                        onClick={() => window.open(selectedMajor.url, '_blank')}
                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                      >
                        🔗 홈페이지
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{competencyData.college}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMajor.reasons?.slice(0, 3).map((reason, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{selectedMajor.matchScore}%</div>
                  <div className="text-xs text-gray-500">RIASEC 매칭도</div>
                </div>
              </div>

              {/* 자가진단 진행 상태 */}
              {(() => {
                const results = calculateResults(selectedMajor.key, competencyData.competencies);
                return (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">전공능력 자가진단 진행도</span>
                      <span className="text-sm text-gray-500">
                        {results.answeredQuestions} / {results.totalQuestions} 문항
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${results.percentage}%` }}
                      />
                    </div>
                    {results.avgScore > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        평균 자기평가 점수: <span className={`font-semibold ${getScoreColor(results.avgScore)}`}>{results.avgScore.toFixed(1)}</span> / 5
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 전공능력별 진단 */}
              <div className="space-y-6">
                {competencyData.competencies.map((competency, compIndex) => (
                  <div key={compIndex} className="border rounded-xl overflow-hidden">
                    {/* 역량 헤더 */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {competency.competencyNumber}
                        </span>
                        <h4 className="font-semibold text-gray-800">{competency.competencyName}</h4>
                      </div>
                    </div>

                    {/* 질문 목록 */}
                    <div className="divide-y">
                      {competency.questions.map((questionItem, qIndex) => {
                        const questionKey = `${compIndex}-${qIndex}`;
                        const currentScore = assessments[selectedMajor.key]?.[questionKey];
                        const questionText = typeof questionItem === 'string' 
                          ? questionItem 
                          : questionItem.question;

                        return (
                          <div key={qIndex} className="p-4">
                            <p className="text-sm text-gray-700 mb-3">
                              <span className="font-medium text-gray-500 mr-2">Q{qIndex + 1}.</span>
                              {questionText}
                            </p>
                            
                            {/* 5점 척도 */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 w-24">전혀 그렇지 않다</span>
                              <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((score) => (
                                  <button
                                    key={score}
                                    onClick={() => handleAssessment(selectedMajor.key, questionKey, score as SelfAssessmentScore)}
                                    className={`
                                      w-10 h-10 rounded-full font-medium transition-all
                                      ${currentScore === score
                                        ? 'bg-indigo-600 text-white shadow-lg scale-110'
                                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                                      }
                                    `}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 w-24 text-right">매우 그렇다</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 하단 액션 버튼 */}
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <button
                  onClick={() => onNavigate?.("roadmap")}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← 로드맵으로 돌아가기
                </button>
                <div className="flex space-x-3">
                  {selectedMajor.url && (
                    <button
                      onClick={() => window.open(selectedMajor.url, '_blank')}
                      className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                    >
                      전공 홈페이지 방문
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const results = calculateResults(selectedMajor.key, competencyData.competencies);
                      if (results.percentage === 100) {
                        alert(`${selectedMajor.name} 전공능력 자가진단이 완료되었습니다!\n\n평균 점수: ${results.avgScore.toFixed(1)} / 5\n\n${results.avgScore >= 4 ? '✅ 이 전공에 대한 역량이 높습니다!' : results.avgScore >= 3 ? '💪 기본 역량을 갖추고 있습니다.' : '📚 이 전공에 대한 학습이 더 필요합니다.'}`);
                      } else {
                        alert(`아직 ${results.totalQuestions - results.answeredQuestions}개 문항이 남아있습니다.`);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    진단 결과 확인
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 비교 요약 카드 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          추천 전공 비교
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedMajors.map((major, index) => {
            const majorData = getMajorCompetencyData(major.name);
            const competencies = majorData?.competencies || DEFAULT_COMPETENCY_DATA;
            const results = calculateResults(major.key, competencies);
            const colorClasses = [
              { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-500' },
              { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', progress: 'bg-emerald-500' },
              { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', progress: 'bg-amber-500' }
            ];
            const color = colorClasses[index];

            return (
              <div 
                key={major.key}
                onClick={() => setSelectedMajorIndex(index)}
                className={`
                  p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${index === selectedMajorIndex 
                    ? `${color.border} ${color.bg}` 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{major.name}</span>
                  <span className={`${color.text} font-bold`}>{major.matchScore}%</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{major.college}</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`${color.progress} h-1.5 rounded-full transition-all`}
                      style={{ width: `${results.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {results.percentage > 0 ? `${Math.round(results.percentage)}%` : '미진단'}
                  </span>
                </div>
                {results.avgScore > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    평균: <span className={getScoreColor(results.avgScore)}>{results.avgScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
