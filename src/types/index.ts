export type Language = 'en' | 'hi';

export type PageRoute =
  | 'home'
  | 'about'
  | 'services'
  | 'ai-solutions'
  | 'android-portfolio'
  | 'app-detail'
  | 'process'
  | 'contact'
  | 'blog'
  | 'privacy'
  | 'terms'
  | 'client-dashboard'
  | 'admin-dashboard';

export type AppCategory =
  | 'Business Apps'
  | 'Education Apps'
  | 'Productivity Apps'
  | 'Utility Apps'
  | 'E-commerce Apps'
  | 'Enterprise Apps'
  | 'AI-powered Apps';

export type AppReleaseStatus =
  | 'enterprise_distribution'
  | 'internal_testing'
  | 'private_apk'
  | 'in_development'
  | 'published';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  titleHi: string;
  category: string;
  categoryHi: string;
  shortDesc: string;
  shortDescHi: string;
  fullDesc: string;
  fullDescHi: string;
  deliverables: string[];
  deliverablesHi: string[];
  techStack: string[];
  icon: string;
  metric: string;
  metricLabel: string;
  metricLabelHi: string;
}

export interface AndroidApp {
  id: string;
  name: string;
  nameHi: string;
  tagline: string;
  taglineHi: string;
  category: AppCategory;
  categoryHi: string;
  version: string;
  architecture: string;
  description: string;
  descriptionHi: string;
  keyFeatures: string[];
  keyFeaturesHi: string[];
  techStack: string[];
  metrics: {
    label: string;
    labelHi: string;
    value: string;
  }[];
  accentColor: string;
  iconName: string;
  status: AppReleaseStatus;
  statusLabelEn: string;
  statusLabelHi: string;
  demoUrl?: string;
  playStoreUrl?: string; // Strictly only if genuinely published on Google Play
  downloadSize: string;
  targetSdk: string;
  screenshots: string[];
  changelog?: {
    version: string;
    date: string;
    notes: string;
    notesHi: string;
  }[];
}

export interface AiSolution {
  id: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  description: string;
  descriptionHi: string;
  coreCapabilities: string[];
  coreCapabilitiesHi: string[];
  businessImpact: string;
  businessImpactHi: string;
  techStack: string[];
  icon: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  titleHi: string;
  duration: string;
  durationHi: string;
  description: string;
  descriptionHi: string;
  deliverables: string[];
  deliverablesHi: string[];
}

export interface WhyChooseUsPillar {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  metric: string;
  metricLabel: string;
  metricLabelHi: string;
  icon: string;
}

export interface BlogPost {
  id: string;
  title: string;
  titleHi: string;
  excerpt: string;
  excerptHi: string;
  content: string[];
  contentHi: string[];
  author: string;
  authorRole: string;
  authorRoleHi: string;
  date: string;
  dateHi: string;
  readTime: string;
  readTimeHi: string;
  category: string;
  categoryHi: string;
}

export interface ConsultationFormData {
  fullName: string;
  workEmail: string;
  phone: string;
  companyName: string;
  projectType: string;
  timeline: string;
  budgetRange: string;
  projectBrief: string;
  attachedFileUrl?: string;
  attachedFileName?: string;
  attachedFileSha256?: string;
}

export type NotificationType =
  | 'quote'
  | 'ticket'
  | 'project'
  | 'milestone'
  | 'system'
  | 'upload';

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  linkRoute?: PageRoute;
  linkParams?: Record<string, string>;
}

export interface UploadedFileRecord {
  fileId: string;
  fileName: string;
  category: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  extension: string;
  sha256: string;
  uploadedBy?: string;
  notes?: string;
  uploadedAt: string;
  downloadUrl: string;
}
