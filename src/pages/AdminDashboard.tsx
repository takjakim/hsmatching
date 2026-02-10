import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdminUser,
  AdminRole,
  ROLE_PERMISSIONS,
  DashboardStats,
  AdminFilterOptions
} from '../types/admin';
import { getAllTestResults, getAllPilotResults } from '../../lib/supabase';
import { getCodeList, getFullResultByCode } from '../utils/resultCode';
import RiasecResult from '../components/pilot/RiasecResult';

// Props
interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

// 색상 팔레트 (기존 UI와 동일)
const COLORS = {
  primary: '#1E3A5F',
  secondary: '#4A6FA5',
  accent: '#E8B86D',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#94A3B8',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
};

// 탭 정의
type TabType = 'overview' | 'students' | 'statistics' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [pilotResults, setPilotResults] = useState<any[]>([]);
  const [filters, setFilters] = useState<AdminFilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  });
  const [searchQuery, setSearchQuery] = useState('');

  const permissions = ROLE_PERMISSIONS[adminUser.role];

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [adminUser, filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 데이터베이스 사용 여부 확인
      const useDatabase = import.meta.env.VITE_USE_DATABASE === 'true';

      let results: any[] = [];
      let pilots: any[] = [];

      // 1. 검사 결과 로드
      if (useDatabase) {
        try {
          // Supabase에서 데이터 로드
          const testData = await getAllTestResults(1000);
          results = testData.map(r => ({
            code: r.code,
            created_at: r.created_at,
            result: r.result,
            device_info: r.device_info
          }));
          console.log(`DB에서 검사결과 ${results.length}개 로드됨`);
        } catch (dbError) {
          console.error('DB 로드 실패, localStorage로 폴백:', dbError);
          // DB 실패 시 localStorage 폴백 (개별 코드 키에서 로드)
          results = await loadResultsFromLocalStorage();
        }
      } else {
        // localStorage에서 데이터 로드 (개별 코드 키에서)
        results = await loadResultsFromLocalStorage();
      }

      // 2. 파일럿 설문 결과 로드 (항상 Supabase 사용)
      try {
        pilots = await getAllPilotResults(1000);
        console.log(`DB에서 파일럿결과 ${pilots.length}개 로드됨`);
      } catch (pilotError) {
        console.error('파일럿 결과 로드 실패:', pilotError);
        pilots = [];
      }

      // 교수 권한인 경우 자기 전공만 필터링
      if (adminUser.role === 'professor' && adminUser.department) {
        results = results.filter((r: any) => {
          const topMajor = r.result?.majors?.[0]?.name || '';
          return topMajor.includes(adminUser.department!) ||
                 r.result?.department === adminUser.department;
        });
      }

      setTestResults(results);
      setPilotResults(pilots);

      // 통계 계산
      const calculatedStats = calculateStats(results, pilots);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // localStorage에서 검사 결과 로드 (개별 코드 키에서)
  const loadResultsFromLocalStorage = async (): Promise<any[]> => {
    try {
      const codeList = await getCodeList();
      const allResults: any[] = [];

      for (const { code, createdAt } of codeList) {
        const fullData = await getFullResultByCode(code);
        if (fullData && fullData.result) {
          allResults.push({
            code,
            created_at: createdAt || fullData.createdAt,
            result: fullData.result,
            device_info: fullData.deviceInfo
          });
        }
      }

      console.log(`localStorage에서 검사결과 ${allResults.length}개 로드됨`);
      return allResults;
    } catch (error) {
      console.error('localStorage 로드 실패:', error);
      return [];
    }
  };

  const calculateStats = (results: any[], pilots: any[]): DashboardStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 검사 결과 + 파일럿 결과 합산
    const allResults = [...results];
    const todayTests = results.filter(r => new Date(r.created_at) >= today).length;
    const weeklyTests = results.filter(r => new Date(r.created_at) >= weekAgo).length;

    // 파일럿 결과의 오늘/주간 카운트
    const todayPilots = pilots.filter(p => new Date(p.created_at) >= today).length;
    const weeklyPilots = pilots.filter(p => new Date(p.created_at) >= weekAgo).length;

    // RIASEC 분포 계산 (검사 결과에서)
    const riasecDistribution: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // 1. 검사 결과에서 RIASEC 분포
    results.forEach(r => {
      const scores = r.result?.norm || r.result?.scores || {};
      const entries = Object.entries(scores).filter(([k]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(k));
      if (entries.length > 0) {
        const topDim = entries.sort((a, b) => (b[1] as number) - (a[1] as number))[0];
        if (topDim) {
          riasecDistribution[topDim[0]] = (riasecDistribution[topDim[0]] || 0) + 1;
        }
      }
    });

    // 2. 파일럿 결과에서 RIASEC 분포 (riasec_scores 필드)
    pilots.forEach(p => {
      const scores = p.riasec_scores;
      if (scores && typeof scores === 'object') {
        const entries = Object.entries(scores).filter(([k]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(k));
        if (entries.length > 0) {
          const topDim = entries.sort((a, b) => (b[1] as number) - (a[1] as number))[0];
          if (topDim) {
            riasecDistribution[topDim[0]] = (riasecDistribution[topDim[0]] || 0) + 1;
          }
        }
      }
    });

    // 최근 활동: 검사 결과 + 파일럿 결과 합쳐서 최신순 정렬
    const allActivity = [
      ...results.map((r, i) => ({
        id: `test-${i}`,
        type: 'test_complete' as const,
        description: `검사 완료 (코드: ${r.code})`,
        timestamp: r.created_at,
      })),
      ...pilots.map((p, i) => ({
        id: `pilot-${i}`,
        type: 'pilot_complete' as const,
        description: `파일럿 설문 (${p.name || p.code})`,
        timestamp: p.created_at,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalTests: results.length + pilots.length, // 전체 검사 수 (검사 + 파일럿)
      totalPilotSurveys: pilots.length,
      todayTests: todayTests + todayPilots,
      weeklyTests: weeklyTests + weeklyPilots,
      completionRate: pilots.length > 0
        ? Math.round((pilots.filter(p => !p.skipped_supplementary).length / pilots.length) * 100)
        : 0,
      riasecDistribution,
      recentActivity: allActivity.slice(0, 10),
    };
  };

  // 필터링된 검사 결과
  const filteredResults = useMemo(() => {
    let filtered = testResults;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.code?.toLowerCase().includes(query) ||
        r.result?.majors?.[0]?.name?.toLowerCase().includes(query)
      );
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(r =>
        new Date(r.created_at) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(r =>
        new Date(r.created_at) <= new Date(filters.dateRange.end + 'T23:59:59')
      );
    }

    return filtered;
  }, [testResults, searchQuery, filters]);

  // 필터링된 파일럿 결과
  const filteredPilots = useMemo(() => {
    let filtered = pilotResults;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.code?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      );
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(p =>
        new Date(p.created_at) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(p =>
        new Date(p.created_at) <= new Date(filters.dateRange.end + 'T23:59:59')
      );
    }

    return filtered;
  }, [pilotResults, searchQuery, filters]);

  // 통합 결과 (검사 + 파일럿)
  const combinedResults = useMemo(() => {
    const testItems = filteredResults.map(r => ({
      ...r,
      type: 'test' as const,
      name: null,
      email: null,
      riasec_scores: r.result?.norm || r.result?.scores || null,
    }));

    const pilotItems = filteredPilots.map(p => ({
      code: p.code,
      created_at: p.created_at,
      type: 'pilot' as const,
      name: p.name,
      email: p.email,
      student_id: p.student_id,
      riasec_scores: p.riasec_scores,
      result: null,
      device_info: p.device_info,
      skipped_supplementary: p.skipped_supplementary,
      // 보완검사 데이터 (PDF 프로파일용)
      value_scores: p.value_scores,
      career_decision: p.career_decision,
      self_efficacy: p.self_efficacy,
      preferences: p.preferences,
      raw_answers: p.raw_answers,
    }));

    return [...testItems, ...pilotItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filteredResults, filteredPilots]);

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} adminUser={adminUser} permissions={permissions} />;
      case 'students':
        return (
          <StudentsTab
            results={combinedResults}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
            adminUser={adminUser}
            permissions={permissions}
          />
        );
      case 'statistics':
        return permissions.canViewStatistics
          ? <StatisticsTab stats={stats} results={combinedResults} adminUser={adminUser} />
          : <AccessDenied />;
      case 'settings':
        return permissions.canEditSettings
          ? <SettingsTab adminUser={adminUser} />
          : <AccessDenied />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.primary }}
              >
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: COLORS.primary }}>
                  MJU 진로검사 관리시스템
                </h1>
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  {permissions.label} · {adminUser.name}
                  {adminUser.department && ` · ${adminUser.department}`}
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: adminUser.role === 'admin' ? `${COLORS.danger}20`
                    : adminUser.role === 'staff' ? `${COLORS.primary}20`
                    : `${COLORS.success}20`,
                  color: adminUser.role === 'admin' ? COLORS.danger
                    : adminUser.role === 'staff' ? COLORS.primary
                    : COLORS.success,
                }}
              >
                {permissions.label}
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: `${COLORS.muted}20`,
                  color: COLORS.muted,
                }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t" style={{ borderColor: COLORS.border }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-1 py-2">
              {[
                { id: 'overview', label: '대시보드', icon: '📊' },
                { id: 'students', label: '검사 결과', icon: '👥' },
                { id: 'statistics', label: '통계 분석', icon: '📈', requirePermission: 'canViewStatistics' },
                { id: 'settings', label: '설정', icon: '⚙️', requirePermission: 'canEditSettings' },
              ].map(tab => {
                const hasPermission = !tab.requirePermission ||
                  permissions[tab.requirePermission as keyof typeof permissions];

                if (!hasPermission && adminUser.role !== 'admin') return null;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      flex items-center gap-2
                    `}
                    style={{
                      backgroundColor: activeTab === tab.id ? COLORS.primary : 'transparent',
                      color: activeTab === tab.id ? '#FFFFFF' : COLORS.muted,
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    {!hasPermission && (
                      <span className="text-xs opacity-50">🔒</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingState />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

// ============ 서브 컴포넌트들 ============

// 대시보드 개요 탭
const OverviewTab: React.FC<{
  stats: DashboardStats | null;
  adminUser: AdminUser;
  permissions: typeof ROLE_PERMISSIONS[AdminRole];
}> = ({ stats, adminUser, permissions }) => {
  if (!stats) return <LoadingState />;

  const statCards = [
    {
      label: '총 검사 수',
      value: stats.totalTests,
      icon: '📝',
      color: COLORS.primary,
      bgColor: `${COLORS.primary}15`,
    },
    {
      label: '파일럿 설문',
      value: stats.totalPilotSurveys,
      icon: '📋',
      color: COLORS.secondary,
      bgColor: `${COLORS.secondary}15`,
    },
    {
      label: '오늘 검사',
      value: stats.todayTests,
      icon: '📅',
      color: COLORS.success,
      bgColor: `${COLORS.success}15`,
    },
    {
      label: '주간 검사',
      value: stats.weeklyTests,
      icon: '📆',
      color: COLORS.warning,
      bgColor: `${COLORS.warning}15`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div
        className="p-6 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        }}
      >
        <h2 className="text-xl font-bold text-white mb-2">
          안녕하세요, {adminUser.name}님
        </h2>
        <p className="text-white/80 text-sm">
          {permissions.description}
        </p>
        {adminUser.department && (
          <p className="text-white/60 text-xs mt-2">
            소속: {adminUser.college} · {adminUser.department}
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: stat.bgColor }}
              >
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.muted }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* RIASEC Distribution */}
      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>
          RIASEC 유형 분포
        </h3>
        <div className="grid grid-cols-6 gap-3">
          {Object.entries(stats.riasecDistribution).map(([dim, count]) => {
            const total = Object.values(stats.riasecDistribution).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const dimColors: Record<string, string> = {
              R: '#EF4444', I: '#3B82F6', A: '#8B5CF6',
              S: '#10B981', E: '#F59E0B', C: '#6B7280',
            };

            return (
              <div key={dim} className="text-center">
                <div
                  className="w-full h-24 rounded-xl flex flex-col items-center justify-end pb-2 mb-2"
                  style={{ backgroundColor: `${dimColors[dim]}15` }}
                >
                  <div
                    className="w-8 rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max(percentage, 10)}%`,
                      backgroundColor: dimColors[dim],
                    }}
                  />
                </div>
                <p className="font-bold text-lg" style={{ color: dimColors[dim] }}>{dim}</p>
                <p className="text-xs" style={{ color: COLORS.muted }}>{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>
          최근 활동
        </h3>
        <div className="space-y-3">
          {stats.recentActivity.slice(0, 5).map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-3 rounded-xl"
              style={{ backgroundColor: COLORS.bg }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: `${COLORS.success}20` }}
              >
                ✓
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: COLORS.primary }}>
                  {activity.description}
                </p>
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  {new Date(activity.timestamp).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 학생 검사 결과 탭
const StudentsTab: React.FC<{
  results: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: AdminFilterOptions;
  onFilterChange: (filters: AdminFilterOptions) => void;
  adminUser: AdminUser;
  permissions: typeof ROLE_PERMISSIONS[AdminRole];
}> = ({ results, searchQuery, onSearchChange, filters, onFilterChange, adminUser, permissions }) => {
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div
        className="p-4 rounded-2xl flex flex-wrap gap-4 items-center"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="코드 또는 전공으로 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
            }}
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => onFilterChange({
              ...filters,
              dateRange: { ...filters.dateRange, start: e.target.value }
            })}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
            }}
          />
          <span style={{ color: COLORS.muted }}>~</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => onFilterChange({
              ...filters,
              dateRange: { ...filters.dateRange, end: e.target.value }
            })}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
            }}
          />
        </div>

        {/* Export Button */}
        {permissions.canExportData && (
          <button
            onClick={() => {
              const csv = results.map(r => ({
                code: r.code,
                date: r.created_at,
                topMajor: r.result?.majors?.[0]?.name || '',
                topRole: r.result?.roles?.[0]?.name || '',
              }));
              const csvContent = [
                Object.keys(csv[0] || {}).join(','),
                ...csv.map(row => Object.values(row).join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `검사결과_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: COLORS.success,
              color: '#FFFFFF',
            }}
          >
            CSV 내보내기
          </button>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: COLORS.muted }}>
          총 <span className="font-bold" style={{ color: COLORS.primary }}>{results.length}</span>개의 결과
          {adminUser.role === 'professor' && adminUser.department && (
            <span> ({adminUser.department} 관련)</span>
          )}
        </p>
      </div>

      {/* Results Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: COLORS.bg }}>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.muted }}>유형</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.muted }}>코드</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.muted }}>이름</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.muted }}>검사일시</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.muted }}>RIASEC</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: COLORS.muted }}>추천 전공</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase" style={{ color: COLORS.muted }}>상세</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 100).map((result, index) => {
              // RIASEC 점수 추출 (통합된 형식)
              const scores = result.riasec_scores || result.result?.norm || result.result?.scores || {};
              const riasecEntries = Object.entries(scores).filter(([k]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(k));
              const topDims = riasecEntries
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 3)
                .map(([d]) => d)
                .join('');

              // 전공/직무 (검사 결과에서만)
              const topMajor = result.result?.majors?.[0]?.name || '-';

              // 유형 색상
              const isPilot = result.type === 'pilot';
              const typeColor = isPilot ? COLORS.accent : COLORS.success;
              const typeLabel = isPilot ? '파일럿' : '검사';

              return (
                <tr
                  key={`${result.type}-${result.code}-${index}`}
                  className="border-t hover:bg-gray-50 transition-colors"
                  style={{ borderColor: COLORS.border }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                    >
                      {typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code
                      className="text-sm font-mono px-2 py-1 rounded"
                      style={{ backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }}
                    >
                      {result.code}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: COLORS.primary }}>
                    {result.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: COLORS.muted }}>
                    {new Date(result.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-bold px-2 py-1 rounded"
                      style={{ backgroundColor: `${COLORS.secondary}15`, color: COLORS.secondary }}
                    >
                      {topDims || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: COLORS.primary }}>
                    {topMajor}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{
                        backgroundColor: `${COLORS.primary}15`,
                        color: COLORS.primary,
                      }}
                    >
                      보기
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {results.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-lg" style={{ color: COLORS.muted }}>
              검색 결과가 없습니다
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedResult && (
          <ResultDetailModal
            result={selectedResult}
            onClose={() => setSelectedResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// 통계 분석 탭
const StatisticsTab: React.FC<{
  stats: DashboardStats | null;
  results: any[];
  adminUser: AdminUser;
}> = ({ stats, results, adminUser }) => {
  if (!stats) return <LoadingState />;

  // 전공별 분포 계산
  const majorDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    results.forEach(r => {
      const major = r.result?.majors?.[0]?.name;
      if (major) {
        dist[major] = (dist[major] || 0) + 1;
      }
    });
    return Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [results]);

  // 일별 검사 추이
  const dailyTrend = useMemo(() => {
    const trend: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    last7Days.forEach(date => {
      trend[date] = 0;
    });

    results.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (trend[date] !== undefined) {
        trend[date]++;
      }
    });

    return Object.entries(trend);
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Rate */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 className="text-sm font-medium mb-4" style={{ color: COLORS.muted }}>
            설문 완료율
          </h3>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold" style={{ color: COLORS.success }}>
              {stats.completionRate}%
            </span>
            <span className="text-sm pb-1" style={{ color: COLORS.muted }}>
              보충 설문 포함
            </span>
          </div>
          <div
            className="mt-4 h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${COLORS.success}20` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${stats.completionRate}%`,
                backgroundColor: COLORS.success,
              }}
            />
          </div>
        </div>

        {/* Average Tests per Day */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 className="text-sm font-medium mb-4" style={{ color: COLORS.muted }}>
            일 평균 검사 수
          </h3>
          <span className="text-4xl font-bold" style={{ color: COLORS.primary }}>
            {stats.totalTests > 0
              ? Math.round(stats.weeklyTests / 7 * 10) / 10
              : 0}
          </span>
          <p className="text-sm mt-2" style={{ color: COLORS.muted }}>
            최근 7일 기준
          </p>
        </div>

        {/* Top RIASEC */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 className="text-sm font-medium mb-4" style={{ color: COLORS.muted }}>
            가장 많은 RIASEC 유형
          </h3>
          {(() => {
            const topType = Object.entries(stats.riasecDistribution)
              .sort((a, b) => b[1] - a[1])[0];
            const typeNames: Record<string, string> = {
              R: '현장형', I: '탐구형', A: '예술형',
              S: '사회형', E: '기업형', C: '관습형',
            };
            return topType ? (
              <div className="flex items-center gap-3">
                <span
                  className="text-4xl font-bold"
                  style={{ color: COLORS.secondary }}
                >
                  {topType[0]}
                </span>
                <div>
                  <p className="font-medium" style={{ color: COLORS.primary }}>
                    {typeNames[topType[0]]}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.muted }}>
                    {topType[1]}명 ({Math.round((topType[1] / stats.totalTests) * 100)}%)
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: COLORS.muted }}>데이터 없음</p>
            );
          })()}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>
            일별 검사 추이
          </h3>
          <div className="flex items-end justify-between h-40 gap-2">
            {dailyTrend.map(([date, count]) => {
              const maxCount = Math.max(...dailyTrend.map(([, c]) => c), 1);
              const height = (count / maxCount) * 100;
              return (
                <div key={date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      backgroundColor: COLORS.primary,
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
                    {date.slice(5).replace('-', '/')}
                  </p>
                  <p className="text-xs font-bold" style={{ color: COLORS.primary }}>
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Majors */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>
            인기 추천 전공 TOP 10
          </h3>
          <div className="space-y-2">
            {majorDistribution.map(([major, count], index) => {
              const maxCount = majorDistribution[0]?.[1] || 1;
              const width = (count / maxCount) * 100;
              return (
                <div key={major} className="flex items-center gap-3">
                  <span
                    className="w-6 text-center text-xs font-bold"
                    style={{ color: index < 3 ? COLORS.accent : COLORS.muted }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm truncate" style={{ color: COLORS.primary }}>
                        {major}
                      </span>
                      <span className="text-xs" style={{ color: COLORS.muted }}>
                        {count}명
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${COLORS.primary}15` }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: index < 3 ? COLORS.accent : COLORS.primary,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// 설정 탭 (관리자 전용)
const SettingsTab: React.FC<{ adminUser: AdminUser }> = ({ adminUser }) => {
  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>
          시스템 설정
        </h3>
        <p className="text-sm" style={{ color: COLORS.muted }}>
          시스템 설정 기능은 준비 중입니다.
        </p>

        <div className="mt-6 space-y-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: COLORS.bg }}
          >
            <h4 className="font-medium mb-2" style={{ color: COLORS.primary }}>
              관리자 계정 정보
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: COLORS.muted }}>사용자명:</span>
                <span className="ml-2 font-medium">{adminUser.username}</span>
              </div>
              <div>
                <span style={{ color: COLORS.muted }}>이름:</span>
                <span className="ml-2 font-medium">{adminUser.name}</span>
              </div>
              <div>
                <span style={{ color: COLORS.muted }}>권한:</span>
                <span className="ml-2 font-medium">{ROLE_PERMISSIONS[adminUser.role].label}</span>
              </div>
              {adminUser.department && (
                <div>
                  <span style={{ color: COLORS.muted }}>소속:</span>
                  <span className="ml-2 font-medium">{adminUser.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 결과 상세 모달
const ResultDetailModal: React.FC<{
  result: any;
  onClose: () => void;
}> = ({ result, onClose }) => {
  const [viewMode, setViewMode] = useState<'profile' | 'summary' | 'json'>('summary');
  const isPilot = result.type === 'pilot';
  const scores = result.riasec_scores || result.result?.norm || result.result?.scores || {};
  const majors = result.result?.majors || [];
  const roles = result.result?.roles || [];

  // RIASEC 점수가 정규화되지 않은 경우 (파일럿: 0-30 범위)
  const normalizeScore = (score: number) => {
    if (typeof score !== 'number') return '-';
    // 파일럿 점수는 0-30 범위, 검사 점수는 0-1 범위
    if (isPilot) {
      return Math.round(score); // 원점수 표시
    }
    return (score * 100).toFixed(0);
  };

  // 파일럿 결과용 supplementaryData 변환
  const getSupplementaryData = () => {
    if (!isPilot || result.skipped_supplementary) return undefined;

    const decisionLevelMap: Record<string, string> = {
      decided: '확정',
      exploring: '탐색',
      undecided: '미결정',
    };

    const vs = result.value_scores;
    const cd = result.career_decision;
    const se = result.self_efficacy;
    const pref = result.preferences;
    const ra = result.raw_answers || {};

    if (!vs && !cd && !se && !pref) return undefined;

    return {
      valueScores: vs || undefined,
      careerDecision: cd ? {
        level: decisionLevelMap[cd.status] || '탐색',
        confidence: (cd.score || 0) / 5,
      } : undefined,
      selfEfficacy: se || undefined,
      preferences: pref ? {
        fieldPreference: pref.fieldPreference,
        workStyle: pref.workStyle,
        environmentPreference: pref.workEnvironment,
      } : undefined,
      roleModel: ra['R01'] ? {
        name: ra['R01'] as string,
        traits: ra['R02'] as string[],
      } : undefined,
      valueRanking: ra['K01'] as Record<string, number> | undefined,
    };
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-h-[95vh] overflow-hidden"
        style={{ maxWidth: isPilot && viewMode === 'profile' ? '1200px' : '700px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">
                  {result.name || result.code}
                </h3>
                <span
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    backgroundColor: isPilot ? `${COLORS.accent}20` : `${COLORS.success}20`,
                    color: isPilot ? COLORS.accent : COLORS.success,
                  }}
                >
                  {isPilot ? '파일럿' : '검사'}
                </span>
              </div>
              <code className="text-xs text-gray-500">{result.code}</code>
            </div>

            {/* 뷰 모드 토글: 요약 / PDF / JSON */}
            <div className="flex bg-gray-100 rounded-lg p-1 ml-4">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  viewMode === 'summary'
                    ? 'bg-white shadow text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                요약
              </button>
              {isPilot && (
                <button
                  onClick={() => setViewMode('profile')}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    viewMode === 'profile'
                      ? 'bg-white shadow text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  PDF
                </button>
              )}
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  viewMode === 'json'
                    ? 'bg-white shadow text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                JSON
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto max-h-[calc(95vh-70px)]">
          {viewMode === 'json' ? (
            <div className="p-6">
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : viewMode === 'profile' && isPilot && result.riasec_scores ? (
            /* 파일럿 결과: RiasecResult 컴포넌트 (PDF 저장 가능) */
            <RiasecResult
              scores={result.riasec_scores}
              participantName={result.name || undefined}
              supplementaryData={getSupplementaryData()}
              isComplete={true}
            />
          ) : (
            /* 요약 뷰 */
            <div className="p-6">
              {/* Participant Info (파일럿만) */}
              {isPilot && (result.name || result.email || result.student_id) && (
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.bg }}>
                  <h3 className="font-bold mb-3" style={{ color: COLORS.primary }}>참여자 정보</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {result.name && (
                      <div>
                        <span style={{ color: COLORS.muted }}>이름:</span>
                        <span className="ml-2 font-medium">{result.name}</span>
                      </div>
                    )}
                    {result.student_id && (
                      <div>
                        <span style={{ color: COLORS.muted }}>학번:</span>
                        <span className="ml-2 font-medium">{result.student_id}</span>
                      </div>
                    )}
                    {result.email && (
                      <div className="col-span-2">
                        <span style={{ color: COLORS.muted }}>이메일:</span>
                        <span className="ml-2 font-medium">{result.email}</span>
                      </div>
                    )}
                    {result.skipped_supplementary !== undefined && (
                      <div>
                        <span style={{ color: COLORS.muted }}>보완검사:</span>
                        <span
                          className="ml-2 font-medium"
                          style={{ color: result.skipped_supplementary ? COLORS.warning : COLORS.success }}
                        >
                          {result.skipped_supplementary ? '건너뜀' : '완료'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RIASEC Scores */}
              <div className="mb-6">
                <h3 className="font-bold mb-3" style={{ color: COLORS.primary }}>
                  RIASEC 점수 {isPilot && <span className="text-xs font-normal">(원점수)</span>}
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {['R', 'I', 'A', 'S', 'E', 'C'].map(dim => (
                    <div key={dim} className="text-center p-3 rounded-xl" style={{ backgroundColor: COLORS.bg }}>
                      <p className="font-bold text-lg" style={{ color: COLORS.secondary }}>{dim}</p>
                      <p className="text-sm" style={{ color: COLORS.muted }}>
                        {normalizeScore(scores[dim])}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Majors (검사 결과만) */}
              {!isPilot && majors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3" style={{ color: COLORS.primary }}>추천 전공</h3>
                  <div className="space-y-2">
                    {majors.slice(0, 5).map((major: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: COLORS.bg }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: COLORS.primary, color: '#FFFFFF' }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium">{major.name}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: COLORS.secondary }}>
                          {Math.round((major.matchScore || major.score || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Roles (검사 결과만) */}
              {!isPilot && roles.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3" style={{ color: COLORS.primary }}>추천 직무</h3>
                  <div className="space-y-2">
                    {roles.slice(0, 5).map((role: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: COLORS.bg }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: COLORS.accent, color: '#FFFFFF' }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium">
                            {(role.name || '').replace(/\s*\(.*?\)\s*/g, '').trim()}
                          </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: COLORS.accent }}>
                          {Math.round((role.matchScore || role.score || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 검사일시 */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                <p className="text-sm" style={{ color: COLORS.muted }}>
                  검사일시: {new Date(result.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// 접근 거부 컴포넌트
const AccessDenied: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
      style={{ backgroundColor: `${COLORS.danger}15` }}
    >
      <span className="text-4xl">🔒</span>
    </div>
    <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>
      접근 권한이 없습니다
    </h2>
    <p className="text-sm" style={{ color: COLORS.muted }}>
      이 페이지를 보려면 더 높은 권한이 필요합니다.
    </p>
  </div>
);

// 로딩 상태
const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div
      className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
      style={{ borderColor: `${COLORS.primary}30`, borderTopColor: COLORS.primary }}
    />
    <p style={{ color: COLORS.muted }}>데이터를 불러오는 중...</p>
  </div>
);

export default AdminDashboard;
