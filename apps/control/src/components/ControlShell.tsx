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
  BarChart3,
  Bot,
  Cpu,
  Wrench,
  Users,
  Scale,
  Server,
  Star,
  FlaskConical,
  UserCog,
  Building2,
  Gavel,
  Shield,
  Target,
  Clock,
  Mail,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
  },
});

// CR16: hrefs precisam de prefix /control para roteamento cross-portal
// funcionar. Astro `base` config quebraria shared_astro merge, então
// declaramos local. Convenção registrada como CR18 (futuro: lint rule).
const PORTAL_BASE = '/control';

const NAV_ITEMS: NavItem[] = [
  {
    href: `${PORTAL_BASE}/`,
    label: 'Overview',
    icon: <BarChart3 size={18} />,
    planet: 'sun',
  },
  {
    href: `${PORTAL_BASE}/agents`,
    label: 'Agents',
    icon: <Bot size={18} />,
    planet: 'mars',
  },
  {
    href: `${PORTAL_BASE}/envelope`,
    label: 'Envelope',
    icon: <Mail size={18} />,
    planet: 'saturn',
  },
  {
    href: `${PORTAL_BASE}/models`,
    label: 'Models & Inference',
    icon: <Cpu size={18} />,
    planet: 'neptune',
    children: [
      { href: `${PORTAL_BASE}/models/providers`, label: 'Providers',      icon: <Server       size={15} /> },
      { href: `${PORTAL_BASE}/models/registry`,  label: 'Model Registry', icon: <Star         size={15} /> },
      { href: `${PORTAL_BASE}/models/quality`,   label: 'Quality',        icon: <FlaskConical size={15} /> },
    ],
  },
  {
    href: `${PORTAL_BASE}/skills`,
    label: 'Skills & Tools',
    icon: <Wrench size={18} />,
    planet: 'sun',
  },
  {
    href: `${PORTAL_BASE}/tenants`,
    label: 'Tenants & Users',
    icon: <Users size={18} />,
    planet: 'saturn',
    children: [
      { href: `${PORTAL_BASE}/tenants`,       label: 'Tenants', icon: <Building2 size={15} /> },
      { href: `${PORTAL_BASE}/tenants/users`, label: 'Users',   icon: <UserCog   size={15} /> },
    ],
  },
  {
    href: `${PORTAL_BASE}/quality`,
    label: 'Quality & Judgment',
    icon: <Scale size={18} />,
    planet: 'themis',
    children: [
      { href: `${PORTAL_BASE}/quality/adequation`, label: 'Adequation',    icon: <Target size={15} /> },
      { href: `${PORTAL_BASE}/quality/gates`,      label: 'Quality Gates', icon: <Shield size={15} /> },
      { href: `${PORTAL_BASE}/quality/themis`,     label: 'Themis',        icon: <Gavel  size={15} /> },
    ],
  },
  {
    href: `${PORTAL_BASE}/scheduling`,
    label: 'Scheduling',
    icon: <Clock size={18} />,
    planet: 'sun',
  },
];

interface ControlShellProps {
  activeHref: string;
  title?: string;
  children: ReactNode;
}

export function ControlShell({
  activeHref,
  title = 'Control Plane',
  children,
}: ControlShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider saturnUrl={getSolarConfig().saturn} autoRefresh={false}>
        <ToastProvider>
          <PortalGate minimum="member">
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
