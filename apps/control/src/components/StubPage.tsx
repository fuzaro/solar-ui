'use client';

import { PageHeader, EmptyState } from '@solar/ui';
import type { ReactNode } from 'react';

interface StubPageProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function StubPage({ title, description, icon }: StubPageProps) {
  return (
    <div style={{ padding: '2rem' }}>
      <PageHeader title={title} description={description} />
      <div style={{ marginTop: '3rem' }}>
        <EmptyState
          icon={icon}
          title={`${title} coming soon`}
          description="This page is under construction. Full implementation will be added by the next agent."
        />
      </div>
    </div>
  );
}
