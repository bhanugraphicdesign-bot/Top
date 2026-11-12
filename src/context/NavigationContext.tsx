import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageRoute } from '../types';

interface NavigationContextType {
  currentRoute: PageRoute;
  params: Record<string, string>;
  navigate: (route: PageRoute, params?: Record<string, string>) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parseHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      return { route: 'home' as PageRoute, params: {} };
    }

    const [routePart, queryPart] = hash.split('?');
    const params: Record<string, string> = {};

    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    const validRoutes: PageRoute[] = [
      'home',
      'about',
      'services',
      'ai-solutions',
      'android-portfolio',
      'app-detail',
      'process',
      'contact',
      'blog',
      'privacy',
      'terms',
      'client-dashboard',
      'admin-dashboard',
    ];

    const matchedRoute = validRoutes.find((r) => r === routePart);
    return {
      route: matchedRoute || ('home' as PageRoute),
      params,
    };
  };

  const initial = parseHash();
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(initial.route);
  const [params, setParams] = useState<Record<string, string>>(initial.params);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      setCurrentRoute(parsed.route);
      setParams(parsed.params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: PageRoute, queryParams?: Record<string, string>) => {
    let hash = `#${route}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const search = new URLSearchParams(queryParams).toString();
      hash += `?${search}`;
    }
    window.location.hash = hash;
    setCurrentRoute(route);
    setParams(queryParams || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('home');
    }
  };

  return (
    <NavigationContext.Provider value={{ currentRoute, params, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
