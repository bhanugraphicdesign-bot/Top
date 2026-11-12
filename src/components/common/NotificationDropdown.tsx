import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { AppNotification } from '../../types';
import {
  Bell,
  CheckCircle2,
  LifeBuoy,
  FileText,
  Layers,
  UploadCloud,
  ShieldCheck,
  Check,
  ExternalLink,
  X,
} from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { language, t, formatDate } = useLanguage();
  const { navigate } = useNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.linkRoute) {
      navigate(notif.linkRoute, notif.linkParams);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'ticket':
        return <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />;
      case 'quote':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'milestone':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'upload':
        return <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />;
      case 'project':
        return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
        title={t('Notifications', 'सूचनाएं')}
        aria-label="View notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden text-left">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">
                {t('Enterprise Notifications', 'एंटरप्राइज सूचनाएं')}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {unreadCount} {t('New', 'नई')}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>{t('Mark all read', 'सभी पढ़ी चिह्नित करें')}</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {t('No notifications at this time.', 'इस समय कोई सूचना नहीं है।')}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                    !notif.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {language === 'hi' ? notif.titleHi : notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {language === 'hi' ? notif.messageHi : notif.message}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                      {formatDate(notif.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              REAL-TIME DISPATCH · SOC-2 SECURE
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
