import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useToastContext } from '../../context/ToastContext';
import type { ToastType } from '../../context/ToastContext';

const BORDER_COLOR: Record<ToastType, string> = {
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
};

const ICON_COLOR: Record<ToastType, string> = {
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
};

function ToastIcon({ type }: { type: ToastType }) {
  const color = ICON_COLOR[type];
  const iconProps = { size: 16, style: { color } };

  switch (type) {
    case 'success':
      return <CheckCircle2 {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    case 'error':
      return <XCircle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
  }
}

export default function Toaster() {
  const { toasts, removeToast } = useToastContext();

  const visible = toasts.slice(-3);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      {visible.map((toast) => (
        <div
          key={toast.id}
          style={{
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            borderLeft: `4px solid ${BORDER_COLOR[toast.type]}`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div style={{ marginTop: '1px', flexShrink: 0 }}>
            <ToastIcon type={toast.type} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              {toast.title}
            </div>
            {toast.message && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '2px',
                }}
              >
                {toast.message}
              </div>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '0',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
