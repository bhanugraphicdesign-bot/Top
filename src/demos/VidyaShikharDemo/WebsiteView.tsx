import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  Languages,
  Mail,
  Menu,
  MonitorPlay,
  Phone,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Language } from '../../types';
import { DemoLanguageToggle } from '../../components/common/DemoLanguageToggle';
import {
  ACADEMY_COURSES,
  ACADEMY_FAQS,
  AcademyCourse,
  CAMPUS_FACILITIES,
  DEMO_PACKAGES,
  HERO_SLIDES,
  PLATFORM_FEATURES,
  SCHOLARSHIP_QUESTIONS,
  UPCOMING_BATCHES,
  formatINR,
} from './sampleData';

interface WebsiteViewProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  onRequestQuote: () => void;
  onSwitchToPortal: (role: 'student' | 'teacher' | 'admin') => void;
  onSubmitInquiry: (data: {
    name: string;
    studentClass: string;
    courseId: string;
    mobile: string;
  }) => void;
}

const FEATURE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  admission: UserCheck,
  fees: IndianRupee,
  live: MonitorPlay,
  video: Video,
  tests: ClipboardCheck,
  analysis: BarChart3,
  attendance: Calendar,
  parent: Users,
  notice: Bell,
  rbac: ShieldCheck,
  bilingual: Languages,
  mobile: Smartphone,
};

export const WebsiteView: React.FC<WebsiteViewProps> = ({
  language,
  onChangeLanguage,
  onRequestQuote,
  onSwitchToPortal,
  onSubmitInquiry,
}) => {
  const isHi = language === 'hi';

  // Header mobile drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero slider (4-second auto-slide)
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);

  useEffect(() => {
    if (sliderPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [sliderPaused]);

  // Course detail modal
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [openUnitIdx, setOpenUnitIdx] = useState<number>(0);

  useEffect(() => {
    if (!selectedCourse) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCourse(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCourse]);

  // Batch filter
  const [batchCourseFilter, setBatchCourseFilter] = useState<string>('all');

  // Free Scholarship Test (5 MCQs + 5-minute countdown)
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState(300);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!quizStarted || quizSubmitted) return;
    if (quizSecondsLeft <= 0) {
      setQuizSubmitted(true);
      return;
    }
    const t = window.setInterval(() => {
      setQuizSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [quizStarted, quizSubmitted, quizSecondsLeft]);

  const quizScore = SCHOLARSHIP_QUESTIONS.reduce(
    (sum, q) => sum + (quizAnswers[q.id] === q.correctIndex ? 1 : 0),
    0
  );

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSecondsLeft(300);
    setQuizSubmitted(false);
    setQuizStarted(true);
  };

  // Fee calculator
  const [calcCourseId, setCalcCourseId] = useState<string>('jee');
  const [calcInstallments, setCalcInstallments] = useState<1 | 3 | 6>(3);
  const calcCourse =
    ACADEMY_COURSES.find((c) => c.id === calcCourseId) || ACADEMY_COURSES[0];
  const calcTotal = calcCourse.sampleFee + calcCourse.materialFee;
  const calcPerInstallment = Math.ceil(calcTotal / calcInstallments);

  // FAQ accordion
  const [openFaqId, setOpenFaqId] = useState<string | null>('f1');

  // Admission inquiry form
  const [formName, setFormName] = useState('');
  const [formClass, setFormClass] = useState('कक्षा 11');
  const [formCourse, setFormCourse] = useState('jee');
  const [formMobile, setFormMobile] = useState('');
  const [formContextHint, setFormContextHint] = useState('');
  const [formFeedback, setFormFeedback] = useState('');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrefillAdmission = (courseId: string, hintHi: string, hintEn: string) => {
    setSelectedCourse(null);
    setFormCourse(courseId);
    setFormContextHint(isHi ? hintHi : hintEn);
    scrollToSection('vs-contact');
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedMobile = formMobile.replace(/\D/g, '');
    if (!formName.trim() || cleanedMobile.length < 10) return;

    onSubmitInquiry({
      name: formName.trim(),
      studentClass: formClass,
      courseId: formCourse,
      mobile: formMobile.trim(),
    });

    setFormFeedback(
      isHi
        ? 'डेमो: फ़ॉर्म ठीक से भरा गया। यह नमूना है, कोई संदेश नहीं भेजा गया।'
        : 'Demo: Form submitted properly. This is a sample preview; no real message was sent.'
    );
    setFormName('');
    setFormMobile('');
  };

  const filteredBatches =
    batchCourseFilter === 'all'
      ? UPCOMING_BATCHES
      : UPCOMING_BATCHES.filter((b) => b.courseId === batchCourseFilter);

  const navLinks = [
    { id: 'vs-courses', hi: 'कोर्स', en: 'Courses' },
    { id: 'vs-batches', hi: 'बैच', en: 'Batches' },
    { id: 'vs-test-series', hi: 'टेस्ट सीरीज़', en: 'Test Series' },
    { id: 'vs-fees', hi: 'फ़ीस', en: 'Fees' },
    { id: 'vs-contact', hi: 'संपर्क', en: 'Contact' },
  ];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white text-slate-900">
      {/* ACADEMY HEADER */}
      <header className="bg-[#0b1936] text-white border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a
            href="#vs-hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('vs-hero');
            }}
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-[#0b1936] flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              {isHi ? 'विद्या शिखर' : 'Vidya Shikhar'}
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav
            aria-label={isHi ? 'मुख्य मेन्यू' : 'Main navigation'}
            className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-200"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.id);
                }}
                className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
              >
                {isHi ? link.hi : link.en}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <DemoLanguageToggle
              language={language}
              onChange={onChangeLanguage}
              tone="dark"
            />
            <button
              type="button"
              onClick={() =>
                handlePrefillAdmission(
                  'jee',
                  'फ़्री डेमो क्लास के लिए चयनित (नमूना)',
                  'Selected for Free Demo Class (Sample)'
                )
              }
              className="pws-btn-amber hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isHi ? 'फ़्री डेमो क्लास' : 'Free Demo Class'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={isHi ? 'मेन्यू खोलें' : 'Toggle menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-lg border border-white/15 bg-white/5 text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#09142c] px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.id);
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  {isHi ? link.hi : link.en}
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                handlePrefillAdmission(
                  'jee',
                  'फ़्री डेमो क्लास के लिए चयनित (नमूना)',
                  'Selected for Free Demo Class (Sample)'
                )
              }
              className="pws-btn-amber w-full py-2.5 rounded-lg text-xs font-extrabold cursor-pointer"
            >
              {isHi ? 'फ़्री डेमो क्लास' : 'Free Demo Class'}
            </button>
          </div>
        )}
      </header>

      {/* HERO SLIDER (4-second auto-slide) */}
      <section
        id="vs-hero"
        className="relative overflow-hidden bg-[#0b1936]"
        onMouseEnter={() => setSliderPaused(true)}
        onMouseLeave={() => setSliderPaused(false)}
      >
        <div className="relative h-[430px] sm:h-[490px] lg:h-[540px]">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === activeSlide;
            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={isHi ? slide.titleHi : slide.titleEn}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#071126]/95 via-[#0b1936]/80 to-[#0b1936]/35" />

                <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center">
                  <div className="max-w-2xl space-y-4">
                    <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide">
                      {isHi ? slide.kickerHi : slide.kickerEn}
                    </p>
                    {isActive ? (
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
                        {isHi ? slide.titleHi : slide.titleEn}
                      </h1>
                    ) : (
                      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
                        {isHi ? slide.titleHi : slide.titleEn}
                      </h2>
                    )}
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
                      {isHi ? slide.subtitleHi : slide.subtitleEn}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => scrollToSection('vs-courses')}
                        className="pws-btn-amber inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-extrabold cursor-pointer whitespace-nowrap"
                      >
                        <span>{isHi ? 'कोर्स देखें' : 'Explore Courses'}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handlePrefillAdmission(
                            'jee',
                            'अकादमिक काउंसलिंग के लिए अनुरोध (नमूना)',
                            'Requested Academic Counselling (Sample)'
                          )
                        }
                        className="pws-btn-glass pws-btn-glass-dark inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold cursor-pointer whitespace-nowrap"
                      >
                        <span>{isHi ? 'काउंसलिंग बुक करें' : 'Book Counselling'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slider Controls */}
          <div className="absolute bottom-5 inset-x-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`${isHi ? 'स्लाइड' : 'Slide'} ${idx + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeSlide ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                  }
                  aria-label={isHi ? 'पिछली स्लाइड' : 'Previous slide'}
                  className="w-9 h-9 rounded-lg bg-[#0b1936]/85 border border-white/20 text-white hover:bg-[#132955] flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                  aria-label={isHi ? 'अगली स्लाइड' : 'Next slide'}
                  className="w-9 h-9 rounded-lg bg-[#0b1936]/85 border border-white/20 text-white hover:bg-[#132955] flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK PORTAL PREVIEW STRIP */}
      <section className="bg-slate-50 border-b border-slate-200 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-700 font-medium">
            <span className="font-extrabold text-[#0b1936]">
              {isHi ? 'विद्या शिखर अकादमी — ' : 'Vidya Shikhar Academy — '}
            </span>
            <span>
              {isHi
                ? 'सही मार्गदर्शन, मज़बूत तैयारी। ऊपर या यहाँ से सीधे किसी भी पोर्टल का अनुभव करें:'
                : 'Right Guidance, Strong Preparation. Jump directly into any role portal:'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSwitchToPortal('student')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 text-xs font-bold text-[#0b1936] cursor-pointer whitespace-nowrap"
            >
              {isHi ? 'छात्र पोर्टल देखें →' : 'Open Student Portal →'}
            </button>
            <button
              type="button"
              onClick={() => onSwitchToPortal('teacher')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 text-xs font-bold text-[#0b1936] cursor-pointer whitespace-nowrap"
            >
              {isHi ? 'टीचर पैनल →' : 'Open Teacher Panel →'}
            </button>
            <button
              type="button"
              onClick={() => onSwitchToPortal('admin')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-amber-500 text-xs font-bold text-[#0b1936] cursor-pointer whitespace-nowrap"
            >
              {isHi ? 'एडमिन डैशबोर्ड →' : 'Open Admin Dashboard →'}
            </button>
          </div>
        </div>
      </section>

      {/* 4 COURSE CARDS */}
      <section id="vs-courses" className="py-14 sm:py-16 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pws-reveal max-w-2xl mb-10">
            <p className="text-xs font-bold text-amber-700 tracking-wide">
              {isHi ? 'संरचित शैक्षणिक कार्यक्रम · नमूना विवरण' : 'Structured Academic Programs · Sample Details'}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0b1936] text-balance">
              {isHi ? 'प्रमुख कोचिंग कोर्स' : 'Core Coaching Courses'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isHi
                ? 'किसी भी कोर्स का संपूर्ण सिलेबस, साप्ताहिक टाइमटेबल और किस्त विवरण देखने के लिए "विवरण" पर क्लिक करें।'
                : 'Click "Details" on any program to inspect its syllabus accordion, weekly timetable, and installment plan.'}
            </p>
          </div>

          <div className="pws-stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ACADEMY_COURSES.map((course) => (
              <article
                key={course.id}
                className="pws-card-3d rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={course.image}
                    alt={isHi ? course.nameHi : course.nameEn}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-amber-700">
                      {isHi ? course.durationHi : course.durationEn}
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-600">
                        {isHi ? course.modeHi : course.modeEn}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#0b1936]">
                      {isHi ? course.nameHi : course.nameEn}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isHi ? course.summaryHi : course.summaryEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {isHi ? 'नमूना फ़ीस' : 'Sample Fee'}
                      </span>
                      <span className="text-base font-extrabold text-[#0b1936] font-mono tabular-nums">
                        {formatINR(course.sampleFee)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourse(course);
                        setOpenUnitIdx(0);
                      }}
                      className="pws-btn-3d w-full py-2.5 px-4 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <span>{isHi ? 'विवरण देखें' : 'View Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING BATCH CALENDAR */}
      <section
        id="vs-batches"
        className="py-14 sm:py-16 bg-slate-50 border-y border-slate-200 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="pws-reveal">
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'बैच कैलेंडर · नमूना अनुसूची' : 'Batch Calendar · Sample Schedule'}
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0b1936]">
                {isHi ? 'आगामी नए बैच' : 'Upcoming New Batches'}
              </h2>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              {[
                { id: 'all', hi: 'सभी', en: 'All' },
                { id: 'jee', hi: 'JEE', en: 'JEE' },
                { id: 'neet', hi: 'NEET', en: 'NEET' },
                { id: 'foundation', hi: 'फ़ाउंडेशन', en: 'Foundation' },
                { id: 'govt', hi: 'सरकारी परीक्षा', en: 'Govt Exams' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBatchCourseFilter(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    batchCourseFilter === item.id
                      ? 'bg-[#0b1936] text-white'
                      : 'text-slate-600 hover:text-[#0b1936]'
                  }`}
                >
                  {isHi ? item.hi : item.en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className="pws-card-3d rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="text-xs font-semibold text-slate-500">
                    <span>{isHi ? batch.startDateHi : batch.startDateEn}</span>
                    <span aria-hidden="true" className="mx-1.5 text-slate-300">
                      ·
                    </span>
                    <span className="text-amber-700 font-bold">
                      {isHi ? batch.modeHi : batch.modeEn}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0b1936]">
                    {isHi ? batch.nameHi : batch.nameEn}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {isHi ? batch.timingHi : batch.timingEn}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#0b1936]">
                      {isHi
                        ? `${batch.seatsLeft} सीटें बाकी (नमूना)`
                        : `${batch.seatsLeft} seats left (Sample)`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePrefillAdmission(
                      batch.courseId,
                      `बैच चयनित: ${batch.nameHi}`,
                      `Selected batch: ${batch.nameEn}`
                    )
                  }
                  className="pws-btn-amber px-4 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isHi ? 'पूछताछ करें' : 'Enquire'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAMPUS & ACADEMIC FACILITIES (6 PHOTO CARDS) */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pws-reveal max-w-2xl mb-10">
            <p className="text-xs font-bold text-amber-700">
              {isHi ? 'शैक्षणिक परिसर और संसाधन' : 'Campus & Academic Infrastructure'}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0b1936] text-balance">
              {isHi ? 'अध्ययन के लिए आधुनिक सुविधाएँ' : 'Modern Facilities Built for Focused Study'}
            </h2>
          </div>

          <div className="pws-stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAMPUS_FACILITIES.map((fac) => (
              <article
                key={fac.id}
                className="pws-card-3d rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={fac.image}
                    alt={isHi ? fac.titleHi : fac.titleEn}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-5 space-y-1.5">
                  <h3 className="text-base font-extrabold text-[#0b1936]">
                    {isHi ? fac.titleHi : fac.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isHi ? fac.descHi : fac.descEn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FREE SCHOLARSHIP TEST WIDGET + FEE CALCULATOR */}
      <section
        id="vs-test-series"
        className="py-14 sm:py-16 bg-[#0b1936] text-white scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 5-MCQ Scholarship Test Widget */}
          <div className="lg:col-span-7 pws-card-3d-dark rounded-2xl p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold text-amber-400">
                  {isHi ? 'इंटरैक्टिव मिनी टेस्ट · नमूना' : 'Interactive Mini Test · Sample'}
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                  {isHi ? 'फ़्री स्कॉलरशिप अभ्यास टेस्ट (5 प्रश्न)' : 'Free Scholarship Practice Test (5 MCQs)'}
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-amber-400/30 font-mono tabular-nums text-sm font-bold text-amber-300">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(quizSecondsLeft)}</span>
              </div>
            </div>

            {!quizStarted ? (
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-200 leading-relaxed">
                  {isHi
                    ? 'भौतिकी, रसायन और गणित के 5 नमूना बहुविकल्पीय प्रश्न हल करें। टाइमर के साथ तुरंत स्कोर और सही उत्तर की व्याख्या देखें।'
                    : 'Attempt 5 sample multiple-choice questions across Physics, Chemistry, and Mathematics with a live timer, instant score, and answer explanations.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuizStarted(true);
                    setQuizSubmitted(false);
                    setQuizSecondsLeft(300);
                  }}
                  className="pws-btn-amber px-5 py-3 rounded-lg text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{isHi ? 'स्कॉलरशिप टेस्ट शुरू करें' : 'Start Scholarship Test'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {SCHOLARSHIP_QUESTIONS.map((q, qIdx) => {
                  const chosen = quizAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-white leading-snug">
                          <span className="text-amber-400 font-mono mr-1.5">Q{qIdx + 1}.</span>
                          {isHi ? q.questionHi : q.questionEn}
                        </p>
                        <span className="text-[11px] text-slate-300 shrink-0">
                          {isHi ? q.subjectHi : q.subjectEn}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(isHi ? q.optionsHi : q.optionsEn).map((opt, optIdx) => {
                          const selected = chosen === optIdx;
                          const isCorrect = optIdx === q.correctIndex;
                          let btnClass =
                            'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10';
                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnClass =
                                'bg-emerald-500/20 border-emerald-400 text-emerald-100';
                            } else if (selected && !isCorrect) {
                              btnClass = 'bg-rose-500/20 border-rose-400 text-rose-100';
                            }
                          } else if (selected) {
                            btnClass = 'bg-amber-400/20 border-amber-400 text-amber-100';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() =>
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className={`text-left px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${btnClass}`}
                            >
                              <span className="font-mono font-bold mr-2">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <p className="text-xs text-emerald-300 pt-1">
                          {isHi ? 'सही उत्तर व्याख्या: ' : 'Explanation: '}
                          {isHi ? q.explanationHi : q.explanationEn}
                        </p>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-slate-300 font-mono tabular-nums">
                      {isHi
                        ? `उत्तर दिए: ${Object.keys(quizAnswers).length} / ${SCHOLARSHIP_QUESTIONS.length}`
                        : `Answered: ${Object.keys(quizAnswers).length} / ${SCHOLARSHIP_QUESTIONS.length}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuizSubmitted(true)}
                      className="pws-btn-amber px-5 py-2.5 rounded-lg text-sm font-extrabold cursor-pointer"
                    >
                      {isHi ? 'टेस्ट सबमिट करें' : 'Submit Test'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-400/15 border border-amber-400/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-amber-300 font-mono tabular-nums">
                        {isHi
                          ? `आपका स्कोर: ${quizScore} / ${SCHOLARSHIP_QUESTIONS.length} (${Math.round(
                              (quizScore / SCHOLARSHIP_QUESTIONS.length) * 100
                            )}%) — नमूना परिणाम`
                          : `Your Score: ${quizScore} / ${SCHOLARSHIP_QUESTIONS.length} (${Math.round(
                              (quizScore / SCHOLARSHIP_QUESTIONS.length) * 100
                            )}%) — Sample Result`}
                      </p>
                      <p className="text-xs text-slate-200">
                        {isHi
                          ? 'सभी सही उत्तर और व्याख्या ऊपर हरे रंग में हाइलाइट कर दिए गए हैं।'
                          : 'All correct answers and explanations are highlighted above.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetQuiz}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                    >
                      {isHi ? 'दोबारा अभ्यास करें' : 'Retake Practice'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Fee Calculator */}
          <div
            id="vs-fees"
            className="lg:col-span-5 bg-white text-slate-900 rounded-2xl p-5 sm:p-7 shadow-xl border border-slate-200 space-y-5 scroll-mt-24"
          >
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'फ़ीस कैलकुलेटर · नमूना दरें' : 'Fee Calculator · Sample Structure'}
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1936] mt-0.5">
                {isHi ? 'कोर्स फ़ीस और किस्त गणना' : 'Course Fee & Installment Estimator'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="vs-calc-course"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  {isHi ? 'कोर्स चुनें' : 'Select Course'}
                </label>
                <select
                  id="vs-calc-course"
                  value={calcCourseId}
                  onChange={(e) => setCalcCourseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900"
                >
                  {ACADEMY_COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isHi ? c.nameHi : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isHi ? 'किस्तों की संख्या चुनें' : 'Choose Installments'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {([1, 3, 6] as const).map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => setCalcInstallments(inst)}
                      className={`py-2.5 rounded-lg border text-xs sm:text-sm font-extrabold font-mono tabular-nums cursor-pointer transition-colors ${
                        calcInstallments === inst
                          ? 'bg-[#0b1936] text-amber-300 border-[#0b1936]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-[#0b1936]'
                      }`}
                    >
                      {inst} {isHi ? (inst === 1 ? 'किस्त' : 'किस्तें') : inst === 1 ? 'Plan' : 'EMIs'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{isHi ? 'शिक्षण शुल्क (नमूना)' : 'Tuition Fee (Sample)'}</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {formatINR(calcCourse.sampleFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {isHi ? 'अध्ययन सामग्री व टेस्ट सीरीज़' : 'Study Material & Test Series'}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {formatINR(calcCourse.materialFee)}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                  <span className="font-extrabold text-[#0b1936]">
                    {isHi ? 'कुल नमूना शुल्क' : 'Total Sample Fee'}
                  </span>
                  <span className="text-xl font-extrabold text-[#0b1936] font-mono tabular-nums">
                    {formatINR(calcTotal)}
                  </span>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900">
                    {isHi
                      ? `प्रति किस्त (${calcInstallments} किस्त)`
                      : `Per Installment (${calcInstallments}x)`}
                  </span>
                  <span className="font-mono tabular-nums font-extrabold text-amber-950 text-sm">
                    {formatINR(calcPerInstallment)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handlePrefillAdmission(
                    calcCourse.id,
                    `फ़ीस गणना: ${calcCourse.nameHi} (${calcInstallments} किस्तें)`,
                    `Fee plan: ${calcCourse.nameEn} (${calcInstallments} installments)`
                  )
                }
                className="pws-btn-3d w-full py-3 rounded-lg text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isHi ? 'इस प्लान के लिए पूछताछ करें' : 'Enquire About This Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION + ADMISSION INQUIRY & DEMO CONTACT */}
      <section id="vs-contact" className="py-14 sm:py-16 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* FAQ Accordion (6 Questions) */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <p className="text-xs font-bold text-amber-700">
                {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#0b1936]">
                {isHi ? 'अभिभावकों व छात्रों के प्रमुख सवाल' : 'Common Questions From Parents & Students'}
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
              {ACADEMY_FAQS.map((faq) => {
                const open = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="bg-white">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaqId(open ? null : faq.id)}
                      className="w-full px-4 sm:px-5 py-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="text-sm font-bold text-[#0b1936]">
                        {isHi ? faq.qHi : faq.qEn}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                          open ? 'rotate-180 text-amber-600' : ''
                        }`}
                      />
                    </button>
                    {open && (
                      <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {isHi ? faq.aHi : faq.aEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admission Inquiry Form + Demo Contact Info */}
          <div className="lg:col-span-6 space-y-5">
            <div className="pws-card-3d rounded-2xl p-5 sm:p-7 space-y-4">
              <div>
                <p className="text-xs font-bold text-amber-700">
                  {isHi ? 'एडमिशन पूछताछ · नमूना फ़ॉर्म' : 'Admission Inquiry · Sample Form'}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#0b1936]">
                  {isHi ? 'निःशुल्क काउंसलिंग व एडमिशन फॉर्म' : 'Free Counselling & Admission Inquiry'}
                </h2>
                {formContextHint && (
                  <p className="mt-1.5 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                    {formContextHint}
                  </p>
                )}
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="vs-inq-name" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'छात्र / अभिभावक का नाम' : 'Student / Parent Name'}
                  </label>
                  <input
                    id="vs-inq-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={isHi ? 'जैसे: आरव शर्मा (नमूना)' : 'e.g. Aarav Sharma (Sample)'}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="vs-inq-class" className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'वर्तमान कक्षा' : 'Current Class'}
                    </label>
                    <select
                      id="vs-inq-class"
                      value={formClass}
                      onChange={(e) => setFormClass(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white"
                    >
                      <option value="कक्षा 8">{isHi ? 'कक्षा 8' : 'Class 8'}</option>
                      <option value="कक्षा 9">{isHi ? 'कक्षा 9' : 'Class 9'}</option>
                      <option value="कक्षा 10">{isHi ? 'कक्षा 10' : 'Class 10'}</option>
                      <option value="कक्षा 11">{isHi ? 'कक्षा 11' : 'Class 11'}</option>
                      <option value="कक्षा 12">{isHi ? 'कक्षा 12' : 'Class 12'}</option>
                      <option value="ड्रॉपर / स्नातक">{isHi ? 'ड्रॉपर / स्नातक' : 'Dropper / Graduate'}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vs-inq-course" className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'इच्छित कोर्स' : 'Target Course'}
                    </label>
                    <select
                      id="vs-inq-course"
                      value={formCourse}
                      onChange={(e) => setFormCourse(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white"
                    >
                      {ACADEMY_COURSES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {isHi ? c.nameHi : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="vs-inq-mobile" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'मोबाइल नंबर (10 अंक)' : 'Mobile Number (10 digits)'}
                  </label>
                  <input
                    id="vs-inq-mobile"
                    type="tel"
                    required
                    pattern="[0-9\s+\-]{10,15}"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="90000 00000"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-mono bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="pws-btn-3d w-full py-3 rounded-lg text-sm font-bold cursor-pointer"
                >
                  {isHi ? 'एडमिशन पूछताछ भेजें (डेमो)' : 'Submit Admission Inquiry (Demo)'}
                </button>

                {formFeedback && (
                  <div
                    role="status"
                    className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm font-semibold text-emerald-900 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{formFeedback}</span>
                  </div>
                )}
              </form>

              {/* Demo Contact Details */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div className="space-y-1">
                  <div className="font-bold text-[#0b1936]">
                    {isHi ? 'डेमो जानकारी (संपर्क)' : 'Demo Information (Contact)'}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      +91 90000 00000
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      hello@vidyashikhar.example
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES SECTION (12 ICONS) */}
      <section className="py-14 sm:py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pws-reveal max-w-2xl mb-10">
            <p className="text-xs font-bold text-amber-700">
              {isHi ? 'संपूर्ण कोचिंग प्लेटफ़ॉर्म क्षमताएँ' : 'Complete Coaching Platform Capabilities'}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0b1936] text-balance">
              {isHi ? 'इस प्लेटफ़ॉर्म की 12 प्रमुख सुविधाएँ' : '12 Core Modules Included in This Platform'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_FEATURES.map((feat) => {
              const Icon = FEATURE_ICON_MAP[feat.id] || HelpCircle;
              return (
                <div
                  key={feat.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0b1936] text-amber-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#0b1936]">
                      {isHi ? feat.titleHi : feat.titleEn}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      {isHi ? feat.descHi : feat.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PACKAGES SECTION (3 CARDS — SAMPLE PRICING) */}
      <section className="py-14 sm:py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pws-reveal max-w-2xl mb-10">
            <p className="text-xs font-bold text-amber-700">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo'}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0b1936] text-balance">
              {isHi ? 'कोचिंग संस्थान के लिए प्लेटफ़ॉर्म पैकेज' : 'Platform Packages for Coaching Institutes'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_PACKAGES.map((pkg) => (
              <article
                key={pkg.id}
                className={`rounded-2xl p-6 flex flex-col justify-between gap-6 border ${
                  pkg.featured
                    ? 'bg-[#0b1936] text-white border-amber-400/50 shadow-xl'
                    : 'bg-white text-slate-900 border-slate-200 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        pkg.featured ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      {isHi ? pkg.audienceHi : pkg.audienceEn}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums">
                      {pkg.price}
                    </div>
                    <p
                      className={`text-[11px] mt-1 ${
                        pkg.featured ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo'}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm">
                    {(isHi ? pkg.pointsHi : pkg.pointsEn).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            pkg.featured ? 'text-amber-400' : 'text-emerald-600'
                          }`}
                        />
                        <span className={pkg.featured ? 'text-slate-100' : 'text-slate-700'}>
                          {pt}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onRequestQuote}
                  className={`w-full py-3 rounded-lg text-sm font-extrabold cursor-pointer ${
                    pkg.featured ? 'pws-btn-amber' : 'pws-btn-3d'
                  }`}
                >
                  {isHi ? 'कोटेशन पूछें' : 'Request Quote'}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COURSE DETAIL MODAL */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vs-course-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#0b1936] text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-amber-300">
                  {selectedCourse.code} · {isHi ? selectedCourse.durationHi : selectedCourse.durationEn}
                </p>
                <h3 id="vs-course-modal-title" className="text-lg font-extrabold truncate">
                  {isHi ? selectedCourse.nameHi : selectedCourse.nameEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                aria-label={isHi ? 'बंद करें' : 'Close modal'}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                {isHi ? selectedCourse.summaryHi : selectedCourse.summaryEn}
              </p>

              {/* Syllabus Accordion */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-extrabold text-[#0b1936] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>{isHi ? 'पाठ्यक्रम (सिलेबस)' : 'Course Syllabus'}</span>
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                  {selectedCourse.syllabus.map((unit, idx) => {
                    const expanded = openUnitIdx === idx;
                    return (
                      <div key={idx}>
                        <button
                          type="button"
                          onClick={() => setOpenUnitIdx(expanded ? -1 : idx)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        >
                          <span className="text-xs sm:text-sm font-bold text-[#0b1936]">
                            {isHi ? unit.unitHi : unit.unitEn}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 transition-transform ${
                              expanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {expanded && (
                          <ul className="px-5 py-3 bg-white space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc list-inside">
                            {(isHi ? unit.topicsHi : unit.topicsEn).map((topic, ti) => (
                              <li key={ti}>{topic}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Timetable */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-extrabold text-[#0b1936] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>{isHi ? 'साप्ताहिक टाइमटेबल (नमूना)' : 'Weekly Timetable (Sample)'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCourse.timetable.map((slot, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs"
                    >
                      <div className="font-extrabold text-[#0b1936]">
                        {isHi ? slot.dayHi : slot.dayEn}
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        {isHi ? slot.slotHi : slot.slotEn}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Installments */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-extrabold text-[#0b1936] flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-600" />
                  <span>{isHi ? 'फ़ीस किस्त विवरण (नमूना)' : 'Fee Installments (Sample)'}</span>
                </h4>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  {[1, 3, 6].map((cnt) => {
                    const total = selectedCourse.sampleFee + selectedCourse.materialFee;
                    return (
                      <div
                        key={cnt}
                        className="rounded-xl bg-slate-50 border border-slate-200 p-3"
                      >
                        <div className="text-[11px] font-bold text-slate-500">
                          {cnt} {isHi ? (cnt === 1 ? 'एकमुश्त' : 'किस्तें') : cnt === 1 ? 'Lump Sum' : 'Installments'}
                        </div>
                        <div className="mt-1 text-sm sm:text-base font-extrabold text-[#0b1936] font-mono tabular-nums">
                          {formatINR(Math.ceil(total / cnt))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal CTA */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePrefillAdmission(
                      selectedCourse.id,
                      `कोर्स चयनित: ${selectedCourse.nameHi}`,
                      `Selected course: ${selectedCourse.nameEn}`
                    )
                  }
                  className="pws-btn-amber px-5 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>{isHi ? 'अभी एडमिशन लें' : 'Enroll Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
