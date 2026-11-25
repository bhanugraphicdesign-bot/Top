import type { Language } from './index';

export interface AiConsultantCollected {
  businessName?: string;
  businessDescription?: string;
  businessStage?: string;
  websiteType?: string;
  recommendedConcepts?: string[];
  targetAudience?: string;
  targetLocation?: string;
  primaryVisitorAction?: string;
  pages?: string[];
  designColors?: string;
  designThemeMode?: string;
  designStyle?: string;
  designFonts?: string;
  designButtons?: string;
  designNavigation?: string;
  designHero?: string;
  designMedia?: string;
  designAnimations?: string;
  features?: string[];
  featureNotes?: string;
  budget?: string;
  timeline?: string;
  domainHostingStatus?: string;
  existingAssets?: string;
  summary?: string;
}

export interface AiConsultantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
  step: number;
  createdAt: string;
}

export interface AiConsultantConsent {
  accepted: true;
  acceptedAt: string;
  policyVersion: string;
}

export type AiConsultantSessionStatus = 'in_progress' | 'summary_ready';

export interface AiConsultationSession {
  id: string;
  ownerUid: string;
  language: Language;
  step: number;
  status: AiConsultantSessionStatus;
  collected: AiConsultantCollected;
  messages: AiConsultantMessage[];
  consent: AiConsultantConsent;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface AiConsultantChatResponse {
  reply: string;
  quickReplies: string[];
  step: number;
  isSummaryReady: boolean;
  collected: AiConsultantCollected;
  remainingQuota?: number;
}
