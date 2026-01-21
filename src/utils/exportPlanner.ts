// 커리큘럼 플래너 내보내기 유틸리티
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 학기 슬롯 타입
interface SemesterSlot {
  year: number;
  semester: number;
  label: string;
  courses: PlannedCourse[];
}

// 계획된 과목 타입
interface PlannedCourse {
  plannedId: string;
  courseNumber: string;
  courseName: string;
  credits: number;
  completionType: string;
  professor: string;
  isCompleted?: boolean;
}

// 학점 정보 타입
interface GradeInfo {
  totalCredits: number;
  acquiredCredits: number;
  averageGpa: number;
  lastSemesterGpa?: number;
}

// DOCX 내보내기
export async function exportToDocx(
  planName: string,
  studentName: string,
  department: string,
  semesters: SemesterSlot[],
  gradeInfo: GradeInfo,
  careerTrack?: string
): Promise<void> {
  // 학기별 테이블 생성
  const semesterTables = semesters.map((semester) => {
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '과목명', bold: true })] })],
          width: { size: 40, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '이수구분', bold: true })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '학점', bold: true })] })],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '상태', bold: true })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
      ],
    });

    const courseRows = semester.courses.map((course) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(course.courseName)],
          }),
          new TableCell({
            children: [new Paragraph(course.completionType)],
          }),
          new TableCell({
            children: [new Paragraph(String(course.credits))],
          }),
          new TableCell({
            children: [new Paragraph(course.isCompleted ? '이수완료' : '예정')],
          }),
        ],
      });
    });

    // 학점 합계 행
    const totalCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
    const totalRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '합계', bold: true })] })],
          columnSpan: 2,
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `${totalCredits}학점`, bold: true })] })],
          columnSpan: 2,
        }),
      ],
    });

    return {
      semesterLabel: semester.label,
      table: new Table({
        rows: [headerRow, ...courseRows, totalRow],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    };
  });

  // 문서 생성
  const doc = new Document({
    sections: [
      {
        children: [
          // 제목
          new Paragraph({
            text: planName,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${studentName} (${department})`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),

          // 학점 현황
          new Paragraph({
            text: '학점 현황',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `이수 학점: ${gradeInfo.acquiredCredits} / 120`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `전체 평점: ${gradeInfo.averageGpa.toFixed(2)} / 4.5` }),
            ],
          }),
          ...(gradeInfo.lastSemesterGpa
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: `직전학기 평점: ${gradeInfo.lastSemesterGpa.toFixed(2)} / 4.5` }),
                  ],
                }),
              ]
            : []),
          new Paragraph({ text: '' }),

          // 선택 트랙
          ...(careerTrack
            ? [
                new Paragraph({
                  text: `선택 진로 트랙: ${careerTrack}`,
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({ text: '' }),
              ]
            : []),

          // 학기별 교과목
          new Paragraph({
            text: '학기별 교과목 계획',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '' }),

          // 학기별 테이블
          ...semesterTables.flatMap(({ semesterLabel, table }) => [
            new Paragraph({
              text: semesterLabel,
              heading: HeadingLevel.HEADING_2,
            }),
            table,
            new Paragraph({ text: '' }),
          ]),
        ],
      },
    ],
  });

  // 문서 저장
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${planName}_커리큘럼플래너.docx`);
}

// PDF 내보내기 (HTML 요소 캡처 방식)
export async function exportToPdf(
  elementId: string,
  planName: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('PDF 내보내기 실패: 요소를 찾을 수 없습니다.');
    return;
  }

  try {
    // HTML 요소를 캔버스로 변환
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // PDF 생성
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // 첫 페이지
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;

    // 추가 페이지 (긴 내용인 경우)
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }

    // PDF 저장
    pdf.save(`${planName}_커리큘럼플래너.pdf`);
  } catch (error) {
    console.error('PDF 내보내기 오류:', error);
    alert('PDF 내보내기에 실패했습니다.');
  }
}

// 간단한 PDF 내보내기 (데이터 기반)
export async function exportToPdfSimple(
  planName: string,
  studentName: string,
  department: string,
  semesters: SemesterSlot[],
  gradeInfo: GradeInfo,
  careerTrack?: string
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // 폰트 설정 (한글 지원을 위해 기본 폰트 사용)
  pdf.setFont('helvetica');

  let yPos = 20;
  const lineHeight = 7;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;

  // 제목
  pdf.setFontSize(18);
  pdf.text(planName, pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight * 2;

  // 학생 정보
  pdf.setFontSize(12);
  pdf.text(`${studentName} (${department})`, pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight;
  pdf.setFontSize(10);
  pdf.text(`Date: ${new Date().toLocaleDateString('ko-KR')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += lineHeight * 2;

  // 학점 현황
  pdf.setFontSize(14);
  pdf.text('Credits Summary', margin, yPos);
  yPos += lineHeight;
  pdf.setFontSize(10);
  pdf.text(`Credits: ${gradeInfo.acquiredCredits} / 120`, margin, yPos);
  yPos += lineHeight;
  pdf.text(`GPA: ${gradeInfo.averageGpa.toFixed(2)} / 4.5`, margin, yPos);
  yPos += lineHeight;
  if (gradeInfo.lastSemesterGpa) {
    pdf.text(`Last Semester GPA: ${gradeInfo.lastSemesterGpa.toFixed(2)} / 4.5`, margin, yPos);
    yPos += lineHeight;
  }

  // 선택 트랙
  if (careerTrack) {
    yPos += lineHeight;
    pdf.text(`Career Track: ${careerTrack}`, margin, yPos);
    yPos += lineHeight;
  }

  // 학기별 과목
  yPos += lineHeight;
  pdf.setFontSize(14);
  pdf.text('Semester Courses', margin, yPos);
  yPos += lineHeight * 1.5;

  semesters.forEach((semester) => {
    // 페이지 넘김 체크
    if (yPos > 270) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(12);
    pdf.text(semester.label, margin, yPos);
    yPos += lineHeight;

    const totalCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);

    if (semester.courses.length === 0) {
      pdf.setFontSize(10);
      pdf.text('  - No courses planned', margin, yPos);
      yPos += lineHeight;
    } else {
      semester.courses.forEach((course) => {
        if (yPos > 280) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFontSize(10);
        const status = course.isCompleted ? '[Done]' : '[Plan]';
        pdf.text(`  - ${course.courseName} (${course.credits}cr) ${status}`, margin, yPos);
        yPos += lineHeight;
      });
    }

    pdf.setFontSize(10);
    pdf.text(`  Total: ${totalCredits} credits`, margin, yPos);
    yPos += lineHeight * 1.5;
  });

  // PDF 저장
  pdf.save(`${planName}_Curriculum.pdf`);
}

// localStorage 저장
export function savePlanToLocalStorage(
  planName: string,
  semesters: SemesterSlot[]
): void {
  const semesterData: { [key: string]: string[] } = {};
  semesters.forEach(sem => {
    const key = `${sem.year}-${sem.semester}`;
    semesterData[key] = sem.courses.map(c => c.courseNumber);
  });

  const savedPlans = JSON.parse(localStorage.getItem('curriculumPlans') || '[]');
  const existingIndex = savedPlans.findIndex((p: any) => p.name === planName);

  const newPlan = {
    name: planName,
    createdAt: existingIndex >= 0 ? savedPlans[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    semesters: semesterData
  };

  if (existingIndex >= 0) {
    savedPlans[existingIndex] = newPlan;
  } else {
    savedPlans.push(newPlan);
  }

  localStorage.setItem('curriculumPlans', JSON.stringify(savedPlans));
}
