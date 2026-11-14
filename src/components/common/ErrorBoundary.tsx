import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw, Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { trackAppError } from '../../firebase/analytics';

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  onGoHome?: () => void;
}

const ErrorFallbackUI: React.FC<ErrorFallbackProps> = ({ error, onReset, onGoHome }) => {
  const { language, toggleLanguage, t } = useLanguage();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    onReset();
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-[75vh] w-full bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
        {/* Top Brand & Language Switch Row */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-950">
            <span className="text-blue-700">POWER</span> WEB STUDIO{' '}
            <span className="text-blue-600">AI</span>
          </div>

          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Languages className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>
        </div>

        {/* Main Error Content */}
        <div className="pt-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t(
                'Something went wrong while displaying this page',
                'इस पृष्ठ को दिखाते समय कुछ तकनीकी त्रुटि आ गई'
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t(
                'An unexpected rendering issue occurred. Your saved account and project data remain safe. Please reload the page to restore normal service.',
                'एक अप्रत्याशित रेंडरिंग समस्या उत्पन्न हुई है। आपका सहेजा गया खाता और प्रोजेक्ट डेटा पूरी तरह सुरक्षित है। सामान्य सेवा बहाल करने के लिए कृपया पेज पुनः लोड करें।'
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{t('Reload Page', 'पेज रीलोड करें')}</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span>{t('Try Again', 'पुनः प्रयास करें')}</span>
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Home className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>{t('Home', 'होमपेज')}</span>
            </button>
          </div>

          {/* Optional Diagnostic Summary */}
          {error?.message && (
            <details className="pt-4 border-t border-slate-100 text-xs text-slate-500">
              <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900 select-none py-1">
                {t('Technical error details', 'तकनीकी त्रुटि विवरण')}
              </summary>
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 break-words">
                {error.name ? `${error.name}: ` : ''}
                {error.message}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Changing resetKey (e.g. route change) automatically clears captured error state */
  resetKey?: string;
  onGoHome?: () => void;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[POWER WEB STUDIO AI — ErrorBoundary]', {
      name: error?.name,
      message: error?.message,
      componentStack: errorInfo?.componentStack,
    });

    trackAppError({
      errorName: error?.name || 'RenderError',
      errorMessage: error?.message || 'Unknown rendering error',
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallbackUI
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.props.onGoHome}
        />
      );
    }

    return this.props.children;
  }
}
