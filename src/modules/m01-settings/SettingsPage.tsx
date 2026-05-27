// SettingsPage — tab orchestrator for Admin / OperationsHead
// Tabs: User Management | Store Settings | Loyalty Programme | Product Catalogue

import { useState } from 'react';
import { Users, Store, Star, Package } from 'lucide-react';
import UserManagement from './UserManagement';
import StoreSettings from './StoreSettings';
import LoyaltyProgrammeConfig from './LoyaltyProgrammeConfig';
import ProductCatalogueSettings from './ProductCatalogueSettings';

type Tab = 'users' | 'stores' | 'loyalty' | 'catalogue';

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { id: 'users',     label: 'User Management',     icon: Users   },
  { id: 'stores',    label: 'Store Settings',       icon: Store   },
  { id: 'loyalty',   label: 'Loyalty Programme',    icon: Star    },
  { id: 'catalogue', label: 'Product Catalogue',    icon: Package },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform configuration — Admin and Operations Head only</p>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                ].join(' ')}
              >
                <Icon size={15} className="flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {activeTab === 'users'     && <UserManagement />}
        {activeTab === 'stores'    && <StoreSettings />}
        {activeTab === 'loyalty'   && <LoyaltyProgrammeConfig />}
        {activeTab === 'catalogue' && <ProductCatalogueSettings />}
      </div>
    </div>
  );
}
