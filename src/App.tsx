import React, { useState, useEffect, useMemo } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import LockedPageOverlay from "./components/LockedPageOverlay";
import Dashboard from "./pages/Dashboard";
import PersonalInfo from "./pages/PersonalInfo";
import GradesInfo from "./pages/GradesInfo";
import CoursesInfo from "./pages/CoursesInfo";
import MajorCompetency from "./pages/MajorCompetency";
import CompetencySurvey from "./pages/CompetencySurvey";
import { CompetencyScores } from "./data/competencyQuestions";
import CareerInsight from "./pages/CareerInsight";
import PilotResultPage from "./pages/PilotResultPage";
import SupplementarySurveyPage from "./pages/SupplementarySurveyPage";
import CareerRoadmapPage from "./pages/CareerRoadmapPage";
import MajorExplorer from "./pages/MajorExplorer";
import HSMatchingPrototype from "./HSMatchingPrototype";
import ResultViewer from "./pages/ResultViewer";
import PublicLanding from "./pages/PublicLanding";
import AdminLogs from "./pages/AdminLogs";
import PilotAdmin from "./pages/PilotAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import { CURRENT_STUDENT } from "./data/dummyData";
import { AdminUser, AdminRole } from "./types/admin";
import PilotSurvey from "./pages/PilotSurvey";
import { PilotResult as PilotResultType } from "./types/pilot";
import { recommendMajors } from "./utils/recommendMajors";
import { getPilotResultByStudentId, getCompetencyResultByStudentId, getMajorAssessmentsByStudentId, getRolemodelSelectionByStudentId, getGraduateRoleModelsByIds } from "../lib/supabase";
import StepBridgePage from './pages/StepBridgePage';
import { StepTransition } from './data/stepBridgeContent';

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type RiasecResult = Record<Dim, number>;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");
  const [riasecResult, setRiasecResult] = useState<RiasecResult | null>(null);
  const [competencyResult, setCompetencyResult] = useState<any>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showBridge, setShowBridge] = useState<StepTransition | null>(null);
  const [bridgeData, setBridgeData] = useState<{
    bestMajor?: { name: string; score: number };
    totalMajorsExplored?: number;
    roleModelCount?: number;
    topCompanyType?: string;
  }>({});
  // Dashboard 리마운트 강제를 위한 카운터
  const [dashboardKey, setDashboardKey] = useState(0);

  // 첫 번째 추천 전공 계산
  const firstRecommendedMajor = useMemo(() => {
    if (!riasecResult) return null;
    const riasecWithV = { ...riasecResult, V: 0 };
    const majors = recommendMajors(riasecWithV, { limit: 1 });
    return majors.length > 0 ? majors[0].name : null;
  }, [riasecResult]);

  // 추천 전공 목록 계산 (StepBridge용)
  const riasecRecommendedMajors = useMemo(() => {
    if (!riasecResult) return null;
    const riasecWithV = { ...riasecResult, V: 0 };
    const majors = recommendMajors(riasecWithV, { limit: 5 });
    return majors.map(m => m.name);
  }, [riasecResult]);

  // 앱 시작 시 localStorage에서 인증 상태 복원
  useEffect(() => {
    const savedIsLoggedIn = localStorage.getItem('auth_isLoggedIn') === 'true';
    const savedStudentId = localStorage.getItem('auth_studentId');
    const savedIsAdmin = localStorage.getItem('auth_isAdmin') === 'true';
    const savedAdminUser = localStorage.getItem('auth_adminUser');

    if (savedIsLoggedIn && savedStudentId) {
      setIsLoggedIn(true);
      setCurrentStudentId(savedStudentId);
      setIsAdmin(savedIsAdmin);
      if (savedAdminUser) {
        try {
          setAdminUser(JSON.parse(savedAdminUser));
        } catch (e) {
          console.error("Failed to parse saved admin user", e);
        }
      }
      // URL에서 경로를 먼저 확인하고, 없으면 저장된 페이지 복원
      const initialPath = window.location.pathname.replace(/^\//, '');
      const publicPages = ['landing', 'result-viewer', 'login', 'pilot', 'riasec', 'riasec-old', 'mju', 'assessment'];

      if (initialPath && initialPath !== 'login' && !publicPages.includes(initialPath)) {
        // URL에 유효한 경로가 있으면 해당 경로 사용
        setCurrentPage(initialPath);
      } else {
        // 저장된 페이지 복원
        const savedPage = localStorage.getItem('auth_currentPage');
        if (savedPage) {
          setCurrentPage(savedPage);
        } else if (savedIsAdmin) {
          setCurrentPage("admin-dashboard");
        } else {
          setCurrentPage("dashboard");
        }
      }
    }
    setAuthInitialized(true);
  }, []);

  // 레거시 키 정리 (이전 버전에서 사용하던 단일 키 제거)
  useEffect(() => {
    localStorage.removeItem("riasecResult");
  }, []);

  // URL → currentPage 동기화 (초기 로드 및 뒤로가기/앞으로가기 지원)
  useEffect(() => {
    // 인증 초기화가 완료될 때까지 대기
    if (!authInitialized) return;

    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '') || 'login';
      // 보호된 페이지에 비로그인 상태로 접근하는 경우 처리
      const publicPages = ['landing', 'result-viewer', 'login', 'pilot', 'riasec', 'riasec-old', 'mju', 'assessment'];
      if (!isLoggedIn && !publicPages.includes(path)) {
        // 원래 가려던 페이지를 sessionStorage에 저장
        sessionStorage.setItem('redirectAfterLogin', path);
        setCurrentPage('login');
      } else {
        setCurrentPage(path);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 초기 로드 시 URL에서 페이지 읽기 (인증되지 않은 경우에만)
    if (!isLoggedIn) {
      const initialPath = window.location.pathname.replace(/^\//, '');
      if (initialPath) {
        const publicPages = ['landing', 'result-viewer', 'login', 'pilot', 'riasec', 'riasec-old', 'mju', 'assessment'];

        if (initialPath === 'pilot') {
          setCurrentPage('pilot');
        } else if (initialPath === 'old' || initialPath === 'riasec-old') {
          setCurrentPage('riasec-old');
        } else if (!publicPages.includes(initialPath)) {
          // 비로그인 상태로 보호된 페이지 접근 시
          sessionStorage.setItem('redirectAfterLogin', initialPath);
          setCurrentPage('login');
        } else if (initialPath !== currentPage) {
          setCurrentPage(initialPath);
        }
      }
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, authInitialized]);

  // currentPage → URL 동기화 및 localStorage 저장
  useEffect(() => {
    if (isLoggedIn && currentPage) {
      const currentPath = window.location.pathname.replace(/^\//, '');
      if (currentPath !== currentPage) {
        window.history.pushState({}, '', `/${currentPage}`);
      }
      localStorage.setItem('auth_currentPage', currentPage);
    } else if (currentPage === 'login') {
      // 로그인 페이지로 이동 시 URL 업데이트
      const currentPath = window.location.pathname.replace(/^\//, '');
      if (currentPath !== 'login') {
        window.history.pushState({}, '', '/login');
      }
    } else if (currentPage) {
      // 공개 페이지 URL 업데이트
      const publicPages = ['landing', 'result-viewer', 'pilot', 'riasec', 'riasec-old', 'mju', 'assessment'];
      if (publicPages.includes(currentPage)) {
        const currentPath = window.location.pathname.replace(/^\//, '');
        if (currentPath !== currentPage) {
          window.history.pushState({}, '', `/${currentPage}`);
        }
      }
    }
  }, [currentPage, isLoggedIn]);

  // 학생별 RIASEC 결과 불러오기 (DB 우선, localStorage 폴백)
  useEffect(() => {
    if (!currentStudentId) {
      setRiasecResult(null);
      setCompetencyResult(null);
      return;
    }

    // DB에서 결과 불러오기
    const loadFromDB = async () => {
      try {
        // 1. RIASEC 결과 - DB에서 먼저 조회
        const dbPilotResult = await getPilotResultByStudentId(currentStudentId);
        if (dbPilotResult?.riasec_scores) {
          const scores = dbPilotResult.riasec_scores;
          // 최대값으로 정규화하여 0-1 범위로 변환
          const maxScore = Math.max(scores.R, scores.I, scores.A, scores.S, scores.E, scores.C) || 1;
          const normalizedResult: RiasecResult = {
            R: scores.R / maxScore,
            I: scores.I / maxScore,
            A: scores.A / maxScore,
            S: scores.S / maxScore,
            E: scores.E / maxScore,
            C: scores.C / maxScore,
          };
          setRiasecResult(normalizedResult);
          // localStorage에도 동기화
          localStorage.setItem(`riasecResult_${currentStudentId}`, JSON.stringify(normalizedResult));
          console.log('[App] RIASEC result loaded from DB for student:', currentStudentId);
        } else {
          // DB에 없으면 localStorage 확인
          const savedResult = localStorage.getItem(`riasecResult_${currentStudentId}`);
          if (savedResult) {
            try {
              setRiasecResult(JSON.parse(savedResult));
              console.log('[App] RIASEC result loaded from localStorage for student:', currentStudentId);
            } catch (e) {
              console.error("Failed to parse saved RIASEC result", e);
              setRiasecResult(null);
            }
          } else {
            setRiasecResult(null);
          }
        }

        // 2. 핵심역량진단 결과 - DB에서 먼저 조회
        const dbCompetencyResult = await getCompetencyResultByStudentId(currentStudentId);
        if (dbCompetencyResult?.scores) {
          setCompetencyResult(dbCompetencyResult.scores);
          // localStorage에도 동기화
          localStorage.setItem(`competencyResult_${currentStudentId}`, JSON.stringify(dbCompetencyResult.scores));
          console.log('[App] Competency result loaded from DB for student:', currentStudentId);
        } else {
          // DB에 없으면 localStorage 확인
          const savedCompetency = localStorage.getItem(`competencyResult_${currentStudentId}`);
          if (savedCompetency) {
            try {
              setCompetencyResult(JSON.parse(savedCompetency));
              console.log('[App] Competency result loaded from localStorage for student:', currentStudentId);
            } catch (e) {
              console.error("Failed to parse saved competency result", e);
              setCompetencyResult(null);
            }
          } else {
            setCompetencyResult(null);
          }
        }
      } catch (error) {
        console.error('[App] Error loading results from DB:', error);
        // DB 오류 시 localStorage 폴백
        const savedResult = localStorage.getItem(`riasecResult_${currentStudentId}`);
        if (savedResult) {
          try {
            setRiasecResult(JSON.parse(savedResult));
          } catch (e) {
            setRiasecResult(null);
          }
        }
        const savedCompetency = localStorage.getItem(`competencyResult_${currentStudentId}`);
        if (savedCompetency) {
          try {
            setCompetencyResult(JSON.parse(savedCompetency));
          } catch (e) {
            setCompetencyResult(null);
          }
        }
      }
    };

    loadFromDB();
  }, [currentStudentId]);

  const handleLogin = (studentId: string, isAdminUser: boolean = false, adminUserData?: AdminUser) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdminUser);

    // localStorage에 인증 상태 저장
    localStorage.setItem('auth_isLoggedIn', 'true');
    localStorage.setItem('auth_studentId', studentId);
    localStorage.setItem('auth_isAdmin', String(isAdminUser));

    if (isAdminUser && adminUserData) {
      setAdminUser(adminUserData);
      localStorage.setItem('auth_adminUser', JSON.stringify(adminUserData));
      setCurrentPage("admin-dashboard");
    } else if (isAdminUser) {
      // 레거시 admin 로그인 (adminUserData 없는 경우)
      const legacyAdminUser = {
        username: studentId,
        name: '관리자',
        role: 'admin' as AdminRole,
      };
      setAdminUser(legacyAdminUser);
      localStorage.setItem('auth_adminUser', JSON.stringify(legacyAdminUser));
      setCurrentPage("admin-dashboard");
    } else {
      // 로그인 전에 접근하려던 페이지가 있으면 그곳으로 이동
      const redirectTo = sessionStorage.getItem('redirectAfterLogin');
      if (redirectTo) {
        sessionStorage.removeItem('redirectAfterLogin');
        setCurrentPage(redirectTo);
      } else {
        setCurrentPage("dashboard");
      }
    }
    setCurrentStudentId(studentId);
  };

  const handleLogout = () => {
    // 로그아웃 시 localStorage 캐시 초기화
    // 현재 학생의 RIASEC 검사 결과 삭제
    if (currentStudentId && !isAdmin) {
      localStorage.removeItem(`riasecResult_${currentStudentId}`);
      localStorage.removeItem(`competencyResult_${currentStudentId}`);
    }

    // 모든 학생의 RIASEC 결과를 삭제하려면 (선택사항)
    // Object.keys(localStorage).forEach(key => {
    //   if (key.startsWith('riasecResult_')) {
    //     localStorage.removeItem(key);
    //   }
    // });

    // 기타 캐시 데이터가 있다면 여기서 삭제
    // localStorage.removeItem('기타_캐시_키');

    // 인증 관련 localStorage 삭제
    localStorage.removeItem('auth_isLoggedIn');
    localStorage.removeItem('auth_studentId');
    localStorage.removeItem('auth_isAdmin');
    localStorage.removeItem('auth_adminUser');
    localStorage.removeItem('auth_currentPage');

    // 상태 초기화
    setRiasecResult(null);
    setCompetencyResult(null);
    setShowBridge(null);
    setCurrentStudentId(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setAdminUser(null);
    setCurrentPage("login");

    // URL도 login으로 업데이트
    window.history.pushState({}, '', '/login');
  };

  const handleRiasecComplete = (result: Record<Dim, number>) => {
    setRiasecResult(result);
    const targetStudentId = currentStudentId || CURRENT_STUDENT.studentId;
    // 학생별로 localStorage에 저장
    localStorage.setItem(`riasecResult_${targetStudentId}`, JSON.stringify(result));
    // 검사 완료 후 인사이트 페이지로 이동 (로그인한 경우만)
    if (isLoggedIn) {
      setCurrentPage("insight");
    }
    // 공개 사용자는 결과 페이지에 머무름
  };

  // 핵심역량진단 완료 핸들러
  const handleCompetencyComplete = (scores: CompetencyScores) => {
    setCompetencyResult(scores);
    const targetStudentId = currentStudentId || CURRENT_STUDENT.studentId;
    localStorage.setItem(`competencyResult_${targetStudentId}`, JSON.stringify(scores));
    // 검사 완료 후 브릿지 페이지로 이동
    if (isLoggedIn) {
      setShowBridge('2to3');
    }
  };

  // Bridge 데이터 함수들 제거됨 - 브릿지는 단계 완료 시에만 표시

  // 파일럿 테스트 완료 핸들러
  const handlePilotComplete = (pilotResult: PilotResultType) => {
    // PilotResult의 riasecScores를 RiasecResult 형식 (0-1 범위)으로 변환
    if (pilotResult.riasecScores) {
      const scores = pilotResult.riasecScores;
      // 최대값으로 정규화하여 0-1 범위로 변환
      const maxScore = Math.max(scores.R, scores.I, scores.A, scores.S, scores.E, scores.C) || 1;
      const result: RiasecResult = {
        R: scores.R / maxScore,
        I: scores.I / maxScore,
        A: scores.A / maxScore,
        S: scores.S / maxScore,
        E: scores.E / maxScore,
        C: scores.C / maxScore,
      };
      setRiasecResult(result);
      const targetStudentId = currentStudentId || CURRENT_STUDENT.studentId;
      localStorage.setItem(`riasecResult_${targetStudentId}`, JSON.stringify(result));
    }

    // 검사가 완전히 완료된 경우에만 다음 단계로 이동
    // - skippedSupplementary가 true면 사용자가 명시적으로 건너뛰기를 선택한 것
    // - valueScores에 실제 데이터가 있으면 보완검사까지 완료한 것
    const isFullyComplete = pilotResult.skippedSupplementary === true ||
      (pilotResult.valueScores && Object.values(pilotResult.valueScores).some(v => v > 0));

    if (isLoggedIn && isFullyComplete) {
      // 1단계 완료 → 핵심역량진단 페이지로 이동 (브릿지는 해당 페이지 진입 시 자동 표시)
      setCurrentPage('competency');
    }
    // RIASEC만 완료된 경우 (skippedSupplementary === false)는 결과 페이지에 머무름
  };

  // 브릿지 닫기 (현재 페이지에서 다시 안 보이게)
  const dismissBridge = () => {
    setBridgeDismissedForPage(currentPage);
    setShowBridge(null);
  };

  // 현재 페이지에서 이미 브릿지를 봤는지 추적 (dismiss 후 재표시 방지)
  const [bridgeDismissedForPage, setBridgeDismissedForPage] = useState<string | null>(null);

  // 이전 페이지 추적 (페이지 변경 감지용)
  const [prevPage, setPrevPage] = useState<string | null>(null);

  // 페이지 진입 시 브릿지 표시 (랜딩 페이지처럼)
  // 페이지 변경 감지와 브릿지 표시를 하나의 effect에서 처리
  useEffect(() => {
    // 페이지가 변경되었으면 상태 초기화
    if (prevPage !== null && prevPage !== currentPage) {
      setBridgeDismissedForPage(null);
    }
    setPrevPage(currentPage);

    // 로그인 안 했으면 스킵
    if (!isLoggedIn) return;

    // 브릿지 매핑
    const bridgeConfig: Record<string, { bridge: StepTransition; check: () => boolean }> = {
      'competency': { bridge: '1to2', check: () => !!riasecResult },
      'roadmap-explorer': { bridge: '2to3', check: () => !!competencyResult },
      'roadmap-rolemodels': { bridge: '3to4', check: () => !!competencyResult },
      'roadmap-planner': { bridge: '4to5', check: () => !!riasecResult },
      'roadmap-fullcycle': { bridge: '4to5', check: () => !!riasecResult },
    };

    const config = bridgeConfig[currentPage];

    // 이 페이지에 브릿지 설정이 없으면 브릿지 숨김
    if (!config) {
      setShowBridge(null);
      return;
    }

    // 이 페이지에서 이미 브릿지를 닫았으면 표시 안함
    if (bridgeDismissedForPage === currentPage) {
      return;
    }

    // 이전 단계 결과가 있으면 브릿지 표시, 없으면 숨김
    if (config.check()) {
      setShowBridge(config.bridge);
    } else {
      setShowBridge(null);
    }
  }, [currentPage, isLoggedIn, riasecResult, competencyResult, bridgeDismissedForPage, prevPage]);

  // URL 파라미터 및 해시 처리 (초기 로드 시에만)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const hash = window.location.hash.replace('#', '');
    
    // 초기 로드 시에만 URL 파라미터 처리
    if (code && currentPage === "login") {
      setCurrentPage('result-viewer');
    } else if (hash && currentPage === "login") {
      // 해시가 있으면 해당 페이지로 이동
      // CareerInsight 페이지의 섹션 ID들
      const insightSections = ['recommended-majors', 'recommended-roles', 'profile-comparison', 'recommended-courses'];
      if (insightSections.includes(hash)) {
        // 로그인 상태 확인 및 결과 확인
        if (isLoggedIn) {
          // 결과가 없어도 insight 페이지로 이동 (검사 안내 표시)
          setCurrentPage('insight');
        } else {
          // 로그인 안 했으면 로그인 페이지 유지
          // 이미 login 페이지이므로 변경 불필요
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 로드 시에만 실행

  // 초기 페이지 설정 (로그인 안 했으면 로그인 페이지)
  useEffect(() => {
    // 초기 로드 시에만 실행 (currentPage가 초기값일 때)
    if (!isLoggedIn && currentPage === "dashboard") {
      setCurrentPage("login");
    }
  }, [isLoggedIn]); // currentPage 의존성 제거하여 무한 루프 방지

  // 디버깅: 페이지 변경 추적
  useEffect(() => {
    console.log("현재 페이지:", currentPage, "로그인 상태:", isLoggedIn);
  }, [currentPage, isLoggedIn]);

  // Dashboard 진입 시 key 증가 (강제 리마운트로 데이터 새로고침)
  useEffect(() => {
    if (currentPage === "dashboard") {
      setDashboardKey(prev => prev + 1);
    }
  }, [currentPage]);


  // 미완료된 첫 번째 단계 찾기
  const getFirstIncompleteStep = () => {
    // 1단계: 전공 진로 적합도 검사
    if (!riasecResult) {
      return { name: "전공 진로 적합도 검사", page: "riasec" };
    }
    // 2단계: 핵심역량진단
    if (!competencyResult) {
      return { name: "핵심역량진단", page: "competency" };
    }
    // 3단계 이상은 접근 가능
    return null;
  };

  const firstIncompleteStep = getFirstIncompleteStep();

  const renderPage = () => {
    // Show StepBridge if active
    if (showBridge) {
      return (
        <StepBridgePage
          transition={showBridge}
          studentName={'학생'}
          // 1→2 data
          riasecTypeCode={riasecResult ?
            Object.entries(riasecResult)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([k]) => k)
              .join('')
            : undefined}
          recommendedMajors={riasecRecommendedMajors?.slice(0, 3)}
          // 2→3 data
          topCompetencies={competencyResult ?
            Object.entries(competencyResult)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 3)
              .map(([type, score]) => ({
                type,
                name: type, // Will use proper name from COMPETENCY_INFO
                score: score as number
              }))
            : undefined}
          // 3→4 data
          bestMajor={bridgeData.bestMajor}
          totalMajorsExplored={bridgeData.totalMajorsExplored}
          // 4→5 data
          roleModelCount={bridgeData.roleModelCount}
          topCompanyType={bridgeData.topCompanyType}
          onContinue={() => {
            // 이미 해당 페이지에 있으므로 브릿지만 닫기
            dismissBridge();
          }}
          onBack={() => {
            dismissBridge();
            // 이전 단계로 돌아가기
            if (showBridge === '1to2') setCurrentPage('insight');
            else if (showBridge === '2to3') setCurrentPage('competency');
            else if (showBridge === '3to4') setCurrentPage('roadmap-explorer');
            else if (showBridge === '4to5') setCurrentPage('roadmap-rolemodels');
          }}
        />
      );
    }

    switch (currentPage) {
      case "landing":
        return (
          <PublicLanding
            onStartTest={() => {
              console.log("검사 시작 버튼 클릭됨 - riasec로 이동");
              // URL 해시 제거
              window.history.replaceState(null, '', window.location.pathname);
              setCurrentPage("riasec");
            }}
            onViewResult={() => {
              console.log("결과 조회 버튼 클릭됨 - result-viewer로 이동");
              window.history.replaceState(null, '', window.location.pathname);
              setCurrentPage("result-viewer");
            }}
            onLogin={() => {
              console.log("로그인 버튼 클릭됨 - login으로 이동");
              window.history.replaceState(null, '', window.location.pathname);
              setCurrentPage("login");
            }}
          />
        );
      case "pilot":
        // 레거시 /pilot 경로 - 새 riasec으로 리다이렉트
        return <PilotSurvey onNavigate={setCurrentPage} onComplete={handlePilotComplete} isLoggedIn={isLoggedIn} currentStudentId={currentStudentId} />;
      case "login":
        return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentPage("landing")} />;
      case "dashboard":
        // 관리자는 대시보드 접근 불가
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <Dashboard key={dashboardKey} onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} riasecResult={riasecResult} currentStudentId={currentStudentId} />;
      case "personal":
        // 개인신상 페이지는 myicap+에서 제공 - 대시보드로 리다이렉트
        setCurrentPage("dashboard");
        return null;
      case "grades":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <GradesInfo />;
      case "courses":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <CoursesInfo />;
      case "competency":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return (
          <LockedPageOverlay
            isLocked={!!firstIncompleteStep && firstIncompleteStep.page !== "competency"}
            requiredStep={firstIncompleteStep?.name || ""}
            onGoToStep={() => setCurrentPage(firstIncompleteStep?.page || "riasec")}
          >
            <CompetencySurvey
              onNavigate={setCurrentPage}
              onComplete={handleCompetencyComplete}
              currentStudentId={currentStudentId}
              riasecResult={riasecResult}
            />
          </LockedPageOverlay>
        );
      case "insight":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        // 파일럿 결과 페이지 사용
        return <PilotResultPage onNavigate={setCurrentPage} onStartTest={() => setCurrentPage("riasec")} currentStudentId={currentStudentId} />;
      case "roadmap":
      case "roadmap-guide":
      case "roadmap-fullcycle":
      case "roadmap-planner":
      case "roadmap-extracurricular":
      case "roadmap-careers":
      case "roadmap-rolemodels": {
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        // 페이지별 initialViewMode 매핑
        const viewModeMap: Record<string, 'roadmap' | 'careers' | 'planner' | 'rolemodels' | 'extracurricular'> = {
          "roadmap": "roadmap",
          "roadmap-guide": "roadmap",
          "roadmap-fullcycle": "planner",
          "roadmap-planner": "planner",
          "roadmap-extracurricular": "extracurricular",
          "roadmap-careers": "careers",
          "roadmap-rolemodels": "rolemodels"
        };

        // 롤모델 탐색: 이전 단계 필요
        if (currentPage === "roadmap-rolemodels") {
          return (
            <LockedPageOverlay
              isLocked={!!firstIncompleteStep}
              requiredStep={firstIncompleteStep?.name || ""}
              onGoToStep={() => setCurrentPage(firstIncompleteStep?.page || "riasec")}
            >
              <CareerRoadmapPage
                onNavigate={setCurrentPage}
                riasecResult={riasecResult}
                competencyResult={competencyResult}
                initialViewMode="rolemodels"
                recommendedMajor={firstRecommendedMajor}
                currentStudentId={currentStudentId}
                              />
            </LockedPageOverlay>
          );
        }

        // 커리큘럼 플래너: 이전 단계 필요
        if (currentPage === "roadmap-planner" || currentPage === "roadmap-fullcycle") {
          return (
            <LockedPageOverlay
              isLocked={!!firstIncompleteStep}
              requiredStep={firstIncompleteStep?.name || ""}
              onGoToStep={() => setCurrentPage(firstIncompleteStep?.page || "riasec")}
            >
              <CareerRoadmapPage
                onNavigate={setCurrentPage}
                riasecResult={riasecResult}
                competencyResult={competencyResult}
                initialViewMode={viewModeMap[currentPage] || "planner"}
                recommendedMajor={firstRecommendedMajor}
                currentStudentId={currentStudentId}
                              />
            </LockedPageOverlay>
          );
        }

        // 비교과 활동: 잠금 없이 항상 접근 가능
        if (currentPage === "roadmap-extracurricular") {
          return (
            <CareerRoadmapPage
              onNavigate={setCurrentPage}
              riasecResult={riasecResult}
              competencyResult={competencyResult}
              initialViewMode="extracurricular"
              recommendedMajor={firstRecommendedMajor}
              currentStudentId={currentStudentId}
            />
          );
        }

        return (
          <CareerRoadmapPage
            onNavigate={setCurrentPage}
            riasecResult={riasecResult}
            competencyResult={competencyResult}
            initialViewMode={viewModeMap[currentPage] || "planner"}
            recommendedMajor={firstRecommendedMajor}
            currentStudentId={currentStudentId}
          />
        );
      }
      case "roadmap-explorer":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return (
          <LockedPageOverlay
            isLocked={!!firstIncompleteStep}
            requiredStep={firstIncompleteStep?.name || ""}
            onGoToStep={() => setCurrentPage(firstIncompleteStep?.page || "riasec")}
          >
            <MajorExplorer onNavigate={setCurrentPage} riasecResult={riasecResult} currentStudentId={currentStudentId} competencyResult={competencyResult} />
          </LockedPageOverlay>
        );
      case "riasec":
        // 새로운 파일럿 테스트로 교체
        return <PilotSurvey onNavigate={setCurrentPage} onComplete={handlePilotComplete} isLoggedIn={isLoggedIn} currentStudentId={currentStudentId} />;
      case "mju":
        // MJU 전용 검사
        return <PilotSurvey onNavigate={setCurrentPage} onComplete={handlePilotComplete} isLoggedIn={isLoggedIn} currentStudentId={currentStudentId} mode="mju" />;
      case "assessment":
        // 외부 기관용 검사
        return <PilotSurvey onNavigate={setCurrentPage} onComplete={handlePilotComplete} isLoggedIn={isLoggedIn} currentStudentId={currentStudentId} mode="external" />;
      case "supplementary":
        // 보완검사만 진행 (기존 RIASEC 점수 활용)
        return <SupplementarySurveyPage onNavigate={setCurrentPage} onComplete={handlePilotComplete} currentStudentId={currentStudentId} />;
      case "riasec-old":
        // 기존 HSMatchingPrototype (레거시)
        return <HSMatchingPrototype onComplete={handleRiasecComplete} onNavigate={setCurrentPage} />;
      case "result-viewer":
        return <ResultViewer />;
      case "admin-dashboard":
        // 관리자만 접근 가능
        if (!isAdmin || !adminUser) {
          setCurrentPage("dashboard");
          return null;
        }
        return (
          <AdminDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
          />
        );
      case "admin-logs":
        // 관리자만 접근 가능 (레거시 지원)
        if (!isAdmin) {
          setCurrentPage("dashboard");
          return null;
        }
        return <AdminLogs onNavigate={setCurrentPage} />;
      case "pilot-admin":
        if (!isAdmin) {
          setCurrentPage("dashboard");
          return null;
        }
        return <PilotAdmin onNavigate={setCurrentPage} />;
      default:
        if (isLoggedIn) {
          return <Dashboard key={dashboardKey} onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} riasecResult={riasecResult} currentStudentId={currentStudentId} />;
        } else {
          return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentPage("landing")} />;
        }
    }
  };

  // 공개 페이지 (로그인 불필요)
  const publicPages = ["landing", "result-viewer", "login", "pilot", "riasec", "riasec-old", "mju", "assessment"];
  const isPublicPage = publicPages.includes(currentPage);

  // 검사 페이지들
  const assessmentPages = ["riasec", "riasec-old", "mju", "assessment"];
  const isAssessmentPage = assessmentPages.includes(currentPage);

  // 로그인된 사용자가 검사 페이지에 있을 때는 Layout과 함께 표시
  if (isLoggedIn && isAssessmentPage) {
    // 아래 Layout 렌더링 로직에서 처리
  }
  // 비로그인 공개 페이지는 Layout 없이 표시
  else if (isPublicPage) {
    // riasec, login 등 페이지는 자체 레이아웃이 있으므로 래퍼 없이 표시
    if (isAssessmentPage || currentPage === "login") {
      console.log("공개 페이지 렌더링 (래퍼 없음):", currentPage, "isPublicPage:", isPublicPage);
      const pageContent = renderPage();
      console.log("렌더링된 페이지 콘텐츠:", pageContent ? "있음" : "없음");
      return pageContent;
    }
    // 다른 공개 페이지는 래퍼 사용
    console.log("공개 페이지 렌더링 (래퍼 있음):", currentPage);
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {renderPage()}
        </div>
      </div>
    );
  }

  // 로그인 필요 페이지
  if (!isLoggedIn) {
    console.log("로그인 필요 - Login 페이지로 리다이렉트");
    return <Login onLogin={handleLogin} />;
  }

  // Admin Dashboard는 자체 레이아웃 사용
  if (currentPage === "admin-dashboard" && isAdmin && adminUser) {
    return renderPage();
  }

  return (
    <Layout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
      isAdmin={isAdmin}
      currentStudentId={currentStudentId}
      stepStatus={{
        step1Complete: !!riasecResult,
        step2Complete: !!competencyResult,
        step3Complete: false, // 전공능력진단은 선택적
        step4Complete: false, // 롤모델 탐색은 선택적
      }}
    >
      {renderPage()}
    </Layout>
  );
}