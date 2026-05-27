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
 * Engineering = 'admin' (administradores da plataforma — topology, executions,
 * billing reconciliation, infrastructure, security console).
 *
 * Decisão registrada em cross-repo-adrs/ADR-002 (gate de elegibilidade) e
 * fix F4 do relatório drill-down 2026-05-27.
 *
 * **CR14 conhecido:** components individuais em engineering (ExecutionControl,
 * ServiceDetail, etc.) não importam Providers.tsx. Isso significa que ao
 * acessar uma URL direta (ex.: /engineering/services), apenas o Shell renderiza
 * o gate — a page component em si hidrata sem gate. Para gating defesa-em-
 * profundidade, refactor pendente em todos os components de engineering para
 * envolver-se com <Providers>. Tracked como débito CR14.
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
          Engineering Portal requer uma sessão válida. Injete o JWT no
          <code> localStorage.solar_session </code> ou aguarde o fluxo de
          login (ADR-016 Phase 3+).
        </p>
      </div>
    );
  }

  if (!meetsRole(session, minimum)) {
    return (
      <div style={{ padding: '2rem', maxWidth: 480, margin: '4rem auto' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Acesso restrito</h2>
        <p style={{ color: '#6b7280' }}>
          Engineering Portal é restrito a administradores. Requer role{' '}
          <strong>{minimum}</strong>.
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
