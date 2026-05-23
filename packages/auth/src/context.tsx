'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clearSession,
  getSession,
  isSessionExpired,
  refreshSession,
  setSession,
  type UserSession,
} from './session';
import { isAdmin as checkAdmin } from './guards';

// ─── Context value ─────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** Currently active session, or null if not authenticated. */
  session: UserSession | null;
  /** True while the session is being loaded or refreshed. */
  isLoading: boolean;
  /** True when a session exists and is not expired. */
  isAuthenticated: boolean;
  /** True when the session's role is `admin`. */
  isAdmin: boolean;
  /**
   * Persist a raw JWT token as the active session.
   * Call this after a successful login response.
   */
  login: (rawToken: string) => void;
  /** Clear the session and sign out. */
  logout: () => void;
  /** Manually trigger a token refresh against Saturn. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  /** Saturn base URL used for token refresh (e.g. "http://localhost:8006"). */
  saturnUrl: string;
  /**
   * When true (default), the provider will attempt to silently refresh the
   * token 60 seconds before it expires.
   */
  autoRefresh?: boolean;
}

export function AuthProvider({
  children,
  saturnUrl,
  autoRefresh = true,
}: AuthProviderProps) {
  const [session, setSessionState] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const scheduleRefresh = useCallback(
    (sess: UserSession) => {
      if (!autoRefresh) return;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const msUntilExpiry = sess.expiresAt - Date.now();
      const refreshIn = Math.max(msUntilExpiry - 60_000, 0);

      refreshTimerRef.current = setTimeout(async () => {
        try {
          const refreshed = await refreshSession(saturnUrl, sess.token);
          setSessionState(refreshed);
          scheduleRefresh(refreshed);
        } catch {
          // Token refresh failed — sign out silently
          clearSession();
          setSessionState(null);
        }
      }, refreshIn);
    },
    [autoRefresh, saturnUrl],
  );

  // ── Initialise from localStorage on mount ─────────────────────────────────

  useEffect(() => {
    const stored = getSession();
    if (stored && !isSessionExpired(stored)) {
      setSessionState(stored);
      scheduleRefresh(stored);
    } else if (stored) {
      clearSession();
    }
    setIsLoading(false);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = useCallback(
    (rawToken: string) => {
      const sess = setSession(rawToken);
      setSessionState(sess);
      scheduleRefresh(sess);
    },
    [scheduleRefresh],
  );

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    clearSession();
    setSessionState(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    const refreshed = await refreshSession(saturnUrl, session.token);
    setSessionState(refreshed);
    scheduleRefresh(refreshed);
  }, [session, saturnUrl, scheduleRefresh]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isAuthenticated: session !== null && !isSessionExpired(session),
      isAdmin: session !== null ? checkAdmin(session) : false,
      login,
      logout,
      refresh,
    }),
    [session, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the current auth context.
 * Must be used inside an `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export { AuthContext };
