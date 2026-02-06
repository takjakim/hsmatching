import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EXTRACURRICULAR_ACTIVITIES,
  EXTRACURRICULAR_CATEGORIES,
  RECOMMENDED_EXTRACURRICULAR,
  getLearningAccountStats,
  ExtracurricularActivity,
  RecommendedActivity
} from '../data/dummyData';
import CertificateModal from './CertificateModal';

interface LearningAccountProps {
  activities?: ExtracurricularActivity[];
  onAddActivity?: () => void;
}

export default function LearningAccount({
  activities = EXTRACURRICULAR_ACTIVITIES,
  onAddActivity
}: LearningAccountProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ExtracurricularActivity | null>(null);

  // 통계 계산
  const stats = useMemo(() => getLearningAccountStats(activities), [activities]);

  // 카테고리 필터링
  const filteredActivities = useMemo(() => {
    if (!selectedCategory) return activities;
    return activities.filter(a => a.category === selectedCategory);
  }, [activities, selectedCategory]);

  // 완료된 활동 (수료증 발급 가능)
  const completedActivities = activities.filter(a => a.status === 'completed' && a.certificateUrl);

  // 수료증 발급 핸들러
  const handleIssueCertificate = (activity: ExtracurricularActivity) => {
    setSelectedActivity(activity);
    setShowCertificateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 배너 - 임시 주석처리 */}
      {/*
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span>📚</span> 나의 학습계좌
            </h2>
            <p className="text-indigo-100">비교과 활동 이력 및 마일리지 관리</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.totalMileage}P</div>
            <div className="text-indigo-200 text-sm">총 마일리지</div>
          </div>
        </div>
      </div>
      */}

      {/* 통계 카드 - 임시 주석처리 */}
      {/*
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-5 text-center border-l-4 border-purple-500"
        >
          <div className="text-3xl font-bold text-purple-600">{stats.totalMileage}P</div>
          <div className="text-gray-600 text-sm mt-1">마일리지</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-5 text-center border-l-4 border-blue-500"
        >
          <div className="text-3xl font-bold text-blue-600">{stats.totalActivities}</div>
          <div className="text-gray-600 text-sm mt-1">완료 활동</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-5 text-center border-l-4 border-green-500"
        >
          <div className="text-3xl font-bold text-green-600">{stats.totalHours}h</div>
          <div className="text-gray-600 text-sm mt-1">활동 시간</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-md p-5 text-center border-l-4 border-orange-500"
        >
          <div className="text-3xl font-bold text-orange-600">{stats.uniqueCategories}</div>
          <div className="text-gray-600 text-sm mt-1">참여 분야</div>
        </motion.div>
      </div>
      */}

      {/* 카테고리별 진행도 - 임시 주석처리 */}
      {/*
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> 카테고리별 진행도
        </h3>
        <div className="space-y-4">
          {stats.categoryProgress.map((cat) => {
            const category = EXTRACURRICULAR_CATEGORIES.find(c => c.id === cat.id);
            return (
              <div key={cat.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category?.icon}</span>
                    <span className="font-medium text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.completed >= cat.requiredCount
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cat.completed} / {cat.requiredCount}
                    </span>
                    {cat.completed >= cat.requiredCount && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${
                      cat.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      */}

      {/* 수료증 발급 가능 활동 */}
      {completedActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎖️</span> 완료 활동 (수료증 발급 가능)
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {completedActivities.map((activity) => {
              const category = EXTRACURRICULAR_CATEGORIES.find(c => c.id === activity.category);
              return (
                <motion.div
                  key={activity.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                      {category?.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{activity.name}</div>
                      <div className="text-xs text-gray-500">
                        {activity.mileage}P · {activity.hours}시간
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleIssueCertificate(activity)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm"
                  >
                    수료증 발급
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 활동 목록 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📋</span> 전체 활동 내역
          </h3>
          {onAddActivity && (
            <button
              onClick={onAddActivity}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
            >
              + 활동 추가
            </button>
          )}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              !selectedCategory
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {EXTRACURRICULAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : `${cat.color} hover:opacity-80`
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* 활동 목록 */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((activity) => {
              const category = EXTRACURRICULAR_CATEGORIES.find(c => c.id === activity.category);
              const statusStyle = activity.status === 'completed'
                ? 'bg-green-100 text-green-700 border-green-200'
                : activity.status === 'in-progress'
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-gray-100 text-gray-600 border-gray-200';
              const statusLabel = activity.status === 'completed' ? '완료'
                : activity.status === 'in-progress' ? '진행중' : '예정';

              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${category?.color} flex items-center justify-center text-2xl`}>
                      {category?.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{activity.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{activity.date}</span>
                        {activity.issuer && <span>· {activity.issuer}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.status === 'completed' && (
                      <div className="text-lg font-bold text-purple-600">+{activity.mileage}P</div>
                    )}
                    <div className="text-xs text-gray-500">{activity.hours}시간</div>
                    {activity.status === 'completed' && activity.certificateUrl && (
                      <button
                        onClick={() => handleIssueCertificate(activity)}
                        className="mt-1 text-xs text-blue-600 hover:underline"
                      >
                        수료증
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              해당 카테고리의 활동이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 추천 비교과 활동 - 임시 주석처리 */}
      {/*
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💡</span> 추천 비교과 활동
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          경영정보학과 학생에게 추천하는 비교과 활동입니다
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {RECOMMENDED_EXTRACURRICULAR.map((rec, idx) => {
            const category = EXTRACURRICULAR_CATEGORIES.find(c => c.id === rec.category);
            const alreadyDone = activities.some(
              a => a.name === rec.name && a.status === 'completed'
            );

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                className={`p-4 border-2 rounded-xl transition cursor-pointer ${
                  alreadyDone
                    ? 'bg-green-50 border-green-300'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${category?.color} flex items-center justify-center text-xl`}>
                    {category?.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        {rec.name}
                        {alreadyDone && <span className="text-green-500 text-sm">✓</span>}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        rec.difficulty === '상' ? 'bg-red-100 text-red-600' :
                        rec.difficulty === '중' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        난이도 {rec.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-600">👤 {rec.recommendFor}</span>
                      <span className="text-gray-500">
                        🎁 {rec.mileageReward}P · ⏱️ {rec.estimatedHours}h
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      */}

      {/* 수료증 모달 */}
      {showCertificateModal && selectedActivity && (
        <CertificateModal
          activity={selectedActivity}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
}
