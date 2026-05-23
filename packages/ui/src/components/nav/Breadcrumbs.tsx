import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      className={`flex items-center gap-1 flex-wrap ${className ?? ''}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <span
                className="text-xs select-none"
                style={{ color: 'var(--color-solar-text-disabled)' }}
                aria-hidden
              >
                /
              </span>
            )}
            {!isLast && item.href ? (
              <a
                href={item.href}
                className="text-sm transition-colors hover:underline"
                style={{ color: 'var(--color-solar-text-secondary)', textDecoration: 'none' }}
              >
                {item.label}
              </a>
            ) : (
              <span
                className="text-sm font-medium"
                style={{ color: isLast ? 'var(--color-solar-text-primary)' : 'var(--color-solar-text-secondary)' }}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
