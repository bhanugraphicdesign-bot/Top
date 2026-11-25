import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  ATTENDANCE_STUDENTS,
  DoubtItem,
  HomeworkItem,
  TEACHER_BATCHES,
} from './sampleData';

interface TeacherViewProps {
  isHi: boolean;
  doubts: DoubtItem[];
  onReplyDoubt: (doubtId: string, replyText: string) => void;
  homeworks: HomeworkItem[];
  onAddHomework: (item: Omit<HomeworkItem, 'id'>) => void;
  onDeleteHomework: (id: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  isHi,
  doubts,
  onReplyDoubt,
  homeworks,
  onAddHomework,
  onDeleteHomework,
}) => {
  // 1. Attendance register (12 sample students)
  const [selectedBatchId, setSelectedBatchId] = useState<string>(TEACHER_BATCHES[0].id);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ATTENDANCE_STUDENTS.forEach((st, idx) => {
      initial[st.id] = idx !== 4 && idx !== 9; // 10 present, 2 absent sample default
    });
    return initial;
  });
  const [savedSummary, setSavedSummary] = useState<{
    batchHi: string;
    batchEn: string;
    present: number;
    absent: number;
    total: number;
    savedAt: string;
  } | null>(null);

  const selectedBatch =
    TEACHER_BATCHES.find((b) => b.id === selectedBatchId) || TEACHER_BATCHES[0];

  const presentCount = ATTENDANCE_STUDENTS.filter((s) => attendanceMap[s.id]).length;
  const absentCount = ATTENDANCE_STUDENTS.length - presentCount;

  const handleToggleStudent = (id: string) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveAttendance = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    setSavedSummary({
      batchHi: selectedBatch.nameHi,
      batchEn: selectedBatch.nameEn,
      present: presentCount,
      absent: absentCount,
      total: ATTENDANCE_STUDENTS.length,
      savedAt: timeStr,
    });
  };

  // 2. Homework / Test Creator
  const [hwSubject, setHwSubject] = useState<'physics' | 'chemistry' | 'maths' | 'biology'>('physics');
  const [hwType, setHwType] = useState<'homework' | 'test'>('homework');
  const [hwDueDate, setHwDueDate] = useState('2026-05-25');
  const [hwPrompt, setHwPrompt] = useState('');

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwPrompt.trim()) return;
    const subjLabels = {
      physics: { hi: 'भौतिकी', en: 'Physics' },
      chemistry: { hi: 'रसायन', en: 'Chemistry' },
      maths: { hi: 'गणित', en: 'Mathematics' },
      biology: { hi: 'जीवविज्ञान', en: 'Biology' },
    }[hwSubject];

    onAddHomework({
      subjectHi: subjLabels.hi,
      subjectEn: subjLabels.en,
      type: hwType,
      dueDate: hwDueDate,
      prompt: hwPrompt.trim(),
      batchHi: selectedBatch.nameHi,
      batchEn: selectedBatch.nameEn,
    });
    setHwPrompt('');
  };

  // 3. Doubt Inbox Replies
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const handleSendReply = (doubtId: string) => {
    const text = (replyDrafts[doubtId] || '').trim();
    if (!text) return;
    onReplyDoubt(doubtId, text);
    setReplyDrafts((prev) => ({ ...prev, [doubtId]: '' }));
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="bg-[#0b1936] text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-300">
              {isHi ? 'टीचर पैनल · नमूना डेटा' : 'Teacher Panel · Sample Data'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {isHi ? 'अकादमिक संचालन एवं कक्षा प्रबंधन' : 'Faculty & Classroom Workspace'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {isHi
                ? 'हाज़िरी दर्ज करें, होमवर्क/टेस्ट असाइन करें और छात्रों के डाउट का उत्तर दें (सभी बदलाव केवल डेमो स्टेट में हैं)।'
                : 'Mark attendance, assign homework or practice tests, and answer student doubts in local demo state.'}
            </p>
          </div>
          <div className="text-xs bg-white/10 border border-white/15 rounded-xl px-4 py-3 font-mono tabular-nums">
            <div className="text-amber-300 font-bold">
              {isHi ? selectedBatch.facultyHi : selectedBatch.facultyEn}
            </div>
            <div className="text-slate-200 mt-0.5">
              {isHi ? 'नमूना फ़ैकल्टी खाता' : 'Sample Faculty Profile'}
            </div>
          </div>
        </div>

        {/* 1. ATTENDANCE REGISTER (12 SAMPLE STUDENTS) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'दैनिक हाज़िरी रजिस्टर · नमूना डेटा' : 'Daily Attendance Register · Sample Data'}
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0b1936] flex items-center gap-2 mt-0.5">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'बैच हाज़िरी (12 नमूना छात्र)' : 'Batch Attendance (12 Sample Students)'}</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="vs-teacher-batch" className="sr-only">
                {isHi ? 'बैच चुनें' : 'Select Batch'}
              </label>
              <select
                id="vs-teacher-batch"
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setSavedSummary(null);
                }}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-bold text-[#0b1936]"
              >
                {TEACHER_BATCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {isHi ? `${b.nameHi} (${b.timingHi})` : `${b.nameEn} (${b.timingEn})`}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const allPresent: Record<string, boolean> = {};
                  ATTENDANCE_STUDENTS.forEach((s) => {
                    allPresent[s.id] = true;
                  });
                  setAttendanceMap(allPresent);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'सभी हाज़िर' : 'Mark All Present'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ATTENDANCE_STUDENTS.map((st) => {
              const present = Boolean(attendanceMap[st.id]);
              return (
                <div
                  key={st.id}
                  className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    present
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-slate-500">{st.rollNo}</div>
                    <div className="text-sm font-bold text-[#0b1936] truncate">
                      {isHi ? st.nameHi : st.nameEn}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStudent(st.id)}
                    aria-pressed={present}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      present
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {present ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isHi ? 'हाज़िर' : 'Present'}</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>{isHi ? 'गैरहाज़िर' : 'Absent'}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="text-xs sm:text-sm font-semibold text-slate-700 font-mono tabular-nums">
              {isHi
                ? `कुल: 12 · हाज़िर: ${presentCount} · गैरहाज़िर: ${absentCount} (${Math.round(
                    (presentCount / 12) * 100
                  )}%)`
                : `Total: 12 · Present: ${presentCount} · Absent: ${absentCount} (${Math.round(
                    (presentCount / 12) * 100
                  )}%)`}
            </div>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="pws-btn-amber px-5 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold cursor-pointer whitespace-nowrap"
            >
              {isHi ? 'हाज़िरी सेव करें' : 'Save Attendance'}
            </button>
          </div>

          {savedSummary && (
            <div
              role="status"
              className="rounded-xl bg-[#0b1936] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-amber-300">
                    {isHi ? 'हाज़िरी सारांश सेव किया गया (नमूना स्टेट)' : 'Attendance Summary Saved (Sample State)'}
                  </div>
                  <div className="text-slate-200 mt-0.5 font-mono tabular-nums">
                    {isHi
                      ? `${savedSummary.batchHi} — हाज़िर: ${savedSummary.present}/${savedSummary.total}, गैरहाज़िर: ${savedSummary.absent} (समय ${savedSummary.savedAt})`
                      : `${savedSummary.batchEn} — Present: ${savedSummary.present}/${savedSummary.total}, Absent: ${savedSummary.absent} (at ${savedSummary.savedAt})`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. HOMEWORK / TEST CREATOR & 3. DOUBT INBOX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Homework / Test Creator */}
          <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'असाइनमेंट · नमूना स्टेट' : 'Assignments · Sample State'}
              </p>
              <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2 mt-0.5">
                <BookOpenCheck className="w-5 h-5 text-amber-600" />
                <span>{isHi ? 'होमवर्क / टेस्ट बनाएँ' : 'Create Homework / Test'}</span>
              </h2>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="vs-hw-subj" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'विषय' : 'Subject'}
                  </label>
                  <select
                    id="vs-hw-subj"
                    value={hwSubject}
                    onChange={(e) =>
                      setHwSubject(e.target.value as 'physics' | 'chemistry' | 'maths' | 'biology')
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                  >
                    <option value="physics">{isHi ? 'भौतिकी' : 'Physics'}</option>
                    <option value="chemistry">{isHi ? 'रसायन' : 'Chemistry'}</option>
                    <option value="maths">{isHi ? 'गणित' : 'Mathematics'}</option>
                    <option value="biology">{isHi ? 'जीवविज्ञान' : 'Biology'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="vs-hw-type" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'प्रकार' : 'Type'}
                  </label>
                  <select
                    id="vs-hw-type"
                    value={hwType}
                    onChange={(e) => setHwType(e.target.value as 'homework' | 'test')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                  >
                    <option value="homework">{isHi ? 'होमवर्क' : 'Homework'}</option>
                    <option value="test">{isHi ? 'टेस्ट' : 'Practice Test'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="vs-hw-date" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'तारीख' : 'Due Date'}
                  </label>
                  <input
                    id="vs-hw-date"
                    type="date"
                    required
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vs-hw-prompt" className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'सवाल / निर्देश' : 'Questions / Instructions'}
                </label>
                <textarea
                  id="vs-hw-prompt"
                  rows={2}
                  required
                  value={hwPrompt}
                  onChange={(e) => setHwPrompt(e.target.value)}
                  placeholder={
                    isHi
                      ? 'जैसे: अध्याय 4 (ऊष्मागतिकी) के 10 संख्यात्मक प्रश्न हल करें...'
                      : 'e.g., Solve 10 numerical problems from Chapter 4 (Thermodynamics)...'
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                className="pws-btn-3d inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isHi ? 'सूची में जोड़ें' : 'Add to Schedule'}</span>
              </button>
            </form>

            {/* Homework List */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              {homeworks.map((hw) => (
                <div
                  key={hw.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-[11px] font-bold text-amber-700">
                      {hw.type === 'homework'
                        ? isHi
                          ? 'होमवर्क'
                          : 'Homework'
                        : isHi
                        ? 'टेस्ट'
                        : 'Test'}{' '}
                      · {isHi ? hw.subjectHi : hw.subjectEn} ·{' '}
                      <span className="font-mono text-slate-600">{hw.dueDate}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-[#0b1936] leading-snug">
                      {hw.prompt}
                    </p>
                    <div className="text-[11px] text-slate-500">
                      {isHi ? hw.batchHi : hw.batchEn}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteHomework(hw.id)}
                    aria-label={isHi ? 'हटाएँ' : 'Remove item'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Doubt Inbox */}
          <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-amber-700">
                  {isHi ? 'छात्र प्रश्न उत्तर · नमूना स्टेट' : 'Student Q&A · Sample State'}
                </p>
                <h2 className="text-lg font-extrabold text-[#0b1936] flex items-center gap-2 mt-0.5">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  <span>{isHi ? 'डाउट इनबॉक्स' : 'Doubt Inbox'}</span>
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                {doubts.filter((d) => !d.reply).length} {isHi ? 'लंबित' : 'Pending'}
              </span>
            </div>

            <div className="space-y-4">
              {doubts.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-bold text-[#0b1936]">
                      {isHi ? d.studentHi : d.studentEn} ·{' '}
                      <span className="text-amber-700">{isHi ? d.subjectHi : d.subjectEn}</span>
                    </span>
                    <span>{isHi ? d.timeHi : d.timeEn}</span>
                  </div>
                  <p className="text-sm font-bold text-[#0b1936]">
                    {isHi ? d.questionHi : d.questionEn}
                  </p>

                  {d.reply ? (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950">
                      <span className="font-extrabold">
                        {isHi ? 'दिया गया उत्तर: ' : 'Submitted Reply: '}
                      </span>
                      {d.reply}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={replyDrafts[d.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                        }
                        placeholder={isHi ? 'जवाब लिखें...' : 'Write your explanation...'}
                        aria-label={isHi ? 'जवाब दें' : 'Write reply'}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(d.id)}
                        className="pws-btn-3d inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isHi ? 'जवाब दें' : 'Reply'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
