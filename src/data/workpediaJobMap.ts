// 워크피디아(wagework.go.kr) 직업 코드 매핑
// 출처: 워크피디아 Open API (callOpenApiSvcInfo212L01.xml)
// 총 537개 직업

export interface WorkpediaJob {
  jobClcd: string;      // 직업 분류 코드
  jobClcdNM: string;    // 직업 분류명
  jobCd: string;        // konetOccpCd (직업 상세 코드)
  jobNm: string;        // 직업명
}

// 전체 워크피디아 직업 목록
export const WORKPEDIA_JOBS: WorkpediaJob[] = [
  // 011 의회의원·고위공무원 및 기업 고위임원
  { jobClcd: "011", jobClcdNM: "의회의원·고위공무원 및 기업 고위임원", jobCd: "K000000847", jobNm: "기업고위임원" },
  { jobClcd: "011", jobClcdNM: "의회의원·고위공무원 및 기업 고위임원", jobCd: "K000000933", jobNm: "행정부고위공무원" },
  
  // 012 행정·경영·금융·보험 관리자
  { jobClcd: "012", jobClcdNM: "행정·경영·금융·보험 관리자", jobCd: "K000000919", jobNm: "마케팅·광고·홍보관리자" },
  { jobClcd: "012", jobClcdNM: "행정·경영·금융·보험 관리자", jobCd: "K000001059", jobNm: "경영지원관리자" },
  { jobClcd: "012", jobClcdNM: "행정·경영·금융·보험 관리자", jobCd: "K000001081", jobNm: "정부행정관리자" },
  { jobClcd: "012", jobClcdNM: "행정·경영·금융·보험 관리자", jobCd: "K000001210", jobNm: "금융관리자" },
  { jobClcd: "012", jobClcdNM: "행정·경영·금융·보험 관리자", jobCd: "K000007471", jobNm: "보험관리자" },
  
  // 013 전문서비스 관리자
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000833", jobNm: "사회복지관리자" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000838", jobNm: "초등학교 교장 및 교감" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000910", jobNm: "경찰·소방·교도관리자" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000912", jobNm: "중고등학교 교장 및 교감" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000931", jobNm: "보건·의료관리자" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000969", jobNm: "예술·디자인·방송관리자" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000000990", jobNm: "대학교 총장 및 대학학장" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000001032", jobNm: "정보통신관리자" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000001171", jobNm: "유치원 원장 및 원감" },
  { jobClcd: "013", jobClcdNM: "전문서비스 관리자", jobCd: "K000001190", jobNm: "연구관리자" },
  
  // 022 경영·인사 전문가
  { jobClcd: "022", jobClcdNM: "경영·인사 전문가", jobCd: "K000000875", jobNm: "인적자원전문가" },
  { jobClcd: "022", jobClcdNM: "경영·인사 전문가", jobCd: "K000000944", jobNm: "경영·진단전문가" },
  { jobClcd: "022", jobClcdNM: "경영·인사 전문가", jobCd: "K000007562", jobNm: "노무사" },
  
  // 023 회계·세무·감정 전문가
  { jobClcd: "023", jobClcdNM: "회계·세무·감정 전문가", jobCd: "K000007449", jobNm: "회계사" },
  { jobClcd: "023", jobClcdNM: "회계·세무·감정 전문가", jobCd: "K000007500", jobNm: "관세사" },
  { jobClcd: "023", jobClcdNM: "회계·세무·감정 전문가", jobCd: "K000007514", jobNm: "감정평가사" },
  { jobClcd: "023", jobClcdNM: "회계·세무·감정 전문가", jobCd: "K000007525", jobNm: "세무사" },
  
  // 024 광고·조사·상품기획·행사기획 전문가
  { jobClcd: "024", jobClcdNM: "광고·조사·상품기획·행사기획 전문가", jobCd: "K000000872", jobNm: "광고·홍보·마케팅전문가" },
  { jobClcd: "024", jobClcdNM: "광고·조사·상품기획·행사기획 전문가", jobCd: "K000000955", jobNm: "행사기획자" },
  { jobClcd: "024", jobClcdNM: "광고·조사·상품기획·행사기획 전문가", jobCd: "K000000997", jobNm: "상품기획자" },
  { jobClcd: "024", jobClcdNM: "광고·조사·상품기획·행사기획 전문가", jobCd: "K000001139", jobNm: "조사전문가" },
  
  // 026 경영지원 사무원
  { jobClcd: "026", jobClcdNM: "경영지원 사무원", jobCd: "K000001069", jobNm: "광고·홍보·마케팅사무원" },
  { jobClcd: "026", jobClcdNM: "경영지원 사무원", jobCd: "K000001079", jobNm: "경영기획사무원" },
  { jobClcd: "026", jobClcdNM: "경영지원 사무원", jobCd: "K000001196", jobNm: "인사·교육·훈련사무원" },
  { jobClcd: "026", jobClcdNM: "경영지원 사무원", jobCd: "K000001200", jobNm: "영업기획·관리·지원사무원" },
  { jobClcd: "026", jobClcdNM: "경영지원 사무원", jobCd: "K000007517", jobNm: "총무사무원" },
  { jobClcd: "026", jobClcdNM: "경영지원 사무원", jobCd: "K000007553", jobNm: "감사사무원" },
  
  // 027 회계·경리 사무원
  { jobClcd: "027", jobClcdNM: "회계·경리 사무원", jobCd: "K000007466", jobNm: "경리사무원" },
  { jobClcd: "027", jobClcdNM: "회계·경리 사무원", jobCd: "K000007487", jobNm: "회계사무원" },
  
  // 028 무역·운송·생산·품질 사무원
  { jobClcd: "028", jobClcdNM: "무역·운송·생산·품질 사무원", jobCd: "K000000843", jobNm: "자재·구매사무원" },
  { jobClcd: "028", jobClcdNM: "무역·운송·생산·품질 사무원", jobCd: "K000000855", jobNm: "물류사무원" },
  { jobClcd: "028", jobClcdNM: "무역·운송·생산·품질 사무원", jobCd: "K000000918", jobNm: "무역사무원" },
  { jobClcd: "028", jobClcdNM: "무역·운송·생산·품질 사무원", jobCd: "K000001001", jobNm: "생산관리사무원" },
  { jobClcd: "028", jobClcdNM: "무역·운송·생산·품질 사무원", jobCd: "K000001022", jobNm: "품질관리사무원" },
  
  // 031 금융·보험 전문가
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000000987", jobNm: "자산운용가" },
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000001163", jobNm: "금융상품개발자" },
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000001168", jobNm: "증권·외환딜러" },
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000001179", jobNm: "투자분석가" },
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000001215", jobNm: "신용분석가" },
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000007519", jobNm: "보험상품개발자" },
  { jobClcd: "031", jobClcdNM: "금융·보험 전문가", jobCd: "K000007561", jobNm: "손해사정사" },
  
  // 032 금융·보험 사무원
  { jobClcd: "032", jobClcdNM: "금융·보험 사무원", jobCd: "K000000908", jobNm: "보험인수심사원(언더라이터)" },
  { jobClcd: "032", jobClcdNM: "금융·보험 사무원", jobCd: "K000001104", jobNm: "신용추심원" },
  { jobClcd: "032", jobClcdNM: "금융·보험 사무원", jobCd: "K000001114", jobNm: "증권사무원" },
  { jobClcd: "032", jobClcdNM: "금융·보험 사무원", jobCd: "K000001136", jobNm: "은행사무원" },
  { jobClcd: "032", jobClcdNM: "금융·보험 사무원", jobCd: "K000001162", jobNm: "보험보상사무원" },
  
  // 110 인문·사회과학 연구원
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000000834", jobNm: "정치학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000000898", jobNm: "경제학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000000949", jobNm: "철학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000001052", jobNm: "사회학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000007493", jobNm: "역사학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000007512", jobNm: "언어학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000007522", jobNm: "교육학연구원" },
  { jobClcd: "110", jobClcdNM: "인문·사회과학 연구원", jobCd: "K000007559", jobNm: "심리학연구원" },
  
  // 121 자연과학 연구원 및 시험원
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000000825", jobNm: "자연과학시험원" },
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000000903", jobNm: "천문 및 기상학연구원" },
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000000960", jobNm: "화학연구원" },
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000001048", jobNm: "생물학연구원" },
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000001125", jobNm: "수학 및 통계연구원" },
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000007531", jobNm: "지질학연구원" },
  { jobClcd: "121", jobClcdNM: "자연과학 연구원 및 시험원", jobCd: "K000007568", jobNm: "물리학연구원" },
  
  // 122 생명과학 연구원 및 시험원
  { jobClcd: "122", jobClcdNM: "생명과학 연구원 및 시험원", jobCd: "K000000836", jobNm: "농학연구원" },
  { jobClcd: "122", jobClcdNM: "생명과학 연구원 및 시험원", jobCd: "K000000852", jobNm: "생명과학시험원" },
  { jobClcd: "122", jobClcdNM: "생명과학 연구원 및 시험원", jobCd: "K000001012", jobNm: "수산학연구원" },
  { jobClcd: "122", jobClcdNM: "생명과학 연구원 및 시험원", jobCd: "K000001140", jobNm: "의학연구원" },
  { jobClcd: "122", jobClcdNM: "생명과학 연구원 및 시험원", jobCd: "K000007535", jobNm: "약학연구원" },
  
  // 131 컴퓨터하드웨어·통신공학 기술자
  { jobClcd: "131", jobClcdNM: "컴퓨터하드웨어·통신공학 기술자", jobCd: "K000000900", jobNm: "통신망운영기술자" },
  { jobClcd: "131", jobClcdNM: "컴퓨터하드웨어·통신공학 기술자", jobCd: "K000000924", jobNm: "통신기기·장비기술자" },
  { jobClcd: "131", jobClcdNM: "컴퓨터하드웨어·통신공학 기술자", jobCd: "K000000936", jobNm: "통신기술개발자" },
  { jobClcd: "131", jobClcdNM: "컴퓨터하드웨어·통신공학 기술자", jobCd: "K000000994", jobNm: "컴퓨터하드웨어기술자" },
  
  // 132 컴퓨터시스템 전문가
  { jobClcd: "132", jobClcdNM: "컴퓨터시스템 전문가", jobCd: "K000000856", jobNm: "컴퓨터시스템설계 및 분석가" },
  { jobClcd: "132", jobClcdNM: "컴퓨터시스템 전문가", jobCd: "K000001085", jobNm: "정보통신컨설턴트 및 감리원" },
  
  // 133 소프트웨어 개발자
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000000853", jobNm: "시스템소프트웨어개발자" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000001042", jobNm: "모바일앱개발자" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000001106", jobNm: "웹개발자" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000001153", jobNm: "IT테스터 및 IT QA전문가" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000001172", jobNm: "웹기획자" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000001176", jobNm: "응용소프트웨어개발자" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000007452", jobNm: "가상현실전문가" },
  { jobClcd: "133", jobClcdNM: "소프트웨어 개발자", jobCd: "K000007580", jobNm: "게임프로그래머" },
  
  // 134 데이터·네트워크 및 시스템 운영 전문가
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000000968", jobNm: "네트워크시스템개발자" },
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000000978", jobNm: "IT기술지원전문가" },
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000001061", jobNm: "웹운영자" },
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000001080", jobNm: "데이터분석가(빅데이터분석가)" },
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000001132", jobNm: "정보시스템운영자" },
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000001134", jobNm: "데이터베이스운영·관리자" },
  { jobClcd: "134", jobClcdNM: "데이터·네트워크 및 시스템 운영 전문가", jobCd: "K000007499", jobNm: "네트워크관리자" },
  
  // 135 정보보안 전문가
  { jobClcd: "135", jobClcdNM: "정보보안 전문가", jobCd: "K000000832", jobNm: "정보보안전문가" },
  
  // 140 건축·토목공학 기술자 및 시험원
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000878", jobNm: "도시계획·설계가" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000888", jobNm: "지적 및 측량기술자" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000891", jobNm: "교통계획·설계가" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000915", jobNm: "건축감리기술자" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000922", jobNm: "건축설비기술자" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000940", jobNm: "건축시공기술자 및 견적원" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000956", jobNm: "건축구조기술자" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000000985", jobNm: "조경기술자" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000001014", jobNm: "건축가(건축설계사)" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000001021", jobNm: "지리정보시스템전문가" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000001067", jobNm: "토목감리기술자" },
  { jobClcd: "140", jobClcdNM: "건축·토목공학 기술자 및 시험원", jobCd: "K000001073", jobNm: "토목시공기술자 및 견적원" },
  
  // 151 기계·로봇공학 기술자 및 시험원
  { jobClcd: "151", jobClcdNM: "기계·로봇공학 기술자 및 시험원", jobCd: "K000000860", jobNm: "로봇공학기술자" },
  { jobClcd: "151", jobClcdNM: "기계·로봇공학 기술자 및 시험원", jobCd: "K000000877", jobNm: "항공공학기술자" },
  { jobClcd: "151", jobClcdNM: "기계·로봇공학 기술자 및 시험원", jobCd: "K000001101", jobNm: "조선·해양공학기술자" },
  { jobClcd: "151", jobClcdNM: "기계·로봇공학 기술자 및 시험원", jobCd: "K000001185", jobNm: "자동차공학기술자" },
  
  // 153 전기·전자공학 기술자 및 시험원
  { jobClcd: "153", jobClcdNM: "전기·전자공학 기술자 및 시험원", jobCd: "K000000826", jobNm: "전기기기·제품개발기술자 및 연구원" },
  { jobClcd: "153", jobClcdNM: "전기·전자공학 기술자 및 시험원", jobCd: "K000000879", jobNm: "디스플레이연구 및 개발자" },
  { jobClcd: "153", jobClcdNM: "전기·전자공학 기술자 및 시험원", jobCd: "K000000984", jobNm: "전자제품 및 부품 개발기술자" },
  { jobClcd: "153", jobClcdNM: "전기·전자공학 기술자 및 시험원", jobCd: "K000001184", jobNm: "반도체공학기술자 및 연구원" },
  { jobClcd: "153", jobClcdNM: "전기·전자공학 기술자 및 시험원", jobCd: "K000001191", jobNm: "전자계측제어기술자" },
  { jobClcd: "153", jobClcdNM: "전기·전자공학 기술자 및 시험원", jobCd: "K000007491", jobNm: "전기안전기술자" },
  
  // 154 화학공학 기술자 및 시험원
  { jobClcd: "154", jobClcdNM: "화학공학 기술자 및 시험원", jobCd: "K000000865", jobNm: "석유화학공학기술자 및 연구원" },
  { jobClcd: "154", jobClcdNM: "화학공학 기술자 및 시험원", jobCd: "K000000998", jobNm: "의약품공학기술자 및 연구원" },
  { jobClcd: "154", jobClcdNM: "화학공학 기술자 및 시험원", jobCd: "K000001141", jobNm: "비누 및 화장품화학공학기술자 및 연구원" },
  
  // 155 에너지·환경공학 기술자 및 시험원
  { jobClcd: "155", jobClcdNM: "에너지·환경공학 기술자 및 시험원", jobCd: "K000000863", jobNm: "원자력공학기술자" },
  { jobClcd: "155", jobClcdNM: "에너지·환경공학 기술자 및 시험원", jobCd: "K000000887", jobNm: "수질환경기술자 및 연구원" },
  { jobClcd: "155", jobClcdNM: "에너지·환경공학 기술자 및 시험원", jobCd: "K000001084", jobNm: "태양광발전연구 및 개발자" },
  { jobClcd: "155", jobClcdNM: "에너지·환경공학 기술자 및 시험원", jobCd: "K000001159", jobNm: "풍력발전연구 및 개발자" },
  { jobClcd: "155", jobClcdNM: "에너지·환경공학 기술자 및 시험원", jobCd: "K000007582", jobNm: "환경영향평가원" },
  
  // 157 식품공학 기술자 및 시험원
  { jobClcd: "157", jobClcdNM: "식품공학 기술자 및 시험원", jobCd: "K000001063", jobNm: "식품공학기술자 및 연구원" },
  
  // 211 대학 교수 및 강사
  { jobClcd: "211", jobClcdNM: "대학 교수 및 강사", jobCd: "K000000906", jobNm: "대학교수" },
  { jobClcd: "211", jobClcdNM: "대학 교수 및 강사", jobCd: "K000001220", jobNm: "대학시간강사" },
  
  // 212 학교 교사
  { jobClcd: "212", jobClcdNM: "학교 교사", jobCd: "K000001065", jobNm: "중·고등학교교사" },
  { jobClcd: "212", jobClcdNM: "학교 교사", jobCd: "K000001113", jobNm: "특수교육교사" },
  { jobClcd: "212", jobClcdNM: "학교 교사", jobCd: "K000007558", jobNm: "초등학교교사" },
  
  // 213 유치원 교사
  { jobClcd: "213", jobClcdNM: "유치원 교사", jobCd: "K000007530", jobNm: "유치원교사" },
  
  // 214 문리·기술·예능 강사
  { jobClcd: "214", jobClcdNM: "문리·기술·예능 강사", jobCd: "K000000837", jobNm: "외국어강사" },
  { jobClcd: "214", jobClcdNM: "문리·기술·예능 강사", jobCd: "K000000911", jobNm: "예능강사" },
  { jobClcd: "214", jobClcdNM: "문리·기술·예능 강사", jobCd: "K000000947", jobNm: "문리학원강사" },
  { jobClcd: "214", jobClcdNM: "문리·기술·예능 강사", jobCd: "K000000967", jobNm: "기술·기능계강사" },
  { jobClcd: "214", jobClcdNM: "문리·기술·예능 강사", jobCd: "K000007539", jobNm: "컴퓨터강사" },
  
  // 215 장학관 및 기타 교육 종사자
  { jobClcd: "215", jobClcdNM: "장학관 및 기타 교육 종사자", jobCd: "K000001149", jobNm: "교재·교구 및 이러닝교육전문가" },
  
  // 221 법률 전문가
  { jobClcd: "221", jobClcdNM: "법률 전문가", jobCd: "K000001221", jobNm: "법무사 및 집행관" },
  { jobClcd: "221", jobClcdNM: "법률 전문가", jobCd: "K000007470", jobNm: "변리사" },
  { jobClcd: "221", jobClcdNM: "법률 전문가", jobCd: "K000007482", jobNm: "변호사" },
  { jobClcd: "221", jobClcdNM: "법률 전문가", jobCd: "K000007527", jobNm: "판사" },
  { jobClcd: "221", jobClcdNM: "법률 전문가", jobCd: "K000007573", jobNm: "검사" },
  
  // 222 법률 사무원
  { jobClcd: "222", jobClcdNM: "법률 사무원", jobCd: "K000001180", jobNm: "법률사무원" },
  
  // 231 사회복지사 및 상담사
  { jobClcd: "231", jobClcdNM: "사회복지사 및 상담사", jobCd: "K000000857", jobNm: "사회복지사" },
  { jobClcd: "231", jobClcdNM: "사회복지사 및 상담사", jobCd: "K000001049", jobNm: "심리상담전문가" },
  { jobClcd: "231", jobClcdNM: "사회복지사 및 상담사", jobCd: "K000007485", jobNm: "사회단체활동가" },
  { jobClcd: "231", jobClcdNM: "사회복지사 및 상담사", jobCd: "K000007526", jobNm: "청소년지도사" },
  { jobClcd: "231", jobClcdNM: "사회복지사 및 상담사", jobCd: "K000007565", jobNm: "직업상담사" },
  
  // 232 보육교사 및 기타 사회복지 종사자
  { jobClcd: "232", jobClcdNM: "보육교사 및 기타 사회복지 종사자", jobCd: "K000007502", jobNm: "보육교사" },
  { jobClcd: "232", jobClcdNM: "보육교사 및 기타 사회복지 종사자", jobCd: "K000007541", jobNm: "생활지도원" },
  
  // 240 경찰관, 소방관 및 교도관
  { jobClcd: "240", jobClcdNM: "경찰관, 소방관 및 교도관", jobCd: "K000007495", jobNm: "소방관" },
  { jobClcd: "240", jobClcdNM: "경찰관, 소방관 및 교도관", jobCd: "K000007521", jobNm: "경찰관" },
  { jobClcd: "240", jobClcdNM: "경찰관, 소방관 및 교도관", jobCd: "K000007570", jobNm: "교도관" },
  
  // 250 군인
  { jobClcd: "250", jobClcdNM: "군인", jobCd: "K000001175", jobNm: "위관급 장교" },
  { jobClcd: "250", jobClcdNM: "군인", jobCd: "K000007508", jobNm: "부사관" },
  
  // 306 의료기사·치료사·재활사
  { jobClcd: "306", jobClcdNM: "의료기사·치료사·재활사", jobCd: "K000001088", jobNm: "언어치료사" },
  { jobClcd: "306", jobClcdNM: "의료기사·치료사·재활사", jobCd: "K000001216", jobNm: "예술치료사" },
  { jobClcd: "306", jobClcdNM: "의료기사·치료사·재활사", jobCd: "K000007501", jobNm: "물리치료사" },
  { jobClcd: "306", jobClcdNM: "의료기사·치료사·재활사", jobCd: "K000007529", jobNm: "임상심리사" },
  { jobClcd: "306", jobClcdNM: "의료기사·치료사·재활사", jobCd: "K000007537", jobNm: "작업치료사" },
  { jobClcd: "306", jobClcdNM: "의료기사·치료사·재활사", jobCd: "K000007564", jobNm: "놀이치료사" },
  
  // 411 작가·통번역가
  { jobClcd: "411", jobClcdNM: "작가·통번역가", jobCd: "K000000824", jobNm: "번역가" },
  { jobClcd: "411", jobClcdNM: "작가·통번역가", jobCd: "K000001029", jobNm: "영화시나리오작가" },
  { jobClcd: "411", jobClcdNM: "작가·통번역가", jobCd: "K000001051", jobNm: "통역가" },
  { jobClcd: "411", jobClcdNM: "작가·통번역가", jobCd: "K000001169", jobNm: "방송작가" },
  { jobClcd: "411", jobClcdNM: "작가·통번역가", jobCd: "K000001198", jobNm: "출판물기획자" },
  { jobClcd: "411", jobClcdNM: "작가·통번역가", jobCd: "K000007572", jobNm: "소설가" },
  
  // 412 기자 및 언론 전문가
  { jobClcd: "412", jobClcdNM: "기자 및 언론 전문가", jobCd: "K000000937", jobNm: "신문기자" },
  { jobClcd: "412", jobClcdNM: "기자 및 언론 전문가", jobCd: "K000000966", jobNm: "잡지기자" },
  { jobClcd: "412", jobClcdNM: "기자 및 언론 전문가", jobCd: "K000001222", jobNm: "방송기자" },
  
  // 413 학예사·사서·기록물관리사
  { jobClcd: "413", jobClcdNM: "학예사·사서·기록물관리사", jobCd: "K000001019", jobNm: "학예사" },
  { jobClcd: "413", jobClcdNM: "학예사·사서·기록물관리사", jobCd: "K000001100", jobNm: "기록물관리사" },
  { jobClcd: "413", jobClcdNM: "학예사·사서·기록물관리사", jobCd: "K000001119", jobNm: "문화재보존원" },
  { jobClcd: "413", jobClcdNM: "학예사·사서·기록물관리사", jobCd: "K000007532", jobNm: "사서" },
  
  // 414 창작·공연 전문가(작가, 연극 제외)
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000000851", jobNm: "지휘자" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000001007", jobNm: "사진작가 및 사진사" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000001089", jobNm: "가수" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000001110", jobNm: "국악인" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000001116", jobNm: "만화영화작가(애니메이터)" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000001181", jobNm: "연주가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007479", jobNm: "안무가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007505", jobNm: "성악가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007511", jobNm: "대중무용수" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007518", jobNm: "만화가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007546", jobNm: "무용가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007551", jobNm: "화가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007571", jobNm: "조각가" },
  { jobClcd: "414", jobClcdNM: "창작·공연 전문가", jobCd: "K000007583", jobNm: "작곡가" },
  
  // 415 디자이너
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000000890", jobNm: "UX·UI디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000001000", jobNm: "제품디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000001008", jobNm: "패션소품디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000001060", jobNm: "시각디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000007454", jobNm: "의상디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000007459", jobNm: "영상그래픽디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000007463", jobNm: "웹디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000007498", jobNm: "실내장식디자이너" },
  { jobClcd: "415", jobClcdNM: "디자이너", jobCd: "K000007567", jobNm: "게임그래픽디자이너" },
  
  // 416 연극·영화·방송 전문가
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000000873", jobNm: "음향·녹음기사" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000000899", jobNm: "영화배우 및 탤런트" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000000901", jobNm: "연극 및 뮤지컬배우" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000000951", jobNm: "모델" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000001099", jobNm: "영상·녹화 및 편집기사" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000001126", jobNm: "개그맨 및 코미디언" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000001138", jobNm: "방송연출가" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000001160", jobNm: "연극영화방송기술감독" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000001161", jobNm: "아나운서" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000001207", jobNm: "리포터" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000007458", jobNm: "영화감독" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000007460", jobNm: "광고영상감독" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000007473", jobNm: "조명기사" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000007476", jobNm: "성우" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000007503", jobNm: "연극연출가" },
  { jobClcd: "416", jobClcdNM: "연극·영화·방송 전문가", jobCd: "K000007543", jobNm: "촬영기사" },
  
  // 417 문화·예술 기획자 및 매니저
  { jobClcd: "417", jobClcdNM: "문화·예술 기획자 및 매니저", jobCd: "K000000881", jobNm: "공연·영화 및 음반기획자" },
  { jobClcd: "417", jobClcdNM: "문화·예술 기획자 및 매니저", jobCd: "K000001025", jobNm: "미디어콘텐츠창작자(크리에이터)" },
  { jobClcd: "417", jobClcdNM: "문화·예술 기획자 및 매니저", jobCd: "K000007574", jobNm: "연예인매니저" },
  
  // 420 스포츠·레크리에이션 종사자
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000000845", jobNm: "스포츠트레이너" },
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000000859", jobNm: "경기심판 및 경기기록원" },
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000000867", jobNm: "직업운동선수" },
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000000957", jobNm: "스포츠강사" },
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000000981", jobNm: "레크리에이션전문가" },
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000001027", jobNm: "스포츠감독 및 코치" },
  { jobClcd: "420", jobClcdNM: "스포츠·레크리에이션 종사자", jobCd: "K000007507", jobNm: "프로게이머" },
  
  // 521 여행 서비스원
  { jobClcd: "521", jobClcdNM: "여행 서비스원", jobCd: "K000001058", jobNm: "자연 및 문화해설사" },
  { jobClcd: "521", jobClcdNM: "여행 서비스원", jobCd: "K000001093", jobNm: "여행상품개발자" },
  { jobClcd: "521", jobClcdNM: "여행 서비스원", jobCd: "K000001187", jobNm: "여행사무원" },
  { jobClcd: "521", jobClcdNM: "여행 서비스원", jobCd: "K000001203", jobNm: "여행안내원" },
  
  // 522 항공기·선박·열차 객실승무원
  { jobClcd: "522", jobClcdNM: "항공기·선박·열차 객실승무원", jobCd: "K000007506", jobNm: "항공기객실승무원" },
  
  // 611 부동산 컨설턴트 및 중개인
  { jobClcd: "611", jobClcdNM: "부동산 컨설턴트 및 중개인", jobCd: "K000007536", jobNm: "부동산중개인" },
  
  // 612 영업원 및 상품중개인
  { jobClcd: "612", jobClcdNM: "영업원 및 상품중개인", jobCd: "K000000930", jobNm: "제품광고영업원" },
  { jobClcd: "612", jobClcdNM: "영업원 및 상품중개인", jobCd: "K000001004", jobNm: "기술영업원" },
  { jobClcd: "612", jobClcdNM: "영업원 및 상품중개인", jobCd: "K000007560", jobNm: "해외영업원" },
];

// 직업명 → 워크피디아 코드 매핑 (빠른 검색용)
export const JOB_NAME_TO_CODE: Record<string, string> = {};
WORKPEDIA_JOBS.forEach(job => {
  JOB_NAME_TO_CODE[job.jobNm] = job.jobCd;
});

// 우리 시스템의 직무명과 워크피디아 직업명 매핑
// (우리 시스템의 직무명이 워크피디아와 다를 경우 매핑)
export const SYSTEM_TO_WORKPEDIA_MAP: Record<string, string> = {
  // 정보통신/IT
  "소프트웨어개발자": "응용소프트웨어개발자",
  "앱개발자": "모바일앱개발자",
  "데이터분석가": "데이터분석가(빅데이터분석가)",
  "빅데이터분석가": "데이터분석가(빅데이터분석가)",
  "데이터사이언티스트": "데이터분석가(빅데이터분석가)",
  "시스템엔지니어": "정보시스템운영자",
  "네트워크엔지니어": "네트워크관리자",
  "보안전문가": "정보보안전문가",
  "사이버보안전문가": "정보보안전문가",
  "IT컨설턴트": "정보통신컨설턴트 및 감리원",
  "시스템분석가": "컴퓨터시스템설계 및 분석가",
  "DBA": "데이터베이스운영·관리자",
  "QA엔지니어": "IT테스터 및 IT QA전문가",
  "VR/AR전문가": "가상현실전문가",
  
  // 경영/사무
  "마케팅전문가": "광고·홍보·마케팅전문가",
  "마케터": "광고·홍보·마케팅전문가",
  "HR전문가": "인적자원전문가",
  "인사담당자": "인적자원전문가",
  "경영컨설턴트": "경영·진단전문가",
  "기획자": "경영기획사무원",
  "사업기획자": "경영기획사무원",
  "상품기획전문가": "상품기획자",
  "이벤트기획자": "행사기획자",
  
  // 금융
  "금융분석가": "투자분석가",
  "펀드매니저": "자산운용가",
  "애널리스트": "투자분석가",
  "딜러": "증권·외환딜러",
  
  // 디자인/예술
  "그래픽디자이너": "시각디자이너",
  "UI디자이너": "UX·UI디자이너",
  "UX디자이너": "UX·UI디자이너",
  "인테리어디자이너": "실내장식디자이너",
  "게임디자이너": "게임그래픽디자이너",
  "영상디자이너": "영상그래픽디자이너",
  "애니메이터": "만화영화작가(애니메이터)",
  "영상편집자": "영상·녹화 및 편집기사",
  "PD": "방송연출가",
  "콘텐츠크리에이터": "미디어콘텐츠창작자(크리에이터)",
  "유튜버": "미디어콘텐츠창작자(크리에이터)",
  "인플루언서": "미디어콘텐츠창작자(크리에이터)",
  
  // 교육
  "교사": "중·고등학교교사",
  "중등교사": "중·고등학교교사",
  "고등학교교사": "중·고등학교교사",
  "교수": "대학교수",
  "강사": "문리학원강사",
  
  // 법률/사회
  "법조인": "변호사",
  "상담사": "심리상담전문가",
  "심리상담사": "심리상담전문가",
  "임상심리전문가": "임상심리사",
  
  // 스포츠
  "스포츠코치": "스포츠감독 및 코치",
  "운동선수": "직업운동선수",
  "트레이너": "스포츠트레이너",
  "체육교사": "스포츠강사",
  "e스포츠선수": "프로게이머",
  
  // 건축/환경
  "건축사": "건축가(건축설계사)",
  "건축설계사": "건축가(건축설계사)",
  "GIS전문가": "지리정보시스템전문가",
  "환경컨설턴트": "환경영향평가원",
  
  // 연구
  "연구원": "경제학연구원",
  "사회연구원": "사회학연구원",
  
  // 기타
  "번역사": "번역가",
  "작가": "소설가",
  "시나리오작가": "영화시나리오작가",
  "기자": "신문기자",
  "큐레이터": "학예사",
  "사진가": "사진작가 및 사진사",
  "사진사": "사진작가 및 사진사",
};

// 핵심 키워드 → 워크피디아 직업 코드 매핑 (유사 매칭용)
const KEYWORD_TO_CODE: Record<string, string> = {
  // IT/개발
  "소프트웨어": "K000001176", // 응용소프트웨어개발자
  "개발자": "K000001176",
  "프로그래머": "K000001176",
  "웹개발": "K000001106",
  "앱개발": "K000001042",
  "모바일": "K000001042",
  "시스템": "K000000853", // 시스템소프트웨어개발자
  "네트워크": "K000007499",
  "보안": "K000000832",
  "데이터": "K000001080",
  "빅데이터": "K000001080",
  "분석가": "K000001080",
  "데이터베이스": "K000001134",
  "DBA": "K000001134",
  "게임": "K000007580",
  "VR": "K000007452",
  "AR": "K000007452",
  "가상현실": "K000007452",
  "IT": "K000000978",
  "QA": "K000001153",
  "테스트": "K000001153",
  
  // 경영/사무
  "회계": "K000007449",
  "감사": "K000007449",
  "세무": "K000007525",
  "경영": "K000000944",
  "컨설턴트": "K000000944",
  "마케팅": "K000000872",
  "광고": "K000000872",
  "홍보": "K000000872",
  "인사": "K000000875",
  "HR": "K000000875",
  "기획": "K000001079",
  "사무": "K000001079",
  "총무": "K000007517",
  "비서": "K000007478",
  
  // 금융
  "금융": "K000001210",
  "투자": "K000001179",
  "증권": "K000001168",
  "은행": "K000001136",
  "보험": "K000007471",
  "펀드": "K000000987",
  "자산운용": "K000000987",
  
  // 법률
  "변호사": "K000007482",
  "법률": "K000007482",
  "판사": "K000007527",
  "검사": "K000007573",
  "법무": "K000001221",
  
  // 교육
  "교수": "K000000906",
  "교사": "K000001065",
  "강사": "K000000947",
  "교육": "K000007522",
  
  // 디자인/예술
  "디자이너": "K000001060",
  "디자인": "K000001060",
  "UX": "K000000890",
  "UI": "K000000890",
  "그래픽": "K000001060",
  "영상": "K000007459",
  "애니메이션": "K000001116",
  "만화": "K000007518",
  "화가": "K000007551",
  "조각": "K000007571",
  "패션": "K000007454",
  "인테리어": "K000007498",
  "실내": "K000007498",
  
  // 방송/미디어
  "PD": "K000001138",
  "연출": "K000001138",
  "작가": "K000001169",
  "기자": "K000000937",
  "아나운서": "K000001161",
  "성우": "K000007476",
  "배우": "K000000899",
  "가수": "K000001089",
  "음악": "K000007583",
  "작곡": "K000007583",
  "촬영": "K000007543",
  "편집": "K000001099",
  "크리에이터": "K000001025",
  "유튜버": "K000001025",
  "인플루언서": "K000001025",
  
  // 스포츠
  "스포츠": "K000000957",
  "체육": "K000000957",
  "트레이너": "K000000845",
  "코치": "K000001027",
  "선수": "K000000867",
  "운동": "K000000867",
  "프로게이머": "K000007507",
  "e스포츠": "K000007507",
  
  // 건축/토목
  "건축": "K000001014",
  "설계": "K000001014",
  "토목": "K000001073",
  "조경": "K000000985",
  "측량": "K000000888",
  "도시계획": "K000000878",
  
  // 공학/기술
  "기계": "K000001185",
  "자동차": "K000001185",
  "전기": "K000000826",
  "전자": "K000000984",
  "반도체": "K000001184",
  "로봇": "K000000860",
  "항공": "K000000877",
  "조선": "K000001101",
  "화학": "K000000865",
  "환경": "K000000887",
  "에너지": "K000001084",
  "식품": "K000001063",
  
  // 연구
  "연구원": "K000000898",
  "연구": "K000000898",
  "과학": "K000001048",
  "생물": "K000001048",
  "의학": "K000001140",
  "약학": "K000007535",
  
  // 사회/복지
  "사회복지": "K000000857",
  "복지": "K000000857",
  "상담": "K000001049",
  "심리": "K000001049",
  "청소년": "K000007526",
  "보육": "K000007502",
  
  // 공무원/공공
  "공무원": "K000000995",
  "행정": "K000000995",
  "경찰": "K000007521",
  "소방": "K000007495",
  "군인": "K000001175",
  
  // 의료
  "의사": "K000007504",
  "간호사": "K000007494",
  "치료사": "K000007501",
  "약사": "K000000993",
  
  // 기타
  "번역": "K000000824",
  "통역": "K000001051",
  "사서": "K000007532",
  "학예사": "K000001019",
  "큐레이터": "K000001019",
  "여행": "K000001093",
  "호텔": "K000000991",
  "항공승무원": "K000007506",
  "승무원": "K000007506",
  "부동산": "K000007536",
  "영업": "K000001004",
};

/**
 * 직무명으로 워크피디아 직업 코드(konetOccpCd)를 찾습니다.
 * @param jobName 우리 시스템의 직무명
 * @returns konetOccpCd 또는 null
 */
export function getWorkpediaJobCode(jobName: string): string | null {
  // 1. 직접 매핑 확인 (정확히 일치)
  const directCode = JOB_NAME_TO_CODE[jobName];
  if (directCode) return directCode;
  
  // 2. 시스템 매핑 확인 (미리 정의된 변환)
  const mappedName = SYSTEM_TO_WORKPEDIA_MAP[jobName];
  if (mappedName && JOB_NAME_TO_CODE[mappedName]) {
    return JOB_NAME_TO_CODE[mappedName];
  }
  
  // 3. 부분 문자열 매칭 (워크피디아 이름에 포함 또는 포함됨)
  const normalizedJobName = jobName.replace(/\s+/g, '').toLowerCase();
  for (const job of WORKPEDIA_JOBS) {
    const normalizedWorkpediaName = job.jobNm.replace(/\s+/g, '').toLowerCase();
    if (normalizedWorkpediaName.includes(normalizedJobName) || 
        normalizedJobName.includes(normalizedWorkpediaName)) {
      return job.jobCd;
    }
  }
  
  // 4. 키워드 기반 매칭 (핵심 단어 추출)
  for (const [keyword, code] of Object.entries(KEYWORD_TO_CODE)) {
    if (jobName.includes(keyword) || normalizedJobName.includes(keyword.toLowerCase())) {
      return code;
    }
  }
  
  // 5. 찾지 못함
  return null;
}

/**
 * 직무명으로 워크피디아 직업 상세 페이지 URL을 생성합니다.
 * @param jobName 직무명
 * @returns 워크피디아 직업 상세 페이지 URL 또는 통합검색 URL
 */
export function getWorkpediaJobUrl(jobName: string): string {
  const jobCode = getWorkpediaJobCode(jobName);
  
  if (jobCode) {
    // 직접 상세 페이지 링크
    return `https://www.wagework.go.kr/pt/b/a/retrieveOccpNvgtDtal.do?konetOccpCd=${jobCode}&topPageId=PT01000000&pageId=PT06010100`;
  } else {
    // 통합검색으로 폴백 (직업정보 + 직업사전 결과 모두 표시됨)
    const searchKeyword = extractSearchKeyword(jobName);
    return `https://www.wagework.go.kr/pt/a/b/retrieveUntySrch.do?pageId=PT01000000&topPageId=PT01000000&searchWord=${encodeURIComponent(searchKeyword)}`;
  }
}

/**
 * 직무명에서 검색용 핵심 키워드를 추출합니다.
 * @param jobName 직무명
 * @returns 검색 키워드
 */
function extractSearchKeyword(jobName: string): string {
  // 불필요한 수식어 제거
  const stopWords = ['및', '의', '관련', '기타', '전문', '종사자', '원', '사', '가', '자'];
  let keyword = jobName;
  
  // 괄호 내용 제거
  keyword = keyword.replace(/\(.*?\)/g, '').trim();
  
  // 불필요한 단어 제거
  for (const sw of stopWords) {
    keyword = keyword.replace(new RegExp(sw + '$'), '').trim();
    keyword = keyword.replace(new RegExp('^' + sw + ' '), '').trim();
  }
  
  // 공백 정리
  keyword = keyword.replace(/\s+/g, ' ').trim();
  
  // 너무 길면 앞부분만 (더 정확한 검색을 위해)
  if (keyword.length > 15) {
    const parts = keyword.split(' ');
    keyword = parts.slice(0, 2).join(' ');
  }
  
  return keyword || jobName;
}

/**
 * 워크피디아 직업 정보를 가져옵니다.
 * @param jobName 직무명
 * @returns WorkpediaJob 또는 null
 */
export function getWorkpediaJobInfo(jobName: string): WorkpediaJob | null {
  const jobCode = getWorkpediaJobCode(jobName);
  if (!jobCode) return null;
  
  return WORKPEDIA_JOBS.find(job => job.jobCd === jobCode) || null;
}
