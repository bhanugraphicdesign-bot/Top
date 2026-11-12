import React, { createContext, useContext, useState, useEffect } from 'react';
import { AndroidApp, AppCategory } from '../types';
import { INITIAL_ANDROID_APPS } from '../data/content';
import {
  fetchFirestoreApps,
  saveFirestoreApp,
  deleteFirestoreApp,
} from '../firebase/services';

interface AppsContextType {
  apps: AndroidApp[];
  addApp: (app: AndroidApp) => void;
  updateApp: (id: string, updated: Partial<AndroidApp>) => void;
  deleteApp: (id: string) => void;
  resetToDefaults: () => void;
  getAppById: (id: string) => AndroidApp | undefined;
  getAppsByCategory: (category: AppCategory | 'all') => AndroidApp[];
}

const AppsContext = createContext<AppsContextType | undefined>(undefined);

const STORAGE_KEY = 'pws_android_apps_v2';

export const AppsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apps, setApps] = useState<AndroidApp[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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
          setApps(cloudApps);
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

  const addApp = (newApp: AndroidApp) => {
    setApps((prev) => [newApp, ...prev]);
    saveFirestoreApp(newApp).catch(console.warn);
  };

  const updateApp = (id: string, updated: Partial<AndroidApp>) => {
    setApps((prev) => {
      const updatedList = prev.map((app) =>
        app.id === id ? { ...app, ...updated } : app
      );
      const target = updatedList.find((a) => a.id === id);
      if (target) {
        saveFirestoreApp(target).catch(console.warn);
      }
      return updatedList;
    });
  };

  const deleteApp = (id: string) => {
    setApps((prev) => prev.filter((app) => app.id !== id));
    deleteFirestoreApp(id).catch(console.warn);
  };

  const resetToDefaults = () => {
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
