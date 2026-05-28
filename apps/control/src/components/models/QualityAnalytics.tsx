'use client';

import { PageHeader, AlertBanner } from '@solar/ui';
import { Providers } from '../Providers';

/**
 * Stub honest (CR30, v0.1.6).
 *
 * Conteúdo original (rankings + tier breakdown + tabela de quality)
 * removido porque dependia de `neptune.models.listQuality()` —
 * endpoint inventado por R5 (`GET /v1/models/quality` list). Neptune
 * publica apenas `GET /v1/models/{id}/quality` (por ID); agregar via
 * lazy-load por ID geraria N+1 queries.
 *
 * Volta quando R3 publicar endpoint de listagem agregada (CR35 aberto).
 */
function QualityAnalyticsContent() {
  return (
    <div style={{ padding: '2rem', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PageHeader
        title="Quality Analytics"
        description="Model quality rankings, hallucination rates, and tool success metrics."
      />
      <AlertBanner
        type="warning"
        title="Backend list não exposto"
        description="O endpoint de listagem agregada de quality (GET /v1/models/quality) não existe em R3 — Neptune publica apenas GET /v1/models/{id}/quality por ID. R5 v0.1.5 chamava um list inventado (CR30 — descartado v0.1.6). Esta página volta quando ADR R3 publicar endpoint de listagem (CR35 aberto)."
      />
    </div>
  );
}

export function QualityAnalytics() {
  return (
    <Providers>
      <QualityAnalyticsContent />
    </Providers>
  );
}
