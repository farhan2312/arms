import type { ComponentType } from 'react';
import Card from './Card';

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

export default function KpiCard({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
  iconBg = '#dcfce7',
  iconColor = '#16a34a',
}: KpiCardProps) {
  const trendColor =
    trendUp === true
      ? '#16a34a'
      : trendUp === false
      ? '#dc2626'
      : 'var(--text-muted)';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginTop: '8px',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {trend && (
        <div
          style={{
            fontSize: '11px',
            color: trendColor,
            marginTop: '4px',
          }}
        >
          {trend}
        </div>
      )}
    </Card>
  );
}
