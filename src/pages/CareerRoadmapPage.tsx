import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CURRENT_STUDENT,
  MIS_STUDENT,
  MIS_CAREER_ROADMAP,
  MIS_RECOMMENDED_CAREERS,
  getMISCurriculum,
  getCoursesByGradeUpTo,
  ROLE_MODELS,
  compareWithRoleModel,
  CareerRoadmap
} from "../data/dummyData";
import CurriculumPlanner from "../components/CurriculumPlanner";
import TutorialOverlay from "../components/TutorialOverlay";

interface CareerRoadmapPageProps {
  onNavigate?: (page: string) => void;
  riasecResult?: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null;
}

export default function CareerRoadmapPage({ onNavigate, riasecResult }: CareerRoadmapPageProps) {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_STUDENT.grade || 1);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'roadmap' | 'curriculum' | 'careers' | 'planner' | 'rolemodels'>('roadmap');
  const [showTutorial, setShowTutorial] = useState(false);

  // 튜토리얼 단계 정의
  const tutorialSteps = useMemo(() => {
    const baseSteps = [
      {
        id: 'welcome',
        title: '전주기 진로 가이드에 오신 것을 환영합니다! 🎓',
        description: '이 페이지에서는 경영정보학과 1~4학년 전주기 커리큘럼과 진로 로드맵을 확인할 수 있습니다.',
        position: 'center' as const
      },
      {
        id: 'viewmode',
        title: '뷰 모드 선택',
        description: '4가지 탭을 통해 로드맵, 커리큘럼, 추천 직무, 커리큘럼 플래너를 확인할 수 있습니다.',
        targetSelector: '[data-tutorial="viewmode-tabs"]',
        position: 'bottom' as const
      },
      {
        id: 'year-select',
        title: '학년 선택',
        description: '학년 버튼을 클릭하면 해당 학년의 정보를 확인할 수 있습니다. 추천 직무는 선택한 학년까지의 수강 이력을 기반으로 계산됩니다.',
        targetSelector: '[data-tutorial="year-select"]',
        position: 'bottom' as const
      }
    ];

    // 현재 뷰 모드에 따른 추가 단계
    if (viewMode === 'careers') {
      return [
        ...baseSteps,
        {
          id: 'careers-info',
          title: '학년별 추천 직무',
          description: `${selectedYear}학년까지의 수강 교과목과 RIASEC 검사 결과를 바탕으로 직무를 추천합니다. 학년을 변경하면 추천 결과도 달라집니다.`,
          targetSelector: '[data-tutorial="careers-section"]',
          position: 'top' as const
        }
      ];
    } else if (viewMode === 'planner') {
      return [
        ...baseSteps,
        {
          id: 'planner-info',
          title: '커리큘럼 플래너',
          description: '교과목을 드래그하여 8학기 그리드에 배치하고, 나만의 4년 커리큘럼을 설계할 수 있습니다.',
          targetSelector: '[data-tutorial="planner-section"]',
          position: 'top' as const
        }
      ];
    }

    return baseSteps;
  }, [viewMode, selectedYear]);

  // 튜토리얼은 기본적으로 숨김 (사용자가 버튼을 클릭할 때만 표시)
  // 첫 방문 시 자동 표시를 원하면 아래 주석을 해제하세요
  // useEffect(() => {
  //   const hasSeenTutorial = localStorage.getItem('roadmap-tutorial-completed');
  //   if (!hasSeenTutorial) {
  //     const timer = setTimeout(() => {
  //       setShowTutorial(true);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  // 경영정보학과 학생인지 확인
  const isMISStudent = CURRENT_STUDENT.studentId === MIS_STUDENT.studentId;

  // 현재 학년의 로드맵 정보
  const currentRoadmap = useMemo(() => {
    return MIS_CAREER_ROADMAP.filter(r => r.year === selectedYear);
  }, [selectedYear]);

  // 현재 학년의 커리큘럼
  const currentCurriculum = useMemo(() => {
    return getMISCurriculum(selectedYear);
  }, [selectedYear]);

  // 선택된 학년까지의 수강 교과목 (누적)
  const coursesUpToSelectedYear = useMemo(() => {
    return getCoursesByGradeUpTo(selectedYear);
  }, [selectedYear]);

  // 롤 모델 비교 결과
  const roleModelComparisons = useMemo(() => {
    return ROLE_MODELS.map(roleModel => {
      const comparison = compareWithRoleModel(coursesUpToSelectedYear, roleModel);
      return {
        ...roleModel,
        ...comparison
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [coursesUpToSelectedYear]);

  // 추천 직무 중 RIASEC + 수강 교과목 기반 매칭 점수 계산
  const rankedCareers = useMemo(() => {
    const allCareers = MIS_RECOMMENDED_CAREERS.map(career => {
      let riasecScore = 0;
      let courseScore = 0;
      
      // RIASEC 점수 계산
      if (riasecResult) {
        const riasecKeys = Object.keys(career.riasecMatch) as Array<'R' | 'I' | 'A' | 'S' | 'E' | 'C'>;
        riasecKeys.forEach(key => {
          if (riasecResult[key]) {
            riasecScore += (career.riasecMatch as any)[key] * riasecResult[key];
          }
        });
      }
      
      // 수강 교과목 기반 점수 계산
      const completedCourseNames = coursesUpToSelectedYear.map(c => c.courseName);
      const relatedCourseNames = career.relatedCourses;
      
      // 관련 교과목과 수강 교과목 매칭
      let matchedCourses = 0;
      relatedCourseNames.forEach(relatedCourse => {
        const found = completedCourseNames.some(completed => 
          completed.includes(relatedCourse) || 
          relatedCourse.includes(completed) ||
          // 부분 매칭 (예: "데이터분석" -> "데이터분석프로그래밍")
          completed.toLowerCase().includes(relatedCourse.toLowerCase()) ||
          relatedCourse.toLowerCase().includes(completed.toLowerCase())
        );
        if (found) matchedCourses++;
      });
      
      // 교과목 매칭 점수: 관련 교과목 중 수강한 비율
      if (relatedCourseNames.length > 0) {
        courseScore = matchedCourses / relatedCourseNames.length;
      }
      
      // 최종 점수: RIASEC 60% + 교과목 40% (RIASEC이 없으면 교과목만)
      const finalScore = riasecResult 
        ? riasecScore * 0.6 + courseScore * 0.4
        : courseScore;
      
      return { 
        ...career, 
        matchScore: finalScore,
        riasecScore,
        courseScore,
        matchedCourses,
        totalRelatedCourses: relatedCourseNames.length
      };
    });
    
    return allCareers.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [riasecResult, coursesUpToSelectedYear, selectedYear]);

  if (!isMISStudent) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">전주기 진로 가이드</h2>
        <p className="text-gray-600 mb-6">
          이 기능은 경영정보학과 학생을 위한 전용 서비스입니다.
        </p>
        <p className="text-sm text-gray-500">
          경영정보학과 학생으로 로그인하면 1~4학년 전주기 커리큘럼과 진로 가이드를 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 튜토리얼 오버레이 */}
      {showTutorial && (
        <TutorialOverlay
          steps={tutorialSteps}
          storageKey="roadmap-tutorial-completed"
          onComplete={() => setShowTutorial(false)}
        />
      )}

      {/* 튜토리얼 다시 보기 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            localStorage.removeItem('roadmap-tutorial-completed');
            setShowTutorial(true);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition"
          title="튜토리얼 다시 보기"
        >
          💡 사용법 안내
        </button>
      </div>

      {/* 뷰 모드 선택 탭 */}
      <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 flex-wrap" data-tutorial="viewmode-tabs">
        {[
          { key: 'planner', label: '📐 내 커리큘럼', desc: '4년 계획 설계' },
          { key: 'roadmap', label: '📍 로드맵', desc: '학년별 진로 가이드' },
          { key: 'curriculum', label: '📚 커리큘럼', desc: '교과목 정보' },
          { key: 'careers', label: '💼 추천 직무', desc: 'RIASEC 기반' },
          { key: 'rolemodels', label: '⭐ 롤모델', desc: '선배와 비교' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key as any)}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg transition-all ${
              viewMode === tab.key
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-semibold">{tab.label}</div>
            <div className={`text-xs ${viewMode === tab.key ? 'text-blue-100' : 'text-gray-500'}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* 학년 선택 (플래너 모드가 아닐 때만 표시) */}
      {viewMode !== 'planner' && (
      <div className="bg-white rounded-xl shadow-md p-6" data-tutorial="year-select">
        <h2 className="text-lg font-bold text-gray-800 mb-4">학년 선택</h2>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((year) => (
            <motion.button
              key={year}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedYear(year)}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                selectedYear === year
                  ? 'bg-blue-600 text-white shadow-lg'
                  : year <= CURRENT_STUDENT.grade
                  ? 'bg-blue-50 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-500 border-2 border-dashed border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{year}학년</div>
              <div className={`text-xs ${selectedYear === year ? 'text-amber-100' : 'text-gray-500'}`}>
                {year < CURRENT_STUDENT.grade && '✓ 수료'}
                {year === CURRENT_STUDENT.grade && '현재'}
                {year > CURRENT_STUDENT.grade && '예정'}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      )}

      {/* 컨텐츠 영역 */}
      <AnimatePresence mode="wait">
        {viewMode === 'planner' && (
          <motion.div
            key="planner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            data-tutorial="planner-section"
          >
            <CurriculumPlanner riasecResult={riasecResult} />
          </motion.div>
        )}

        {viewMode === 'roadmap' && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 학년별 로드맵 카드 */}
            {currentRoadmap.map((roadmap, index) => (
              <RoadmapCard key={`${roadmap.year}-${roadmap.semester}`} roadmap={roadmap} index={index} />
            ))}
            
            {currentRoadmap.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                해당 학년의 로드맵 정보가 없습니다.
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'curriculum' && (
          <motion.div
            key="curriculum"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <h3 className="text-lg font-bold">{selectedYear}학년 교과목 목록</h3>
              <p className="text-blue-100 text-sm">총 {currentCurriculum.length}개 과목</p>
            </div>
            <div className="divide-y divide-gray-100">
              {currentCurriculum.map((course, index) => (
                <motion.div
                  key={course.courseNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          course.completionType === '전공필수' ? 'bg-red-100 text-red-700' :
                          course.completionType === '전공' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.completionType}
                        </span>
                        <span className="text-xs text-gray-500">{course.courseNumber}</span>
                      </div>
                      <h4 className="font-semibold text-gray-800">{course.courseName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>👨‍🏫 {course.professor}</span>
                        <span>📍 {course.timeAndRoom}</span>
                        <span>📊 {course.credits}학점</span>
                      </div>
                    </div>
                    {course.riasecProfile && (
                      <div className="flex flex-wrap gap-1 max-w-[150px] justify-end">
                        {Object.entries(course.riasecProfile).map(([key, value]) => (
                          value && value > 0.5 && (
                            <span
                              key={key}
                              className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                            >
                              {key}: {Math.round(value * 100)}%
                            </span>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'careers' && (
          <motion.div
            key="careers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
            data-tutorial="careers-section"
          >
            {/* 학년별 수강 현황 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📚</span>
                <h3 className="font-semibold text-blue-800">
                  {selectedYear}학년까지의 수강 교과목 기반 추천
                </h3>
              </div>
              <p className="text-sm text-blue-700">
                {coursesUpToSelectedYear.length}개 교과목을 수강하셨습니다. 
                {riasecResult ? ' RIASEC 검사 결과와 함께' : ''} 수강 이력을 바탕으로 직무를 추천합니다.
              </p>
              {!riasecResult && (
                <button
                  onClick={() => onNavigate?.('riasec')}
                  className="text-sm text-blue-600 hover:text-blue-700 underline mt-2"
                >
                  RIASEC 검사하기 → (더 정확한 추천을 위해)
                </button>
              )}
            </div>

            {rankedCareers.map((career, index) => (
              <motion.div
                key={career.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all ${
                  selectedCareer === career.title ? 'ring-2 ring-amber-500' : ''
                }`}
              >
                <button
                  onClick={() => setSelectedCareer(selectedCareer === career.title ? null : career.title)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{career.title}</h3>
                        <p className="text-sm text-gray-500">{career.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((career.matchScore || 0) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">매칭 점수</div>
                      {career.totalRelatedCourses > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          수강: {career.matchedCourses}/{career.totalRelatedCourses}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {selectedCareer === career.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 bg-gray-50">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <span>🛠️</span> 필요 역량
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.requiredSkills.map((skill) => (
                                <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <span>📚</span> 관련 교과목
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.relatedCourses.map((course) => {
                                // 수강한 교과목인지 확인
                                const isCompleted = coursesUpToSelectedYear.some(c => 
                                  c.courseName.includes(course) || 
                                  course.includes(c.courseName) ||
                                  c.courseName.toLowerCase().includes(course.toLowerCase()) ||
                                  course.toLowerCase().includes(c.courseName.toLowerCase())
                                );
                                return (
                                  <span 
                                    key={course} 
                                    className={`px-2 py-1 rounded text-sm ${
                                      isCompleted 
                                        ? 'bg-green-200 text-green-800 font-medium' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {course} {isCompleted && '✓'}
                                  </span>
                                );
                              })}
                            </div>
                            {career.totalRelatedCourses > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                {selectedYear}학년까지 {career.matchedCourses}개 수강 완료
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <span>📊</span> 매칭 상세
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {riasecResult && (
                              <div>
                                <p className="text-xs text-gray-600 mb-2">RIASEC 매칭</p>
                                <div className="flex gap-2 flex-wrap">
                                  {Object.entries(career.riasecMatch).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-1">
                                      <span className="font-medium text-gray-600 text-xs">{key}:</span>
                                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{ width: `${value * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  RIASEC 점수: {Math.round((career.riasecScore || 0) * 100)}%
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-600 mb-2">교과목 매칭</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${(career.courseScore || 0) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700">
                                  {Math.round((career.courseScore || 0) * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                관련 교과목 {career.matchedCourses}/{career.totalRelatedCourses}개 수강
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {viewMode === 'rolemodels' && (
          <motion.div
            key="rolemodels"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⭐</span>
                <h3 className="font-semibold text-blue-800">
                  {selectedYear}학년까지의 커리큘럼으로 선배와 비교
                </h3>
              </div>
              <p className="text-sm text-blue-700">
                경영정보학과 출신 우수 선배들의 커리큘럼과 비교하여 현재 진행도를 확인하세요.
              </p>
            </div>

            {/* 롤 모델 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roleModelComparisons.map((model, index) => {
                const getMatchColor = (percentage: number) => {
                  if (percentage >= 70) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' };
                  if (percentage >= 50) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-500' };
                  return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' };
                };

                const matchColor = getMatchColor(model.matchPercentage);

                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    {/* 헤더 */}
                    <div className={`p-6 border-b-4 ${matchColor.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-4xl">{model.icon}</div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${matchColor.text}`}>
                            {model.matchPercentage}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">매칭률</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{model.name} 선배</h3>
                      <p className="text-sm text-gray-600 mb-1">{model.company}</p>
                      <p className="text-xs text-gray-500">{model.position}</p>
                    </div>

                    {/* 상세 정보 */}
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">수강 교과목</span>
                          <span className="font-medium text-gray-800">
                            {model.matchedCourses.length} / {model.courses.length}개
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${model.matchPercentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={`h-full ${matchColor.bar}`}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">커리어 경로</p>
                        <ul className="space-y-1">
                          {model.careerPath.map((path, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start">
                              <span className="mr-1">•</span>
                              <span>{path}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">
                          {model.matchedCourses.length < model.courses.length && (
                            <>
                              <span className="font-medium text-orange-600">
                                {model.missingCourses.length}개 교과목
                              </span>
                              {' '}추가 수강 필요
                            </>
                          )}
                          {model.matchedCourses.length === model.courses.length && (
                            <span className="text-green-600 font-medium">
                              ✓ 모든 필수 교과목 수강 완료
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 전체 비교 요약 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">전체 비교 요약</h3>
              <div className="space-y-3">
                {roleModelComparisons.map((model) => {
                  const matchColor = model.matchPercentage >= 70 ? 'text-green-600' :
                                   model.matchPercentage >= 50 ? 'text-yellow-600' :
                                   'text-orange-600';
                  return (
                    <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{model.icon}</span>
                        <div>
                          <p className="font-medium text-gray-800">{model.name} 선배 ({model.company})</p>
                          <p className="text-xs text-gray-500">{model.companyType} · {model.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${matchColor}`}>
                          {model.matchPercentage}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {model.matchedCourses.length}/{model.courses.length}개 수강
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 전체 로드맵 타임라인 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">📅 전주기 로드맵 타임라인</h2>
        <div className="relative">
          {/* 연결선 */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-orange-500 to-red-500" />
          
          {MIS_CAREER_ROADMAP.map((roadmap, index) => (
            <motion.div
              key={`${roadmap.year}-${roadmap.semester}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-16 pb-8 ${
                roadmap.year < CURRENT_STUDENT.grade || 
                (roadmap.year === CURRENT_STUDENT.grade && roadmap.semester === 1)
                  ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {/* 노드 */}
              <div className={`absolute left-4 w-5 h-5 rounded-full border-4 ${
                roadmap.year === CURRENT_STUDENT.grade
                  ? 'bg-amber-500 border-amber-200 animate-pulse'
                  : roadmap.year < CURRENT_STUDENT.grade
                  ? 'bg-green-500 border-green-200'
                  : 'bg-gray-300 border-gray-200'
              }`} />
              
              <div className={`p-4 rounded-lg ${
                roadmap.year === CURRENT_STUDENT.grade
                  ? 'bg-amber-50 border-2 border-amber-300'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-xs font-bold">
                    {roadmap.year}학년 {roadmap.semester}학기
                  </span>
                  {roadmap.year === CURRENT_STUDENT.grade && (
                    <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs font-bold">
                      현재
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-800 mb-1">{roadmap.title}</h4>
                <p className="text-sm text-gray-600">{roadmap.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 로드맵 카드 컴포넌트
function RoadmapCard({ roadmap, index }: { roadmap: CareerRoadmap; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-bold">
                {roadmap.year}학년 {roadmap.semester}학기
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{roadmap.title}</h3>
            <p className="text-gray-600 mt-1">{roadmap.description}</p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-amber-600 text-2xl"
          >
            ▼
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* 습득 역량 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> 습득 역량
                </h4>
                <div className="flex flex-wrap gap-2">
                  {roadmap.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* 추천 교과목 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📚</span> 추천 교과목
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {roadmap.recommendedCourses.map((course) => (
                    <div key={course} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-amber-500">•</span>
                      <span className="text-gray-700">{course}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 진로 목표 */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">🚀</span> 진로 목표
                </h4>
                <div className="space-y-2">
                  {roadmap.careerGoals.map((goal) => (
                    <div key={goal} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-700">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 추천 자격증 */}
              {roadmap.certifications && roadmap.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xl">📜</span> 추천 자격증
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.certifications.map((cert) => (
                      <span key={cert} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

