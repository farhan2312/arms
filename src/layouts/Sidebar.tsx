import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, PackageSearch, Leaf, Users,
  Ticket, Map, Briefcase, Star, BarChart3, Activity, Settings,
  Sprout, Store, Building2, BookOpen, FileMinus, CircleDollarSign,
  ChevronUp, ClipboardList, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { NavItem, UserRole } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Roles that see all nav items ──────────────────────────────────────────────

const PLATFORM_WIDE_ROLES: UserRole[] = ['OperationsHead', 'Admin', 'SuperAdmin'];

// ── Grouped nav structure ─────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Dashboard',   path: '/',           icon: LayoutDashboard, roles: null },
      { label: 'POS',         path: '/pos',         icon: ShoppingCart,    roles: ['StoreIncharge', 'Cashier'] },
      { label: 'Inventory',   path: '/inventory',   icon: PackageSearch,   roles: ['StoreIncharge', 'WarehouseManager'], activeFor: ['/inventory', '/grn'] },
      { label: 'Catalogue',   path: '/products',    icon: Leaf,            roles: ['B2BSalesExecutive', 'WarehouseManager'] },
      { label: 'Procurement', path: '/procurement', icon: ClipboardList,   roles: ['StoreIncharge', 'WarehouseManager', 'BDM', 'OperationsHead'] },
      { label: 'Compliance',  path: '/compliance',  icon: ShieldCheck,     roles: ['StoreIncharge', 'Finance'] },
    ],
  },
  {
    label: 'FARMERS',
    items: [
      { label: 'Farmers', path: '/farmers', icon: Users,   roles: ['StoreIncharge', 'BDM', 'B2BSalesExecutive'], activeFor: ['/farmers', '/outreach', '/wallet-lookup'] },
      { label: 'Coupons', path: '/coupons', icon: Ticket,  roles: ['StoreIncharge', 'Finance'] },
      { label: 'Loyalty', path: '/loyalty', icon: Star,    roles: ['BDM', 'Finance'], activeFor: ['/loyalty', '/wallet-lookup', '/tier-management'] },
    ],
  },
  {
    label: 'FIELD',
    items: [
      { label: 'Field Force', path: '/field-force', icon: Map,   roles: ['BDM', 'B2BSalesExecutive', 'FieldAgent'] },
      { label: 'Stores',      path: '/stores',      icon: Store, roles: ['BDM'] },
    ],
  },
  {
    label: 'B2B',
    items: [
      { label: 'B2B Orders',        path: '/b2b-orders',      icon: Briefcase,        roles: ['BDM', 'B2BSalesExecutive', 'WarehouseManager'], activeFor: ['/b2b-orders', '/b2b-new'] },
      { label: 'Retailer Accounts', path: '/retailers',       icon: Building2,        roles: ['BDM', 'B2BSalesExecutive'] },
      { label: 'B2B Receivables',   path: '/b2b-receivables', icon: CircleDollarSign, roles: ['Finance'] },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { label: 'Bookkeeping', path: '/bookkeeping',  icon: BookOpen,  roles: ['StoreIncharge', 'Finance'] },
      { label: 'Credit Notes', path: '/credit-notes', icon: FileMinus, roles: ['Finance'] },
      { label: 'Reports',     path: '/reports',      icon: BarChart3, roles: ['Finance'] },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { label: 'Ops Dashboard', path: '/analytics', icon: Activity, roles: [] },
      { label: 'Settings',      path: '/settings',  icon: Settings,  roles: [] },
    ],
  },
];

// ── Active detection ──────────────────────────────────────────────────────────

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.path === '/') return pathname === '/';
  const patterns = item.activeFor ?? [item.path];
  return patterns.some(p => pathname === p || pathname.startsWith(p + '/'));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { currentUser, setCurrentUser, allUsers } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const location = useLocation();

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('');

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-sidebar)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '18px 16px 16px',
          borderBottom: '1px solid var(--sidebar-border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--green-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sprout size={18} color="white" />
        </div>
        <div>
          <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px', lineHeight: 1.1 }}>ARMS</p>
          <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px', lineHeight: 1 }}>
            Bharat Agri Platform
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="overflow-y-auto scrollbar-thin"
        style={{ flex: 1, padding: '8px 8px 0' }}
      >
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.roles === null) return true;
            if (PLATFORM_WIDE_ROLES.includes(currentUser.role)) return true;
            return item.roles.includes(currentUser.role);
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} style={{ marginTop: '16px' }}>
              {/* Group label */}
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: 'var(--sidebar-group)',
                  padding: '0 8px',
                  marginBottom: '4px',
                }}
              >
                {group.label}
              </p>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {visibleItems.map((item) => {
                  const active = isNavActive(item, location.pathname);
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        height: '36px',
                        padding: '0 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        fontWeight: active ? 500 : 400,
                        textDecoration: 'none',
                        backgroundColor: active ? 'var(--sidebar-active)' : 'transparent',
                        color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                        transition: 'background-color 120ms, color 120ms',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--sidebar-hover)';
                          (e.currentTarget as HTMLAnchorElement).style.color = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sidebar-text)';
                        }
                      }}
                    >
                      <span style={{ color: active ? '#ffffff' : '#6b7280', flexShrink: 0, display: 'flex' }}>
                        <Icon size={16} />
                      </span>
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div style={{ height: '16px' }} />
      </nav>

      {/* User card + role switcher */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {popoverOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setPopoverOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '8px',
                right: '8px',
                marginBottom: '4px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)',
                zIndex: 20,
                overflow: 'hidden',
                paddingBlock: '4px',
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: 'var(--text-muted)',
                  padding: '8px 12px 4px',
                  textTransform: 'uppercase',
                }}
              >
                Switch Role
              </p>
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => { setCurrentUser(user); setPopoverOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: user.id === currentUser.id ? 'var(--green-50)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (user.id !== currentUser.id)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (user.id !== currentUser.id)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--green-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--green-900)',
                      fontSize: '11px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initials(user.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>{user.role}</p>
                  </div>
                  {user.id === currentUser.id && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--green-500)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setPopoverOpen(v => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderTop: '1px solid var(--sidebar-border)',
            background: 'transparent',
            border: 'none',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'var(--sidebar-border)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 120ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--sidebar-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--green-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials(currentUser.name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name}
            </p>
            <p style={{ color: '#6b7280', fontSize: '10px', lineHeight: 1.2, marginTop: '1px' }}>
              {currentUser.role}
            </p>
          </div>
          <ChevronUp
            size={13}
            style={{
              color: '#6b7280',
              flexShrink: 0,
              transform: popoverOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 150ms',
            }}
          />
        </button>
      </div>
    </aside>
  );
}
