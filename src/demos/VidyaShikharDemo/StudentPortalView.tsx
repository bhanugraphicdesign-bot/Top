import React, { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  IndianRupee,
  MessageSquarePlus,
  Play,
  RotateCcw,
  Send,
  TrendingUp,
} from 'lucide-react';
import {
  AcademyNotice,
  DoubtItem,
  MOCK_TEST_QUESTIONS,
  SAMPLE_STUDY_NOTES,
  SAMPLE_VIDEO_LECTURES,
  STUDENT_PROGRESS_SERIES,
  formatINR,
} from './sampleData';

interface StudentPortalViewProps {
  isHi: boolean;
  doubts: DoubtItem[];
  onAddDoubt: (subjectHi: string, subjectEn: string, question: string) => void;
  notices: AcademyNotice[];
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  isHi,
  doubts,
  onAddDoubt,
  notices,
}) => {
  // Video & note demo notices
  const [mediaNotice, setMediaNotice] = useState<string>('');

  // Mock Test (10 Questions + 15-min timer + palette + subject bar chart)
  const [testRunning, setTestRunning] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!testRunning || testSubmitted) return;
    if (secondsLeft <= 0) {
      setTestSubmitted(true);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [testRunning, testSubmitted, secondsLeft]);

  const currentQ = MOCK_TEST_QUESTIONS[currentQIdx];
  const totalCorrect = MOCK_TEST_QUESTIONS.reduce(
    (acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0),
    0
  );

  const subjectStats = (['physics', 'chemistry', 'maths'] as const).map((subj) => {
    const qs = MOCK_TEST_QUESTIONS.filter((q) => q.subject === subj);
    const correct = qs.filter((q) => answers[q.id] === q.correctIndex).length;
    return {
      id: subj,
      labelHi: subj === 'physics' ? 'भौतिकी' : subj === 'chemistry' ? 'रसायन' : 'गणित',
      labelEn: subj === 'physics' ? 'Physics' : subj === 'chemistry' ? 'Chemistry' : 'Mathematics',
      correct,
      total: qs.length,
      pct: Math.round((correct / qs.length) * 100),
    };
  });

  // Ask a Doubt form
  const [doubtSubject, setDoubtSubject] = useState<'physics' | 'chemistry' | 'maths'>('physics');
  const [doubtText, setDoubtText] = useState('');
  const [doubtNotice, setDoubtNotice] = useState('');

  const handleSubmitDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim()) return;
    const subjMap = {
      physics: { hi: 'भौतिकी', en: 'Physics' },
      chemistry: { hi: 'रसायन', en: 'Chemistry' },
      maths: { hi: 'गणित', en: 'Mathematics' },
    }[doubtSubject];
    onAddDoubt(subjMap.hi, subjMap.en, doubtText.trim());
    setDoubtText('');
    setDoubtNotice(
      isHi
        ? 'डाउट सूची में जोड़ दिया गया (नमूना स्टेट — टीचर पैनल में भी दिखाई देगा)।'
        : 'Doubt added to your list (Sample state — also visible in the Teacher Panel).'
    );
  };

  // Attendance ring SVG math (88% sample)
  const attendancePct = 88;
  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - attendancePct / 100);

  // Line chart geometry (6 tests)
  const chartW = 540;
  const chartH = 190;
  const padX = 44;
  const padY = 24;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const linePoints = STUDENT_PROGRESS_SERIES.map((pt, idx) => {
    const x = padX + (idx / (STUDENT_PROGRESS_SERIES.length - 1)) * plotW;
    const y = padY + plotH - ((pt.score - 40) / 60) * plotH;
    return { ...pt, x, y };
  });

  const polylineStr = linePoints.map((p) => `${p.x},${p.y}`).join(' ');

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Student Header */}
        <div className="bg-[#0b1936] text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-300">
              {isHi ? 'छात्र पोर्टल · नमूना डेटा' : 'Student Portal · Sample Data'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {isHi ? 'नमस्ते, डेमो छात्र' : 'Welcome, Demo Student'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {isHi
                ? 'बैच: शिखर JEE लक्ष्य बैच · रोल नं: VS-DEMO-101 (सारा विवरण नमूना है)'
                : 'Batch: Shikhar JEE Target Batch · Roll No: VS-DEMO-101 (All records are sample data)'}
            </p>
          </div>
          <div className="text-xs text-slate-200 bg-white/10 border border-white/15 rounded-xl px-4 py-3 font-mono tabular-nums">
            <div>{isHi ? 'सत्र: 2026–27' : 'Session: 2026–27'}</div>
            <div className="text-amber-300 font-bold mt-0.5">
              {isHi ? 'नमूना छात्र प्रोफ़ाइल' : 'Sample Student Profile'}
            </div>
          </div>
        </div>

        {/* 4 Overview Cards (all tagged नमूना डेटा) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Classes */}
          <div className="pws-card-3d rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-[#0b1936]">
                {isHi ? 'आज की क्लासें' : "Today's Classes"}
              </span>
              <span className="text-[11px] font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 pt-1">
              <li className="flex justify-between gap-2">
                <span className="font-semibold">{isHi ? 'भौतिकी — यांत्रिकी' : 'Physics — Mechanics'}</span>
                <span className="font-mono text-slate-500">08:00</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="font-semibold">{isHi ? 'गणित — कलन' : 'Maths — Calculus'}</span>
                <span className="font-mono text-slate-500">09:45</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="font-semibold">{isHi ? 'डाउट सत्र' : 'Doubt Desk'}</span>
                <span className="font-mono text-slate-500">11:30</span>
              </li>
            </ul>
          </div>

          {/* Attendance Ring */}
          <div className="pws-card-3d rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#0b1936]">
                {isHi ? 'हाज़िरी प्रतिशत' : 'Attendance %'}
              </div>
              <div className="text-2xl font-extrabold text-[#0b1936] font-mono tabular-nums">
                {attendancePct}%
              </div>
              <div className="text-[11px] font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा (44/50 दिन)' : 'Sample Data (44/50 days)'}
              </div>
            </div>
            <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true" className="shrink-0">
              <circle
                cx="38"
                cy="38"
                r={ringRadius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="7"
              />
              <circle
                cx="38"
                cy="38"
                r={ringRadius}
                fill="none"
                stroke="#d97706"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 38 38)"
              />
              <text
                x="38"
                y="42"
                textAnchor="middle"
                className="fill-[#0b1936] text-xs font-extrabold font-mono"
              >
                {attendancePct}%
              </text>
            </svg>
          </div>

          {/* Next Test */}
          <div className="pws-card-3d rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0b1936]">{isHi ? 'अगला टेस्ट' : 'Next Test'}</span>
              <span className="text-[11px] font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>
            <div className="text-base font-extrabold text-[#0b1936]">
              {isHi ? 'साप्ताहिक CBT मॉक #07' : 'Weekly CBT Mock #07'}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHi ? 'रविवार · सुबह 9:30 बजे' : 'Sunday · 9:30 AM'}</span>
            </div>
          </div>

          {/* Pending Fees */}
          <div className="pws-card-3d rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0b1936]">{isHi ? 'बाकी फ़ीस' : 'Pending Fees'}</span>
              <span className="text-[11px] font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#0b1936] font-mono tabular-nums">
              {formatINR(18000)}
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHi ? 'किस्त #3 देय: 15 जून (नमूना)' : 'Installment #3 due: 15 Jun (Sample)'}</span>
            </div>
          </div>
        </div>

        {/* VIDEO LECTURES & STUDY NOTES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-[#0b1936]">
                {isHi ? 'वीडियो लेक्चर लाइब्रेरी' : 'Video Lecture Library'}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            {mediaNotice && (
              <div
                role="status"
                className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-xs sm:text-sm font-bold text-amber-950 flex items-center justify-between gap-3"
              >
                <span>{mediaNotice}</span>
                <button
                  type="button"
                  onClick={() => setMediaNotice('')}
                  className="text-xs underline cursor-pointer shrink-0"
                >
                  {isHi ? 'बंद करें' : 'Dismiss'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAMPLE_VIDEO_LECTURES.map((lec) => (
                <button
                  key={lec.id}
                  type="button"
                  onClick={() =>
                    setMediaNotice(
                      isHi
                        ? `डेमो — वीडियो नहीं चलेगा (${lec.titleHi})`
                        : `Demo — Video playback is disabled (${lec.titleEn})`
                    )
                  }
                  className="text-left rounded-xl border border-slate-200 overflow-hidden bg-slate-50 hover:border-amber-500 transition-colors cursor-pointer group"
                >
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                    <img
                      src={lec.thumbnail}
                      alt={isHi ? lec.titleHi : lec.titleEn}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-[#0b1936]/35 flex items-center justify-center">
                      <span className="w-11 h-11 rounded-full bg-amber-400 text-[#0b1936] flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <div className="text-[11px] font-semibold text-amber-700">
                      {isHi ? lec.subjectHi : lec.subjectEn} · {isHi ? lec.durationHi : lec.durationEn}
                    </div>
                    <div className="text-sm font-bold text-[#0b1936] leading-snug">
                      {isHi ? lec.titleHi : lec.titleEn}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isHi ? lec.facultyHi : lec.facultyEn}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Study Notes List */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>{isHi ? 'अध्ययन नोट्स व DPP' : 'Study Notes & DPPs'}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {SAMPLE_STUDY_NOTES.map((note) => (
                <div
                  key={note.id}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-amber-700">
                      {isHi ? note.subjectHi : note.subjectEn} · {note.pages} {isHi ? 'पृष्ठ' : 'pages'}
                    </div>
                    <div className="text-sm font-bold text-[#0b1936] truncate">
                      {isHi ? note.titleHi : note.titleEn}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isHi ? note.updatedHi : note.updatedEn}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaNotice(
                        isHi
                          ? `डेमो — पीडीएफ डाउनलोड केवल वास्तविक संस्थान पोर्टल में सक्रिय होगा (${note.titleHi})`
                          : `Demo — PDF download is enabled in the live institute build (${note.titleEn})`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-[#0b1936] text-xs font-bold text-[#0b1936] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isHi ? 'खोलें' : 'Open'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Notices from Admin */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <h3 className="text-sm font-extrabold text-[#0b1936] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>{isHi ? 'संस्थान नोटिस बोर्ड' : 'Academy Notice Board'}</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notices.map((nt) => (
                  <div
                    key={nt.id}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1"
                  >
                    <div className="font-bold text-[#0b1936]">
                      {isHi ? nt.titleHi : nt.titleEn}
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {isHi ? nt.bodyHi : nt.bodyEn}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      {isHi ? nt.dateHi : nt.dateEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE MOCK TEST (10 QUESTIONS + PALETTE + RESULT & SUBJECT BAR CHART) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'ऑनलाइन CBT अभ्यास · नमूना डेटा' : 'Online CBT Practice · Sample Data'}
              </p>
              <h2 className="text-xl font-extrabold text-[#0b1936] flex items-center gap-2 mt-0.5">
                <ClipboardCheck className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'मॉक टेस्ट (10 प्रश्न)' : 'Interactive Mock Test (10 Questions)'}</span>
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0b1936] text-amber-300 font-mono tabular-nums text-sm font-bold">
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsLeft)}</span>
            </div>
          </div>

          {!testRunning ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <p className="text-sm text-slate-600 max-w-2xl">
                {isHi
                  ? 'भौतिकी, रसायन और गणित के 10 नमूना प्रश्नों का 15 मिनट का मॉक टेस्ट चलाकर देखें। इसमें प्रश्न नंबर पैलेट, लाइव टाइमर और सबमिट करने पर विषय-वार बार चार्ट मिलता है।'
                  : 'Try a 15-minute 10-question CBT mock test across Physics, Chemistry, and Mathematics with a live question palette and subject-wise result bar chart.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTestRunning(true);
                  setTestSubmitted(false);
                  setAnswers({});
                  setCurrentQIdx(0);
                  setSecondsLeft(900);
                }}
                className="pws-btn-amber px-5 py-3 rounded-lg text-sm font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isHi ? 'मॉक टेस्ट शुरू करें' : 'Start Mock Test'}
              </button>
            </div>
          ) : !testSubmitted ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Question Pane */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-[#0b1936] font-mono tabular-nums">
                    {isHi ? `प्रश्न ${currentQIdx + 1} / 10` : `Question ${currentQIdx + 1} of 10`}
                  </span>
                  <span className="font-semibold text-amber-700">
                    {isHi ? currentQ.subjectHi : currentQ.subjectEn}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-[#0b1936] leading-snug">
                  {isHi ? currentQ.questionHi : currentQ.questionEn}
                </h3>

                <div className="space-y-2.5">
                  {(isHi ? currentQ.optionsHi : currentQ.optionsEn).map((opt, idx) => {
                    const selected = answers[currentQ.id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [currentQ.id]: idx }))
                        }
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#0b1936] text-white border-[#0b1936]'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-500'
                        }`}
                      >
                        <span className="font-mono font-bold mr-2.5">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentQIdx === 0}
                      onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      {isHi ? '← पिछला' : '← Previous'}
                    </button>
                    <button
                      type="button"
                      disabled={currentQIdx === MOCK_TEST_QUESTIONS.length - 1}
                      onClick={() =>
                        setCurrentQIdx((i) => Math.min(MOCK_TEST_QUESTIONS.length - 1, i + 1))
                      }
                      className="px-4 py-2 rounded-lg bg-[#0b1936] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      {isHi ? 'अगला →' : 'Next →'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestSubmitted(true)}
                    className="pws-btn-amber px-5 py-2 rounded-lg text-xs font-extrabold cursor-pointer"
                  >
                    {isHi ? 'टेस्ट सबमिट करें' : 'Submit Test'}
                  </button>
                </div>
              </div>

              {/* Question Number Palette */}
              <div className="lg:col-span-4 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="text-xs font-extrabold text-[#0b1936]">
                  {isHi ? 'प्रश्न नंबर पैलेट' : 'Question Palette'}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {MOCK_TEST_QUESTIONS.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = idx === currentQIdx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQIdx(idx)}
                        className={`h-10 rounded-lg text-xs font-mono font-extrabold border transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-400 text-[#0b1936] border-amber-600'
                            : isAnswered
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-[#0b1936]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                  <div>
                    {isHi
                      ? `उत्तर दिए: ${Object.keys(answers).length} / 10`
                      : `Answered: ${Object.keys(answers).length} / 10`}
                  </div>
                  <div>
                    {isHi
                      ? 'हरा = उत्तर दिया · सुनहरा = वर्तमान प्रश्न'
                      : 'Green = Answered · Gold = Current'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Result Card + Subject-wise Bar Chart */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 rounded-2xl bg-[#0b1936] text-white p-6 space-y-2">
                  <p className="text-xs font-bold text-amber-300">
                    {isHi ? 'मॉक टेस्ट परिणाम · नमूना डेटा' : 'Mock Test Result · Sample Data'}
                  </p>
                  <div className="text-4xl font-extrabold font-mono tabular-nums">
                    {totalCorrect} / {MOCK_TEST_QUESTIONS.length}
                  </div>
                  <p className="text-sm text-slate-200 font-mono tabular-nums">
                    {isHi ? 'सटीकता:' : 'Accuracy:'}{' '}
                    {Math.round((totalCorrect / MOCK_TEST_QUESTIONS.length) * 100)}%
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setCurrentQIdx(0);
                      setSecondsLeft(900);
                      setTestSubmitted(false);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 text-[#0b1936] text-xs font-extrabold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isHi ? 'दोबारा टेस्ट दें' : 'Retake Test'}</span>
                  </button>
                </div>

                {/* Subject-wise Bar Chart */}
                <div className="md:col-span-7 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#0b1936]">
                      {isHi ? 'विषय-वार प्रदर्शन (बार चार्ट)' : 'Subject-Wise Performance (Bar Chart)'}
                    </span>
                    <span className="text-slate-500">{isHi ? 'नमूना परिणाम' : 'Sample Result'}</span>
                  </div>
                  <div className="space-y-3">
                    {subjectStats.map((st) => (
                      <div key={st.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700">{isHi ? st.labelHi : st.labelEn}</span>
                          <span className="font-mono tabular-nums text-[#0b1936]">
                            {st.correct}/{st.total} ({st.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0b1936] to-amber-500 transition-all duration-300"
                            style={{ width: `${Math.max(st.pct, 6)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* PROGRESS REPORT (6-TEST LINE CHART) + ASK A DOUBT FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 6-Test Progress Line Chart */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'प्रगति रिपोर्ट (6 टेस्ट)' : 'Progress Report (6 Tests)'}</span>
              </h2>
              <span className="text-xs font-semibold text-amber-700">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <div className="w-full">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto"
                role="img"
                aria-label={
                  isHi
                    ? '6 नमूना टेस्ट का प्रगति लाइन चार्ट'
                    : 'Line chart showing sample progress across 6 tests'
                }
              >
                {[40, 60, 80, 100].map((val) => {
                  const y = padY + plotH - ((val - 40) / 60) * plotH;
                  return (
                    <g key={val}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padX - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-500 text-[11px] font-mono"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}
                <polyline
                  fill="none"
                  stroke="#0b1936"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={polylineStr}
                />
                {linePoints.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5.5" fill="#f59e0b" stroke="#0b1936" strokeWidth="2" />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      className="fill-[#0b1936] text-[11px] font-bold font-mono"
                    >
                      {p.score}%
                    </text>
                    <text
                      x={p.x}
                      y={chartH - 4}
                      textAnchor="middle"
                      className="fill-slate-600 text-[11px] font-semibold"
                    >
                      {isHi ? p.labelHi : p.labelEn}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Ask a Doubt Form + Live Doubt Thread */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'डाउट पूछें' : 'Ask a Doubt'}</span>
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {isHi ? 'टीचर पैनल से जुड़ा (नमूना)' : 'Synced with Teacher Panel'}
              </span>
            </div>

            <form onSubmit={handleSubmitDoubt} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['physics', 'chemistry', 'maths'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDoubtSubject(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      doubtSubject === s
                        ? 'bg-[#0b1936] text-amber-300 border-[#0b1936]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {s === 'physics'
                      ? isHi
                        ? 'भौतिकी'
                        : 'Physics'
                      : s === 'chemistry'
                      ? isHi
                        ? 'रसायन'
                        : 'Chemistry'
                      : isHi
                      ? 'गणित'
                      : 'Mathematics'}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                required
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder={
                  isHi
                    ? 'अपना प्रश्न लिखें (जैसे: किरचॉफ़ का नियम कब लागू होता है?)'
                    : 'Type your academic question here...'
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
              />
              <button
                type="submit"
                className="pws-btn-3d inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isHi ? 'डाउट भेजें' : 'Post Doubt'}</span>
              </button>
              {doubtNotice && (
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{doubtNotice}</span>
                </p>
              )}
            </form>

            <div className="space-y-2.5 pt-2 border-t border-slate-200 max-h-56 overflow-y-auto pr-1">
              {doubts.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-bold text-amber-700">
                      {isHi ? d.subjectHi : d.subjectEn}
                    </span>
                    <span>{isHi ? d.timeHi : d.timeEn}</span>
                  </div>
                  <p className="font-bold text-[#0b1936]">
                    {isHi ? d.questionHi : d.questionEn}
                  </p>
                  {d.reply ? (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-900">
                      <span className="font-extrabold">
                        {isHi ? 'टीचर का उत्तर: ' : 'Teacher Reply: '}
                      </span>
                      {d.reply}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">
                      {isHi ? 'उत्तर प्रतीक्षारत (टीचर पैनल में जवाब दें)' : 'Awaiting reply (reply via Teacher Panel)'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
