import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, PackageSearch, Leaf, Users,
  Ticket, Map, Briefcase, Star, Wallet, SlidersHorizontal,
  BarChart3, Activity, Settings, Sprout, Store, Megaphone,
  Building2, BookOpen, FileMinus, CircleDollarSign, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { NavItem, UserRole } from '../types';

// Roles that bypass per-item role restrictions and see all nav items
const PLATFORM_WIDE_ROLES: UserRole[] = ['OperationsHead', 'Admin', 'SuperAdmin'];

const NAV_ITEMS: NavItem[] = [
  // ── Always visible ───────────────────────────────────────────────────────
  { label: 'Dashboard',         path: '/',                icon: LayoutDashboard,   roles: null },

  // ── Store Ops ─────────────────────────────────────────────────────────────
  { label: 'POS',               path: '/pos',             icon: ShoppingCart,      roles: ['StoreIncharge', 'Cashier'] },
  { label: 'Inventory',         path: '/inventory',       icon: PackageSearch,     roles: ['StoreIncharge', 'WarehouseManager'],   activeFor: ['/inventory', '/grn'] },
  { label: 'Farmers',           path: '/farmers',         icon: Users,             roles: ['StoreIncharge', 'BDM', 'B2BSalesExecutive'] },
  { label: 'Coupons',           path: '/coupons',         icon: Ticket,            roles: ['StoreIncharge', 'Finance'] },
  { label: 'Daily Bookkeeping', path: '/bookkeeping',     icon: BookOpen,          roles: ['StoreIncharge', 'Finance'] },
  { label: 'Loyalty Lookup',    path: '/wallet-lookup',   icon: Wallet,            roles: ['StoreIncharge'] },

  // ── BDM / Field ───────────────────────────────────────────────────────────
  { label: 'Stores',            path: '/stores',          icon: Store,             roles: ['BDM'] },
  { label: 'Outreach',          path: '/outreach',        icon: Megaphone,         roles: ['BDM'] },
  { label: 'Field Force',       path: '/field-force',     icon: Map,               roles: ['BDM', 'B2BSalesExecutive', 'FieldAgent'] },
  { label: 'Loyalty Dashboard', path: '/loyalty',         icon: Star,              roles: ['BDM', 'Finance'] },

  // ── B2B / Retailer ────────────────────────────────────────────────────────
  { label: 'B2B Orders',        path: '/b2b-orders',      icon: Briefcase,         roles: ['BDM', 'B2BSalesExecutive', 'WarehouseManager'], activeFor: ['/b2b-orders', '/b2b-new'] },
  { label: 'Retailer Accounts', path: '/retailers',       icon: Building2,         roles: ['BDM', 'B2BSalesExecutive'] },
  { label: 'Catalogue',         path: '/products',        icon: Leaf,              roles: ['B2BSalesExecutive', 'WarehouseManager'] },

  // ── Finance ───────────────────────────────────────────────────────────────
  { label: 'Reports',           path: '/reports',         icon: BarChart3,         roles: ['Finance'] },
  { label: 'Credit Notes',      path: '/credit-notes',    icon: FileMinus,         roles: ['Finance'] },
  { label: 'B2B Receivables',   path: '/b2b-receivables', icon: CircleDollarSign,  roles: ['Finance'] },

  // ── Platform-wide only (Admin / SuperAdmin / OperationsHead) ──────────────
  { label: 'Operations Dashboard', path: '/analytics',     icon: Activity,          roles: [] },
  { label: 'Tier Management',   path: '/tier-management', icon: SlidersHorizontal, roles: [] },
  { label: 'Settings',          path: '/settings',        icon: Settings,          roles: [] },
];

const ROLE_COLORS: Record<UserRole, string> = {
  SuperAdmin:        'bg-red-500/20 text-red-300',
  Admin:             'bg-emerald-500/20 text-emerald-300',
  StoreIncharge:     'bg-blue-500/20 text-blue-300',
  Cashier:           'bg-sky-500/20 text-sky-300',
  BDM:               'bg-purple-500/20 text-purple-300',
  FieldAgent:        'bg-green-500/20 text-green-300',
  B2BSalesExecutive: 'bg-teal-500/20 text-teal-300',
  OperationsHead:    'bg-orange-500/20 text-orange-300',
  WarehouseManager:  'bg-yellow-500/20 text-yellow-300',
  Finance:           'bg-pink-500/20 text-pink-300',
};

// Returns true when `pathname` should be considered active for the given nav item.
// Default: prefix-match on item.path (covers /:id child routes automatically).
// If item.activeFor is set, each entry is checked as an exact match OR a prefix
// (e.g. '/b2b-orders' matches '/b2b-orders/42'). Dashboard ('/') is always exact.
function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.path === '/') return pathname === '/';
  const patterns = item.activeFor ?? [item.path];
  return patterns.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function Sidebar() {
  const { currentUser, setCurrentUser, allUsers } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles === null) return true;
    if (PLATFORM_WIDE_ROLES.includes(currentUser.role)) return true;
    return item.roles.includes(currentUser.role);
  });

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 h-screen flex flex-col select-none">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700/60 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <Sprout size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none tracking-wide">ARMS</p>
          <p className="text-gray-500 text-[10px] mt-0.5 leading-none uppercase tracking-widest">
            Agri Retail Mgmt
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isNavActive(item, location.pathname)
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
                ].join(' ')
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User card — click to open role switcher */}
      <div className="relative flex-shrink-0">
        {/* Upward popover */}
        {popoverOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setPopoverOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-1 overflow-hidden mx-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold px-3 py-2">
                Switch Role
              </p>
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setCurrentUser(user);
                    setPopoverOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    user.id === currentUser.id ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold flex-shrink-0">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-800 font-medium truncate text-xs">{user.name}</p>
                    <p className="text-gray-500 text-[11px]">{user.role}</p>
                  </div>
                  {user.id === currentUser.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Trigger button */}
        <button
          onClick={() => setPopoverOpen((v) => !v)}
          className="w-full px-4 py-3 border-t border-gray-700/60 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm font-semibold flex-shrink-0">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-200 text-xs font-semibold truncate">{currentUser.name}</p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[currentUser.role]}`}
            >
              {currentUser.role}
            </span>
          </div>
          <ChevronUp
            size={13}
            className={`text-gray-500 flex-shrink-0 transition-transform duration-150 ${popoverOpen ? '' : 'rotate-180'}`}
          />
        </button>
      </div>
    </aside>
  );
}
