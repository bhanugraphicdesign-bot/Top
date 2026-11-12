import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useLanguage();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isAlert = toast.type === 'alert';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-emerald-950 border-emerald-800 text-emerald-50'
                : isAlert
                ? 'bg-amber-950 border-amber-800 text-amber-50'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isAlert && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isAlert && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
