'use client';

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@solar/auth';
import { getSolarConfig } from '@solar/api';
import { ToastProvider } from '@solar/ui';
import { PortalGate } from './PortalGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Providers para hidratação de page components em /engineering/*.
 *
 * Ordem (de fora para dentro):
 * 1. QueryClientProvider — react-query cache scope desta ilha
 * 2. AuthProvider — context auth (autoRefresh=false até ADR-016 Phase 3+
 *    expor /v1/sessions/refresh em Pluto; ver CR1 do drill-down 2026-05-27)
 * 3. PortalGate — gate por role mínimo 'admin'
 * 4. children — page component
 *
 * **CR14:** atualmente nenhum component de engineering importa este arquivo.
 * Componentes (ServiceDetail, ExecutionControl, etc.) precisam ser
 * refatorados para envolver-se com `<Providers>` para que o PortalGate
 * cubra page-level rendering. Hoje, gate só protege o chrome do
 * EngineeringShell.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider saturnUrl={getSolarConfig().saturn} autoRefresh={false}>
        <PortalGate minimum="admin">
          <ToastProvider>
            {children}
          </ToastProvider>
        </PortalGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
