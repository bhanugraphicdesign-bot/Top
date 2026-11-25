import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db, ensureClientFirestoreOnline, withFirestoreTimeout } from './config';
import { authenticatedFetch } from './services';
import { OperationType } from './errorHandler';
import type { Language } from '../types';
import type {
  AiConsultationSession,
  AiConsultantChatResponse,
  AiConsultantCollected,
  AiConsultantConsent,
  AiConsultantMessage,
  AiConsultantSessionStatus,
} from '../types/aiConsultant';

export const AI_CONSULTATION_SESSIONS_COLLECTION = 'ai_consultation_sessions';
export const AI_CONSULTANT_POLICY_VERSION = '2026-01';
export const AI_CONSULTANT_MAX_STORED_MESSAGES = 100;

// Keep client clamps <= both server.ts Zod schema limits and firestore.rules limits
const COLLECTED_STRING_LIMITS: Array<[keyof AiConsultantCollected, number]> = [
  ['businessName', 160],
  ['businessDescription', 600],
  ['businessStage', 60],
  ['websiteType', 100],
  ['targetAudience', 300],
  ['targetLocation', 160],
  ['primaryVisitorAction', 240],
  ['designColors', 200],
  ['designThemeMode', 100],
  ['designStyle', 200],
  ['designFonts', 200],
  ['designButtons', 200],
  ['designNavigation', 200],
  ['designHero', 200],
  ['designMedia', 200],
  ['designAnimations', 200],
  ['featureNotes', 1500],
  ['budget', 120],
  ['timeline', 120],
  ['domainHostingStatus', 160],
  ['existingAssets', 300],
  ['summary', 3000],
];

export class AiConsultantFirestoreError extends Error {
  code: string;
  operation: OperationType;

  constructor(code: string, operation: OperationType, message: string) {
    super(message);
    this.name = 'AiConsultantFirestoreError';
    this.code = code;
    this.operation = operation;
  }
}

function extractFirestoreErrorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const rawCode = (err as { code?: unknown }).code;
    if (typeof rawCode === 'string' && rawCode.trim()) {
      return rawCode.trim();
    }
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string') {
      if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        return 'permission-denied';
      }
      if (msg.includes('not-found') || msg.includes('No document to update')) {
        return 'not-found';
      }
      if (msg.includes('invalid-argument')) {
        return 'invalid-argument';
      }
      if (msg.includes('failed-precondition')) {
        return 'failed-precondition';
      }
      if (msg.includes('unavailable') || msg.toLowerCase().includes('offline')) {
        return 'unavailable';
      }
      if (msg.includes('unauthenticated')) {
        return 'unauthenticated';
      }
    }
  }
  return 'unknown';
}

async function ensureSessionFirestoreReady(
  operation: OperationType,
  forceCheck = false
): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AiConsultantFirestoreError('offline', operation, 'OFFLINE_FIRESTORE');
  }
  const online = await ensureClientFirestoreOnline({ forceCheck });
  if (!online) {
    throw new AiConsultantFirestoreError('unavailable', operation, 'FIRESTORE_UNREACHABLE');
  }
}

function clampText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  // Code-point safe slicing prevents splitting UTF-16 surrogate pairs (emojis) into invalid lone surrogates
  return Array.from(trimmed).slice(0, maxLen).join('');
}

function clampList(val: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(val)) return [];
  const out: string[] = [];
  for (const item of val) {
    if (typeof item !== 'string') continue;
    const clean = clampText(item, maxItemLen);
    if (!clean) continue;
    out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function generateAiSessionId(): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(36).slice(2, 10);
  return `aisess_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

export function sanitizeCollectedForFirestore(
  collected?: AiConsultantCollected
): AiConsultantCollected {
  const clean: AiConsultantCollected = {};
  if (!collected || typeof collected !== 'object') return clean;

  for (const [key, maxLen] of COLLECTED_STRING_LIMITS) {
    const val = clampText(collected[key], maxLen);
    if (val) {
      (clean as Record<string, unknown>)[key] = val;
    }
  }

  const concepts = clampList(collected.recommendedConcepts, 5, 300);
  if (concepts.length > 0) clean.recommendedConcepts = concepts;

  const pages = clampList(collected.pages, 25, 120);
  if (pages.length > 0) clean.pages = pages;

  const features = clampList(collected.features, 30, 160);
  if (features.length > 0) clean.features = features;

  return clean;
}

export function sanitizeMessagesForFirestore(
  messages: AiConsultantMessage[]
): AiConsultantMessage[] {
  const bounded = messages.slice(-AI_CONSULTANT_MAX_STORED_MESSAGES);
  return bounded
    .map((m, idx): AiConsultantMessage | null => {
      const id = clampText(m.id, 64) || `msg_${Date.now()}_${idx}`;
      const role = m.role === 'user' ? 'user' : 'assistant';
      const text = clampText(m.text, 2500);
      if (!text) return null;
      const step = Math.min(8, Math.max(1, Math.round(Number(m.step) || 1)));
      const createdAt = clampText(m.createdAt, 64) || new Date().toISOString();
      const quickReplies = clampList(m.quickReplies, 8, 120);
      const entry: AiConsultantMessage = {
        id,
        role,
        text,
        step,
        createdAt,
      };
      if (quickReplies.length > 0) {
        entry.quickReplies = quickReplies;
      }
      return entry;
    })
    .filter((item): item is AiConsultantMessage => item !== null);
}

function timestampToMillis(val: unknown): number {
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as Timestamp).toMillis === 'function') {
    return (val as Timestamp).toMillis();
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseSessionDoc(docId: string, data: Record<string, any>): AiConsultationSession | null {
  if (!data || typeof data !== 'object' || typeof data.ownerUid !== 'string') {
    return null;
  }
  const language: Language = data.language === 'en' ? 'en' : 'hi';
  const step = Math.min(8, Math.max(1, Math.round(Number(data.step) || 1)));
  const status: AiConsultantSessionStatus =
    data.status === 'summary_ready' ? 'summary_ready' : 'in_progress';
  const rawConsent = data.consent && typeof data.consent === 'object' ? data.consent : {};
  const consent: AiConsultantConsent = {
    accepted: true,
    acceptedAt: clampText(rawConsent.acceptedAt, 64) || new Date().toISOString(),
    policyVersion: clampText(rawConsent.policyVersion, 32) || AI_CONSULTANT_POLICY_VERSION,
  };
  const collected = sanitizeCollectedForFirestore(data.collected as AiConsultantCollected);
  const rawMessages = Array.isArray(data.messages) ? (data.messages as AiConsultantMessage[]) : [];
  const messages = sanitizeMessagesForFirestore(rawMessages);

  return {
    id: docId || clampText(data.id, 128),
    ownerUid: data.ownerUid,
    language,
    step,
    status,
    collected,
    messages,
    consent,
    createdAtMs: timestampToMillis(data.createdAt),
    updatedAtMs: timestampToMillis(data.updatedAt),
  };
}

export async function listUserAiConsultantSessions(uid: string): Promise<AiConsultationSession[]> {
  if (!uid) return [];
  await ensureSessionFirestoreReady(OperationType.LIST);

  const colRef = collection(db, AI_CONSULTATION_SESSIONS_COLLECTION);
  try {
    const q = query(colRef, where('ownerUid', '==', uid), limit(15));
    const snap = await withFirestoreTimeout(() => getDocs(q));
    const sessions = snap.docs
      .map((d) => parseSessionDoc(d.id, d.data()))
      .filter((s): s is AiConsultationSession => s !== null);
    sessions.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    return sessions;
  } catch (err: any) {
    const code = extractFirestoreErrorCode(err);
    if (code !== 'unavailable' && code !== 'offline') {
      console.error('[AI Consultant Firestore LIST Error]', {
        code,
        message: err instanceof Error ? err.message : String(err),
      });
    }
    throw new AiConsultantFirestoreError(
      code,
      OperationType.LIST,
      err instanceof Error ? err.message : String(err)
    );
  }
}

export async function listAllAiConsultantSessionsForAdmin(
  maxResults = 50,
  forceConnectivityCheck = false
): Promise<AiConsultationSession[]> {
  await ensureSessionFirestoreReady(OperationType.LIST, forceConnectivityCheck);

  const clampedLimit = Math.min(50, Math.max(1, Math.round(Number(maxResults) || 50)));
  const colRef = collection(db, AI_CONSULTATION_SESSIONS_COLLECTION);

  try {
    let snap;
    try {
      const orderedQuery = query(colRef, orderBy('updatedAt', 'desc'), limit(clampedLimit));
      snap = await withFirestoreTimeout(() => getDocs(orderedQuery));
    } catch (orderedErr: any) {
      const orderedCode = extractFirestoreErrorCode(orderedErr);
      if (orderedCode === 'failed-precondition') {
        const fallbackQuery = query(colRef, limit(clampedLimit));
        snap = await withFirestoreTimeout(() => getDocs(fallbackQuery));
      } else {
        throw orderedErr;
      }
    }

    const sessions = snap.docs
      .map((d) => parseSessionDoc(d.id, d.data()))
      .filter((s): s is AiConsultationSession => s !== null);
    sessions.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    return sessions;
  } catch (err: any) {
    const code = extractFirestoreErrorCode(err);
    if (code !== 'unavailable' && code !== 'offline') {
      console.error('[AI Consultant Admin Firestore LIST Error]', {
        code,
        message: err instanceof Error ? err.message : String(err),
      });
    }
    throw new AiConsultantFirestoreError(
      code,
      OperationType.LIST,
      err instanceof Error ? err.message : String(err)
    );
  }
}

export async function deleteAiConsultationSessionAsAdmin(sessionId: string): Promise<void> {
  await ensureSessionFirestoreReady(OperationType.DELETE);

  const cleanId = clampText(sessionId, 128).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) {
    throw new AiConsultantFirestoreError('invalid-argument', OperationType.DELETE, 'INVALID_SESSION_ID');
  }

  const sessionRef = doc(db, AI_CONSULTATION_SESSIONS_COLLECTION, cleanId);
  try {
    await withFirestoreTimeout(() => deleteDoc(sessionRef));
  } catch (err: any) {
    const code = extractFirestoreErrorCode(err);
    if (code !== 'unavailable' && code !== 'offline') {
      console.error('[AI Consultant Admin Firestore DELETE Error]', {
        code,
        message: err instanceof Error ? err.message : String(err),
      });
    }
    throw new AiConsultantFirestoreError(
      code,
      OperationType.DELETE,
      err instanceof Error ? err.message : String(err)
    );
  }
}

function summarizeMessageShape(msg?: AiConsultantMessage) {
  if (!msg) return null;
  return {
    keys: Object.keys(msg),
    idLen: msg.id.length,
    role: msg.role,
    textLen: Array.from(msg.text).length,
    step: msg.step,
    stepIsInt: Number.isInteger(msg.step),
    createdAtLen: msg.createdAt.length,
    quickRepliesCount: Array.isArray(msg.quickReplies) ? msg.quickReplies.length : 0,
    quickRepliesMaxLen: Array.isArray(msg.quickReplies)
      ? msg.quickReplies.reduce((m, s) => Math.max(m, Array.from(s).length), 0)
      : 0,
  };
}

export async function createAiConsultantSession(params: {
  sessionId: string;
  ownerUid: string;
  language: Language;
  step: number;
  status: AiConsultantSessionStatus;
  collected: AiConsultantCollected;
  messages: AiConsultantMessage[];
  consent: AiConsultantConsent;
  forceConnectivityCheck?: boolean;
}): Promise<AiConsultationSession> {
  await ensureSessionFirestoreReady(OperationType.CREATE, Boolean(params.forceConnectivityCheck));

  const cleanId =
    clampText(params.sessionId, 128).replace(/[^a-zA-Z0-9_-]/g, '') || generateAiSessionId();
  const effectiveOwnerUid = auth.currentUser?.uid || params.ownerUid;
  const cleanStep = Math.min(8, Math.max(1, Math.round(Number(params.step) || 1)));
  const cleanStatus: AiConsultantSessionStatus =
    params.status === 'summary_ready' ? 'summary_ready' : 'in_progress';
  const cleanCollected = sanitizeCollectedForFirestore(params.collected);
  const cleanMessages = sanitizeMessagesForFirestore(params.messages);
  const cleanConsent: AiConsultantConsent = {
    accepted: true,
    acceptedAt: clampText(params.consent.acceptedAt, 64) || new Date().toISOString(),
    policyVersion: clampText(params.consent.policyVersion, 32) || AI_CONSULTANT_POLICY_VERSION,
  };

  try {
    await withFirestoreTimeout(() =>
      setDoc(doc(db, AI_CONSULTATION_SESSIONS_COLLECTION, cleanId), {
        id: cleanId,
        ownerUid: effectiveOwnerUid,
        language: params.language === 'en' ? 'en' : 'hi',
        step: cleanStep,
        status: cleanStatus,
        collected: cleanCollected,
        messages: cleanMessages,
        consent: cleanConsent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    const nowMs = Date.now();
    return {
      id: cleanId,
      ownerUid: effectiveOwnerUid,
      language: params.language === 'en' ? 'en' : 'hi',
      step: cleanStep,
      status: cleanStatus,
      collected: cleanCollected,
      messages: cleanMessages,
      consent: cleanConsent,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    };
  } catch (err: any) {
    const code = extractFirestoreErrorCode(err);
    if (code !== 'unavailable' && code !== 'offline') {
      console.error('[AI Consultant Firestore CREATE Error]', {
        code,
        idLen: cleanId.length,
        idValid: /^[a-zA-Z0-9_-]{1,128}$/.test(cleanId),
        authSignedIn: Boolean(auth.currentUser?.uid),
        ownerMatchesAuth: Boolean(auth.currentUser?.uid && effectiveOwnerUid === auth.currentUser.uid),
        step: cleanStep,
        language: params.language === 'en' ? 'en' : 'hi',
        status: cleanStatus,
        messageCount: cleanMessages.length,
        firstMsg: summarizeMessageShape(cleanMessages[0]),
        lastMsg: summarizeMessageShape(cleanMessages[cleanMessages.length - 1]),
        collectedKeys: Object.keys(cleanCollected),
        consentKeys: Object.keys(cleanConsent),
        message: err instanceof Error ? err.message : String(err),
      });
    }
    throw new AiConsultantFirestoreError(
      code,
      OperationType.CREATE,
      err instanceof Error ? err.message : String(err)
    );
  }
}

function summarizeCollectedLengths(collected: AiConsultantCollected): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(collected)) {
    if (typeof v === 'string') {
      out[k] = { cpLen: Array.from(v).length, utf16Len: v.length };
    } else if (Array.isArray(v)) {
      out[k] = {
        count: v.length,
        maxCpLen: v.reduce((m, s) => Math.max(m, Array.from(String(s)).length), 0),
      };
    } else {
      out[k] = typeof v;
    }
  }
  return out;
}

export async function updateAiConsultantSession(
  sessionId: string,
  params: {
    language: Language;
    step: number;
    status: AiConsultantSessionStatus;
    collected: AiConsultantCollected;
    messages: AiConsultantMessage[];
    forceConnectivityCheck?: boolean;
  }
): Promise<void> {
  await ensureSessionFirestoreReady(OperationType.UPDATE, Boolean(params.forceConnectivityCheck));

  const cleanId = clampText(sessionId, 128).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) {
    throw new AiConsultantFirestoreError('not-found', OperationType.UPDATE, 'EMPTY_SESSION_ID');
  }
  const cleanStep = Math.min(8, Math.max(1, Math.round(Number(params.step) || 1)));
  const cleanStatus: AiConsultantSessionStatus =
    params.status === 'summary_ready' ? 'summary_ready' : 'in_progress';
  const cleanCollected = sanitizeCollectedForFirestore(params.collected);
  const cleanMessages = sanitizeMessagesForFirestore(params.messages);

  const sessionRef = doc(db, AI_CONSULTATION_SESSIONS_COLLECTION, cleanId);
  try {
    await withFirestoreTimeout(() =>
      updateDoc(sessionRef, {
        language: params.language === 'en' ? 'en' : 'hi',
        step: cleanStep,
        status: cleanStatus,
        collected: cleanCollected,
        messages: cleanMessages,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err: any) {
    let code = extractFirestoreErrorCode(err);
    let docDiag: Record<string, unknown> | undefined;

    // Firestore returns permission-denied (not not-found) when allow update reads resource.data on a missing doc.
    // Use a passive timeout here so a slow diagnostic read NEVER triggers disableNetwork(db).
    if (code === 'permission-denied') {
      let probeTimer: ReturnType<typeof setTimeout> | null = null;
      try {
        const snap = await Promise.race([
          getDoc(sessionRef),
          new Promise<never>((_, reject) => {
            probeTimer = setTimeout(() => {
              const timeoutErr = new Error('Diagnostic getDoc timed out') as Error & { code?: string };
              timeoutErr.code = 'deadline-exceeded';
              reject(timeoutErr);
            }, 5000);
          }),
        ]);
        if (!snap.exists()) {
          code = 'not-found';
        } else {
          const existing = snap.data() || {};
          const existingConsent =
            existing.consent && typeof existing.consent === 'object' ? existing.consent : null;
          docDiag = {
            docExists: true,
            existingKeys: Object.keys(existing),
            idMatches: existing.id === cleanId,
            ownerMatches: Boolean(auth.currentUser?.uid && existing.ownerUid === auth.currentUser.uid),
            createdAtType: existing.createdAt === null ? 'null' : typeof existing.createdAt,
            createdAtIsTimestamp: Boolean(
              existing.createdAt &&
                typeof existing.createdAt === 'object' &&
                typeof existing.createdAt.toMillis === 'function'
            ),
            consentKeys: existingConsent ? Object.keys(existingConsent) : null,
            consentAccepted: existingConsent ? existingConsent.accepted === true : false,
            consentAcceptedAtLen:
              existingConsent && typeof existingConsent.acceptedAt === 'string'
                ? existingConsent.acceptedAt.length
                : -1,
            consentPolicyVersionLen:
              existingConsent && typeof existingConsent.policyVersion === 'string'
                ? existingConsent.policyVersion.length
                : -1,
          };
        }
      } catch (probeErr: unknown) {
        docDiag = {
          getDocProbeFailed: true,
          getDocErrorCode: extractFirestoreErrorCode(probeErr),
        };
      } finally {
        if (probeTimer) clearTimeout(probeTimer);
      }
    }

    if (code !== 'not-found' && code !== 'unavailable' && code !== 'offline') {
      console.error('[AI Consultant Firestore UPDATE Error]', {
        code,
        idLen: cleanId.length,
        idValid: /^[a-zA-Z0-9_-]{1,128}$/.test(cleanId),
        authSignedIn: Boolean(auth.currentUser?.uid),
        step: cleanStep,
        stepIsInt: Number.isInteger(cleanStep),
        language: params.language === 'en' ? 'en' : 'hi',
        status: cleanStatus,
        messageCount: cleanMessages.length,
        firstMsg: summarizeMessageShape(cleanMessages[0]),
        lastMsg: summarizeMessageShape(cleanMessages[cleanMessages.length - 1]),
        collectedKeys: Object.keys(cleanCollected),
        collectedLengths: summarizeCollectedLengths(cleanCollected),
        ...(docDiag ? { docDiag } : {}),
        message: err instanceof Error ? err.message : String(err),
      });
    }
    throw new AiConsultantFirestoreError(
      code,
      OperationType.UPDATE,
      err instanceof Error ? err.message : String(err)
    );
  }
}

export class AiConsultantApiError extends Error {
  code: string;
  status: number;
  messageHi: string;
  retryAfterSeconds?: number;

  constructor(opts: {
    code: string;
    status: number;
    messageEn: string;
    messageHi: string;
    retryAfterSeconds?: number;
  }) {
    super(opts.messageEn);
    this.name = 'AiConsultantApiError';
    this.code = opts.code;
    this.status = opts.status;
    this.messageHi = opts.messageHi;
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }
}

export async function sendAiConsultantChatMessage(params: {
  language: Language;
  currentStep: number;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  collected: AiConsultantCollected;
  user?: User | null;
}): Promise<AiConsultantChatResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 32_000);

  try {
    const cleanMessage = clampText(params.message, 1500);
    const cleanHistory = params.history
      .slice(-24)
      .map((h) => ({
        role: h.role,
        text: clampText(h.text, 2500),
      }))
      .filter((h) => h.text.length > 0);

    const res = await authenticatedFetch(
      '/api/ai/consultant/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: params.language,
          currentStep: Math.min(8, Math.max(1, Math.round(Number(params.currentStep) || 1))),
          message: cleanMessage,
          history: cleanHistory,
          collected: sanitizeCollectedForFirestore(params.collected),
        }),
        signal: controller.signal,
      },
      params.user ? { user: params.user } : {}
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new AiConsultantApiError({
        code: String(data?.code || `HTTP_${res.status}`),
        status: res.status,
        messageEn:
          typeof data?.error === 'string' && data.error.trim()
            ? data.error.trim()
            : 'Unable to reach AI Consultant right now. Please try again.',
        messageHi:
          typeof data?.errorHi === 'string' && data.errorHi.trim()
            ? data.errorHi.trim()
            : 'अभी AI Consultant से संपर्क नहीं हो पा रहा है। कृपया दोबारा प्रयास करें।',
        retryAfterSeconds:
          typeof data?.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined,
      });
    }

    const reply = clampText(data?.reply, 2500);
    if (!reply) {
      throw new AiConsultantApiError({
        code: 'AI_EMPTY_RESPONSE',
        status: 502,
        messageEn: 'AI Consultant returned an empty response. Please try again.',
        messageHi: 'AI Consultant से खाली उत्तर मिला। कृपया दोबारा प्रयास करें।',
      });
    }

    return {
      reply,
      quickReplies: clampList(data?.quickReplies, 8, 120),
      step: Math.min(8, Math.max(1, Math.round(Number(data?.step) || params.currentStep || 1))),
      isSummaryReady: Boolean(data?.isSummaryReady),
      collected: sanitizeCollectedForFirestore(data?.collected as AiConsultantCollected),
      remainingQuota:
        typeof data?.remainingQuota === 'number' ? data.remainingQuota : undefined,
    };
  } catch (err: any) {
    if (err instanceof AiConsultantApiError) {
      throw err;
    }
    if (err?.name === 'AbortError') {
      throw new AiConsultantApiError({
        code: 'CLIENT_TIMEOUT',
        status: 504,
        messageEn: 'The AI Consultant took too long to respond. Please try sending your message again.',
        messageHi: 'AI Consultant से जवाब आने में अधिक समय लग गया। कृपया दोबारा प्रयास करें।',
      });
    }
    throw new AiConsultantApiError({
      code: 'NETWORK_ERROR',
      status: 0,
      messageEn: 'Network issue while contacting AI Consultant. Please check your connection and retry.',
      messageHi: 'नेटवर्क समस्या के कारण AI Consultant से संपर्क नहीं हो सका। कृपया इंटरनेट जांचकर दोबारा प्रयास करें।',
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}
