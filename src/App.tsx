import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PersonalInfo from "./pages/PersonalInfo";
import GradesInfo from "./pages/GradesInfo";
import CoursesInfo from "./pages/CoursesInfo";
import MajorCompetency from "./pages/MajorCompetency";
import CareerInsight from "./pages/CareerInsight";
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

  // 레거시 키 정리 (이전 버전에서 사용하던 단일 키 제거)
  useEffect(() => {
    localStorage.removeItem("riasecResult");
  }, []);

  useEffect(() => {
    const pathname = window.location.pathname;

    // /pilot 경로 처리
    if (pathname === '/pilot') {
      setCurrentPage('pilot');
      return;
    }

    // /old 경로 처리 - 기존 RIASEC 테스트
    if (pathname === '/old' || pathname === '/riasec-old') {
      setCurrentPage('riasec-old');
      return;
    }

    // ... 나머지 코드
  }, []);  // 빈 배열로 초기 로드 시에만 실행

  // 학생별 RIASEC 결과 불러오기
  useEffect(() => {
    if (!currentStudentId) {
      setRiasecResult(null);
      setCompetencyResult(null);
      return;
    }

    const savedResult = localStorage.getItem(`riasecResult_${currentStudentId}`);
    if (savedResult) {
      try {
        setRiasecResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Failed to parse saved MJU 전공 진로 적합도 검사 result", e);
        setRiasecResult(null);
      }
    } else {
      setRiasecResult(null);
    }

    // Load competency result
    const savedCompetency = localStorage.getItem(`competencyResult_${currentStudentId}`);
    if (savedCompetency) {
      try {
        setCompetencyResult(JSON.parse(savedCompetency));
      } catch (e) {
        console.error("Failed to parse saved competency result", e);
        setCompetencyResult(null);
      }
    } else {
      setCompetencyResult(null);
    }
  }, [currentStudentId]);

  const handleLogin = (studentId: string, isAdminUser: boolean = false, adminUserData?: AdminUser) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdminUser);
    if (isAdminUser && adminUserData) {
      setAdminUser(adminUserData);
      setCurrentPage("admin-dashboard");
    } else if (isAdminUser) {
      // 레거시 admin 로그인 (adminUserData 없는 경우)
      setAdminUser({
        username: studentId,
        name: '관리자',
        role: 'admin',
      });
      setCurrentPage("admin-dashboard");
    } else {
      setCurrentPage("dashboard");
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

    // 상태 초기화
    setRiasecResult(null);
    setCompetencyResult(null);
    setCurrentStudentId(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setAdminUser(null);
    setCurrentPage("login");
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
    // 검사 완료 후 인사이트 페이지로 이동
    if (isLoggedIn) {
      setCurrentPage("insight");
    }
  };

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

  const renderPage = () => {
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
        return <PilotSurvey onNavigate={setCurrentPage} onComplete={handlePilotComplete} />;
      case "login":
        return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentPage("landing")} />;
      case "dashboard":
        // 관리자는 대시보드 접근 불가
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <Dashboard onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} riasecResult={riasecResult} />;
      case "personal":
        // 관리자는 일반 학생 페이지 접근 불가
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <PersonalInfo />;
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
        return <MajorCompetency />;
      case "insight":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <CareerInsight riasecResult={riasecResult} onStartTest={() => setCurrentPage("riasec")} onNavigate={setCurrentPage} />;
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
        return <CareerRoadmapPage onNavigate={setCurrentPage} riasecResult={riasecResult} competencyResult={competencyResult} initialViewMode={viewModeMap[currentPage] || "planner"} />;
      }
      case "roadmap-explorer":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <MajorExplorer onNavigate={setCurrentPage} riasecResult={riasecResult} />;
      case "riasec":
        // 새로운 파일럿 테스트로 교체
        return <PilotSurvey onNavigate={setCurrentPage} onComplete={handlePilotComplete} />;
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
          return <Dashboard onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} riasecResult={riasecResult} />;
        } else {
          return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentPage("landing")} />;
        }
    }
  };

  // 공개 페이지 (로그인 불필요)
  const publicPages = ["landing", "result-viewer", "login", "pilot"];
  // riasec, riasec-old는 로그인 여부에 따라 다르게 처리
  const isPublicPage = publicPages.includes(currentPage) || ((currentPage === "riasec" || currentPage === "riasec-old") && !isLoggedIn);

  // 공개 페이지는 Layout 없이 표시
  if (isPublicPage) {
    // riasec, riasec-old, login 페이지는 자체 레이아웃이 있으므로 래퍼 없이 표시
    if (currentPage === "riasec" || currentPage === "riasec-old" || currentPage === "login") {
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
    >
      {renderPage()}
    </Layout>
  );
}