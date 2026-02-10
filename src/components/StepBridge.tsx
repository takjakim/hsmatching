import React from 'react';

interface StepBridgeProps {
  riasecResult: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> | null;
  recommendedMajors: string[];
  recommendedJobs: string[];
  onContinue: () => void;
  onBack: () => void;
}

const RIASEC_NAMES: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', string> = {
  R: '현실형',
  I: '탐구형',
  A: '예술형',
  S: '사회형',
  E: '진취형',
  C: '관습형',
};

const StepBridge: React.FC<StepBridgeProps> = ({
  riasecResult,
  recommendedMajors,
  recommendedJobs,
  onContinue,
  onBack,
}) => {
  // Get top 3 RIASEC types sorted by score
  const getTopTypes = () => {
    if (!riasecResult) return [];

    const entries = Object.entries(riasecResult) as [keyof typeof RIASEC_NAMES, number][];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => ({ code: type, name: RIASEC_NAMES[type] }));
  };

  const topTypes = getTopTypes();
  const typeString = topTypes.map(t => t.code).join('');
  const typeNames = topTypes.map(t => t.name).join('-');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            1, 2단계 검사 완료
          </h1>
          <p className="text-gray-600">
            진로 적성과 흥미 검사가 성공적으로 완료되었습니다
          </p>
        </div>

        {/* Results Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 mb-6">
          {/* RIASEC Type */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
              나의 RIASEC 유형
            </h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">{typeString}</div>
              <div className="text-lg opacity-90">{typeNames}</div>
            </div>
          </div>

          {/* Recommended Majors */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              추천 전공 TOP 5
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedMajors.slice(0, 5).map((major, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur rounded-xl px-4 py-3 border border-blue-100 hover:border-blue-300 transition-all hover:shadow-md"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-800 font-medium">{major}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Jobs */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
              추천 직무
            </h2>
            <div className="flex flex-wrap gap-3">
              {recommendedJobs.slice(0, 6).map((job, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full px-5 py-2 border border-purple-200"
                >
                  <span className="text-purple-800 font-medium">{job}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Step Card */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl border-2 border-indigo-200 p-8 mb-6">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                다음 단계: 전공능력진단검사
              </h2>
              <p className="text-gray-600">
                선택한 전공에 대한 심화 진단을 진행합니다.
              </p>
              <p className="text-gray-600 mt-1">
                자신의 강점과 개발이 필요한 역량을 파악할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-4 bg-white/80 backdrop-blur border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white hover:border-gray-400 transition-all hover:shadow-lg group"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                결과 다시보기
              </span>
            </button>

            <button
              onClick={onContinue}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all hover:shadow-lg hover:scale-[1.02] group"
            >
              <span className="flex items-center justify-center">
                3단계 진행하기
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Info Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>💡 3단계 검사는 약 10-15분 소요됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default StepBridge;
