import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CURRENT_STUDENT, ExtracurricularActivity, EXTRACURRICULAR_CATEGORIES } from '../data/dummyData';

interface CertificateModalProps {
  activity: ExtracurricularActivity;
  onClose: () => void;
}

export default function CertificateModal({ activity, onClose }: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const category = EXTRACURRICULAR_CATEGORIES.find(c => c.id === activity.category);

  // PDF 다운로드
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        (210 - imgHeight) / 2, // center vertically
        imgWidth,
        imgHeight
      );

      pdf.save(`${activity.name}_수료증.pdf`);
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
      link.download = `${activity.name}_수료증.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  // 현재 날짜 포맷
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  // 발급 번호 생성 (더미)
  const generateCertNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `CERT-${activity.category.toUpperCase().slice(0, 3)}-${timestamp}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
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
              <span>🎖️</span> 수료증 발급
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

          {/* 수료증 미리보기 */}
          <div className="p-6">
            <div
              ref={certificateRef}
              className="bg-gradient-to-br from-amber-50 via-white to-amber-50 border-8 border-double border-amber-400 rounded-lg p-8 shadow-inner"
              style={{ aspectRatio: '1.414/1' }}
            >
              {/* 상단 장식 */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-500" />
                  <span className="text-5xl">{category?.icon}</span>
                  <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-500" />
                </div>
              </div>

              {/* 타이틀 */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-serif font-bold text-gray-800 mb-2" style={{ fontFamily: 'serif' }}>
                  수 료 증
                </h1>
                <p className="text-gray-500 text-sm">CERTIFICATE OF COMPLETION</p>
              </div>

              {/* 본문 */}
              <div className="text-center space-y-6 mb-8">
                <div>
                  <p className="text-lg text-gray-600">위 사람</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2 border-b-2 border-amber-400 inline-block px-8 pb-1">
                    {CURRENT_STUDENT.name}
                  </p>
                </div>

                <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
                  위 사람은 <span className="font-semibold text-amber-700">{category?.name}</span> 분야의
                  <br />
                  <span className="text-xl font-bold text-gray-800">&ldquo;{activity.name}&rdquo;</span>
                  <br />
                  을(를) 성실히 이수하였기에 이 증서를 수여합니다.
                </p>

                {/* 활동 정보 */}
                <div className="flex justify-center gap-8 text-sm text-gray-500">
                  <div>
                    <span className="text-gray-400">활동 기간</span>
                    <p className="font-medium text-gray-700">{formatDate(activity.date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">이수 시간</span>
                    <p className="font-medium text-gray-700">{activity.hours}시간</p>
                  </div>
                  <div>
                    <span className="text-gray-400">취득 마일리지</span>
                    <p className="font-medium text-amber-600">{activity.mileage}P</p>
                  </div>
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="flex items-end justify-between mt-auto pt-6 border-t border-amber-200">
                <div className="text-xs text-gray-400">
                  <p>발급번호: {generateCertNumber()}</p>
                  <p>발급일: {new Date().toLocaleDateString('ko-KR')}</p>
                </div>

                <div className="text-center">
                  <div className="w-24 h-24 border-2 border-red-400 rounded-full flex items-center justify-center mb-2 mx-auto bg-red-50">
                    <span className="text-red-600 font-bold text-lg" style={{ fontFamily: 'serif' }}>
                      MJU
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{activity.issuer || '명지대학교'}</p>
                </div>

                <div className="text-xs text-gray-400 text-right">
                  <p>학번: {CURRENT_STUDENT.studentId}</p>
                  <p>학과: {CURRENT_STUDENT.department}</p>
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
