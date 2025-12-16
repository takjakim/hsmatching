import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CURRENT_STUDENT,
  MIS_STUDENT,
  MIS_CAREER_ROADMAP,
  MIS_RECOMMENDED_CAREERS,
  getMISCurriculum,
  CareerRoadmap
} from "../data/dummyData";
import CurriculumPlanner from "../components/CurriculumPlanner";

interface CareerRoadmapPageProps {
  onNavigate?: (page: string) => void;
  riasecResult?: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null;
}

export default function CareerRoadmapPage({ onNavigate, riasecResult }: CareerRoadmapPageProps) {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_STUDENT.grade || 1);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'roadmap' | 'curriculum' | 'careers' | 'planner'>('roadmap');

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

  // 추천 직무 중 RIASEC 매칭 점수 계산
  const rankedCareers = useMemo(() => {
    if (!riasecResult) return MIS_RECOMMENDED_CAREERS;
    
    return MIS_RECOMMENDED_CAREERS.map(career => {
      let matchScore = 0;
      const riasecKeys = Object.keys(career.riasecMatch) as Array<'R' | 'I' | 'A' | 'S' | 'E' | 'C'>;
      riasecKeys.forEach(key => {
        if (riasecResult[key]) {
          matchScore += (career.riasecMatch as any)[key] * riasecResult[key];
        }
      });
      return { ...career, matchScore };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [riasecResult]);

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
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🎓 전주기 진로 가이드</h1>
            <p className="text-amber-100">
              {CURRENT_STUDENT.name}님의 경영정보학과 1~4학년 맞춤형 로드맵
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{CURRENT_STUDENT.grade}학년</div>
            <div className="text-amber-200 text-sm">현재 학년</div>
          </div>
        </div>
      </div>

      {/* 뷰 모드 선택 탭 */}
      <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 flex-wrap">
        {[
          { key: 'planner', label: '📐 내 커리큘럼', desc: '4년 계획 설계' },
          { key: 'roadmap', label: '📍 로드맵', desc: '학년별 진로 가이드' },
          { key: 'curriculum', label: '📚 커리큘럼', desc: '교과목 정보' },
          { key: 'careers', label: '💼 추천 직무', desc: 'RIASEC 기반' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key as any)}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg transition-all ${
              viewMode === tab.key
                ? tab.key === 'planner' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-semibold">{tab.label}</div>
            <div className={`text-xs ${viewMode === tab.key ? (tab.key === 'planner' ? 'text-indigo-100' : 'text-amber-100') : 'text-gray-500'}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* 학년 선택 (플래너 모드가 아닐 때만 표시) */}
      {viewMode !== 'planner' && (
      <div className="bg-white rounded-xl shadow-md p-6">
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
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg'
                  : year <= CURRENT_STUDENT.grade
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
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
          >
            {!riasecResult && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-medium text-amber-800">RIASEC 검사를 완료하면 더 정확한 추천을 받을 수 있습니다</p>
                  <button
                    onClick={() => onNavigate?.('riasec')}
                    className="text-sm text-amber-600 hover:text-amber-700 underline mt-1"
                  >
                    지금 검사하기 →
                  </button>
                </div>
              </div>
            )}

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
                    {riasecResult && career.matchScore && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          {Math.round(career.matchScore * 25)}%
                        </div>
                        <div className="text-xs text-gray-500">매칭 점수</div>
                      </div>
                    )}
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
                              {career.relatedCourses.map((course) => (
                                <span key={course} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                  {course}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <span>📊</span> RIASEC 프로파일
                          </h4>
                          <div className="flex gap-2">
                            {Object.entries(career.riasecMatch).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className="font-medium text-gray-600">{key}:</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${value * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
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

