import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  padding?: string;
  className?: string;
}

function Card({ children, padding = '20px', className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

function CardHeader({ title, subtitle, right }: CardHeaderProps) {
  return (
    <div
      className="flex items-start justify-between"
      style={{
        borderBottom: '1px solid var(--border)',
        paddingBottom: '14px',
        marginBottom: '16px',
      }}
    >
      <div>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
      {right && (
        <div className="flex items-center">{right}</div>
      )}
    </div>
  );
}

export default Card;
export { Card, CardHeader };
