import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Leaf,
  Users,
  Ticket,
  Map,
  Briefcase,
  Star,
  BarChart3,
  Activity,
  Settings,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { NavItem, UserRole } from '../types';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: null },
  { label: 'POS', path: '/pos', icon: ShoppingCart, roles: ['StoreIncharge', 'Admin'] },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: PackageSearch,
    roles: ['StoreIncharge', 'OperationsHead', 'WarehouseManager', 'Admin'],
  },
  {
    label: 'Products',
    path: '/products',
    icon: Leaf,
    roles: ['StoreIncharge', 'OperationsHead', 'WarehouseManager', 'Admin'],
  },
  {
    label: 'Farmers',
    path: '/farmers',
    icon: Users,
    roles: ['StoreIncharge', 'BDM', 'B2BSalesExecutive', 'Admin'],
  },
  {
    label: 'Coupons',
    path: '/coupons',
    icon: Ticket,
    roles: ['StoreIncharge', 'Finance', 'Admin'],
  },
  {
    label: 'Field Force',
    path: '/field-force',
    icon: Map,
    roles: ['BDM', 'OperationsHead', 'Admin'],
  },
  {
    label: 'B2B Orders',
    path: '/b2b-orders',
    icon: Briefcase,
    roles: ['BDM', 'B2BSalesExecutive', 'Admin'],
  },
  {
    label: 'Loyalty',
    path: '/loyalty',
    icon: Star,
    roles: ['Finance', 'Admin'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['OperationsHead', 'Finance', 'Admin'],
  },
  {
    label: 'Ops Dashboard',
    path: '/analytics',
    icon: Activity,
    roles: ['OperationsHead', 'SuperAdmin', 'Admin'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['Admin'],
  },
];

const ROLE_COLORS: Record<UserRole, string> = {
  SuperAdmin: 'bg-red-500/20 text-red-300',
  Admin: 'bg-emerald-500/20 text-emerald-300',
  StoreIncharge: 'bg-blue-500/20 text-blue-300',
  Cashier: 'bg-blue-500/20 text-blue-300',
  BDM: 'bg-purple-500/20 text-purple-300',
  FieldAgent: 'bg-green-500/20 text-green-300',
  B2BSalesExecutive: 'bg-teal-500/20 text-teal-300',
  OperationsHead: 'bg-orange-500/20 text-orange-300',
  WarehouseManager: 'bg-yellow-500/20 text-yellow-300',
  Finance: 'bg-pink-500/20 text-pink-300',
};

export default function Sidebar() {
  const { currentUser } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles === null || item.roles.includes(currentUser.role),
  );

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 h-screen flex flex-col select-none">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700/60 flex items-center gap-3">
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
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
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

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm font-semibold flex-shrink-0">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0">
            <p className="text-gray-200 text-xs font-semibold truncate">{currentUser.name}</p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[currentUser.role]}`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
