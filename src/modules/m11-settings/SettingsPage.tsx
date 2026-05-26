import { useState, createElement } from 'react';
import { Store, Users, Bell, Shield, Database, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { MOCK_USERS } from '../../data/mockUsers';
import { storeById } from '../../data/mockStores';
import Badge from '../../components/ui/Badge';
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
          </div>
        </div>

        {/* Content */}
        <div className="xl:col-span-3">
          {activeSection === 'store' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-800">Store Profile</h2>
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
              <div>
                <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1">Full Address</label>
                <textarea
                  rows={2}
                  defaultValue="14, Krishi Bhavan Road, APMC Yard Area, Akola – 444001, Maharashtra"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <button className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">Users & Roles</h2>
                <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                  Invite User
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Mobile / Email</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_USERS.map((user) => {
                    const primaryStoreId = user.assignedStoreIds[0];
                    const store = primaryStoreId ? storeById.get(primaryStoreId) : undefined;
                    const assignedLabel = store
                      ? store.name
                      : user.assignedStoreIds.length === 0
                      ? 'Platform-wide'
                      : `${user.assignedStoreIds.length} stores`;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-800">{user.name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{user.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-gray-600">{user.mobile}</p>
                          {user.email && <p className="text-[11px] text-gray-400">{user.email}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge label={user.role} variant={ROLE_COLORS[user.role]} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[200px] truncate">{assignedLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(activeSection === 'notifications' || activeSection === 'permissions' || activeSection === 'data') && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                {createElement(
                  SETTING_SECTIONS.find((s) => s.id === activeSection)!.icon,
                  { size: 22, className: 'text-gray-400' },
                )}
              </div>
              <p className="text-gray-600 text-sm font-medium">
                {SETTING_SECTIONS.find((s) => s.id === activeSection)?.label}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {SETTING_SECTIONS.find((s) => s.id === activeSection)?.description}
              </p>
              <p className="text-gray-300 text-xs mt-4">Configuration coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
