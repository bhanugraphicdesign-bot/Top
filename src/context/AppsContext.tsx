import React, { createContext, useContext, useState, useEffect } from 'react';
import { AndroidApp, AppCategory } from '../types';
import { INITIAL_ANDROID_APPS, ASSETS } from '../data/content';
import { useAuth } from './AuthContext';
import {
  fetchFirestoreApps,
  saveFirestoreApp,
  deleteFirestoreApp,
} from '../firebase/services';

function normalizeAppAssets(list: AndroidApp[]): AndroidApp[] {
  return list.map((app) => ({
    ...app,
    screenshots: (app.screenshots || []).map((src) =>
      src.startsWith('/src/assets/') || src.includes('android_app_ecosystem_')
        ? ASSETS.androidImage
        : src
    ),
  }));
}

interface AppsContextType {
  apps: AndroidApp[];
  addApp: (app: AndroidApp) => Promise<void>;
  updateApp: (id: string, updated: Partial<AndroidApp>) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
  resetToDefaults: () => void;
  getAppById: (id: string) => AndroidApp | undefined;
  getAppsByCategory: (category: AppCategory | 'all') => AndroidApp[];
}

const AppsContext = createContext<AppsContextType | undefined>(undefined);

const STORAGE_KEY = 'pws_android_apps_v2';

export const AppsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [apps, setApps] = useState<AndroidApp[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeAppAssets(parsed);
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_ANDROID_APPS;
  });

  // Background sync with live Cloud Firestore
  useEffect(() => {
    fetchFirestoreApps()
      .then((cloudApps) => {
        if (cloudApps && cloudApps.length > 0) {
          setApps(normalizeAppAssets(cloudApps));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch {
      // storage quota or disabled
    }
  }, [apps]);

  const addApp = async (newApp: AndroidApp) => {
    if (!isAdmin) {
      throw new Error('Forbidden: Administrator privileges required to add portfolio apps.');
    }
    await saveFirestoreApp(newApp);
    setApps((prev) => [newApp, ...prev]);
  };

  const updateApp = async (id: string, updated: Partial<AndroidApp>) => {
    if (!isAdmin) {
      throw new Error('Forbidden: Administrator privileges required to update portfolio apps.');
    }
    const existing = apps.find((a) => a.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updated };
    await saveFirestoreApp(merged);
    setApps((prev) => prev.map((app) => (app.id === id ? merged : app)));
  };

  const deleteApp = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Forbidden: Administrator privileges required to delete portfolio apps.');
    }
    await deleteFirestoreApp(id);
    setApps((prev) => prev.filter((app) => app.id !== id));
  };

  const resetToDefaults = () => {
    if (!isAdmin) {
      return;
    }
    setApps(INITIAL_ANDROID_APPS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ANDROID_APPS));
    } catch {
      // ignore
    }
  };

  const getAppById = (id: string) => {
    return apps.find((a) => a.id === id);
  };

  const getAppsByCategory = (category: AppCategory | 'all') => {
    if (category === 'all') return apps;
    return apps.filter((a) => a.category === category);
  };

  return (
    <AppsContext.Provider
      value={{
        apps,
        addApp,
        updateApp,
        deleteApp,
        resetToDefaults,
        getAppById,
        getAppsByCategory,
      }}
    >
      {children}
    </AppsContext.Provider>
  );
};

export const useApps = (): AppsContextType => {
  const context = useContext(AppsContext);
  if (!context) {
    throw new Error('useApps must be used within an AppsProvider');
  }
  return context;
};
