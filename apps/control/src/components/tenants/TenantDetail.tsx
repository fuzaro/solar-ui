'use client';

import { PageHeader, AlertBanner } from '@solar/ui';
import { Providers } from '../Providers';

/**
 * Stub honest (CR5 + CR20, v0.1.3).
 *
 * Conteúdo original (Plan Configuration / Members / Budget / Resources
 * tabs) removido porque dependia de:
 *   - `saturn.admin.getConfig` (descartado em v0.1.3 CR5 — R5 inventou)
 *     para popular o objeto Tenant inteiro
 *   - `mars.budget.{get,ledger,grant}` (descartado em v0.1.2 CR20+CR25
 *     — R5 inventou semantic per-tenant)
 *
 * Sem o endpoint REST de tenant mgmt, o componente não tem como buscar
 * dados do tenant pelo `tenantId` recebido por prop. Aguardando ADR R3
 * que publique GET /v1/admin/tenants/{id} ou equivalente.
 */

interface TenantDetailProps {
  tenantId: string;
  onBack?: () => void;
}

function TenantDetailContent({ tenantId }: TenantDetailProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PageHeader
        title="Tenant Detail"
        description={`Tenant ID: ${tenantId}`}
      />
      <AlertBanner
        type="warning"
        title="Backend em construção"
        description="Detalhe de tenant (plan/members/budget/resources) ainda não está exposto via REST em R3. R5 v0.1.2 usava saturn.admin.getConfig como workaround inventado — descartado em v0.1.3 (CR5). Tabs Budget/Ledger já estavam stubadas em v0.1.2 (CR20). Esta página volta quando ADR R3 publicar contrato GET /v1/admin/tenants/{id} (CR5/CR20 abertos)."
      />
    </div>
  );
}

export function TenantDetail(props: TenantDetailProps) {
  return (
    <Providers>
      <TenantDetailContent {...props} />
    </Providers>
  );
}
