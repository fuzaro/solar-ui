import type { ApiScope, PrincipalRole } from '@solar/api';

// ─── Session model ─────────────────────────────────────────────────────────────

export interface UserSession {
  /** Raw JWT string */
  token: string;
  /** Decoded claims */
  principalId: string;
  tenantId: string;
  displayName: string;
  email: string;
  role: PrincipalRole;
  scopes: ApiScope[];
  plan: string;
  expiresAt: number; // Unix epoch ms
  issuedAt: number;
}

const SESSION_KEY = 'solar_session';

// ─── JWT decode (base64) — no crypto verification (done server-side) ────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Malformed JWT');
    const payload = parts[1];
    // Base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to 4-char boundary
    const padded = base64 + '=='.slice((2 - (base64.length % 4)) % 4);
    const decoded = typeof atob !== 'undefined'
      ? atob(padded)
      : (globalThis as unknown as { Buffer: { from(s: string, e: string): { toString(e: string): string } } }).Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function claimsToSession(token: string, claims: Record<string, unknown>): UserSession {
  const exp = (claims['exp'] as number | undefined) ?? 0;
  const iat = (claims['iat'] as number | undefined) ?? 0;
  return {
    token,
    principalId: (claims['sub'] as string | undefined) ?? (claims['principal_id'] as string | undefined) ?? '',
    tenantId: (claims['tenant_id'] as string | undefined) ?? '',
    displayName: (claims['display_name'] as string | undefined) ?? (claims['name'] as string | undefined) ?? '',
    email: (claims['email'] as string | undefined) ?? '',
    role: (claims['role'] as PrincipalRole | undefined) ?? 'readonly',
    scopes: (claims['scopes'] as ApiScope[] | undefined) ?? [],
    plan: (claims['plan'] as string | undefined) ?? 'free',
    expiresAt: exp * 1000,
    issuedAt: iat * 1000,
  };
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

/**
 * Read the current session from localStorage.
 * Returns `null` if not present or unparseable.
 */
export function getSession(): UserSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Decode `rawToken`, persist as UserSession, and return it.
 */
export function setSession(rawToken: string): UserSession {
  const claims = decodeJwtPayload(rawToken);
  const session = claimsToSession(rawToken, claims);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Remove session from localStorage.
 */
export function clearSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Returns true when the session's expiry has passed (with a 30-second buffer).
 */
export function isSessionExpired(session: UserSession): boolean {
  const bufferMs = 30_000;
  return Date.now() + bufferMs >= session.expiresAt;
}

/**
 * Exchange the current token for a fresh one via Saturn `/auth/refresh`.
 * Stores and returns the new session.
 */
export async function refreshSession(
  saturnUrl: string,
  token: string,
): Promise<UserSession> {
  const response = await fetch(`${saturnUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Session refresh failed: ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as { access_token: string };
  return setSession(body.access_token);
}
