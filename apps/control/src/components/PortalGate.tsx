'use client';

import { type ReactNode } from 'react';
import { useAuth, meetsRole } from '@solar/auth';
import type { PrincipalRole } from '@solar/api';

interface PortalGateProps {
  minimum: PrincipalRole;
  children: ReactNode;
}

/**
 * Renderiza children apenas se a sessão atende ao role mínimo do portal.
 *
 * Control = 'member' (operadores — admin de quotas/agentes/skills/envelope/
 * Themis quality gates).
 *
 * Decisão registrada em cross-repo-adrs/ADR-002 (gate de elegibilidade) e
 * fix F4 do relatório drill-down 2026-05-27.
 *
 * Observação técnica: este componente precisa estar dentro de um
 * <AuthProvider> (do mesmo React island). Astro hidrata Shell e pages
 * como islands separadas — por isso PortalGate é montado tanto em
 * ControlShell quanto em Providers.tsx.
 */
export function PortalGate({ minimum, children }: PortalGateProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Carregando sessão…
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '2rem', maxWidth: 480, margin: '4rem auto' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Sessão necessária</h2>
        <p style={{ color: '#6b7280' }}>
          Control Plane requer uma sessão válida. Injete o JWT no
          <code> localStorage.solar_session </code> ou aguarde o fluxo de
          login (ADR-016 Phase 3+).
        </p>
      </div>
    );
  }

  if (!meetsRole(session, minimum)) {
    return (
      <div style={{ padding: '2rem', maxWidth: 480, margin: '4rem auto' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Acesso negado</h2>
        <p style={{ color: '#6b7280' }}>
          Control Plane é para operadores. Requer role{' '}
          <strong>{minimum}</strong> ou superior.
          Seu role atual: <strong>{session.role}</strong>.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a href="/" style={{ color: '#3b82f6' }}>← Voltar ao Console</a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
