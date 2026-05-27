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
import { AuthProvider } from '@solar/auth';
import { getSolarConfig } from '@solar/api';
import { PortalGate } from './PortalGate';
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

// CR16: hrefs precisam de prefix /engineering para roteamento cross-portal
// funcionar. Astro `base` config quebraria shared_astro merge, então
// declaramos local. Convenção registrada como CR18.
const PORTAL_BASE = '/engineering';

const NAV_ITEMS: NavItem[] = [
  {
    href: `${PORTAL_BASE}/`,
    label: 'Topology',
    icon: <Globe size={18} />,
    planet: 'mercury',
  },
  {
    href: `${PORTAL_BASE}/services`,
    label: 'Services',
    icon: <Server size={18} />,
    planet: 'moon',
  },
  {
    href: `${PORTAL_BASE}/executions`,
    label: 'Executions',
    icon: <Activity size={18} />,
    planet: 'mars',
  },
  {
    href: `${PORTAL_BASE}/security`,
    label: 'Security',
    icon: <Lock size={18} />,
    planet: 'pluto',
  },
  {
    href: `${PORTAL_BASE}/parameters`,
    label: 'Parameters',
    icon: <Settings size={18} />,
    planet: 'saturn',
  },
  {
    href: `${PORTAL_BASE}/infrastructure`,
    label: 'Infrastructure',
    icon: <HardDrive size={18} />,
    planet: 'jupiter',
  },
  {
    href: `${PORTAL_BASE}/audit`,
    label: 'Audit',
    icon: <FileSearch size={18} />,
    planet: 'moon',
  },
  {
    href: `${PORTAL_BASE}/billing`,
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
      <AuthProvider saturnUrl={getSolarConfig().saturn} autoRefresh={false}>
        <ToastProvider>
          <PortalGate minimum="admin">
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
          </PortalGate>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
