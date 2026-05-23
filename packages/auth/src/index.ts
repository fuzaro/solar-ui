// ─── Session management ───────────────────────────────────────────────────────
export {
  getSession,
  setSession,
  clearSession,
  isSessionExpired,
  refreshSession,
  type UserSession,
} from './session';

// ─── Guards & helpers ─────────────────────────────────────────────────────────
export {
  requireAuth,
  hasScope,
  hasRole,
  meetsRole,
  isAdmin,
  isMember,
  assertScope,
} from './guards';

// ─── React context & hooks ────────────────────────────────────────────────────
export {
  AuthProvider,
  useAuth,
  AuthContext,
  type AuthContextValue,
} from './context';
