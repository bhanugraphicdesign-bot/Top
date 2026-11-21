import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageRoute } from '../types';

interface NavigationContextType {
  currentRoute: PageRoute;
  params: Record<string, string>;
  navigate: (route: PageRoute, params?: Record<string, string>) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const VALID_ROUTES: PageRoute[] = [
  'home',
  'about',
  'services',
  'ai-solutions',
  'android-portfolio',
  'app-detail',
  'demo',
  'process',
  'contact',
  'pay',
  'blog',
  'privacy',
  'terms',
  'client-dashboard',
  'admin-dashboard',
];

export function getPathForRoute(route: PageRoute, queryParams?: Record<string, string>): string {
  const cleanParams: Record<string, string> = queryParams ? { ...queryParams } : {};
  let basePath = '/';

  if (route === 'app-detail' && cleanParams.id) {
    basePath = `/apps/${encodeURIComponent(cleanParams.id)}`;
    delete cleanParams.id;
  } else if (route === 'demo' && cleanParams.slug) {
    basePath = `/demo/${encodeURIComponent(cleanParams.slug)}`;
    delete cleanParams.slug;
  } else if (route !== 'home') {
    basePath = `/${route}`;
  }

  const search = new URLSearchParams(cleanParams).toString();
  return search ? `${basePath}?${search}` : basePath;
}

function parseRouteTarget(rawPath: string, rawSearch: string): { route: PageRoute; params: Record<string, string> } | null {
  const cleanPath = rawPath.replace(/^\/+|\/+$/g, '');
  const params: Record<string, string> = {};

  if (rawSearch) {
    const sp = new URLSearchParams(rawSearch.replace(/^\?/, ''));
    sp.forEach((val, key) => {
      params[key] = val;
    });
  }

  if (!cleanPath) {
    return { route: 'home', params };
  }

  if (cleanPath === 'admin') {
    return { route: 'admin-dashboard', params };
  }

  if (cleanPath.startsWith('apps/')) {
    const appId = decodeURIComponent(cleanPath.slice('apps/'.length)).split('/')[0]?.trim();
    if (appId) {
      params.id = appId;
      return { route: 'app-detail', params };
    }
    return { route: 'android-portfolio', params };
  }

  if (cleanPath.startsWith('demo/')) {
    const demoSlug = decodeURIComponent(cleanPath.slice('demo/'.length)).split('/')[0]?.trim();
    if (demoSlug) {
      params.slug = demoSlug;
      return { route: 'demo', params };
    }
    return { route: 'home', params };
  }

  const matchedRoute = VALID_ROUTES.find((r) => r === cleanPath);
  if (!matchedRoute) {
    return null;
  }

  return { route: matchedRoute, params };
}

function parseCurrentLocation(): {
  route: PageRoute;
  params: Record<string, string>;
  redirectTo?: string;
} {
  const rawHash = window.location.hash || '';
  if (rawHash.length > 1) {
    const strippedHash = rawHash.replace(/^#\/?/, '');
    const [hashPath, hashQuery = ''] = strippedHash.split('?');
    const hashParsed = parseRouteTarget(hashPath, hashQuery);
    if (hashParsed) {
      return {
        route: hashParsed.route,
        params: hashParsed.params,
        redirectTo: getPathForRoute(hashParsed.route, hashParsed.params),
      };
    }
  }

  const pathname = window.location.pathname || '/';
  const search = window.location.search || '';
  const pathParsed = parseRouteTarget(pathname, search);

  if (pathParsed) {
    const canonicalPath = getPathForRoute(pathParsed.route, pathParsed.params);
    const currentFull = `${window.location.pathname}${window.location.search}`;
    const shouldNormalize =
      (pathname.startsWith('/app-detail') && pathParsed.route === 'app-detail' && Boolean(pathParsed.params.id)) ||
      pathname === '/admin';

    return {
      route: pathParsed.route,
      params: pathParsed.params,
      redirectTo: shouldNormalize && currentFull !== canonicalPath ? canonicalPath : undefined,
    };
  }

  return { route: 'not-found', params: pathname ? { path: pathname } : {} };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = parseCurrentLocation();
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(initial.route);
  const [params, setParams] = useState<Record<string, string>>(initial.params);

  useEffect(() => {
    const syncLocation = (scroll = false) => {
      const parsed = parseCurrentLocation();
      if (parsed.redirectTo) {
        try {
          window.history.replaceState(null, '', parsed.redirectTo);
        } catch {
          // ignore history errors in sandboxed frames
        }
      }
      setCurrentRoute(parsed.route);
      setParams(parsed.params);
      if (scroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Redirect legacy #/ links on initial load if present
    syncLocation(false);

    const handlePopState = () => syncLocation(true);
    const handleHashChange = () => syncLocation(true);

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = (route: PageRoute, queryParams?: Record<string, string>) => {
    const nextUrl = getPathForRoute(route, queryParams);
    const currentFull = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    try {
      if (currentFull !== nextUrl) {
        window.history.pushState(null, '', nextUrl);
      }
    } catch {
      // ignore history errors in sandboxed frames
    }
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
