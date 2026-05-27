import type { ReactNode } from 'react';

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .arms-table { width: 100%; border-collapse: collapse; }
        .arms-table thead { background-color: #f8fafc; border-bottom: 1px solid var(--border); }
        .arms-table tbody tr:last-child td { border-bottom: none; }
      `}</style>
      <table className="arms-table">
        {children}
      </table>
    </div>
  );
}

interface ThProps {
  children?: ReactNode;
  right?: boolean;
  mono?: boolean;
}

export function Th({ children, right, mono }: ThProps) {
  return (
    <th
      style={{
        fontSize: '11px',
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '10px 16px',
        textAlign: right ? 'right' : 'left',
        fontFamily: mono ? 'monospace' : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

interface TdProps {
  children?: ReactNode;
  right?: boolean;
  mono?: boolean;
  bold?: boolean;
  muted?: boolean;
}

export function Td({ children, right, mono, bold, muted }: TdProps) {
  return (
    <td
      style={{
        fontSize: '13px',
        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
        padding: '12px 16px',
        textAlign: right ? 'right' : 'left',
        fontFamily: mono ? 'monospace' : undefined,
        fontWeight: bold ? 500 : undefined,
        borderBottom: '1px solid #f8fafc',
      }}
    >
      {children}
    </td>
  );
}

interface TrProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Tr({ children, onClick, className }: TrProps) {
  return (
    <tr
      className={className}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafa';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '';
      }}
    >
      {children}
    </tr>
  );
}
