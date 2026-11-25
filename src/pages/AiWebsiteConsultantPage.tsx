import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Globe,
  History,
  Loader2,
  Lock,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import type { Language } from '../types';
import type {
  AiConsultationSession,
  AiConsultantCollected,
  AiConsultantConsent,
  AiConsultantMessage,
  AiConsultantSessionStatus,
} from '../types/aiConsultant';
import {
  AI_CONSULTANT_MAX_STORED_MESSAGES,
  AI_CONSULTANT_POLICY_VERSION,
  AiConsultantApiError,
  AiConsultantFirestoreError,
  createAiConsultantSession,
  generateAiSessionId,
  listUserAiConsultantSessions,
  sendAiConsultantChatMessage,
  updateAiConsultantSession,
} from '../firebase/aiConsultantService';

const MAX_MESSAGE_LENGTH = 1500;

const STEP_LABELS: Array<{ step: number; hi: string; en: string }> = [
  { step: 1, hi: 'बिजनेस परिचय', en: 'Business Overview' },
  { step: 2, hi: 'वेबसाइट का प्रकार', en: 'Website Type' },
  { step: 3, hi: 'ऑडियंस व लक्ष्य', en: 'Audience & Goal' },
  { step: 4, hi: 'जरूरी पेज', en: 'Key Pages' },
  { step: 5, hi: 'डिज़ाइन पसंद', en: 'Design Style' },
  { step: 6, hi: 'फ़ीचर्स व तकनीकी जरूरत', en: 'Features & Scope' },
  { step: 7, hi: 'बजट, समय व संसाधन', en: 'Budget & Readiness' },
  { step: 8, hi: 'सारांश व सुधार', en: 'Summary & Edit' },
];

function buildWelcomeMessage(lang: Language): AiConsultantMessage {
  const isHi = lang === 'hi';
  return {
    id: 'welcome_intro',
    role: 'assistant',
    step: 1,
    createdAt: new Date().toISOString(),
    text: isHi
      ? 'नमस्ते! मैं आपका AI Website Consultant हूँ। आपको वेबसाइट बनवाने के लिए पहले से कोई आइडिया होना जरूरी नहीं है। मैं आपको एक-एक कदम पर गाइड करूंगा।\n\nचलिए शुरू करते हैं — आपके बिजनेस या प्रोजेक्ट का नाम क्या है, यह क्या काम करता है, और क्या यह नया बिजनेस है या पहले से चल रहा है?'
      : "Hello! I'm your AI Website Consultant. You don't need a website idea beforehand—I'll guide you step by step.\n\nLet's begin: What is the name of your business or project, what does it do, and is it a new or existing business?",
    quickReplies: isHi
      ? ['मेरा नया बिजनेस शुरू होने वाला है', 'मेरा पहले से चल रहा बिजनेस है', 'अभी नाम तय नहीं किया है']
      : ['Starting a new business', 'Existing business going online', 'Name not decided yet'],
  };
}

function formatMessageLines(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function getSessionPreviewLabel(session: AiConsultationSession, isHi: boolean): string {
  if (session.collected.businessName) {
    return session.collected.businessName;
  }
  const firstUserMsg = session.messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    return firstUserMsg.text.slice(0, 42) + (firstUserMsg.text.length > 42 ? '…' : '');
  }
  return isHi ? 'सहेजा गया वेबसाइट प्लान' : 'Saved Website Plan';
}

export const AiWebsiteConsultantPage: React.FC = () => {
  const { currentUser, isAuthReady, openAuthModal } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { navigate } = useNavigation();
  const isHi = language === 'hi';

  const [savedSessions, setSavedSessions] = useState<AiConsultationSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [status, setStatus] = useState<AiConsultantSessionStatus>('in_progress');
  const [collected, setCollected] = useState<AiConsultantCollected>({});
  const [messages, setMessages] = useState<AiConsultantMessage[]>(() => [
    buildWelcomeMessage(language),
  ]);

  const [consentChecked, setConsentChecked] = useState(false);
  const [recordedConsent, setRecordedConsent] = useState<AiConsultantConsent | null>(null);
  const [consentPromptVisible, setConsentPromptVisible] = useState(false);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const [showMobilePlanPanel, setShowMobilePlanPanel] = useState(false);

  const autoOpenedAuthRef = useRef(false);
  const loadedForUidRef = useRef<string | null>(null);
  const hasUserInteractedRef = useRef(false);
  const sendingLockRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const pendingSaveRef = useRef<{
    ownerUid: string;
    language: Language;
    step: number;
    status: AiConsultantSessionStatus;
    collected: AiConsultantCollected;
    messages: AiConsultantMessage[];
    consent: AiConsultantConsent;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Open existing AuthModal automatically once when arriving logged out
  useEffect(() => {
    if (!isAuthReady) return;
    if (!currentUser && !autoOpenedAuthRef.current) {
      autoOpenedAuthRef.current = true;
      openAuthModal('login');
    }
    if (currentUser) {
      autoOpenedAuthRef.current = false;
    }
  }, [isAuthReady, currentUser, openAuthModal]);

  // Keep welcome message synced to language before user starts chatting (without causing a render loop)
  useEffect(() => {
    setMessages((prev) => {
      if (activeSessionId || prev.length !== 1 || prev[0]?.id !== 'welcome_intro') {
        return prev;
      }
      const nextWelcome = buildWelcomeMessage(language);
      if (prev[0].text === nextWelcome.text) {
        return prev;
      }
      return [nextWelcome];
    });
  }, [language, activeSessionId]);

  const hydrateFromSession = useCallback((session: AiConsultationSession) => {
    activeSessionIdRef.current = session.id;
    setActiveSessionId(session.id);
    setStep(session.step);
    setStatus(session.status);
    setCollected(session.collected);
    setMessages(
      session.messages.length > 0 ? session.messages : [buildWelcomeMessage(session.language)]
    );
    setRecordedConsent(session.consent);
    setConsentChecked(true);
    setConsentPromptVisible(false);
    setChatError(null);
    setSaveWarning(null);
    setHasPendingSave(false);
    pendingSaveRef.current = null;
    setLastFailedInput(null);
    setSaveState('saved');
  }, []);

  const loadSessionsForUser = useCallback(
    async (uid: string) => {
      setLoadingSessions(true);
      setSessionLoadError(null);
      try {
        const list = await listUserAiConsultantSessions(uid);
        setSavedSessions(list);
        // Never overwrite an active conversation if the user already started chatting before history loaded
        if (hasUserInteractedRef.current) {
          return;
        }
        if (list.length > 0) {
          hydrateFromSession(list[0]);
        } else {
          activeSessionIdRef.current = null;
          setActiveSessionId(null);
          setStep(1);
          setStatus('in_progress');
          setCollected({});
          setMessages([buildWelcomeMessage(language)]);
          setRecordedConsent(null);
          setConsentChecked(false);
          setSaveState('idle');
        }
      } catch (err: any) {
        const code = err instanceof AiConsultantFirestoreError ? err.code : '';
        const msg = String(err?.message || '');
        if (code === 'offline' || code === 'unavailable' || msg === 'OFFLINE_FIRESTORE') {
          setSessionLoadError(
            isHi
              ? 'इंटरनेट या डेटाबेस कनेक्शन उपलब्ध नहीं है। आप नया चैट शुरू कर सकते हैं।'
              : 'Database connection is currently offline. You can retry loading your saved plan.'
          );
        } else {
          setSessionLoadError(
            isHi
              ? 'पिछला सेशन लोड नहीं हो सका। आप दोबारा कोशिश करें या नया प्लान शुरू करें।'
              : 'Could not load your saved session. You can retry or start a new plan.'
          );
        }
      } finally {
        setLoadingSessions(false);
      }
    },
    [hydrateFromSession, isHi, language]
  );

  // Fetch user's saved sessions on login
  useEffect(() => {
    if (!isAuthReady) return;
    if (!currentUser) {
      loadedForUidRef.current = null;
      hasUserInteractedRef.current = false;
      activeSessionIdRef.current = null;
      pendingSaveRef.current = null;
      setHasPendingSave(false);
      setSavedSessions([]);
      setActiveSessionId(null);
      setRecordedConsent(null);
      setConsentChecked(false);
      return;
    }
    if (loadedForUidRef.current === currentUser.uid) return;
    loadedForUidRef.current = currentUser.uid;
    hasUserInteractedRef.current = false;
    void loadSessionsForUser(currentUser.uid);
  }, [isAuthReady, currentUser, loadSessionsForUser]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const handleStartNewSession = () => {
    hasUserInteractedRef.current = true;
    activeSessionIdRef.current = null;
    pendingSaveRef.current = null;
    setHasPendingSave(false);
    setActiveSessionId(null);
    setStep(1);
    setStatus('in_progress');
    setCollected({});
    setMessages([buildWelcomeMessage(language)]);
    setRecordedConsent(null);
    setConsentChecked(false);
    setConsentPromptVisible(false);
    setInputText('');
    setChatError(null);
    setSaveWarning(null);
    setLastFailedInput(null);
    setSaveState('idle');
  };

  const persistSessionSnapshot = useCallback(
    async (
      snapshot: {
        ownerUid: string;
        language: Language;
        step: number;
        status: AiConsultantSessionStatus;
        collected: AiConsultantCollected;
        messages: AiConsultantMessage[];
        consent: AiConsultantConsent;
      },
      options?: { forceConnectivityCheck?: boolean }
    ) => {
      setSaveState('saving');
      setSaveWarning(null);
      try {
        const currentId = activeSessionIdRef.current;
        if (!currentId) {
          const newId = generateAiSessionId();
          const created = await createAiConsultantSession({
            sessionId: newId,
            ownerUid: snapshot.ownerUid,
            language: snapshot.language,
            step: snapshot.step,
            status: snapshot.status,
            collected: snapshot.collected,
            messages: snapshot.messages,
            consent: snapshot.consent,
            forceConnectivityCheck: options?.forceConnectivityCheck,
          });
          activeSessionIdRef.current = created.id;
          setActiveSessionId(created.id);
          setSavedSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
        } else {
          try {
            await updateAiConsultantSession(currentId, {
              language: snapshot.language,
              step: snapshot.step,
              status: snapshot.status,
              collected: snapshot.collected,
              messages: snapshot.messages,
              forceConnectivityCheck: options?.forceConnectivityCheck,
            });
          } catch (updateErr) {
            if (updateErr instanceof AiConsultantFirestoreError && updateErr.code === 'not-found') {
              const recreated = await createAiConsultantSession({
                sessionId: currentId,
                ownerUid: snapshot.ownerUid,
                language: snapshot.language,
                step: snapshot.step,
                status: snapshot.status,
                collected: snapshot.collected,
                messages: snapshot.messages,
                consent: snapshot.consent,
                forceConnectivityCheck: options?.forceConnectivityCheck,
              });
              activeSessionIdRef.current = recreated.id;
              setActiveSessionId(recreated.id);
              setSavedSessions((prev) => [recreated, ...prev.filter((s) => s.id !== recreated.id)]);
              pendingSaveRef.current = null;
              setHasPendingSave(false);
              setSaveState('saved');
              return;
            }
            throw updateErr;
          }

          setSavedSessions((prev) => {
            const nowMs = Date.now();
            const updatedList = prev.map((s) =>
              s.id === currentId
                ? {
                    ...s,
                    language: snapshot.language,
                    step: snapshot.step,
                    status: snapshot.status,
                    collected: snapshot.collected,
                    messages: snapshot.messages,
                    updatedAtMs: nowMs,
                  }
                : s
            );
            updatedList.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
            return updatedList;
          });
        }
        pendingSaveRef.current = null;
        setHasPendingSave(false);
        setSaveState('saved');
      } catch (saveErr: any) {
        const errCode =
          saveErr instanceof AiConsultantFirestoreError
            ? saveErr.code
            : typeof saveErr?.code === 'string' && saveErr.code
            ? saveErr.code
            : 'unknown';
        pendingSaveRef.current = snapshot;
        setHasPendingSave(true);
        setSaveState('idle');
        setSaveWarning(
          isHi
            ? `AI का जवाब आ गया है, लेकिन सेशन Firestore में सेव नहीं हो पाया (${errCode})। नीचे "दोबारा सेव करें" पर क्लिक करें या अगला संदेश भेजें।`
            : `AI replied, but saving the session to Firestore failed (${errCode}). Tap "Retry Save" or send your next message.`
        );
      }
    },
    [isHi]
  );

  const handleRetrySave = async () => {
    if (!pendingSaveRef.current || saveState === 'saving') return;
    await persistSessionSnapshot(pendingSaveRef.current, { forceConnectivityCheck: true });
  };

  const handleSendMessage = async (overrideText?: string) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (sendingLockRef.current || isSending) return;

    const rawText = (overrideText !== undefined ? overrideText : inputText).trim();
    if (!rawText) return;

    const hasConsent = Boolean(recordedConsent?.accepted || consentChecked);
    if (!hasConsent) {
      setConsentPromptVisible(true);
      setChatError(
        isHi
          ? 'कृपया पहला उत्तर भेजने और सेव करने से पहले नीचे दिए गए गोपनीयता सहमति (Privacy Consent) बॉक्स पर टिक करें।'
          : 'Please check the privacy consent box below before sending and saving your first answer.'
      );
      return;
    }

    hasUserInteractedRef.current = true;
    sendingLockRef.current = true;

    const clampedText = Array.from(rawText).slice(0, MAX_MESSAGE_LENGTH).join('');
    setConsentPromptVisible(false);
    setChatError(null);
    setSaveWarning(null);
    setLastFailedInput(null);

    const activeConsent: AiConsultantConsent = recordedConsent || {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      policyVersion: AI_CONSULTANT_POLICY_VERSION,
    };

    const userMsg: AiConsultantMessage = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      text: clampedText,
      step,
      createdAt: new Date().toISOString(),
    };

    const baselineMessages = messages;
    const historyForApi = baselineMessages
      .filter((m) => m.id !== 'welcome_intro' || baselineMessages.length === 1)
      .slice(-24)
      .map((m) => ({ role: m.role, text: m.text }));

    const nextMessagesWithUser = [...baselineMessages, userMsg];
    setMessages(nextMessagesWithUser);
    if (overrideText === undefined) {
      setInputText('');
    }
    setIsSending(true);

    try {
      const aiResponse = await sendAiConsultantChatMessage({
        language,
        currentStep: step,
        message: clampedText,
        history: historyForApi,
        collected,
        user: currentUser,
      });

      const assistantMsg: AiConsultantMessage = {
        id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        text: aiResponse.reply,
        quickReplies: aiResponse.quickReplies,
        step: aiResponse.step,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...nextMessagesWithUser, assistantMsg].slice(
        -AI_CONSULTANT_MAX_STORED_MESSAGES
      );
      const nextStatus: AiConsultantSessionStatus =
        aiResponse.isSummaryReady || aiResponse.step === 8 ? 'summary_ready' : 'in_progress';

      setMessages(finalMessages);
      setStep(aiResponse.step);
      setStatus(nextStatus);
      setCollected(aiResponse.collected);
      setRecordedConsent(activeConsent);

      await persistSessionSnapshot({
        ownerUid: currentUser.uid,
        language,
        step: aiResponse.step,
        status: nextStatus,
        collected: aiResponse.collected,
        messages: finalMessages,
        consent: activeConsent,
      });
    } catch (err: any) {
      // Restore messages before optimistic user bubble so user can retry cleanly
      setMessages(baselineMessages);
      setLastFailedInput(clampedText);
      if (overrideText === undefined) {
        setInputText(clampedText);
      }

      if (err instanceof AiConsultantApiError) {
        setChatError(isHi ? err.messageHi : err.message);
      } else {
        setChatError(
          isHi
            ? 'AI Consultant से उत्तर प्राप्त नहीं हो सका। कृपया दोबारा प्रयास करें।'
            : 'Could not get a response from AI Consultant. Please try again.'
        );
      }
    } finally {
      sendingLockRef.current = false;
      setIsSending(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const currentStepMeta = STEP_LABELS.find((s) => s.step === step) || STEP_LABELS[0];
  const progressPercent = Math.round((step / 8) * 100);
  const latestMessage = messages[messages.length - 1];
  const activeQuickReplies =
    !isSending && latestMessage?.role === 'assistant' && Array.isArray(latestMessage.quickReplies)
      ? latestMessage.quickReplies
      : [];

  const editQuickReplies =
    !isSending && (status === 'summary_ready' || step === 8) && activeQuickReplies.length === 0
      ? isHi
        ? [
            'बिजनेस विवरण बदलना है',
            'पेज या फ़ीचर्स बदलना है',
            'डिज़ाइन पसंद बदलना है',
            'बजट या समय बदलना है',
          ]
        : ['Edit business info', 'Edit pages or features', 'Edit design style', 'Edit budget or timeline']
      : [];

  const displayedQuickReplies =
    activeQuickReplies.length > 0 ? activeQuickReplies : editQuickReplies;

  const collectedSummaryRows: Array<{ label: string; value: string }> = [
    {
      label: isHi ? 'बिजनेस' : 'Business',
      value: [collected.businessName, collected.businessStage].filter(Boolean).join(' · '),
    },
    {
      label: isHi ? 'वेबसाइट प्रकार' : 'Website Type',
      value: collected.websiteType || '',
    },
    {
      label: isHi ? 'लक्ष्य ऑडियंस' : 'Audience & Location',
      value: [collected.targetAudience, collected.targetLocation].filter(Boolean).join(' · '),
    },
    {
      label: isHi ? 'मुख्य विज़िटर एक्शन' : 'Main Visitor Action',
      value: collected.primaryVisitorAction || '',
    },
    {
      label: isHi ? 'पेज' : 'Pages',
      value: collected.pages?.join(', ') || '',
    },
    {
      label: isHi ? 'डिज़ाइन' : 'Design',
      value: [collected.designThemeMode, collected.designStyle, collected.designColors]
        .filter(Boolean)
        .join(' · '),
    },
    {
      label: isHi ? 'फ़ीचर्स' : 'Features',
      value: collected.features?.join(', ') || '',
    },
    {
      label: isHi ? 'बजट व समय' : 'Budget & Timeline',
      value: [collected.budget, collected.timeline].filter(Boolean).join(' · '),
    },
    {
      label: isHi ? 'डोमेन / सामग्री' : 'Domain & Assets',
      value: [collected.domainHostingStatus, collected.existingAssets].filter(Boolean).join(' · '),
    },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F4F8FF] via-white to-slate-50 overflow-x-hidden">
      {/* Consultant Workspace Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate('home')}
                aria-label={isHi ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-950 truncate">
                  Power Web Studio AI Consultant
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  {isHi
                    ? `चरण ${step} / 8 · ${currentStepMeta.hi}`
                    : `Step ${step} of 8 · ${currentStepMeta.en}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Hindi / English Toggle */}
              <div
                role="group"
                aria-label={isHi ? 'भाषा चुनें' : 'Select language'}
                className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isHi
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    !isHi
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={handleStartNewSession}
                  className="min-h-[44px] px-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-700"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isHi ? 'नया प्लान' : 'New Plan'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Step Progress Bar */}
          {currentUser && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <span className="font-semibold text-blue-800">
                  {isHi ? `चरण ${step} में से 8` : `Step ${step} of 8`}
                </span>
                <div className="flex items-center gap-3">
                  {saveState === 'saving' && (
                    <span className="text-slate-500">
                      {isHi ? 'सेव हो रहा है…' : 'Saving…'}
                    </span>
                  )}
                  {saveState === 'saved' && (
                    <span className="text-emerald-700 font-medium">
                      {isHi ? 'खाते में सेव' : 'Saved'}
                    </span>
                  )}
                  <span className="font-semibold text-slate-700">{progressPercent}%</span>
                </div>
              </div>
              <div
                className="w-full h-2 rounded-full bg-blue-100 overflow-hidden"
                role="progressbar"
                aria-valuenow={step}
                aria-valuemin={1}
                aria-valuemax={8}
                aria-label={isHi ? `चरण ${step} / 8` : `Step ${step} of 8`}
              >
                <div
                  className="h-full rounded-full bg-blue-700 transition-transform duration-300 origin-left"
                  style={{ transform: `scaleX(${progressPercent / 100})` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {!isAuthReady ? (
          <div className="max-w-lg mx-auto rounded-2xl bg-white border border-blue-100 shadow-sm p-8 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-blue-700 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-700">
              {isHi ? 'आपका खाता सत्यापित किया जा रहा है…' : 'Checking your sign-in status…'}
            </p>
          </div>
        ) : !currentUser ? (
          <div className="max-w-lg mx-auto rounded-2xl bg-white border border-blue-100 shadow-sm p-6 sm:p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-950">
                {isHi ? 'जारी रखने के लिए साइन इन करें' : 'Sign in to start planning'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {isHi
                  ? 'आपका वेबसाइट प्लान आपके खाते में सुरक्षित रूप से सेव रहेगा ताकि आप कभी भी वहीं से आगे जारी रख सकें। लॉगिन के बाद आप सीधे इसी पेज पर लौट आएंगे।'
                  : 'Your website plan is saved privately to your account so you can resume anytime. After signing in, you will return right here.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'साइन इन करें' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => navigate('home')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'मुख्य पृष्ठ पर जाएं' : 'Back to Home'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Chat Workspace */}
            <div className="lg:col-span-8 min-w-0 flex flex-col rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden">
              {/* Mobile Toggle for Saved Sessions & Plan Summary */}
              <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-2.5 bg-blue-50/60 border-b border-blue-100">
                <span className="text-xs font-medium text-slate-600 truncate">
                  {savedSessions.length > 0
                    ? isHi
                      ? `${savedSessions.length} सहेजे गए प्लान`
                      : `${savedSessions.length} saved plan(s)`
                    : isHi
                    ? 'नया वेबसाइट प्लान'
                    : 'New website plan'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobilePlanPanel((prev) => !prev)}
                  className="min-h-[40px] px-3 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-100/70 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {showMobilePlanPanel
                    ? isHi
                      ? 'सारांश छुपाएं'
                      : 'Hide Summary'
                    : isHi
                    ? 'प्लान व इतिहास देखें'
                    : 'View Plan & History'}
                </button>
              </div>

              {/* Mobile Collapsible Summary / Session Switcher */}
              {showMobilePlanPanel && (
                <div className="lg:hidden p-4 bg-slate-50 border-b border-slate-200 space-y-4">
                  {savedSessions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">
                        {isHi ? 'पिछला सेशन जारी रखें' : 'Resume a Saved Session'}
                      </p>
                      <div className="space-y-1.5">
                        {savedSessions.slice(0, 5).map((sess) => {
                          const isCurrent = sess.id === activeSessionId;
                          return (
                            <button
                              key={sess.id}
                              type="button"
                              onClick={() => {
                                hydrateFromSession(sess);
                                setShowMobilePlanPanel(false);
                              }}
                              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer border ${
                                isCurrent
                                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="truncate">{getSessionPreviewLabel(sess, isHi)}</div>
                              <div className="text-[11px] text-slate-500 font-normal mt-0.5 tabular-nums">
                                {isHi ? `चरण ${sess.step} / 8` : `Step ${sess.step} of 8`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {collectedSummaryRows.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">
                        {isHi ? 'अब तक की जानकारी' : 'Collected Plan Details'}
                      </p>
                      <dl className="space-y-1.5 text-xs">
                        {collectedSummaryRows.map((row) => (
                          <div key={row.label} className="flex flex-col">
                            <dt className="text-slate-500 font-medium">{row.label}</dt>
                            <dd className="text-slate-900 font-medium break-words">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              )}

              {/* Loading saved session state */}
              {loadingSessions && (
                <div className="px-4 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    {isHi ? 'आपका पिछला सेशन खोजा जा रहा है…' : 'Loading your saved session…'}
                  </span>
                </div>
              )}

              {sessionLoadError && (
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sessionLoadError}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void loadSessionsForUser(currentUser.uid)}
                    className="min-h-[36px] px-3 rounded-lg bg-white border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    {isHi ? 'पुनः प्रयास करें' : 'Retry'}
                  </button>
                </div>
              )}

              {/* Chat Messages Area */}
              <div className="flex-1 min-h-[380px] max-h-[62vh] overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-gradient-to-b from-[#F8FBFF] to-white">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isUser && (
                        <div
                          className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                          aria-hidden="true"
                        >
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
                          isUser
                            ? 'bg-blue-700 text-white rounded-br-md shadow-xs'
                            : 'bg-white text-slate-800 border border-blue-100 rounded-bl-md shadow-xs'
                        }`}
                      >
                        <div>{formatMessageLines(msg.text)}</div>
                      </div>

                      {isUser && (
                        <div
                          className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5"
                          aria-hidden="true"
                        >
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isSending && (
                  <div className="flex items-start gap-2.5 justify-start" aria-live="polite">
                    <div
                      className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-white border border-blue-100 px-4 py-3 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                      <Loader2 className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
                      <span>
                        {isHi
                          ? 'AI Consultant उत्तर तैयार कर रहा है…'
                          : 'AI Consultant is preparing your next step…'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick-reply chips */}
                {displayedQuickReplies.length > 0 && (
                  <div className="pt-1 pl-0 sm:pl-10">
                    <p className="text-[11px] font-medium text-slate-500 mb-2">
                      {isHi ? 'त्वरित विकल्प (चुनें या नीचे टाइप करें):' : 'Quick options (tap or type below):'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displayedQuickReplies.map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isSending}
                          onClick={() => void handleSendMessage(option)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-blue-50 active:scale-[0.99] text-blue-800 border border-blue-200 hover:border-blue-400 text-xs sm:text-sm font-semibold text-left transition-colors cursor-pointer disabled:opacity-50 break-words max-w-full focus-visible:outline-2 focus-visible:outline-blue-700"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error & Save Warning Banners */}
              {chatError && (
                <div
                  role="alert"
                  className="mx-4 sm:mx-6 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs sm:text-sm text-red-800 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="break-words">{chatError}</span>
                  </div>
                  {lastFailedInput && (
                    <button
                      type="button"
                      onClick={() => void handleSendMessage(lastFailedInput)}
                      className="min-h-[40px] px-3.5 rounded-lg bg-white border border-red-300 text-red-800 text-xs font-bold hover:bg-red-100 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isHi ? 'दोबारा भेजें' : 'Retry'}</span>
                    </button>
                  )}
                </div>
              )}

              {saveWarning && (
                <div className="mx-4 sm:mx-6 mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span className="break-words">{saveWarning}</span>
                  </div>
                  {hasPendingSave && (
                    <button
                      type="button"
                      disabled={saveState === 'saving'}
                      onClick={() => void handleRetrySave()}
                      className="min-h-[36px] px-3 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saveState === 'saving' ? 'animate-spin' : ''}`} />
                      <span>{isHi ? 'दोबारा सेव करें' : 'Retry Save'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Privacy Notice & Consent Checkbox (before first answer is saved) */}
              {!recordedConsent && (
                <div
                  className={`mx-4 sm:mx-6 mt-3 rounded-xl border p-3.5 text-xs leading-relaxed transition-colors ${
                    consentPromptVisible && !consentChecked
                      ? 'bg-red-50/70 border-red-300 text-slate-800'
                      : 'bg-blue-50/60 border-blue-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <ShieldCheck
                      className="w-4 h-4 text-blue-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p>
                      {isHi ? (
                        <>
                          आपके उत्तर केवल आपका वेबसाइट प्लान बनाने के लिए आपके खाते में निजी रूप से सेव होंगे। आपका ईमेल या फ़ोन नंबर AI को नहीं भेजा जाता। विवरण के लिए{' '}
                          <a
                            href="/privacy"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate('privacy');
                            }}
                            className="text-blue-700 font-bold underline hover:text-blue-900"
                          >
                            गोपनीयता नीति (Privacy Policy)
                          </a>{' '}
                          पढ़ें।
                        </>
                      ) : (
                        <>
                          Your answers are saved privately to your account only to build your website plan. Your email and phone number are never sent to AI. Read our{' '}
                          <a
                            href="/privacy"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate('privacy');
                            }}
                            className="text-blue-700 font-bold underline hover:text-blue-900"
                          >
                            Privacy Policy
                          </a>
                          .
                        </>
                      )}
                    </p>
                  </div>

                  <label className="flex items-center gap-3 min-h-[44px] px-2 -mx-2 rounded-lg cursor-pointer select-none hover:bg-white/60">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => {
                        setConsentChecked(e.target.checked);
                        if (e.target.checked) {
                          setConsentPromptVisible(false);
                          setChatError(null);
                        }
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-blue-700 focus:ring-blue-600 shrink-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-900">
                      {isHi
                        ? 'मैं सहमत हूँ कि मेरे वेबसाइट प्लान के उत्तर मेरे खाते में सेव किए जाएं।'
                        : 'I agree to save my website planning answers to my account.'}
                    </span>
                  </label>
                </div>
              )}

              {/* Message Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="p-4 sm:p-5 bg-white border-t border-slate-200/80 space-y-2"
              >
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 min-w-0">
                    <label htmlFor="ai-consultant-input" className="sr-only">
                      {isHi ? 'अपना उत्तर लिखें' : 'Write your reply'}
                    </label>
                    <textarea
                      id="ai-consultant-input"
                      ref={textareaRef}
                      rows={2}
                      maxLength={MAX_MESSAGE_LENGTH}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      disabled={isSending}
                      placeholder={
                        isHi
                          ? 'अपना जवाब यहाँ लिखें… (जैसे: मेरा नाम/बिजनेस, काम या पसंद)'
                          : 'Type your reply here… (e.g., your business name, what it does, or preferences)'
                      }
                      className="w-full min-h-[48px] max-h-36 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none transition-colors disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    aria-label={isHi ? 'संदेश भेजें' : 'Send message'}
                    className="min-h-[48px] min-w-[48px] sm:px-5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline">{isHi ? 'भेजें' : 'Send'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {isHi
                      ? 'कृपया चैट में अपना फ़ोन नंबर या ईमेल न लिखें।'
                      : 'Please avoid sharing personal phone numbers or emails in chat.'}
                  </span>
                  <span className="tabular-nums shrink-0 ml-2">
                    {inputText.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </form>
            </div>

            {/* Desktop Side Rail: Progress Checklist, Collected Plan & Saved Sessions */}
            <aside className="hidden lg:flex lg:col-span-4 flex-col gap-5 min-w-0">
              {/* Live Website Plan Summary */}
              <div className="rounded-2xl bg-white border border-blue-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold text-slate-950">
                    {isHi ? 'आपका वेबसाइट प्लान' : 'Your Website Plan'}
                  </h2>
                  <span className="text-xs font-semibold text-blue-700 tabular-nums">
                    {step}/8
                  </span>
                </div>

                {collectedSummaryRows.length > 0 ? (
                  <dl className="space-y-3 text-xs divide-y divide-slate-100">
                    {collectedSummaryRows.map((row) => (
                      <div key={row.label} className="pt-2.5 first:pt-0">
                        <dt className="text-slate-500 font-medium">{row.label}</dt>
                        <dd className="text-slate-900 font-semibold mt-0.5 break-words leading-relaxed">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isHi
                      ? 'जैसे-जैसे आप सवालों के जवाब देंगे, आपके बिजनेस, पेज, डिज़ाइन और फ़ीचर्स का विवरण यहाँ अपने आप जुड़ता जाएगा।'
                      : 'As you answer each step, your business details, pages, design preferences, and features will appear here automatically.'}
                  </p>
                )}

                {collected.featureNotes && (
                  <div className="pt-3 border-t border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">
                      {isHi ? 'तकनीकी / अतिरिक्त आवश्यकता नोट्स' : 'Technical & Integration Notes'}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed break-words">
                      {collected.featureNotes}
                    </p>
                  </div>
                )}

                {/* 8-Step Checklist */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  {STEP_LABELS.map((item) => {
                    const done = item.step < step || status === 'summary_ready';
                    const active = item.step === step;
                    return (
                      <div
                        key={item.step}
                        className={`flex items-center gap-2 text-xs py-1 ${
                          active
                            ? 'text-blue-800 font-bold'
                            : done
                            ? 'text-slate-700 font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 text-center tabular-nums font-bold shrink-0">
                            {item.step}.
                          </span>
                        )}
                        <span className="truncate">{isHi ? item.hi : item.en}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saved Sessions Switcher */}
              <div className="rounded-2xl bg-white border border-blue-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                    <h2 className="text-sm font-extrabold text-slate-950">
                      {isHi ? 'सहेजे गए सेशन' : 'Saved Sessions'}
                    </h2>
                  </div>
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                </div>

                {loadingSessions ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                    <span>{isHi ? 'लोड हो रहा है…' : 'Loading…'}</span>
                  </div>
                ) : savedSessions.length === 0 ? (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isHi
                      ? 'अभी कोई सहेजा गया सेशन नहीं है। पहला उत्तर भेजते ही आपका प्लान अपने आप सेव हो जाएगा।'
                      : 'No saved sessions yet. Your plan will save automatically after your first reply.'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedSessions.map((sess) => {
                      const isCurrent = sess.id === activeSessionId;
                      return (
                        <button
                          key={sess.id}
                          type="button"
                          onClick={() => hydrateFromSession(sess)}
                          className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer border ${
                            isCurrent
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                              : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="truncate">{getSessionPreviewLabel(sess, isHi)}</div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-normal mt-0.5 tabular-nums">
                            <span>
                              {isHi ? `चरण ${sess.step} / 8` : `Step ${sess.step} of 8`}
                            </span>
                            <span>
                              {sess.status === 'summary_ready'
                                ? isHi
                                  ? 'सारांश तैयार'
                                  : 'Summary ready'
                                : isHi
                                ? 'जारी है'
                                : 'In progress'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
