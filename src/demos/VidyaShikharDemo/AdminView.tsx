import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  IndianRupee,
  Printer,
  Send,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ACADEMY_COURSES,
  ADMIN_COURSE_DISTRIBUTION,
  ADMIN_MONTHLY_FEES,
  ATTENDANCE_STUDENTS,
  AcademyNotice,
  AdmissionInquiry,
  InquiryStatus,
  TEACHER_BATCHES,
  formatINR,
} from './sampleData';

interface AdminViewProps {
  isHi: boolean;
  inquiries: AdmissionInquiry[];
  onUpdateInquiryStatus: (id: string, status: InquiryStatus) => void;
  notices: AcademyNotice[];
  onPublishNotice: (notice: Omit<AcademyNotice, 'id' | 'dateHi' | 'dateEn'>) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isHi,
  inquiries,
  onUpdateInquiryStatus,
  notices,
  onPublishNotice,
}) => {
  // Fee receipt generator
  const [receiptStudentId, setReceiptStudentId] = useState(ATTENDANCE_STUDENTS[0].id);
  const [receiptCourseId, setReceiptCourseId] = useState(ACADEMY_COURSES[0].id);
  const [receiptAmount, setReceiptAmount] = useState('26000');
  const [receiptMode, setReceiptMode] = useState('UPI (डेमो)');
  const [receiptNo, setReceiptNo] = useState('VS-DEMO-2026-041');

  const receiptStudent =
    ATTENDANCE_STUDENTS.find((s) => s.id === receiptStudentId) || ATTENDANCE_STUDENTS[0];
  const receiptCourse =
    ACADEMY_COURSES.find((c) => c.id === receiptCourseId) || ACADEMY_COURSES[0];
  const numericReceiptAmt = Math.max(0, Number(receiptAmount) || 0);

  // Batch status toggle in state
  const [batchActiveState, setBatchActiveState] = useState<Record<string, boolean>>({
    'b-jee-1': true,
    'b-neet-1': true,
    'b-fnd-1': true,
  });

  // Notice board publisher
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeAudience, setNoticeAudience] = useState('सभी छात्र');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeFeedback, setNoticeFeedback] = useState('');

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    onPublishNotice({
      titleHi: noticeTitle.trim(),
      titleEn: noticeTitle.trim(),
      bodyHi: noticeBody.trim(),
      bodyEn: noticeBody.trim(),
      audienceHi: noticeAudience,
      audienceEn: noticeAudience,
    });
    setNoticeTitle('');
    setNoticeBody('');
    setNoticeFeedback(
      isHi
        ? 'सूचना नोटिस बोर्ड पर जोड़ दी गई (केवल डेमो स्टेट — छात्र पोर्टल में भी दिखेगी)।'
        : 'Notice published to board (Demo state only — also visible in Student Portal).'
    );
  };

  const admittedCount = inquiries.filter((i) => i.status === 'admitted').length;
  const maxMonthFee = Math.max(...ADMIN_MONTHLY_FEES.map((m) => m.amountLakhs));
  const maxCourseCount = Math.max(...ADMIN_COURSE_DISTRIBUTION.map((c) => c.count));

  const getCourseName = (courseId: string) => {
    const found = ACADEMY_COURSES.find((c) => c.id === courseId);
    if (!found) return courseId;
    return isHi ? found.nameHi : found.nameEn;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="bg-[#0b1936] text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-300">
              {isHi ? 'एडमिन डैशबोर्ड · नमूना डेटा' : 'Admin Dashboard · Sample Data'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {isHi ? 'संस्थान प्रबंधन एवं फ़ीस नियंत्रण केंद्र' : 'Institute Operations & Fee Console'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {isHi
                ? 'सभी KPI आँकड़े, चार्ट, रसीद और पूछताछ रिकॉर्ड केवल डेमो प्रदर्शन के लिए नमूना डेटा हैं।'
                : 'All KPI metrics, charts, receipts, and inquiry rows are local sample data for demonstration.'}
            </p>
          </div>
          <div className="text-xs bg-white/10 border border-white/15 rounded-xl px-4 py-3 font-mono">
            <div className="text-amber-300 font-bold">
              {isHi ? 'विद्या शिखर एडमिन' : 'Vidya Shikhar Admin'}
            </div>
            <div className="text-slate-200 mt-0.5">
              {isHi ? 'सत्र 2026–27 (नमूना)' : 'Session 2026–27 (Sample)'}
            </div>
          </div>
        </div>

        {/* 4 KPI CARDS (ALL TAGGED नमूना डेटा) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              labelHi: 'कुल छात्र',
              labelEn: 'Total Students',
              value: `${460 + admittedCount}`,
              icon: Users,
            },
            {
              labelHi: 'नए एडमिशन (इस माह)',
              labelEn: 'New Admissions (Month)',
              value: `${24 + admittedCount}`,
              icon: UserPlus,
            },
            {
              labelHi: 'फ़ीस कलेक्शन',
              labelEn: 'Fee Collection',
              value: formatINR(3520000),
              icon: IndianRupee,
            },
            {
              labelHi: 'बाकी फ़ीस',
              labelEn: 'Pending Fees',
              value: formatINR(485000),
              icon: FileSpreadsheet,
            },
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="pws-card-3d rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {isHi ? kpi.labelHi : kpi.labelEn}
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-[#0b1936] text-amber-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#0b1936] font-mono tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-semibold text-amber-700">
                  {isHi ? 'नमूना डेटा' : 'Sample Data'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2 CHARTS: MONTHLY FEE COLLECTION + COURSE-WISE STUDENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Fee Collection Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#0b1936] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'मासिक फ़ीस कलेक्शन (₹ लाख)' : 'Monthly Fee Collection (₹ Lakhs)'}</span>
              </h2>
              <span className="text-xs font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-48 pt-4">
              {ADMIN_MONTHLY_FEES.map((m, idx) => {
                const heightPct = Math.round((m.amountLakhs / maxMonthFee) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-mono tabular-nums font-bold text-[#0b1936]">
                      {m.amountLakhs.toFixed(1)}L
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-[#0b1936] to-amber-500 rounded-t-lg transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {isHi ? m.monthHi : m.monthEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course-wise Students Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#0b1936] flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'कोर्स-वार छात्र वितरण' : 'Course-Wise Student Distribution'}</span>
              </h2>
              <span className="text-xs font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {ADMIN_COURSE_DISTRIBUTION.map((item, idx) => {
                const pct = Math.round((item.count / maxCourseCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                      <span className="text-[#0b1936]">{isHi ? item.courseHi : item.courseEn}</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {item.count} {isHi ? 'छात्र (नमूना)' : 'students (Sample)'}
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0b1936] via-blue-800 to-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ADMISSION INQUIRIES TABLE */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'एडमिशन फ़ॉलो-अप · नमूना डेटा' : 'Admission Pipeline · Sample Data'}
              </p>
              <h2 className="text-lg font-extrabold text-[#0b1936]">
                {isHi ? 'एडमिशन पूछताछ टेबल' : 'Admission Inquiries Table'}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {inquiries.length} {isHi ? 'रिकॉर्ड' : 'records'}
            </span>
          </div>

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">{isHi ? 'नाम' : 'Name'}</th>
                  <th className="py-2.5 pr-3">{isHi ? 'कक्षा' : 'Class'}</th>
                  <th className="py-2.5 pr-3">{isHi ? 'कोर्स' : 'Course'}</th>
                  <th className="py-2.5 pr-3">{isHi ? 'मोबाइल' : 'Mobile'}</th>
                  <th className="py-2.5">{isHi ? 'स्टेटस' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-mono text-xs text-slate-500">{inq.id}</td>
                    <td className="py-3 pr-3 font-bold text-[#0b1936]">{inq.name}</td>
                    <td className="py-3 pr-3 text-slate-600">{inq.studentClass}</td>
                    <td className="py-3 pr-3 text-slate-700 font-medium">
                      {getCourseName(inq.courseId)}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-slate-600">{inq.mobile}</td>
                    <td className="py-3">
                      <select
                        aria-label={`${isHi ? 'स्टेटस बदलें' : 'Update status'} ${inq.name}`}
                        value={inq.status}
                        onChange={(e) =>
                          onUpdateInquiryStatus(inq.id, e.target.value as InquiryStatus)
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                          inq.status === 'admitted'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : inq.status === 'called'
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-blue-50 border-blue-300 text-blue-900'
                        }`}
                      >
                        <option value="new">{isHi ? 'नया' : 'New'}</option>
                        <option value="called">{isHi ? 'कॉल किया' : 'Called'}</option>
                        <option value="admitted">{isHi ? 'एडमिशन' : 'Admitted'}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FEE RECEIPT GENERATOR + PREVIEW */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-xs font-bold text-amber-700">
              {isHi ? 'डेमो रसीद जनरेटर · कोई वास्तविक भुगतान नहीं' : 'Demo Receipt Generator · No Real Payment'}
            </p>
            <h2 className="text-lg font-extrabold text-[#0b1936]">
              {isHi ? 'फ़ीस रसीद बनाएँ' : 'Generate Fee Receipt'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Controls */}
            <div className="lg:col-span-5 space-y-3.5">
              <div>
                <label htmlFor="vs-rec-student" className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'छात्र चुनें' : 'Select Student'}
                </label>
                <select
                  id="vs-rec-student"
                  value={receiptStudentId}
                  onChange={(e) => setReceiptStudentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                >
                  {ATTENDANCE_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.rollNo} — {isHi ? s.nameHi : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vs-rec-course" className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'कोर्स' : 'Course'}
                </label>
                <select
                  id="vs-rec-course"
                  value={receiptCourseId}
                  onChange={(e) => setReceiptCourseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                >
                  {ACADEMY_COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isHi ? c.nameHi : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vs-rec-amt" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'रकम (₹)' : 'Amount (₹)'}
                  </label>
                  <input
                    id="vs-rec-amt"
                    type="number"
                    min={500}
                    max={500000}
                    value={receiptAmount}
                    onChange={(e) => setReceiptAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="vs-rec-mode" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'माध्यम' : 'Mode'}
                  </label>
                  <select
                    id="vs-rec-mode"
                    value={receiptMode}
                    onChange={(e) => setReceiptMode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="UPI (डेमो)">UPI ({isHi ? 'डेमो' : 'Demo'})</option>
                    <option value="नकद (डेमो)">{isHi ? 'नकद (डेमो)' : 'Cash (Demo)'}</option>
                    <option value="बैंक ट्रांसफ़र (डेमो)">
                      {isHi ? 'बैंक ट्रांसफ़र (डेमो)' : 'Bank Transfer (Demo)'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setReceiptNo(
                      `VS-DEMO-2026-${String(Math.floor(100 + Math.random() * 899))}`
                    )
                  }
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {isHi ? 'नया रसीद नंबर' : 'New Receipt No.'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="pws-btn-3d inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isHi ? 'रसीद प्रिंट करें' : 'Print Receipt'}</span>
                </button>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="lg:col-span-7 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/30 p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-base font-extrabold text-[#0b1936]">
                    {isHi ? 'विद्या शिखर अकादमी' : 'Vidya Shikhar Academy'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isHi ? 'सही मार्गदर्शन, मज़बूत तैयारी' : 'Right Guidance, Strong Preparation'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded bg-amber-200 border border-amber-400 text-amber-950 text-xs font-extrabold tracking-wide">
                    {isHi ? 'डेमो रसीद' : 'DEMO RECEIPT'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1">{receiptNo}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-slate-500 text-xs">{isHi ? 'छात्र का नाम' : 'Student Name'}</div>
                  <div className="font-bold text-[#0b1936]">
                    {isHi ? receiptStudent.nameHi : receiptStudent.nameEn}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">{isHi ? 'रोल नंबर' : 'Roll Number'}</div>
                  <div className="font-mono font-bold text-[#0b1936]">{receiptStudent.rollNo}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">{isHi ? 'कोर्स' : 'Course'}</div>
                  <div className="font-bold text-[#0b1936]">
                    {isHi ? receiptCourse.nameHi : receiptCourse.nameEn}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">{isHi ? 'भुगतान माध्यम' : 'Payment Mode'}</div>
                  <div className="font-bold text-[#0b1936]">{receiptMode}</div>
                </div>
              </div>

              <div className="rounded-xl bg-[#0b1936] text-white px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300">
                  {isHi ? 'प्राप्त नमूना राशि' : 'Sample Amount Received'}
                </span>
                <span className="text-xl font-extrabold font-mono tabular-nums">
                  {formatINR(numericReceiptAmt)}
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                {isHi
                  ? 'नोट: यह केवल "डेमो रसीद" प्रीव्यू है। कोई वास्तविक लेन-देन या कर चालान जारी नहीं किया गया है।'
                  : 'Note: This is a "DEMO RECEIPT" preview only. No real payment or tax invoice was processed.'}
              </p>
            </div>
          </div>
        </section>

        {/* BATCH & TEACHER MANAGEMENT + NOTICE BOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Batch & Teacher Management */}
          <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'बैच व टीचर प्रबंधन' : 'Batch & Faculty Management'}</span>
              </h2>
              <span className="text-xs font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <div className="space-y-3">
              {TEACHER_BATCHES.map((batch) => {
                const active = batchActiveState[batch.id] ?? true;
                return (
                  <div
                    key={batch.id}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-sm font-extrabold text-[#0b1936]">
                        {isHi ? batch.nameHi : batch.nameEn}
                      </div>
                      <div className="text-xs text-slate-600">
                        {isHi ? batch.facultyHi : batch.facultyEn} ·{' '}
                        {isHi ? batch.timingHi : batch.timingEn}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setBatchActiveState((prev) => ({ ...prev, [batch.id]: !active }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-800'
                      }`}
                    >
                      {active
                        ? isHi
                          ? 'सक्रिय'
                          : 'Active'
                        : isHi
                        ? 'प्रतीक्षा सूची'
                        : 'Waitlist'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Notice Board Publisher */}
          <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'सूचना प्रसारण · केवल स्टेट' : 'Broadcast Notice · State Only'}
              </p>
              <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2 mt-0.5">
                <Bell className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'नोटिस बोर्ड पर सूचना भेजें' : 'Publish to Notice Board'}</span>
              </h2>
            </div>

            <form onSubmit={handleNoticeSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder={isHi ? 'सूचना का शीर्षक' : 'Notice title'}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <select
                  value={noticeAudience}
                  onChange={(e) => setNoticeAudience(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="सभी छात्र">{isHi ? 'सभी छात्र' : 'All Students'}</option>
                  <option value="अभिभावक व छात्र">{isHi ? 'अभिभावक व छात्र' : 'Parents & Students'}</option>
                  <option value="फ़ैकल्टी">{isHi ? 'फ़ैकल्टी' : 'Faculty'}</option>
                </select>
              </div>
              <textarea
                rows={2}
                required
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                placeholder={isHi ? 'सूचना का विवरण लिखें...' : 'Write announcement details...'}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
              <button
                type="submit"
                className="pws-btn-amber inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isHi ? 'नोटिस भेजें' : 'Publish Notice'}</span>
              </button>
              {noticeFeedback && (
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{noticeFeedback}</span>
                </p>
              )}
            </form>

            <div className="space-y-2 pt-3 border-t border-slate-200 max-h-44 overflow-y-auto pr-1">
              {notices.map((nt) => (
                <div
                  key={nt.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-0.5"
                >
                  <div className="font-bold text-[#0b1936]">
                    {isHi ? nt.titleHi : nt.titleEn}
                  </div>
                  <p className="text-slate-600">{isHi ? nt.bodyHi : nt.bodyEn}</p>
                  <div className="text-[11px] text-slate-400">
                    {isHi ? nt.audienceHi : nt.audienceEn} · {isHi ? nt.dateHi : nt.dateEn}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
