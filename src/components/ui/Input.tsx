import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Search, ChevronDown } from 'lucide-react';

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  iconLeft?: LucideIcon;
  className?: string;
  type?: string;
}

const BASE_STYLE: React.CSSProperties = {
  height: '34px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-card)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function Input({
  value,
  onChange,
  placeholder,
  disabled,
  iconLeft: IconLeft,
  className,
  type = 'text',
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`relative flex items-center ${className ?? ''}`} style={{ display: 'inline-flex', width: '100%', position: 'relative', alignItems: 'center' }}>
      {IconLeft && (
        <span
          style={{
            position: 'absolute',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          <IconLeft size={16} />
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_STYLE,
          paddingInline: IconLeft ? '36px 12px' : '12px',
          borderColor: focused ? 'var(--green-500)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px rgba(22,163,74,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: '10px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <Search size={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_STYLE,
          paddingInline: '36px 12px',
          backgroundColor: focused ? '#ffffff' : '#f8fafc',
          borderColor: focused ? 'var(--green-500)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px rgba(22,163,74,0.12)' : 'none',
          transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Select({ value, onChange, children, disabled, className }: SelectProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...BASE_STYLE,
          paddingInline: '12px 32px',
          appearance: 'none',
          WebkitAppearance: 'none',
          borderColor: focused ? 'var(--green-500)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px rgba(22,163,74,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {children}
      </select>
      <span
        style={{
          position: 'absolute',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
      >
        <ChevronDown size={14} />
      </span>
    </div>
  );
}
