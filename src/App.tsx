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
import HSMatchingPrototype from "./HSMatchingPrototype";
import ResultViewer from "./pages/ResultViewer";
import PublicLanding from "./pages/PublicLanding";
import AdminLogs from "./pages/AdminLogs";
import { CURRENT_STUDENT } from "./data/dummyData";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type RiasecResult = Record<Dim, number>;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");
  const [riasecResult, setRiasecResult] = useState<RiasecResult | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 레거시 키 정리 (이전 버전에서 사용하던 단일 키 제거)
  useEffect(() => {
    localStorage.removeItem("riasecResult");
  }, []);

  // 학생별 RIASEC 결과 불러오기
  useEffect(() => {
    if (!currentStudentId) {
      setRiasecResult(null);
      return;
    }

    const savedResult = localStorage.getItem(`riasecResult_${currentStudentId}`);
    if (savedResult) {
      try {
        setRiasecResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Failed to parse saved RIASEC result", e);
        setRiasecResult(null);
      }
    } else {
      setRiasecResult(null);
    }
  }, [currentStudentId]);

  const handleLogin = (studentId: string, isAdminUser: boolean = false) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdminUser);
    if (isAdminUser) {
      setCurrentPage("admin-logs");
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
    setCurrentStudentId(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentPage("dashboard");
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
      case "login":
        return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentPage("landing")} />;
      case "dashboard":
        // 관리자는 대시보드 접근 불가
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <Dashboard onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} />;
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
        return <CareerInsight riasecResult={riasecResult} onStartTest={() => setCurrentPage("riasec")} />;
      case "roadmap":
        if (isAdmin) {
          setCurrentPage("admin-logs");
          return null;
        }
        return <CareerRoadmapPage onNavigate={setCurrentPage} riasecResult={riasecResult} />;
      case "riasec":
        return <HSMatchingPrototype onComplete={handleRiasecComplete} />;
      case "result-viewer":
        return <ResultViewer />;
      case "admin-logs":
        // 관리자만 접근 가능
        if (!isAdmin) {
          setCurrentPage("dashboard");
          return null;
        }
        return <AdminLogs />;
      default:
        if (isLoggedIn) {
          return <Dashboard onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} />;
        } else {
          return <Login onLogin={handleLogin} onNavigateToLanding={() => setCurrentPage("landing")} />;
        }
    }
  };

  // 공개 페이지 (로그인 불필요)
  const publicPages = ["landing", "riasec", "result-viewer", "login"];
  const isPublicPage = publicPages.includes(currentPage);

  // 공개 페이지는 Layout 없이 표시
  if (isPublicPage) {
    // riasec와 login 페이지는 자체 레이아웃이 있으므로 래퍼 없이 표시
    if (currentPage === "riasec" || currentPage === "login") {
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