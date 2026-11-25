import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Eye,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { AiConsultationSession, AiConsultantCollected } from '../../types/aiConsultant';
import {
  AiConsultantFirestoreError,
  deleteAiConsultationSessionAsAdmin,
  listAllAiConsultantSessionsForAdmin,
} from '../../firebase/aiConsultantService';

interface AdminUserRecord {
  uid?: string;
  id?: string;
  displayName?: string;
  email?: string;
}

interface AdminAiConsultantSessionsSectionProps {
  isAuthorizedAdmin: boolean;
  usersList: AdminUserRecord[];
}

const COLLECTED_FIELD_LABELS: Array<{
  key: keyof AiConsultantCollected;
  en: string;
  hi: string;
}> = [
  { key: 'businessName', en: 'Business Name', hi: 'बिजनेस का नाम' },
  { key: 'businessDescription', en: 'Business Description', hi: 'बिजनेस विवरण' },
  { key: 'businessStage', en: 'Business Stage', hi: 'बिजनेस चरण' },
  { key: 'websiteType', en: 'Website Type', hi: 'वेबसाइट का प्रकार' },
  { key: 'recommendedConcepts', en: 'Recommended Concepts', hi: 'सुझाए गए कॉन्सेप्ट' },
  { key: 'targetAudience', en: 'Target Audience', hi: 'लक्ष्य ऑडियंस' },
  { key: 'targetLocation', en: 'Target Location', hi: 'लक्ष्य लोकेशन' },
  { key: 'primaryVisitorAction', en: 'Primary Visitor Action', hi: 'मुख्य विज़िटर एक्शन' },
  { key: 'pages', en: 'Pages', hi: 'पेज' },
  { key: 'designThemeMode', en: 'Design Theme Mode', hi: 'डिज़ाइन थीम मोड' },
  { key: 'designStyle', en: 'Design Style', hi: 'डिज़ाइन स्टाइल' },
  { key: 'designColors', en: 'Design Colors', hi: 'डिज़ाइन रंग' },
  { key: 'designFonts', en: 'Design Fonts', hi: 'डिज़ाइन फ़ॉन्ट' },
  { key: 'designButtons', en: 'Design Buttons', hi: 'बटन स्टाइल' },
  { key: 'designNavigation', en: 'Navigation Style', hi: 'नेविगेशन स्टाइल' },
  { key: 'designHero', en: 'Hero Section', hi: 'हीरो सेक्शन' },
  { key: 'designMedia', en: 'Media & Visuals', hi: 'मीडिया व विजुअल्स' },
  { key: 'designAnimations', en: 'Animations', hi: 'एनीमेशन' },
  { key: 'features', en: 'Features', hi: 'फ़ीचर्स' },
  { key: 'featureNotes', en: 'Feature Notes', hi: 'फ़ीचर नोट्स' },
  { key: 'budget', en: 'Budget', hi: 'बजट' },
  { key: 'timeline', en: 'Timeline', hi: 'समय-सीमा' },
  { key: 'domainHostingStatus', en: 'Domain & Hosting', hi: 'डोमेन और होस्टिंग' },
  { key: 'existingAssets', en: 'Existing Assets', hi: 'मौजूदा सामग्री' },
  { key: 'summary', en: 'Plan Summary', hi: 'योजना सारांश' },
];

function formatDateTime(ms: number, lang: 'hi' | 'en'): string {
  if (!ms || !Number.isFinite(ms)) return '—';
  try {
    return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

function formatIsoTimestamp(iso: string, lang: 'hi' | 'en'): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return iso || '—';
  return formatDateTime(parsed, lang);
}

export const AdminAiConsultantSessionsSection: React.FC<
  AdminAiConsultantSessionsSectionProps
> = ({ isAuthorizedAdmin, usersList }) => {
  const { language, t } = useLanguage();
  const isHi = language === 'hi';

  const [sessions, setSessions] = useState<AiConsultationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'summary_ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<AiConsultationSession | null>(null);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<AiConsultationSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userLookupByUid = useMemo(() => {
    const map = new Map<string, { displayName: string; email: string }>();
    for (const u of usersList) {
      const uid = String(u?.uid || u?.id || '').trim();
      if (!uid) continue;
      map.set(uid, {
        displayName: typeof u.displayName === 'string' ? u.displayName.trim() : '',
        email: typeof u.email === 'string' ? u.email.trim() : '',
      });
    }
    return map;
  }, [usersList]);

  const loadSessions = useCallback(
    async (forceConnectivityCheck = false) => {
      if (!isAuthorizedAdmin) return;
      setLoading(true);
      setError(null);
      try {
        const list = await listAllAiConsultantSessionsForAdmin(50, forceConnectivityCheck);
        setSessions(list);
      } catch (err: unknown) {
        const code = err instanceof AiConsultantFirestoreError ? err.code : 'unknown';
        if (code === 'permission-denied') {
          setError(
            t(
              'Permission denied while reading AI Consultant sessions (permission-denied).',
              'AI Consultant सेशन पढ़ने की अनुमति नहीं मिली (permission-denied)।'
            )
          );
        } else if (code === 'unavailable' || code === 'offline') {
          setError(
            t(
              'Unable to reach Cloud Firestore right now. Please check connection and retry.',
              'अभी Cloud Firestore से संपर्क नहीं हो पा रहा है। कृपया कनेक्शन जांचकर दोबारा प्रयास करें।'
            )
          );
        } else {
          setError(
            t(
              `Could not load AI Consultant sessions (${code}). Please try again.`,
              `AI Consultant सेशन लोड नहीं हो सके (${code})। कृपया दोबारा प्रयास करें।`
            )
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [isAuthorizedAdmin, t]
  );

  useEffect(() => {
    if (!isAuthorizedAdmin) {
      setSessions([]);
      setSelectedSession(null);
      setPendingDeleteSession(null);
      return;
    }
    void loadSessions(false);
  }, [isAuthorizedAdmin, loadSessions]);

  // Close confirm dialog or detail modal on Escape
  useEffect(() => {
    if (!selectedSession && !pendingDeleteSession) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pendingDeleteSession) {
        if (!deletingSessionId) {
          setPendingDeleteSession(null);
        }
        return;
      }
      if (selectedSession && !deletingSessionId) {
        setSelectedSession(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedSession, pendingDeleteSession, deletingSessionId]);

  const handleRequestDelete = (session: AiConsultationSession) => {
    if (!isAuthorizedAdmin || deletingSessionId) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    setPendingDeleteSession(session);
  };

  const handleConfirmDelete = async () => {
    if (!isAuthorizedAdmin || !pendingDeleteSession || deletingSessionId) return;
    const target = pendingDeleteSession;
    setDeletingSessionId(target.id);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      await deleteAiConsultationSessionAsAdmin(target.id);
      setSessions((prev) => prev.filter((s) => s.id !== target.id));
      setSelectedSession((prev) => (prev?.id === target.id ? null : prev));
      setPendingDeleteSession(null);
      setDeleteSuccess(
        t('Session deleted successfully.', 'सेशन सफलतापूर्वक हटा दिया गया।')
      );
    } catch (err: unknown) {
      const code = err instanceof AiConsultantFirestoreError ? err.code : 'unknown';
      setPendingDeleteSession(null);
      if (code === 'permission-denied') {
        setDeleteError(
          t(
            'Permission denied while deleting this session (permission-denied).',
            'यह सेशन हटाने की अनुमति नहीं मिली (permission-denied)।'
          )
        );
      } else if (code === 'unavailable' || code === 'offline') {
        setDeleteError(
          t(
            'Could not reach Cloud Firestore to delete this session. Please check connection and retry.',
            'सेशन हटाने के लिए Cloud Firestore से संपर्क नहीं हो पाया। कृपया कनेक्शन जांचकर दोबारा प्रयास करें।'
          )
        );
      } else {
        setDeleteError(
          t(
            `Failed to delete session (${code}). Please try again.`,
            `सेशन हटाया नहीं जा सका (${code})। कृपया दोबारा प्रयास करें।`
          )
        );
      }
    } finally {
      setDeletingSessionId(null);
    }
  };

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const userMeta = userLookupByUid.get(s.ownerUid);
      const businessName = (s.collected.businessName || '').toLowerCase();
      const email = (userMeta?.email || '').toLowerCase();
      const displayName = (userMeta?.displayName || '').toLowerCase();
      const ownerUid = s.ownerUid.toLowerCase();
      return (
        businessName.includes(q) ||
        email.includes(q) ||
        displayName.includes(q) ||
        ownerUid.includes(q)
      );
    });
  }, [sessions, statusFilter, searchQuery, userLookupByUid]);

  if (!isAuthorizedAdmin) {
    return null;
  }

  const getStatusBadge = (status: AiConsultationSession['status']) => {
    if (status === 'summary_ready') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          {t('Summary Ready', 'सारांश तैयार')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        {t('In Progress', 'प्रगति में')}
      </span>
    );
  };

  const renderUserIdentity = (ownerUid: string) => {
    const userMeta = userLookupByUid.get(ownerUid);
    if (userMeta && (userMeta.displayName || userMeta.email)) {
      return (
        <div className="min-w-0">
          {userMeta.displayName && (
            <div className="font-bold text-slate-950 truncate">{userMeta.displayName}</div>
          )}
          {userMeta.email && (
            <div className="text-[11px] text-slate-500 truncate">{userMeta.email}</div>
          )}
        </div>
      );
    }
    return (
      <div className="font-mono text-[11px] text-slate-700 break-all" title={ownerUid}>
        {ownerUid}
      </div>
    );
  };

  const selectedCollectedEntries = selectedSession
    ? COLLECTED_FIELD_LABELS.map((item) => {
        const rawVal = selectedSession.collected[item.key];
        if (Array.isArray(rawVal)) {
          if (rawVal.length === 0) return null;
          return {
            key: item.key,
            label: isHi ? item.hi : item.en,
            value: rawVal.join(', '),
          };
        }
        if (typeof rawVal === 'string' && rawVal.trim()) {
          return {
            key: item.key,
            label: isHi ? item.hi : item.en,
            value: rawVal.trim(),
          };
        }
        return null;
      }).filter((entry): entry is { key: keyof AiConsultantCollected; label: string; value: string } => entry !== null)
    : [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-950">
              {t('AI Consultant Sessions', 'AI Consultant सेशन')}
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {t('Read-Only', 'केवल पढ़ने के लिए')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              'Latest 50 AI Website Consultant sessions ordered by most recent update. Click any row to inspect collected requirements and full chat transcript.',
              'सबसे नए अपडेट के क्रम में नवीनतम 50 AI Website Consultant सेशन। सभी एकत्रित विवरण और पूरी चैट देखने के लिए किसी भी पंक्ति पर क्लिक करें।'
            )}
          </p>
        </div>

        {/* Search, Status Filter, and Refresh */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                'Search business name or email...',
                'बिजनेस नाम या ईमेल से खोजें...'
              )}
              aria-label={t('Search business name or email', 'बिजनेस नाम या ईमेल से खोजें')}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-700"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'in_progress' | 'summary_ready')
            }
            aria-label={t('Filter by status', 'स्टेटस के अनुसार फ़िल्टर करें')}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:border-blue-700 cursor-pointer"
          >
            <option value="all">{t('All Statuses', 'सभी स्टेटस')}</option>
            <option value="in_progress">{t('In Progress', 'प्रगति में')}</option>
            <option value="summary_ready">{t('Summary Ready', 'सारांश तैयार')}</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setDeleteSuccess(null);
              setDeleteError(null);
              void loadSessions(true);
            }}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Refresh', 'रिफ्रेश')}</span>
          </button>
        </div>
      </div>

      {/* Delete Feedback Banners */}
      {deleteSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccess(null)}
            aria-label={t('Dismiss message', 'संदेश बंद करें')}
            className="p-1 text-emerald-700 hover:text-emerald-950 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {deleteError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            aria-label={t('Dismiss error', 'त्रुटि बंद करें')}
            className="p-1 text-rose-700 hover:text-rose-950 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-2.5 text-slate-500">
          <RefreshCw className="w-5 h-5 text-blue-700 animate-spin" />
          <p className="text-xs font-medium">
            {t('Loading AI Consultant sessions...', 'AI Consultant सेशन लोड हो रहे हैं...')}
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadSessions(true)}
            className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-white border border-rose-200 hover:bg-rose-100 rounded-md transition-colors cursor-pointer shrink-0"
          >
            {t('Retry', 'पुनः प्रयास करें')}
          </button>
        </div>
      )}

      {/* Empty State (Zero sessions in database) */}
      {!loading && !error && sessions.length === 0 && (
        <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Bot className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {isHi ? 'अभी कोई सेशन नहीं' : 'No sessions yet'}
          </p>
          <p className="text-xs text-slate-500">
            {t(
              'Sessions created by users on /ai-website-consultant will appear here.',
              'उपयोगकर्ताओं द्वारा /ai-website-consultant पर बनाए गए सेशन यहाँ दिखाई देंगे।'
            )}
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
        <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-700">
            {t(
              'No sessions match the selected status or search term.',
              'चुने गए स्टेटस या खोज शब्द से कोई सेशन मेल नहीं खाया।'
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-3 py-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            {t('Clear filters', 'फ़िल्टर हटाएँ')}
          </button>
        </div>
      )}

      {/* Sessions Table */}
      {!loading && !error && filteredSessions.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-500">
            {isHi
              ? `कुल ${sessions.length} में से ${filteredSessions.length} सेशन दिखाए जा रहे हैं`
              : `Showing ${filteredSessions.length} of ${sessions.length} sessions`}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">{t('User / Owner', 'उपयोगकर्ता / ओनर')}</th>
                  <th className="py-3 px-4">{t('Business Name', 'बिजनेस का नाम')}</th>
                  <th className="py-3 px-4">{t('Website Type', 'वेबसाइट प्रकार')}</th>
                  <th className="py-3 px-4">{t('Step', 'चरण')}</th>
                  <th className="py-3 px-4">{t('Status', 'स्टेटस')}</th>
                  <th className="py-3 px-4">{t('Created', 'बनाया गया')}</th>
                  <th className="py-3 px-4">{t('Updated', 'अंतिम अपडेट')}</th>
                  <th className="py-3 px-4 text-right">{t('Actions', 'कार्रवाई')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session) => {
                  const isDeletingThisRow = deletingSessionId === session.id;
                  return (
                    <tr
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSession(session);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700"
                    >
                      <td className="py-3 px-4 max-w-[210px]">
                        {renderUserIdentity(session.ownerUid)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-[180px] truncate">
                        {session.collected.businessName || (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-[170px] truncate">
                        {session.collected.websiteType || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                        {isHi ? `चरण ${session.step}/8` : `Step ${session.step}/8`}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatDateTime(session.createdAtMs, language)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatDateTime(session.updatedAtMs, language)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('Details', 'विवरण')}</span>
                          </span>
                          {isAuthorizedAdmin && (
                            <button
                              type="button"
                              disabled={Boolean(deletingSessionId)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestDelete(session);
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 rounded transition-colors cursor-pointer"
                            >
                              {isDeletingThisRow ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              <span>
                                {isDeletingThisRow
                                  ? t('Deleting...', 'हटाया जा रहा है...')
                                  : t('Delete', 'हटाएं')}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Read-Only Session Detail Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-session-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSession(null);
            }
          }}
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    id="ai-session-detail-title"
                    className="text-sm sm:text-base font-extrabold text-slate-950 truncate"
                  >
                    {selectedSession.collected.businessName ||
                      t('AI Consultant Session Details', 'AI Consultant सेशन विवरण')}
                  </h4>
                  {getStatusBadge(selectedSession.status)}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {isHi ? `चरण ${selectedSession.step}/8` : `Step ${selectedSession.step}/8`}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                    {t('Read-Only', 'केवल पढ़ने के लिए')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                  <span>
                    <strong className="text-slate-800">{t('User:', 'उपयोगकर्ता:')}</strong>{' '}
                    {(() => {
                      const u = userLookupByUid.get(selectedSession.ownerUid);
                      if (u && (u.displayName || u.email)) {
                        return [u.displayName, u.email].filter(Boolean).join(' · ');
                      }
                      return selectedSession.ownerUid;
                    })()}
                  </span>
                  <span>
                    <strong className="text-slate-800">{t('Language:', 'भाषा:')}</strong>{' '}
                    {selectedSession.language === 'hi' ? 'हिन्दी (hi)' : 'English (en)'}
                  </span>
                  <span>
                    <strong className="text-slate-800">{t('Created:', 'बनाया गया:')}</strong>{' '}
                    {formatDateTime(selectedSession.createdAtMs, language)}
                  </span>
                  <span>
                    <strong className="text-slate-800">{t('Updated:', 'अपडेट:')}</strong>{' '}
                    {formatDateTime(selectedSession.updatedAtMs, language)}
                  </span>
                  <span className="font-mono text-slate-500">ID: {selectedSession.id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                aria-label={t('Close detail view', 'विवरण बंद करें')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Section 1: All Collected Fields */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  {t('Collected Requirements', 'एकत्रित विवरण')} ({selectedCollectedEntries.length})
                </h5>

                {selectedCollectedEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    {t(
                      'No structured fields have been collected in this session yet.',
                      'इस सेशन में अभी कोई विवरण एकत्रित नहीं हुआ है।'
                    )}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCollectedEntries.map((entry) => (
                      <div
                        key={entry.key}
                        className={`rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1 ${
                          entry.key === 'summary' ||
                          entry.key === 'businessDescription' ||
                          entry.key === 'featureNotes'
                            ? 'sm:col-span-2'
                            : ''
                        }`}
                      >
                        <div className="text-[11px] font-bold text-slate-500">{entry.label}</div>
                        <div className="text-xs text-slate-900 whitespace-pre-wrap break-words leading-relaxed">
                          {entry.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Full Ordered Chat Transcript */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-700" />
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    {t('Chat Messages', 'चैट संदेश')} ({selectedSession.messages.length})
                  </h5>
                </div>

                {selectedSession.messages.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    {t('No messages recorded.', 'कोई संदेश उपलब्ध नहीं है।')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedSession.messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div
                          key={msg.id || `${idx}`}
                          className={`rounded-lg border p-3.5 space-y-1.5 ${
                            isUser
                              ? 'bg-blue-50/60 border-blue-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                              {isUser ? (
                                <>
                                  <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                                  <span>{t('User', 'उपयोगकर्ता')}</span>
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3.5 h-3.5 text-slate-700" />
                                  <span>{t('AI Consultant', 'AI Consultant')}</span>
                                </>
                              )}
                              <span className="text-slate-400 font-normal">
                                · {isHi ? `चरण ${msg.step}/8` : `Step ${msg.step}/8`}
                              </span>
                            </span>
                            <span className="text-slate-500">
                              {formatIsoTimestamp(msg.createdAt, language)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-900 whitespace-pre-wrap break-words leading-relaxed">
                            {msg.text}
                          </div>

                          {Array.isArray(msg.quickReplies) && msg.quickReplies.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {msg.quickReplies.map((qr, qIdx) => (
                                <span
                                  key={`${msg.id}_qr_${qIdx}`}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                                >
                                  {qr}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div>
                {deleteError && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{deleteError}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAuthorizedAdmin && (
                  <button
                    type="button"
                    disabled={Boolean(deletingSessionId)}
                    onClick={() => handleRequestDelete(selectedSession)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {deletingSessionId === selectedSession.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {deletingSessionId === selectedSession.id
                        ? t('Deleting...', 'हटाया जा रहा है...')
                        : t('Delete', 'हटाएं')}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={Boolean(deletingSessionId)}
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
                >
                  {t('Close', 'बंद करें')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single-Session Delete Confirmation Dialog */}
      {isAuthorizedAdmin && pendingDeleteSession && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-session-delete-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingSessionId) {
              setPendingDeleteSession(null);
            }
          }}
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4
                  id="ai-session-delete-confirm-title"
                  className="text-sm font-bold text-slate-950"
                >
                  {t('Delete Session', 'सेशन हटाएं')}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isHi
                    ? 'क्या आप यह सेशन हमेशा के लिए हटाना चाहते हैं? यह वापस नहीं आएगा।'
                    : 'Are you sure you want to permanently delete this session? This cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={Boolean(deletingSessionId)}
                onClick={() => setPendingDeleteSession(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingSessionId)}
                onClick={() => void handleConfirmDelete()}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {deletingSessionId === pendingDeleteSession.id && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {deletingSessionId === pendingDeleteSession.id
                    ? t('Deleting...', 'हटाया जा रहा है...')
                    : t('Delete', 'हटाएं')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
