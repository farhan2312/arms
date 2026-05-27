import { useState } from 'react';
import { Store, Users, Bell, Shield, Database, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { MOCK_USERS } from '../../data/mockUsers';
import { storeById } from '../../data/mockStores';
import Badge from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import type { UserRole } from '../../types/roles';

const ROLE_COLORS: Record<UserRole, 'blue' | 'purple' | 'orange' | 'green' | 'yellow' | 'gray'> = {
  SuperAdmin: 'orange',
  Admin: 'green',
  StoreIncharge: 'blue',
  Cashier: 'blue',
  BDM: 'purple',
  FieldAgent: 'green',
  B2BSalesExecutive: 'green',
  OperationsHead: 'orange',
  WarehouseManager: 'yellow',
  Finance: 'gray',
};

const SETTING_SECTIONS = [
  { id: 'store', label: 'Store Profile', icon: Store, description: 'Store name, code, address and contact details' },
  { id: 'users', label: 'Users & Roles', icon: Users, description: 'Manage system users and their role assignments' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts for low stock, pending orders and KYC' },
  { id: 'permissions', label: 'Role Permissions', icon: Shield, description: 'Module-level access control per role' },
  { id: 'data', label: 'Data & Integrations', icon: Database, description: 'API keys, ERP sync and export settings' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('users');

  return (
    <div className="p-6">
      <PageHeader title="Settings" subtitle="System configuration and administration" />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="xl:col-span-1">
          <Card padding="0">
            {SETTING_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-100 last:border-0 transition-colors ${
                    activeSection === section.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon size={15} className={activeSection === section.id ? 'text-emerald-600' : 'text-gray-400'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{section.label}</p>
                  </div>
                  <ChevronRight size={13} className="text-gray-300" />
                </button>
              );
            })}
          </Card>
        </div>

        {/* Content */}
        <div className="xl:col-span-3">
          {activeSection === 'store' && (
            <Card padding="24px">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Store Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Store Name', value: 'Bharat Agri Store – Akola' },
                  { label: 'Store Code', value: 'AKL-001' },
                  { label: 'GSTIN', value: '27AABCB1234A1Z5' },
                  { label: 'State', value: 'Maharashtra' },
                  { label: 'Phone', value: '+91 724 248 0001' },
                  { label: 'Email', value: 'akola@bharatagri.in' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">{field.label}</label>
                    <input
                      defaultValue={field.value}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Full Address</label>
                <textarea
                  rows={2}
                  defaultValue="14, Krishi Bhavan Road, APMC Yard Area, Akola – 444001, Maharashtra"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="mt-4">
                <Button variant="primary" size="sm">Save Changes</Button>
              </div>
            </Card>
          )}

          {activeSection === 'users' && (
            <>
              <CardHeader
                title="Users & Roles"
                right={<Button variant="primary" size="sm">Invite User</Button>}
              />
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Mobile / Email</Th>
                    <Th>Role</Th>
                    <Th>Assigned To</Th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map((user) => {
                    const primaryStoreId = user.assignedStoreIds[0];
                    const store = primaryStoreId ? storeById.get(primaryStoreId) : undefined;
                    const assignedLabel = store
                      ? store.name
                      : user.assignedStoreIds.length === 0
                      ? 'Platform-wide'
                      : `${user.assignedStoreIds.length} stores`;
                    return (
                      <Tr key={user.id}>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-800">{user.name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{user.employeeCode}</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <p className="text-xs text-gray-600">{user.mobile}</p>
                          {user.email && <p className="text-[11px] text-gray-400">{user.email}</p>}
                        </Td>
                        <Td>
                          <Badge label={user.role} variant={ROLE_COLORS[user.role]} />
                        </Td>
                        <Td muted>{assignedLabel}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </>
          )}

          {(activeSection === 'notifications' || activeSection === 'permissions' || activeSection === 'data') && (
            <Card padding="48px">
              <EmptyState
                icon={SETTING_SECTIONS.find((s) => s.id === activeSection)!.icon}
                iconColor="#9ca3af"
                title={SETTING_SECTIONS.find((s) => s.id === activeSection)?.label ?? ''}
                subtitle={SETTING_SECTIONS.find((s) => s.id === activeSection)?.description}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
