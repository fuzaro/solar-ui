'use client';

import { PageHeader, AlertBanner } from '@solar/ui';
import { Providers } from '../Providers';

/**
 * Stub honest (CR5, v0.1.3).
 *
 * Conteúdo original (lista de tenants com create modal + filtros) removido
 * porque R5 inventou `saturn.admin.getConfig/setConfig` como workaround
 * para tenant mgmt — Saturn não publica `/v1/admin/config`. CR5
 * descartou esses endpoints inventados.
 *
 * Saturn `admin_routes.py` tem `POST /v1/admin/tenants` (create) mas
 * falta endpoint REST de leitura/listagem para popular a UI. Aguardando
 * ADR R3 que especifique contrato REST de tenants (CR5/CR20 abertos).
 */
function TenantListContent() {
  return (
    <div style={{ padding: '2rem', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PageHeader
        title="Tenant Administration"
        description="Manage tenant organisations, access plans, and billing configuration."
      />
      <AlertBanner
        type="warning"
        title="Backend em construção"
        description="Endpoints de tenant mgmt (list, create, update) ainda não estão expostos via REST em R3. R5 v0.1.2 usava saturn.admin.getConfig/setConfig como workaround inventado — descartado em v0.1.3 (CR5). Saturn admin_routes.py tem POST /v1/admin/tenants implementado; falta endpoint de leitura/listagem REST. Esta página volta quando ADR R3 publicar contrato GET /v1/admin/tenants (ou equivalente)."
      />
    </div>
  );
}

export function TenantList() {
  return (
    <Providers>
      <TenantListContent />
    </Providers>
  );
}
