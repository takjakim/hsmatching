import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GraduateRoleModel, GraduateProgram } from '../../lib/supabase';
import { EXTRACURRICULAR_ACTIVITIES, EXTRACURRICULAR_CATEGORIES, ExtracurricularActivity } from '../data/dummyData';

interface ExtracurricularRecommendationProps {
  selectedRoleModels: GraduateRoleModel[];
  userActivities?: ExtracurricularActivity[];
  onNavigate?: (page: string) => void;
}

// 프로그램명을 카테고리로 분류하는 함수
const categorizeProgram = (programName: string): string => {
  const lower = programName.toLowerCase();

  if (lower.includes('자격') || lower.includes('certificate') || lower.includes('시험')) {
    return 'certificate';
  }
  if (lower.includes('공모') || lower.includes('대회') || lower.includes('경진') || lower.includes('contest')) {
    return 'contest';
  }
  if (lower.includes('인턴') || lower.includes('현장') || lower.includes('실습')) {
    return 'internship';
  }
  if (lower.includes('봉사') || lower.includes('volunteer')) {
    return 'volunteer';
  }
  if (lower.includes('동아리') || lower.includes('학회') || lower.includes('club')) {
    return 'club';
  }
  if (lower.includes('특강') || lower.includes('세미나') || lower.includes('워크') || lower.includes('캠프')) {
    return 'seminar';
  }

  return 'seminar'; // 기본값
};

// 레벨 계산 함수
const calculateLevel = (total: number): { level: number; progress: number; nextTarget: number } => {
  const thresholds = [0, 3, 7, 12, 18, 25, 35, 50];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (total >= thresholds[i]) level = i + 1;
    else break;
  }
  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1];
  const progress = ((total - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return { level, progress: Math.min(progress, 100), nextTarget: nextThreshold };
};

export default function ExtracurricularRecommendation({
  selectedRoleModels,
  userActivities = EXTRACURRICULAR_ACTIVITIES,
  onNavigate
}: ExtracurricularRecommendationProps) {
  // 롤모델들의 비교과 프로그램 집계
  const roleModelPrograms = useMemo(() => {
    const programCount: Record<string, { count: number; graduates: string[]; category: string }> = {};

    selectedRoleModels.forEach(rm => {
      rm.programs?.forEach(program => {
        const name = program.program_name;
        if (!programCount[name]) {
          programCount[name] = {
            count: 0,
            graduates: [],
            category: categorizeProgram(name)
          };
        }
        programCount[name].count++;
        const gradName = `${rm.department || ''}졸업생`;
        if (!programCount[name].graduates.includes(gradName)) {
          programCount[name].graduates.push(gradName);
        }
      });
    });

    return Object.entries(programCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [selectedRoleModels]);

  // 사용자가 이미 완료한 활동 이름 목록
  const completedActivityNames = useMemo(() => {
    return userActivities
      .filter(a => a.status === 'completed')
      .map(a => a.name.toLowerCase());
  }, [userActivities]);

  // 추천 프로그램 (사용자가 아직 안 한 것 중에서)
  const recommendations = useMemo(() => {
    return roleModelPrograms
      .filter(([name]) => !completedActivityNames.includes(name.toLowerCase()))
      .slice(0, 4);
  }, [roleModelPrograms, completedActivityNames]);

  // 카테고리별 비교
  const categoryComparison = useMemo(() => {
    const userCategories: Record<string, number> = {};
    const roleModelCategories: Record<string, number> = {};

    userActivities.filter(a => a.status === 'completed').forEach(a => {
      userCategories[a.category] = (userCategories[a.category] || 0) + 1;
    });

    selectedRoleModels.forEach(rm => {
      rm.programs?.forEach(program => {
        const category = categorizeProgram(program.program_name);
        roleModelCategories[category] = (roleModelCategories[category] || 0) + 1;
      });
    });

    const avgDivisor = selectedRoleModels.length || 1;
    Object.keys(roleModelCategories).forEach(key => {
      roleModelCategories[key] = Math.round(roleModelCategories[key] / avgDivisor);
    });

    return EXTRACURRICULAR_CATEGORIES.map(cat => ({
      ...cat,
      userCount: userCategories[cat.id] || 0,
      roleModelAvg: roleModelCategories[cat.id] || 0,
      gap: (roleModelCategories[cat.id] || 0) - (userCategories[cat.id] || 0)
    }));
  }, [userActivities, selectedRoleModels]);

  // 사용자 통계
  const userStats = useMemo(() => {
    const completed = userActivities.filter(a => a.status === 'completed').length;
    const inProgress = userActivities.filter(a => a.status === 'in-progress').length;
    const levelInfo = calculateLevel(completed);
    const roleModelAvgTotal = selectedRoleModels.length > 0
      ? Math.round(selectedRoleModels.reduce((sum, rm) => sum + (rm.programs?.length || 0), 0) / selectedRoleModels.length)
      : 0;
    const matchRate = roleModelAvgTotal > 0
      ? Math.min(Math.round((completed / roleModelAvgTotal) * 100), 100)
      : 0;

    return { completed, inProgress, ...levelInfo, roleModelAvgTotal, matchRate };
  }, [userActivities, selectedRoleModels]);

  // 롤모델 미선택 시
  if (selectedRoleModels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"
      >
        <div className="text-center py-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">롤모델 기반 비교과 추천</h3>
          <p className="text-slate-500 text-sm mb-5">
            롤모델을 선택하면 맞춤형 활동을 추천받을 수 있어요
          </p>
          <button
            onClick={() => onNavigate?.('roadmap-rolemodels')}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:from-violet-600 hover:to-purple-600 transition-all shadow-md"
          >
            롤모델 탐색하기
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 상단 요약 카드 - Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 레벨 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-violet-200 text-sm font-medium mb-1">나의 레벨</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">Lv.{userStats.level}</span>
                <span className="text-violet-200 text-sm">/ 8</span>
              </div>
              <p className="text-violet-200 text-xs mt-2">
                다음 레벨까지 {userStats.nextTarget - userStats.completed}개 활동 필요
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - userStats.progress }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-white"
                  strokeWidth="4"
                  strokeDasharray="100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {Math.round(userStats.progress)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* 완료 활동 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4 border border-teal-100"
        >
          <p className="text-teal-600 text-xs font-semibold mb-1">완료한 활동</p>
          <p className="text-3xl font-black text-teal-700">{userStats.completed}</p>
          <p className="text-teal-500 text-xs mt-1">+{userStats.inProgress} 진행중</p>
        </motion.div>

        {/* 롤모델 달성률 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 border border-amber-100"
        >
          <p className="text-amber-600 text-xs font-semibold mb-1">롤모델 달성률</p>
          <p className="text-3xl font-black text-amber-700">{userStats.matchRate}%</p>
          <p className="text-amber-500 text-xs mt-1">목표 {userStats.roleModelAvgTotal}개</p>
        </motion.div>
      </div>

      {/* 나 vs 롤모델 비교 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">나 vs 롤모델</h3>
            <p className="text-slate-500 text-xs mt-0.5">{selectedRoleModels.length}명의 롤모델 평균과 비교</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></span>
              <span className="text-slate-600 font-medium">나</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></span>
              <span className="text-slate-600 font-medium">롤모델</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoryComparison.map((cat, index) => {
            const maxValue = Math.max(cat.userCount, cat.roleModelAvg, 3);
            const userPercent = (cat.userCount / maxValue) * 100;
            const roleModelPercent = (cat.roleModelAvg / maxValue) * 100;
            const isAhead = cat.userCount >= cat.roleModelAvg && cat.roleModelAvg > 0;
            const isBehind = cat.gap > 0;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className={`relative p-4 rounded-xl border transition-all hover:shadow-md ${
                  isAhead
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                    : isBehind
                      ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                }`}
              >
                {isAhead && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <p className="text-sm font-semibold text-slate-700 mb-3">{cat.name}</p>

                <div className="space-y-2">
                  {/* 나의 바 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${userPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 + index * 0.05 }}
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-5 text-right">{cat.userCount}</span>
                  </div>

                  {/* 롤모델 바 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${roleModelPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 + index * 0.05 }}
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-5 text-right">{cat.roleModelAvg}</span>
                  </div>
                </div>

                {isBehind && (
                  <p className="text-xs text-rose-500 font-medium mt-2">
                    +{cat.gap}개 도전해보세요!
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 추천 활동 */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">롤모델 추천 활동</h3>
              <p className="text-amber-700 text-xs">선배들이 많이 참여한 활동이에요</p>
            </div>
          </div>

          <div className="space-y-2">
            {recommendations.map(([name, data], index) => {
              const category = EXTRACURRICULAR_CATEGORIES.find(c => c.id === data.category);
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-white hover:bg-amber-50 rounded-xl border border-amber-100 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800 group-hover:text-amber-700 transition-colors">{name}</p>
                      <p className="text-slate-500 text-xs">
                        {data.count}명 참여 · {category?.name || '기타'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                    추천
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 응원 메시지 & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-100 via-purple-50 to-fuchsia-100 border border-violet-200 p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-600 text-sm mb-1">
              {userStats.matchRate >= 80
                ? "대단해요! 롤모델 수준에 거의 도달했어요"
                : userStats.matchRate >= 50
                  ? "잘하고 있어요! 조금만 더 힘내세요"
                  : "지금 시작해도 충분해요! 화이팅"}
            </p>
            <p className="text-lg font-bold text-slate-800">나만의 커리어를 만들어가는 중</p>
          </div>
          <button
            onClick={() => onNavigate?.('roadmap-extracurricular')}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:from-violet-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
          >
            활동 관리
          </button>
        </div>
      </motion.div>
    </div>
  );
}
