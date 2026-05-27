import type { ReactNode } from 'react';

// Variants including legacy aliases for backward compat
export type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray' | 'yellow' | 'orange';

type CoreVariant = 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray';

const STYLES: Record<CoreVariant, React.CSSProperties> = {
  green:  { backgroundColor: 'var(--status-green-bg)',  color: 'var(--status-green-text)' },
  blue:   { backgroundColor: 'var(--status-blue-bg)',   color: 'var(--status-blue-text)' },
  amber:  { backgroundColor: 'var(--status-amber-bg)',  color: 'var(--status-amber-text)' },
  red:    { backgroundColor: 'var(--status-red-bg)',    color: 'var(--status-red-text)' },
  purple: { backgroundColor: 'var(--status-purple-bg)', color: 'var(--status-purple-text)' },
  gray:   { backgroundColor: 'var(--status-gray-bg)',   color: 'var(--status-gray-text)' },
};

function normalize(v: BadgeVariant): CoreVariant {
  if (v === 'yellow' || v === 'orange') return 'amber';
  return v as CoreVariant;
}

export function getTierVariant(tier: string): BadgeVariant {
  if (tier === 'Platinum') return 'purple';
  if (tier === 'Gold')     return 'amber';
  if (tier === 'Silver')   return 'gray';
  return 'green';
}

export function getStatusVariant(status: string): BadgeVariant {
  const s = (status ?? '').toLowerCase().replace(/\s+/g, '');
  if (['active','delivered','verified','posted','confirmed','approved'].includes(s)) return 'green';
  if (['pending','draft','submitted','underreview','pendingapproval'].includes(s))   return 'amber';
  if (['overdue','blocked','failed','rejected','cancelled','expired','inactive'].includes(s)) return 'red';
  if (['allocated','dispatched','intransit','invoiced','completed'].includes(s))     return 'blue';
  if (['platinum'].includes(s)) return 'purple';
  return 'gray';
}

/** @deprecated use getStatusVariant */
export const statusVariant = getStatusVariant;

interface BadgeProps {
  variant?: BadgeVariant;
  /** Preferred API */
  children?: ReactNode;
  /** Legacy label prop — kept for backward compat */
  label?: string;
  className?: string;
}

export default function Badge({ variant = 'gray', children, label, className = '' }: BadgeProps) {
  const content = children ?? label;
  const s = STYLES[normalize(variant)];
  return (
    <span
      style={{
        ...s,
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      className={className}
    >
      {content}
    </span>
  );
}
