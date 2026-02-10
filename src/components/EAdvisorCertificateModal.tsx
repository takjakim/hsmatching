import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface EAdvisorCertificateModalProps {
  studentName: string;
  studentId: string;
  department: string;
  completedSteps: {
    riasec: boolean;
    competency: boolean;
    majorAssessment: boolean;
    roleModel: boolean;
    curriculum: boolean;
  };
  onClose: () => void;
}

export default function EAdvisorCertificateModal({
  studentName,
  studentId,
  department,
  completedSteps,
  onClose
}: EAdvisorCertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const allCompleted = Object.values(completedSteps).every(Boolean);
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  // PDF 다운로드
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        (210 - imgHeight) / 2,
        imgWidth,
        imgHeight
      );

      pdf.save(`e-advisor_이수증_${studentName}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 다운로드에 실패했습니다.');
    }
  };

  // 이미지 다운로드
  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `e-advisor_이수증_${studentName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  // 발급 번호 생성
  const generateCertNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `EA-${new Date().getFullYear()}-${timestamp}`;
  };

  const stepLabels = [
    { key: 'riasec', label: 'MJU 전공 진로 적합도 검사' },
    { key: 'competency', label: '핵심역량진단' },
    { key: 'majorAssessment', label: '전공능력진단' },
    { key: 'roleModel', label: '롤모델 탐색' },
    { key: 'curriculum', label: '커리큘럼 플래너' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        >
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🏆</span> e-advisor 이수증
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 이수증 미리보기 */}
          <div className="p-6">
            {!allCompleted ? (
              // 미완료 상태
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">아직 모든 단계를 완료하지 않았습니다</h3>
                <p className="text-gray-500 mb-6">5단계를 모두 완료하면 이수증을 발급받을 수 있습니다.</p>

                <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600 mb-3">완료 현황 ({completedCount}/5)</p>
                  <div className="space-y-2">
                    {stepLabels.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className={completedSteps[key as keyof typeof completedSteps] ? 'text-gray-800' : 'text-gray-400'}>
                          {label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          completedSteps[key as keyof typeof completedSteps]
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {completedSteps[key as keyof typeof completedSteps] ? '완료' : '미완료'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // 완료 상태 - 이수증 표시
              <>
                <div
                  ref={certificateRef}
                  className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-8 border-double border-blue-400 rounded-lg p-8 shadow-inner"
                  style={{ aspectRatio: '1.414/1' }}
                >
                  {/* 상단 장식 */}
                  <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent to-blue-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-4xl">🎓</span>
                        <span className="text-4xl">🏆</span>
                        <span className="text-4xl">⭐</span>
                      </div>
                      <div className="w-20 h-0.5 bg-gradient-to-l from-transparent to-blue-500" />
                    </div>
                  </div>

                  {/* 타이틀 */}
                  <div className="text-center mb-6">
                    <p className="text-blue-600 font-medium text-sm mb-1">MJU Career Matching</p>
                    <h1 className="text-4xl font-serif font-bold text-gray-800 mb-2" style={{ fontFamily: 'serif' }}>
                      e-advisor 이수증
                    </h1>
                    <p className="text-gray-500 text-sm">CERTIFICATE OF E-ADVISOR COMPLETION</p>
                  </div>

                  {/* 본문 */}
                  <div className="text-center space-y-4 mb-6">
                    <div>
                      <p className="text-lg text-gray-600">위 사람</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2 border-b-2 border-blue-400 inline-block px-8 pb-1">
                        {studentName}
                      </p>
                    </div>

                    <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
                      위 사람은 명지대학교 e-advisor 진로탐색 프로그램의
                      <br />
                      <span className="font-semibold text-blue-700">5단계 커리어 매칭 과정</span>을
                      <br />
                      성실히 이수하였기에 이 증서를 수여합니다.
                    </p>

                    {/* 완료 단계 표시 */}
                    <div className="flex justify-center gap-3 mt-4">
                      {stepLabels.map(({ label }, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                            {index + 1}
                          </div>
                          <span className="text-[10px] text-gray-500 mt-1 max-w-[60px] text-center leading-tight">
                            {label.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 하단 정보 */}
                  <div className="flex items-end justify-between mt-auto pt-4 border-t border-blue-200">
                    <div className="text-xs text-gray-400">
                      <p>발급번호: {generateCertNumber()}</p>
                      <p>발급일: {new Date().toLocaleDateString('ko-KR')}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 border-2 border-blue-500 rounded-full flex items-center justify-center mb-2 mx-auto bg-blue-50">
                        <div className="text-center">
                          <span className="text-blue-600 font-bold text-sm" style={{ fontFamily: 'serif' }}>
                            MJU
                          </span>
                          <p className="text-[8px] text-blue-500">e-advisor</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">명지대학교</p>
                    </div>

                    <div className="text-xs text-gray-400 text-right">
                      <p>학번: {studentId}</p>
                      <p>학과: {department}</p>
                    </div>
                  </div>
                </div>

                {/* 다운로드 버튼들 */}
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF 다운로드
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    이미지 다운로드
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
