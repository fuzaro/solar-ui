'use client';

import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  user?: UserInfo;
}

function UserAvatar({ user, onClick }: { user: UserInfo; onClick: () => void }) {
  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-white/5"
      style={{ color: 'var(--color-solar-text-secondary)' }}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
      ) : (
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'var(--color-moon-surface)',
            color: 'var(--color-moon-light)',
            border: '1px solid var(--color-moon)',
          }}
        >
          {initials}
        </span>
      )}
      <div className="hidden sm:flex flex-col items-start">
        <span className="text-xs font-medium leading-none" style={{ color: 'var(--color-solar-text-primary)' }}>
          {user.name}
        </span>
        {user.role && (
          <span className="text-xs leading-none mt-0.5" style={{ color: 'var(--color-solar-text-muted)' }}>
            {user.role}
          </span>
        )}
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-50">
        <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export function Header({ title, breadcrumbs, actions, user }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 h-14 min-w-0">
      {/* Left */}
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span className="text-xs px-1" style={{ color: 'var(--color-solar-text-disabled)' }}>
                    /
                  </span>
                )}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <a
                    href={crumb.href}
                    className="text-sm transition-colors truncate hover:underline"
                    style={{ color: 'var(--color-solar-text-secondary)', textDecoration: 'none' }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--color-solar-text-primary)' }}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--color-solar-text-primary)' }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        {user && (
          <div ref={dropdownRef} className="relative">
            <UserAvatar user={user} onClick={() => setDropdownOpen((v) => !v)} />
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-lg py-1 z-50"
                style={{
                  background: 'var(--color-solar-elevated)',
                  border: '1px solid var(--color-solar-border)',
                  boxShadow: 'var(--shadow-modal)',
                }}
              >
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-solar-border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-solar-text-primary)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-solar-text-muted)' }}>
                    {user.email}
                  </p>
                </div>
                <button
                  className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  style={{ color: 'var(--color-solar-text-secondary)' }}
                >
                  Profile Settings
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  style={{ color: 'var(--color-venus)' }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
