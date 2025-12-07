import React, { useMemo } from "react";
import { getCurrentCourses, CURRENT_STUDENT } from "../data/dummyData";

export default function CoursesInfo() {
  const CURRENT_COURSES = getCurrentCourses();
  
  // 학기별로 그룹화
  const groupedCourses = useMemo(() => {
    const groups: Record<string, typeof CURRENT_COURSES> = {};
    
    CURRENT_COURSES.forEach((course) => {
      const key = `${course.year}-${course.semester}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(course);
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, []);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📚</span>
          수강현황
        </h2>
        <p className="text-sm text-gray-600 mt-1">학기별 수강 과목 목록을 확인할 수 있습니다.</p>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "총 수강 과목",
            value: CURRENT_COURSES.length,
            icon: "📖",
            color: "bg-blue-600"
          },
          {
            label: CURRENT_STUDENT.grade === 1 ? "기초교양 과목" : "전공 과목",
            value: CURRENT_STUDENT.grade === 1 
              ? CURRENT_COURSES.filter(c => c.completionType === "기초교양").length
              : CURRENT_COURSES.filter(c => c.completionType === "전공").length,
            icon: "🎯",
            color: "bg-blue-600"
          },
          {
            label: "핵심교양 과목",
            value: CURRENT_COURSES.filter(c => c.completionType === "핵심교양").length,
            icon: "🌟",
            color: "bg-blue-600"
          }
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} text-white rounded-xl shadow-md p-6`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 학기별 수강 목록 */}
      {groupedCourses.map(([semesterKey, courses]) => {
        const [year, semester] = semesterKey.split("-");
        const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
        
        return (
          <div key={semesterKey} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  {year}년 {semester}학기
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
                    과목 수: {courses.length}개
                  </span>
                  <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
                    총 학점: {totalCredits}학점
                  </span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">강좌번호</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">과목명</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이수구분</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">학점</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">시간/강의실</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">재수강</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">담당교수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courses.map((course, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm text-gray-600">{course.courseNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{course.courseName}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          course.completionType === "전공"
                            ? "bg-blue-100 text-[#1e3a8a]"
                            : course.completionType === "핵심교양"
                            ? "bg-blue-50 text-[#3b82f6]"
                            : "bg-blue-50 text-[#60a5fa]"
                        }`}>
                          {course.completionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-center font-medium">
                        {course.credits}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{course.timeAndRoom}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={course.retake}
                          disabled
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{course.professor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* 이수 구분별 통계 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">이수 구분별 통계</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              type: "전공",
              courses: CURRENT_COURSES.filter(c => c.completionType === "전공"),
              bgColor: "bg-blue-50",
              borderColor: "border-[#1e3a8a]",
              textColor: "text-[#1e3a8a]"
            },
            {
              type: "핵심교양",
              courses: CURRENT_COURSES.filter(c => c.completionType === "핵심교양"),
              bgColor: "bg-blue-50",
              borderColor: "border-[#3b82f6]",
              textColor: "text-[#3b82f6]"
            },
            {
              type: "기초교양",
              courses: CURRENT_COURSES.filter(c => c.completionType === "기초교양"),
              bgColor: "bg-blue-50",
              borderColor: "border-[#60a5fa]",
              textColor: "text-[#60a5fa]"
            }
          ]
          .filter(category => category.courses.length > 0)
          .map((category) => {
            const totalCredits = category.courses.reduce((sum, c) => sum + c.credits, 0);
            
            return (
              <div key={category.type} className={`${category.bgColor} border-2 ${category.borderColor} rounded-xl p-4`}>
                <h4 className={`text-sm font-semibold ${category.textColor} mb-3`}>
                  {category.type}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">과목 수</span>
                    <span className={`text-lg font-bold ${category.textColor}`}>
                      {category.courses.length}개
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 학점</span>
                    <span className={`text-lg font-bold ${category.textColor}`}>
                      {totalCredits}학점
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

