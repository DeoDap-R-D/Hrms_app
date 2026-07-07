import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from 'react';
import * as svc from '../api/services';
import { getToken, saveToken, clearToken, saveUser, getUser, clearLocalNotifications } from '../api/storage';
import { setUnauthorizedHandler } from '../api/client';
import { cancelReminders } from '../utils/notifications';
import type { Employee } from '../api/types';

interface AuthState {
  bootstrapping: boolean;
  isAuthenticated: boolean;
  user: Employee | null;
  signIn: (payload: svc.LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: Employee) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<Employee | null>(null);

  const signOut = useCallback(async () => {
    await svc.logout();
    await clearToken();
    cancelReminders();
    clearLocalNotifications();
    setTokenState(null);
    setUserState(null);
  }, []);

  // Wire global 401 handler to force sign-out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUserState(null);
    });
  }, []);

  // Restore session on launch. Bootstrapping ends as soon as the cached session
  // is read (fast, local) so the app opens straight to the dashboard; the /me
  // refresh then runs in the background without blocking or showing a loader.
  useEffect(() => {
    (async () => {
      let saved: string | null = null;
      try {
        saved = await getToken();
        if (saved) {
          setTokenState(saved);
          const cached = await getUser<Employee>();
          if (cached) setUserState(cached);
        }
      } finally {
        setBootstrapping(false);
      }
      if (saved) {
        try {
          const fresh = await svc.me();
          setUserState(fresh);
          await saveUser(fresh);
        } catch {
          // Token may be valid offline; keep the cached user.
        }
      }
    })();
  }, []);

  const signIn = useCallback(async (payload: svc.LoginPayload) => {
    const { token: newToken, user: loginUser } = await svc.login(payload);
    if (!newToken) throw new Error('No token returned by server.');
    await saveToken(newToken);
    setTokenState(newToken);
    let profile = loginUser;
    try {
      profile = await svc.me();
    } catch {
      // fall back to login payload user
    }
    if (profile) {
      setUserState(profile);
      await saveUser(profile);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await svc.me();
    setUserState(fresh);
    await saveUser(fresh);
  }, []);

  const setUser = useCallback((u: Employee) => {
    setUserState(u);
    saveUser(u).catch(() => {});
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      bootstrapping,
      isAuthenticated: !!token,
      user,
      signIn,
      signOut,
      refreshUser,
      setUser,
    }),
    [bootstrapping, token, user, signIn, signOut, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
