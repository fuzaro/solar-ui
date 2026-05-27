'use client';

import { PageHeader, AlertBanner } from '@solar/ui';
import { Providers } from '../Providers';

/**
 * Stub honest (CR20 + CR25, v0.1.2).
 *
 * Conteúdo original (dashboard de ledger + chart + tabela) removido
 * porque o endpoint REST de ledger não existe em R3 ainda:
 *   - Mars expõe budget per-exec_id (`/v1/budget/{exec_id}`), não
 *     per-tenant
 *   - Saturn tem tabela `budget_ledger` mas não publica via REST
 * R5 v0.1.1 chamava paths inventados que retornavam 404. Quando ADR
 * R3 publicar `GET /v1/budget/{tenant}/ledger` ou equivalente, este
 * componente volta a renderizar dados reais.
 */
function BillingPageContent() {
  return (
    <div style={{ padding: '2rem', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PageHeader
        title="Billing & Usage"
        description="Credit balance, usage trend, and transaction history."
      />
      <AlertBanner
        type="warning"
        title="Backend em construção"
        description="O endpoint REST de ledger ainda não está exposto em R3 (CR20 aberto). Aguardando ADR para definir contrato entre Saturn (tabela budget_ledger) e Mars/UI. Esta página voltará a renderizar dados reais quando R3 publicar GET /v1/budget/{tenant}/ledger (ou equivalente)."
      />
    </div>
  );
}

export function BillingPage() {
  return (
    <Providers>
      <BillingPageContent />
    </Providers>
  );
}
