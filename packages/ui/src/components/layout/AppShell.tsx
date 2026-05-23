'use client';

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, header, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      style={{ background: 'var(--color-solar-bg)', color: 'var(--color-solar-text-primary)' }}
      className="flex h-screen w-full overflow-hidden"
    >
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'relative z-50 flex-shrink-0 transition-all duration-300 ease-in-out',
          isMobile && [
            'fixed inset-y-0 left-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ]
        )}
        style={{ background: 'var(--color-solar-surface)' }}
      >
        {sidebar}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex-shrink-0 z-30"
          style={{
            background: 'var(--color-solar-surface)',
            borderBottom: '1px solid var(--color-solar-border)',
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-md"
              style={{ color: 'var(--color-solar-text-secondary)' }}
              aria-label="Toggle sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {header}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto" style={{ background: 'var(--color-solar-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
