interface StatProps {
  label: string;
  value: string | number;
  className?: string;
}

export default function Stat({ label, value, className }: StatProps) {
  return (
    <div
      className={`flex flex-col ${className ?? ''}`}
      style={{ gap: '2px' }}
    >
      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
