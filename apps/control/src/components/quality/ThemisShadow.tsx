'use client';

import { PageHeader, AlertBanner } from '@solar/ui';
import { Providers } from '../Providers';

/**
 * Stub honest (CR31, v0.1.6).
 *
 * Conteúdo original dependia de `themis.shadow.list` +
 * `themis.divergence.list` — endpoints inventados por R5. A API REST
 * real de Themis é diferente (recognition, hyde, reputation,
 * aura/envelope, aura/finalize, recommend/task). Alinhar a API
 * canônica de Themis com a 4R-methodology e R5 é decisão arquitetural
 * R3-side (CR34 aberto).
 */
function ThemisShadowContent() {
  return (
    <div style={{ padding: '2rem', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PageHeader title="Themis Shadow" />
      <AlertBanner
        type="warning"
        title="Backend em reformulação"
        description="Themis publica uma API REST (recognition, hyde, reputation, aura/envelope, aura/finalize, recommend/task), mas R5 esperava paths diferentes (shadow.recommend, divergence.analyze) que não existem (R5 inventou). Aguarda CR34 — ADR R3 para alinhar a API REST canônica de Themis com a 4R-methodology e o R5."
      />
    </div>
  );
}

export function ThemisShadow() {
  return (
    <Providers>
      <ThemisShadowContent />
    </Providers>
  );
}
