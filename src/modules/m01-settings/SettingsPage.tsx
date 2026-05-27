// SettingsPage — tab orchestrator for Admin / OperationsHead
// Tabs: User Management | Store Settings | Loyalty Programme | Product Catalogue

import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import UserManagement from './UserManagement';
import StoreSettings from './StoreSettings';
import LoyaltyProgrammeConfig from './LoyaltyProgrammeConfig';
import ProductCatalogueSettings from './ProductCatalogueSettings';

type Tab = 'users' | 'stores' | 'loyalty' | 'catalogue';

const TABS = [
  { id: 'users',     label: 'User Management' },
  { id: 'stores',    label: 'Store Settings' },
  { id: 'loyalty',   label: 'Loyalty Programme' },
  { id: 'catalogue', label: 'Product Catalogue' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 pt-6 flex-shrink-0 bg-white">
        <PageHeader
          title="Settings"
          subtitle="Platform configuration — Admin and Operations Head only"
        />

        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as Tab)}
        />
      </div>

      {/* Tab content */}
      <main
        className="flex-1 overflow-y-auto p-6"
        style={{ backgroundColor: 'var(--bg-page)' }}
      >
        {activeTab === 'users'     && <UserManagement />}
        {activeTab === 'stores'    && <StoreSettings />}
        {activeTab === 'loyalty'   && <LoyaltyProgrammeConfig />}
        {activeTab === 'catalogue' && <ProductCatalogueSettings />}
      </main>
    </div>
  );
}
