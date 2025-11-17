import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PersonalInfo from "./pages/PersonalInfo";
import GradesInfo from "./pages/GradesInfo";
import CoursesInfo from "./pages/CoursesInfo";
import MajorCompetency from "./pages/MajorCompetency";
import CareerInsight from "./pages/CareerInsight";
import HSMatchingPrototype from "./HSMatchingPrototype";
import { CURRENT_STUDENT } from "./data/dummyData";

type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';
type RiasecResult = Record<Dim, number>;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [riasecResult, setRiasecResult] = useState<RiasecResult | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

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

  const handleLogin = (studentId: string) => {
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
    setCurrentStudentId(studentId);
  };

  const handleLogout = () => {
    // 로그아웃 시 localStorage 캐시 초기화
    // 현재 학생의 RIASEC 검사 결과 삭제
    if (currentStudentId) {
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
    setCurrentPage("dashboard");
  };

  const handleRiasecComplete = (result: RiasecResult) => {
    setRiasecResult(result);
    const targetStudentId = currentStudentId || CURRENT_STUDENT.studentId;
    // 학생별로 localStorage에 저장
    localStorage.setItem(`riasecResult_${targetStudentId}`, JSON.stringify(result));
    // 검사 완료 후 인사이트 페이지로 이동
    setCurrentPage("insight");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} />;
      case "personal":
        return <PersonalInfo />;
      case "grades":
        return <GradesInfo />;
      case "courses":
        return <CoursesInfo />;
      case "competency":
        return <MajorCompetency />;
      case "insight":
        return <CareerInsight riasecResult={riasecResult} onStartTest={() => setCurrentPage("riasec")} />;
      case "riasec":
        return <HSMatchingPrototype onComplete={handleRiasecComplete} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} riasecCompleted={!!riasecResult} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}