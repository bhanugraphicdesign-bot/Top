export type Language = 'en' | 'hi';

export type PageRoute =
  | 'home'
  | 'about'
  | 'services'
  | 'ai-solutions'
  | 'android-portfolio'
  | 'app-detail'
  | 'demo'
  | 'process'
  | 'contact'
  | 'pay'
  | 'blog'
  | 'privacy'
  | 'terms'
  | 'client-dashboard'
  | 'admin-dashboard'
  | 'not-found';

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

export interface EnterpriseInvoice {
  id: string;
  invoiceNumber: string;
  documentType?: 'tax_invoice' | 'bill_of_supply';
  gstRegistered?: boolean;
  supplierGstin?: string;
  supplierLegalName?: string;
  supplierStateCode?: string;
  supplierStateName?: string;
  projectId: string;
  projectName: string;
  projectNameHi: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientGstin?: string;
  clientStateCode?: string;
  clientStateName?: string;
  milestoneTitle: string;
  milestoneTitleHi: string;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  taxType?: 'none' | 'cgst_sgst' | 'igst';
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
  currency: 'INR';
  hsnSac: string;
  status: 'issued' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  paymentTxnId?: string;
  paymentMethod?: string;
  verificationHash: string;
}

export interface VerifiedPayment {
  id: string;
  orderId: string;
  invoiceId: string;
  clientId: string;
  clientEmail: string;
  amount: number;
  currency: 'INR';
  method: 'UPI' | 'NEFT_RTGS' | 'Corporate_Card' | 'Escrow';
  status: 'success' | 'pending' | 'failed';
  transactionRef: string;
  checksum: string;
  timestamp: string;
  verifiedBy: string;
}

export interface UpiPaymentSettings {
  upiId: string;
  payeeName: string;
  enabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PublicGstStatus {
  gstRegistered: boolean;
  gstin: string;
  legalName: string;
  stateCode: string;
  stateName: string;
}

export interface GstSettings extends PublicGstStatus {
  canEdit?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type UpiPaymentStatus = 'pending' | 'submitted' | 'paid' | 'rejected';

export interface UpiPaymentRecord {
  id: string;
  referenceNumber: string;
  name: string;
  mobile: string;
  purpose: string;
  amount: number;
  currency: 'INR';
  upiId: string;
  payeeName: string;
  utr: string;
  status: UpiPaymentStatus;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
}
