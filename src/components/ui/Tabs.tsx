interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: isActive ? 'var(--green-500)' : 'var(--text-secondary)',
              paddingBottom: '10px',
              marginRight: '24px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--green-500)' : '2px solid transparent',
              marginBottom: '-1px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--green-500)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 500,
                  paddingInline: '3px',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
