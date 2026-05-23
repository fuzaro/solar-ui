import type { ApiScope, PrincipalRole } from '@solar/api';
import type { UserSession } from './session';

/**
 * Retrieve the current session, throwing if not authenticated.
 */
export function requireAuth(session: UserSession | null): UserSession {
  if (!session) {
    throw new Error('Not authenticated. Please sign in.');
  }
  return session;
}

/**
 * Check whether a session has a specific API scope.
 */
export function hasScope(session: UserSession, scope: ApiScope): boolean {
  return session.scopes.includes(scope);
}

/**
 * Check whether a session matches a specific role (exact).
 */
export function hasRole(session: UserSession, role: PrincipalRole): boolean {
  return session.role === role;
}

/** Role hierarchy used for `meetsRole` comparisons. */
const ROLE_RANK: Record<PrincipalRole, number> = {
  readonly: 0,
  member: 1,
  admin: 2,
};

/**
 * Check whether a session meets or exceeds a minimum role level.
 * e.g. `meetsRole(session, 'member')` → true for member AND admin
 */
export function meetsRole(session: UserSession, minimum: PrincipalRole): boolean {
  return (ROLE_RANK[session.role] ?? 0) >= (ROLE_RANK[minimum] ?? 0);
}

/**
 * Convenience: returns true when the session's role is `admin`.
 */
export function isAdmin(session: UserSession): boolean {
  return session.role === 'admin';
}

/**
 * Convenience: returns true when the session's role is `member` or higher.
 */
export function isMember(session: UserSession): boolean {
  return meetsRole(session, 'member');
}

/**
 * Assert that the session has the given scope, throwing a descriptive error otherwise.
 */
export function assertScope(session: UserSession, scope: ApiScope): void {
  if (!hasScope(session, scope)) {
    throw new Error(
      `Insufficient permissions. Required scope: "${scope}". ` +
        `Your scopes: ${session.scopes.join(', ') || '(none)'}.`,
    );
  }
}
