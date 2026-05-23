'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { PlanetId } from '../../tokens/index';
import { PLANET_META } from '../../tokens/index';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  planet?: PlanetId;
  badge?: string | number;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onCollapse: () => void;
  activeHref: string;
}

function NavItemRow({
  item,
  collapsed,
  activeHref,
  depth = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  activeHref: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => c.href === activeHref) ?? false
  );
  const isActive = item.href === activeHref;
  const planetColor = item.planet ? PLANET_META[item.planet].color : 'var(--color-moon)';
  const planetGlow = item.planet ? PLANET_META[item.planet].glow : 'rgba(99,102,241,0.2)';

  const handleClick = (e: React.MouseEvent) => {
    if (item.children?.length) {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  return (
    <div>
      <a
        href={item.href}
        onClick={handleClick}
        className={clsx(
          'group flex items-center gap-3 px-3 py-2.5 rounded-md mx-2 my-0.5 cursor-pointer transition-all duration-150 relative select-none',
          isActive
            ? 'text-white'
            : 'hover:bg-white/5',
          depth > 0 && 'pl-10 py-2 text-sm'
        )}
        style={{
          color: isActive ? planetColor : 'var(--color-solar-text-secondary)',
          background: isActive
            ? `linear-gradient(90deg, ${planetColor}18 0%, transparent 100%)`
            : undefined,
          boxShadow: isActive ? `inset 3px 0 0 ${planetColor}, 0 0 12px ${planetGlow}` : undefined,
          textDecoration: 'none',
        }}
        title={collapsed ? item.label : undefined}
      >
        {/* Icon */}
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
          style={{ color: isActive ? planetColor : 'inherit' }}
        >
          {item.icon}
        </span>

        {/* Label */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {!collapsed && item.badge !== undefined && (
          <span
            className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded-full"
            style={{
              background: `${planetColor}22`,
              color: planetColor,
              border: `1px solid ${planetColor}44`,
            }}
          >
            {item.badge}
          </span>
        )}

        {/* Chevron for children */}
        {!collapsed && item.children?.length && (
          <motion.svg
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
            className="ml-auto opacity-50"
          >
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </a>

      {/* Nested children */}
      <AnimatePresence initial={false}>
        {open && !collapsed && item.children?.map((child) => (
          <NavItemRow
            key={child.href}
            item={child}
            collapsed={collapsed}
            activeHref={activeHref}
            depth={1}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ items, collapsed, onCollapse, activeHref }: SidebarProps) {
  return (
    <div
      className="flex flex-col h-full relative transition-all duration-300"
      style={{
        width: collapsed ? 60 : 240,
        background: 'var(--color-solar-surface)',
        borderRight: '1px solid var(--color-solar-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-solar-border)' }}
      >
        <span className="text-lg flex-shrink-0" style={{ color: 'var(--color-sun)' }}>☀</span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-bold tracking-wider whitespace-nowrap overflow-hidden"
              style={{ color: 'var(--color-solar-text-primary)' }}
            >
              Solar Systems
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-none">
        {items.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            activeHref={activeHref}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div
        className="flex-shrink-0 p-2"
        style={{ borderTop: '1px solid var(--color-solar-border)' }}
      >
        <button
          onClick={onCollapse}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-md transition-all duration-150 hover:bg-white/5"
          style={{ color: 'var(--color-solar-text-muted)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.svg
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
          >
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
          {!collapsed && (
            <span className="text-xs">Collapse</span>
          )}
        </button>
      </div>
    </div>
  );
}
