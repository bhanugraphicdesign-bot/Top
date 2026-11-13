import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import {
  fetchNotifications,
  createNotification as firestoreCreateNotification,
  markNotificationAsRead as firestoreMarkAsRead,
  markAllNotificationsAsRead as firestoreMarkAllAsRead,
} from '../firebase/services';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Enterprise APK v2.4.1-rc3 Build Signed & Verified',
    titleHi: 'एंटरप्राइज APK v2.4.1-rc3 हस्ताक्षरित एवं सत्यापित',
    message: 'Release candidate build signed with 4096-bit enterprise keystore. SHA-256 digest ready in Document Vault.',
    messageHi: 'रिलीज कैंडिडेट बिल्ड 4096-बिट कीस्टोर द्वारा हस्ताक्षरित। दस्तावेज़ वॉल्ट में उपलब्ध।',
    type: 'upload',
    read: false,
    createdAt: '2026-11-12T05:00:00Z',
    linkRoute: 'client-dashboard',
  },
  {
    id: 'notif-2',
    title: 'P2 Priority SLA Ticket #TKT-2026-904 Assigned',
    titleHi: 'P2 प्राथमिकता SLA टिकट #TKT-2026-904 नियुक्त',
    message: 'Lead Architect Er. Bhanu Ram Bariha reviewed BLE Soundbox latency logs. Sample target response < 2 hours.',
    messageHi: 'प्रधान वास्तुकार भानु राम बरीहा ने लेटेंसी लॉग्स की समीक्षा की। सैंपल लक्ष्य प्रतिक्रिया < 2 घंटे।',
    type: 'ticket',
    read: false,
    createdAt: '2026-11-11T14:30:00Z',
    linkRoute: 'client-dashboard',
  },
  {
    id: 'notif-3',
    title: 'Milestone 03 (BLE Soundbox & Dynamic QR) Accepted',
    titleHi: 'माइलस्टोन 03 (BLE साउंडबॉक्स एवं डायनामिक QR) स्वीकृत',
    message: 'NPCI UPI 2.0 dynamic intent generator passed multi-bank reconciliation stress tests.',
    messageHi: 'NPCI UPI 2.0 डायनामिक इंटेंट जनरेटर ने बैंक सुलह परीक्षण सफलतापूर्वक पास किया।',
    type: 'milestone',
    read: true,
    createdAt: '2026-11-09T10:15:00Z',
    linkRoute: 'client-dashboard',
  },
  {
    id: 'notif-4',
    title: 'Sample Workspace Security Checklist Review',
    titleHi: 'सैंपल कार्यक्षेत्र सुरक्षा चेकलिस्ट समीक्षा',
    message: 'Preview notification: Security rules lint and role-access verification configured for sandbox testing.',
    messageHi: 'पूर्वावलोकन सूचना: सैंडबॉक्स परीक्षण के लिए सुरक्षा नियम और भूमिका-आधारित एक्सेस जांच सक्रिय है।',
    type: 'system',
    read: true,
    createdAt: '2026-11-02T16:00:00Z',
    linkRoute: 'client-dashboard',
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { language, showToast } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);

  const refreshNotifications = useCallback(async () => {
    try {
      const live = await fetchNotifications(currentUser?.uid);
      if (live && live.length > 0) {
        setNotifications((prev) => {
          const combined = [...live];
          for (const s of prev) {
            if (!combined.some((c) => c.id === s.id)) {
              combined.push(s);
            }
          }
          return combined;
        });
      }
    } catch {
      // Keep seed state
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newId = `notif-${Date.now()}`;
    const newRecord: AppNotification = {
      ...notif,
      id: newId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newRecord, ...prev]);

    // Async write to Firestore
    try {
      await firestoreCreateNotification(notif);
    } catch (err) {
      console.warn('[addNotification error]', err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await firestoreMarkAsRead(id);
    } catch {
      // local updated
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await firestoreMarkAllAsRead(currentUser?.uid);
      showToast(
        language === 'hi' ? 'सभी सूचनाएं पढ़ी हुई चिह्नित की गईं।' : 'All notifications marked as read.',
        'info'
      );
    } catch {
      // local updated
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
