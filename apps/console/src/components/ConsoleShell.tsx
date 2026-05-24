'use client';

import { useState, type ReactNode } from 'react';
import {
  AppShell,
  Sidebar,
  Header,
  ToastProvider,
  type NavItem,
} from '@solar/ui';
import { AuthProvider } from '@solar/auth';
import { getSolarConfig } from '@solar/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
  },
});

import {
  LayoutDashboard,
  Terminal,
  Database,
  User,
  Shield,
  Plus,
  Clock,
  History,
  KeyRound,
  CreditCard,
  UserCircle,
} from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: <Terminal size={18} />,
    children: [
      { href: '/tasks/new',     label: 'New Task',  icon: <Plus    size={15} /> },
      { href: '/tasks/active',  label: 'Active',    icon: <Clock   size={15} /> },
      { href: '/tasks/history', label: 'History',   icon: <History size={15} /> },
    ],
  },
  {
    href: '/resources',
    label: 'Resources',
    icon: <Database size={18} />,
  },
  {
    href: '/account',
    label: 'Account',
    icon: <User size={18} />,
    children: [
      { href: '/account/profile',  label: 'Profile',  icon: <UserCircle size={15} /> },
      { href: '/account/api-keys', label: 'API Keys', icon: <KeyRound   size={15} /> },
      { href: '/account/billing',  label: 'Billing',  icon: <CreditCard size={15} /> },
    ],
  },
  {
    href: '/audit',
    label: 'Audit Trail',
    icon: <Shield size={18} />,
  },
];

interface ConsoleShellProps {
  activeHref: string;
  title?: string;
  children: ReactNode;
}

export function ConsoleShell({
  activeHref,
  title = 'Console',
  children,
}: ConsoleShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider saturnUrl={getSolarConfig().saturn}>
        <ToastProvider>
          <AppShell
            sidebar={
              <Sidebar
                items={NAV_ITEMS}
                collapsed={collapsed}
                onCollapse={() => setCollapsed((c) => !c)}
                activeHref={activeHref}
              />
            }
            header={<Header title={title} />}
          >
            {children}
          </AppShell>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
