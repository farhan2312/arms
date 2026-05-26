import { useNavigate } from 'react-router-dom';
import {
  Sprout, ShieldAlert, Shield, Store, ShoppingCart,
  Briefcase, Leaf, Users, Activity, PackageSearch, BarChart3,
} from 'lucide-react';
import { MOCK_USERS } from '../../data/mockUsers';
import { useAuth } from '../../context/AuthContext';
import type { User, UserRole } from '../../types/roles';
import type { ComponentType } from 'react';

interface RoleConfig {
  icon: ComponentType<{ size?: number; className?: string }>;
  description: string;
  accent: string;       // border + icon colour
  bg: string;           // card background
}

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  SuperAdmin:        { icon: ShieldAlert,   description: 'Platform owner — full system access',            accent: 'border-red-300 text-red-500',      bg: 'bg-red-50' },
  Admin:             { icon: Shield,        description: 'Organisation admin — all stores and modules',    accent: 'border-emerald-300 text-emerald-600', bg: 'bg-emerald-50' },
  StoreIncharge:     { icon: Store,         description: 'Manages a retail store — POS, inventory, CRM',  accent: 'border-blue-300 text-blue-500',     bg: 'bg-blue-50' },
  Cashier:           { icon: ShoppingCart,  description: 'POS operator within a store',                   accent: 'border-sky-300 text-sky-500',       bg: 'bg-sky-50' },
  BDM:               { icon: Briefcase,     description: 'Territory owner — field team and B2B sales',    accent: 'border-purple-300 text-purple-500', bg: 'bg-purple-50' },
  FieldAgent:        { icon: Leaf,          description: 'Farmer outreach and field journeys',            accent: 'border-green-300 text-green-600',   bg: 'bg-green-50' },
  B2BSalesExecutive: { icon: Users,         description: 'B2B orders and retailer account management',    accent: 'border-teal-300 text-teal-500',     bg: 'bg-teal-50' },
  OperationsHead:    { icon: Activity,      description: 'Regional operations oversight — approves all',  accent: 'border-orange-300 text-orange-500', bg: 'bg-orange-50' },
  WarehouseManager:  { icon: PackageSearch, description: 'GRN, stock transfers and warehouse inventory',  accent: 'border-yellow-400 text-yellow-600', bg: 'bg-yellow-50' },
  Finance:           { icon: BarChart3,     description: 'Bookkeeping, credit notes and B2B receivables', accent: 'border-pink-300 text-pink-500',     bg: 'bg-pink-50' },
};

export default function LoginPage() {
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  function handleSelect(user: User) {
    setCurrentUser(user);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
          <Sprout size={26} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 leading-none tracking-wide">ARMS</p>
          <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-widest">Agri Retail Management System</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-10">Select your role to continue</p>

      {/* Role cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full max-w-5xl">
        {MOCK_USERS.map((user) => {
          const cfg = ROLE_CONFIG[user.role];
          const Icon = cfg.icon;
          return (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className={`${cfg.bg} border-2 ${cfg.accent} rounded-2xl p-5 flex flex-col items-center text-center gap-2 transition-all duration-150 hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/70 ${cfg.accent}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{user.name}</p>
                <p className="text-[11px] font-medium text-gray-500 mt-0.5">{user.role}</p>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">{cfg.description}</p>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 mt-10">Demo mode · No authentication required</p>
    </div>
  );
}
