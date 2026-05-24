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

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Overview',
    icon: <BarChart3 size={18} />,
    planet: 'sun',
  },
  {
    href: '/agents',
    label: 'Agents',
    icon: <Bot size={18} />,
    planet: 'mars',
  },
  {
    href: '/envelope',
    label: 'Envelope',
    icon: <Mail size={18} />,
    planet: 'saturn',
  },
  {
    href: '/models',
    label: 'Models & Inference',
    icon: <Cpu size={18} />,
    planet: 'neptune',
    children: [
      { href: '/models/providers', label: 'Providers',      icon: <Server       size={15} /> },
      { href: '/models/registry',  label: 'Model Registry', icon: <Star         size={15} /> },
      { href: '/models/quality',   label: 'Quality',        icon: <FlaskConical size={15} /> },
    ],
  },
  {
    href: '/skills',
    label: 'Skills & Tools',
    icon: <Wrench size={18} />,
    planet: 'sun',
  },
  {
    href: '/tenants',
    label: 'Tenants & Users',
    icon: <Users size={18} />,
    planet: 'saturn',
    children: [
      { href: '/tenants',       label: 'Tenants', icon: <Building2 size={15} /> },
      { href: '/tenants/users', label: 'Users',   icon: <UserCog   size={15} /> },
    ],
  },
  {
    href: '/quality',
    label: 'Quality & Judgment',
    icon: <Scale size={18} />,
    planet: 'themis',
    children: [
      { href: '/quality/adequation', label: 'Adequation',    icon: <Target size={15} /> },
      { href: '/quality/gates',      label: 'Quality Gates', icon: <Shield size={15} /> },
      { href: '/quality/themis',     label: 'Themis',        icon: <Gavel  size={15} /> },
    ],
  },
  {
    href: '/scheduling',
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
