import React from "react";
import { CURRENT_STUDENT } from "../data/dummyData";

export default function PersonalInfo() {
  const infoSections = [
    {
      title: "기본 정보",
      items: [
        { label: "신상번호", value: CURRENT_STUDENT.studentId },
        { label: "성명", value: CURRENT_STUDENT.name },
        { label: "영문성명", value: CURRENT_STUDENT.nameEng },
        { label: "주민등록번호", value: `${CURRENT_STUDENT.registrationNumber} (생년월일: ${CURRENT_STUDENT.birthDate})` }
      ]
    },
    {
      title: "학적 정보",
      items: [
        { label: "학과", value: CURRENT_STUDENT.department },
        { label: "학년", value: `${CURRENT_STUDENT.grade}학년` },
        { label: "학적상태", value: "재학" },
        { label: "입학년도", value: CURRENT_STUDENT.grade === 1 ? "2025년" : "2023년" }
      ]
    },
    {
      title: "연락처 정보",
      items: [
        { label: "휴대전화번호", value: CURRENT_STUDENT.phoneNumber },
        { label: "이메일", value: CURRENT_STUDENT.email },
        { label: "연락불가여부", value: "연락가능" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-3xl">👤</span>
          <h2 className="text-2xl font-bold">개인신상</h2>
        </div>
        <p className="text-blue-100">기본 신상 정보를 확인할 수 있습니다.</p>
      </div>

      {/* 기본신상 정보 카드 */}
      {infoSections.map((section, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-600">
                    {item.label}
                  </label>
                  <div className="text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* 주소 정보 - 별도 섹션 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">주소 정보</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-600">
              주소
            </label>
            <div className="space-y-2">
              <div className="text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                ({CURRENT_STUDENT.address.zipCode}) 기본주소: {CURRENT_STUDENT.address.basic}
              </div>
              <div className="text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                상세주소: {CURRENT_STUDENT.address.detail}
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-600">
              주민등록주소
            </label>
            <div className="space-y-2">
              <div className="text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                ({CURRENT_STUDENT.address.zipCode}) 기본주소: {CURRENT_STUDENT.address.basic}
              </div>
              <div className="text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                상세주소: {CURRENT_STUDENT.address.detail}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 수정 버튼 */}
      <div className="flex justify-end space-x-3">
        <button className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition">
          취소
        </button>
        <button className="px-6 py-2 bg-[#1e3a8a] hover:bg-[#3b82f6] text-white font-medium rounded-lg transition shadow-md">
          정보 수정
        </button>
      </div>
    </div>
  );
}

