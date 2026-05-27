import type { ComponentType } from 'react';
import Button from './Button';

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

interface EmptyStateProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  action?: () => void;
  actionLabel?: string;
}

export default function EmptyState({
  icon: Icon,
  iconColor = '#94a3b8',
  title,
  subtitle,
  action,
  actionLabel,
}: EmptyStateProps) {
  // Convert hex color to rgba with 12% opacity for icon bg
  const iconBg = iconColor.startsWith('#')
    ? `${iconColor}1f`
    : `color-mix(in srgb, ${iconColor} 12%, transparent)`;

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '240px',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}
      >
        <Icon size={32} />
      </div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginTop: '16px',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '6px',
            maxWidth: '280px',
          }}
        >
          {subtitle}
        </div>
      )}
      {action && actionLabel && (
        <div style={{ marginTop: '16px' }}>
          <Button variant="secondary" onClick={action}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
