import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, ShieldCheck, Download, FileText, CheckCircle2, Lock, ExternalLink } from 'lucide-react';

export interface EnterpriseDocument {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  categoryHi: string;
  executedDate: string;
  status: string;
  statusHi: string;
  fileSize: string;
  sha256: string;
  format: 'PDF' | 'APK' | 'ZIP' | 'DEED';
  signatories: string[];
  description: string;
  descriptionHi: string;
}

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EnterpriseDocument | null;
  onDownload: (doc: EnterpriseDocument) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload,
}) => {
  const { language, t, formatDate } = useLanguage();

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {document.format} · {document.fileSize}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {language === 'hi' ? document.statusHi : document.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950 mt-1">
                {language === 'hi' ? document.titleHi : document.title}
              </h3>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-600">
            <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {language === 'hi' ? document.descriptionHi : document.description}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {t('Execution Date', 'निष्पादन तिथि')}
                </span>
                <span className="font-bold text-slate-900">{formatDate(document.executedDate)}</span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {t('Legal Classification', 'कानूनी वर्गीकरण')}
                </span>
                <span className="font-bold text-slate-900">
                  {language === 'hi' ? document.categoryHi : document.category}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {t('Authorized Signatories & Attestation', 'अधिकृत हस्ताक्षरकर्ता एवं अनुप्रमाणन')}
              </span>
              <div className="space-y-1">
                {document.signatories.map((sig, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium">{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg text-slate-300 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>CRYPTOGRAPHIC VERIFICATION</span>
                <span className="text-emerald-400">AUTHENTIC</span>
              </div>
              <div className="text-slate-400 text-[10px]">SHA-256 DIGEST:</div>
              <div className="text-emerald-400 break-all select-all font-mono">
                {document.sha256}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {t('Close', 'बंद करें')}
            </button>
            <button
              type="button"
              onClick={() => {
                onDownload(document);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Download Verified Document', 'सत्यापित दस्तावेज़ डाउनलोड करें')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
