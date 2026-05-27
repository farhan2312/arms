import type { ComponentType, ReactNode } from 'react';

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: ReactNode;
}

const SIZE_STYLE: Record<ButtonSize, { height: string; paddingInline: string }> = {
  sm: { height: '28px', paddingInline: '12px' },
  md: { height: '34px', paddingInline: '16px' },
  lg: { height: '40px', paddingInline: '20px' },
};

type VariantStyle = {
  backgroundColor: string;
  color: string;
  border: string;
};

const VARIANT_STYLE: Record<ButtonVariant, VariantStyle> = {
  primary: {
    backgroundColor: 'var(--green-500)',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    backgroundColor: '#ffffff',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  danger: {
    backgroundColor: '#ffffff',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
};

const HOVER_BG: Record<ButtonVariant, string> = {
  primary: 'var(--green-600)',
  secondary: 'var(--bg-page)',
  danger: '#fee2e2',
  ghost: 'transparent',
};

const HOVER_COLOR: Record<ButtonVariant, string | undefined> = {
  primary: undefined,
  secondary: undefined,
  danger: undefined,
  ghost: 'var(--text-primary)',
};

function Spinner() {
  return (
    <span
      className="animate-spin"
      style={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: 'currentColor',
        flexShrink: 0,
      }}
    />
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  iconLeft: IconLeft,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className,
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLE[size];
  const variantStyle = VARIANT_STYLE[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1.5 transition-colors ${className ?? ''}`}
      style={{
        height: sizeStyle.height,
        paddingInline: sizeStyle.paddingInline,
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        border: variantStyle.border,
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        // CSS variables for hover set via data attrs — handled via onMouseEnter/Leave
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.backgroundColor = HOVER_BG[variant];
        if (HOVER_COLOR[variant]) el.style.color = HOVER_COLOR[variant]!;
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.backgroundColor = variantStyle.backgroundColor;
        el.style.color = variantStyle.color;
      }}
    >
      {loading ? (
        <Spinner />
      ) : (
        IconLeft && <IconLeft size={14} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={14} />}
    </button>
  );
}
