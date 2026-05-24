'use client';

import { useState, type ReactNode } from 'react';
import {
  AppShell,
  Sidebar,
  Header,
  ToastProvider,
  type NavItem,
} from '@solar/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Globe,
  Server,
  Activity,
  Lock,
  Settings,
  HardDrive,
  FileSearch,
  Receipt,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
  },
});

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Topology',
    icon: <Globe size={18} />,
    planet: 'mercury',
  },
  {
    href: '/services',
    label: 'Services',
    icon: <Server size={18} />,
    planet: 'moon',
  },
  {
    href: '/executions',
    label: 'Executions',
    icon: <Activity size={18} />,
    planet: 'mars',
  },
  {
    href: '/security',
    label: 'Security',
    icon: <Lock size={18} />,
    planet: 'pluto',
  },
  {
    href: '/parameters',
    label: 'Parameters',
    icon: <Settings size={18} />,
    planet: 'saturn',
  },
  {
    href: '/infrastructure',
    label: 'Infrastructure',
    icon: <HardDrive size={18} />,
    planet: 'jupiter',
  },
  {
    href: '/audit',
    label: 'Audit',
    icon: <FileSearch size={18} />,
    planet: 'moon',
  },
  {
    href: '/billing',
    label: 'Billing',
    icon: <Receipt size={18} />,
    planet: 'saturn',
  },
];

interface EngineeringShellProps {
  activeHref: string;
  title?: string;
  children: ReactNode;
}

export function EngineeringShell({
  activeHref,
  title = 'Engineering',
  children,
}: EngineeringShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
