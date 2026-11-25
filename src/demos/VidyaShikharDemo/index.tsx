import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Globe,
  GraduationCap,
  Shield,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DemoPriceBar } from '../../components/DemoPriceBar';
import { DemoLanguageToggle } from '../../components/common/DemoLanguageToggle';
import {
  AcademyNotice,
  AcademyRole,
  AdmissionInquiry,
  DoubtItem,
  HomeworkItem,
  INITIAL_DOUBTS,
  INITIAL_HOMEWORKS,
  INITIAL_INQUIRIES,
  INITIAL_NOTICES,
  InquiryStatus,
} from './sampleData';

const WebsiteView = lazy(() =>
  import('./WebsiteView').then((m) => ({ default: m.WebsiteView }))
);
const StudentPortalView = lazy(() =>
  import('./StudentPortalView').then((m) => ({ default: m.StudentPortalView }))
);
const TeacherView = lazy(() =>
  import('./TeacherView').then((m) => ({ default: m.TeacherView }))
);
const AdminView = lazy(() =>
  import('./AdminView').then((m) => ({ default: m.AdminView }))
);

interface VidyaShikharDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

const VALID_ROLES: AcademyRole[] = ['website', 'student', 'teacher', 'admin'];

function parseRoleFromHash(): AcademyRole {
  if (typeof window === 'undefined') return 'website';
  const cleaned = window.location.hash.replace(/^#/, '').toLowerCase() as AcademyRole;
  return VALID_ROLES.includes(cleaned) ? cleaned : 'website';
}

const ViewSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
    <div className="h-52 rounded-2xl bg-slate-200" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-slate-200" />
      ))}
    </div>
    <div className="h-56 rounded-2xl bg-slate-200" />
  </div>
);

export const VidyaShikharDemo: React.FC<VidyaShikharDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';

  const [role, setRole] = useState<AcademyRole>(parseRoleFromHash);

  // Shared in-memory React state across all 4 portals (zero Firestore / zero API calls)
  const [doubts, setDoubts] = useState<DoubtItem[]>(INITIAL_DOUBTS);
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(INITIAL_HOMEWORKS);
  const [inquiries, setInquiries] = useState<AdmissionInquiry[]>(INITIAL_INQUIRIES);
  const [notices, setNotices] = useState<AcademyNotice[]>(INITIAL_NOTICES);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const onHashChange = () => {
      setRole(parseRoleFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const switchRole = (nextRole: AcademyRole) => {
    setRole(nextRole);
    if (typeof window !== 'undefined') {
      const targetHash = `#${nextRole}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${targetHash}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddDoubt = (subjectHi: string, subjectEn: string, question: string) => {
    const newDoubt: DoubtItem = {
      id: `d-${Date.now()}`,
      studentHi: 'डेमो छात्र',
      studentEn: 'Demo Student',
      batchHi: 'शिखर JEE लक्ष्य बैच',
      batchEn: 'Shikhar JEE Target Batch',
      subjectHi,
      subjectEn,
      questionHi: question,
      questionEn: question,
      timeHi: 'अभी · नमूना',
      timeEn: 'Just now · Sample',
    };
    setDoubts((prev) => [newDoubt, ...prev]);
  };

  const handleReplyDoubt = (doubtId: string, replyText: string) => {
    setDoubts((prev) =>
      prev.map((d) => (d.id === doubtId ? { ...d, reply: replyText } : d))
    );
  };

  const handleAddHomework = (item: Omit<HomeworkItem, 'id'>) => {
    setHomeworks((prev) => [{ ...item, id: `hw-${Date.now()}` }, ...prev]);
  };

  const handleDeleteHomework = (id: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSubmitInquiry = (data: {
    name: string;
    studentClass: string;
    courseId: string;
    mobile: string;
  }) => {
    const nextNum = 305 + inquiries.length;
    const newItem: AdmissionInquiry = {
      id: `INQ-${nextNum}`,
      name: data.name,
      studentClass: data.studentClass,
      courseId: data.courseId,
      mobile: data.mobile,
      dateHi: 'अभी (नमूना)',
      dateEn: 'Just now (Sample)',
      status: 'new',
    };
    setInquiries((prev) => [newItem, ...prev]);
  };

  const handleUpdateInquiryStatus = (id: string, status: InquiryStatus) => {
    setInquiries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row))
    );
  };

  const handlePublishNotice = (
    notice: Omit<AcademyNotice, 'id' | 'dateHi' | 'dateEn'>
  ) => {
    setNotices((prev) => [
      {
        ...notice,
        id: `nt-${Date.now()}`,
        dateHi: 'अभी · नमूना',
        dateEn: 'Just now · Sample',
      },
      ...prev,
    ]);
  };

  const roleTabs: {
    id: AcademyRole;
    icon: React.ComponentType<{ className?: string }>;
    hi: string;
    en: string;
  }[] = [
    { id: 'website', icon: Globe, hi: 'वेबसाइट', en: 'Website' },
    { id: 'student', icon: GraduationCap, hi: 'छात्र पोर्टल', en: 'Student Portal' },
    { id: 'teacher', icon: BookOpen, hi: 'टीचर', en: 'Teacher' },
    { id: 'admin', icon: Shield, hi: 'एडमिन', en: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col overflow-x-clip">
      {/* STICKY TOP BAR: DEMO STRIP + MRP BAR + 4-ROLE SWITCHER */}
      <div className="sticky top-0 z-40 shadow-xs">
        {/* Top Demo Disclaimer Strip */}
        <div className="bg-[#071126] text-slate-100 border-b border-amber-500/25">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {isHi ? 'Power Web Studio AI पर वापस' : 'Back to Power Web Studio AI'}
                </span>
              </button>
              <span className="hidden sm:inline text-amber-300 font-medium truncate">
                {isHi
                  ? 'DEMO वेबसाइट — सारा डेटा नमूना है'
                  : 'DEMO Website — All Data Is Sample Only'}
              </span>
            </div>

            <span className="text-[11px] font-bold text-amber-300 whitespace-nowrap shrink-0">
              {isHi ? 'प्रीमियम डेमो' : 'Premium Demo'}
            </span>
          </div>
        </div>

        {/* MRP Price Bar */}
        <DemoPriceBar slug="vidya-shikhar" />

        {/* 4-Tab Role Switcher Bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="hidden md:inline text-xs font-extrabold text-[#0b1936] shrink-0">
              {isHi ? 'रोल स्विचर:' : 'Role Switcher:'}
            </span>

            <div
              role="tablist"
              aria-label={isHi ? 'प्लेटफ़ॉर्म रोल चुनें' : 'Select academy role'}
              className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex gap-1 bg-slate-100 p-1 rounded-xl"
            >
              {roleTabs.map((tab) => {
                const Icon = tab.icon;
                const active = role === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchRole(tab.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#0b1936] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#0b1936]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    />
                    <span>{isHi ? tab.hi : tab.en}</span>
                  </button>
                );
              })}
            </div>

            {role !== 'website' && (
              <DemoLanguageToggle
                language={language}
                onChange={setLanguage}
                tone="light"
                className="hidden sm:inline-flex"
              />
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE ROLE VIEW (React.lazy) */}
      <main className="flex-1">
        <Suspense fallback={<ViewSkeleton />}>
          {role === 'website' && (
            <WebsiteView
              language={language}
              onChangeLanguage={setLanguage}
              onRequestQuote={onRequestQuote}
              onSwitchToPortal={(nextRole) => switchRole(nextRole)}
              onSubmitInquiry={handleSubmitInquiry}
            />
          )}
          {role === 'student' && (
            <StudentPortalView
              isHi={isHi}
              doubts={doubts}
              onAddDoubt={handleAddDoubt}
              notices={notices}
            />
          )}
          {role === 'teacher' && (
            <TeacherView
              isHi={isHi}
              doubts={doubts}
              onReplyDoubt={handleReplyDoubt}
              homeworks={homeworks}
              onAddHomework={handleAddHomework}
              onDeleteHomework={handleDeleteHomework}
            />
          )}
          {role === 'admin' && (
            <AdminView
              isHi={isHi}
              inquiries={inquiries}
              onUpdateInquiryStatus={handleUpdateInquiryStatus}
              notices={notices}
              onPublishNotice={handlePublishNotice}
            />
          )}
        </Suspense>
      </main>

      {/* BOTTOM CONVERSION CTA */}
      <section className="bg-[#0b1936] text-white py-10 border-t border-amber-500/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold">
              {isHi
                ? 'अपने कोचिंग संस्थान के लिए ऐसा पूरा प्लेटफ़ॉर्म बनवाएँ'
                : 'Launch a Complete Coaching Institute Platform Like This'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {isHi
                ? 'वेबसाइट, छात्र पोर्टल, टीचर पैनल और एडमिन डैशबोर्ड — Power Web Studio AI द्वारा आपके ब्रांड के अनुरूप।'
                : 'Website, Student Portal, Teacher Panel, and Admin Dashboard tailored to your institute by Power Web Studio AI.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestQuote}
            className="pws-btn-amber inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {isHi ? 'ऐसी कोचिंग वेबसाइट बनवाएँ' : 'Build a Coaching Website Like This'}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#071126] text-slate-400 py-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-200">© Vidya Shikhar Academy (Demo)</span>
          <span>
            {isHi
              ? 'यह केवल इंटरैक्टिव डेमो प्लेटफ़ॉर्म है — कोई वास्तविक एडमिशन, भुगतान या डेटाबेस सेव नहीं होता।'
              : 'Interactive showcase platform — no live admissions, payments, or database writes occur.'}
          </span>
        </div>
      </footer>
    </div>
  );
};
