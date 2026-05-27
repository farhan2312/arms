// UserManagement — Admin / OperationsHead only
// Full user CRUD with role, store, and retailer assignment

import { useState, useMemo } from 'react';
import { Plus, Pencil, UserX, UserCheck, X, Check } from 'lucide-react';
import type { User, UserRole } from '../../types/roles';
import { MOCK_USERS } from '../../data/mockUsers';
import { mockStores } from '../../data/mockStores';
import { mockRetailers } from '../../data/mockRetailers';

const ALL_ROLES: UserRole[] = [
  'SuperAdmin', 'Admin', 'StoreIncharge', 'Cashier',
  'BDM', 'FieldAgent', 'B2BSalesExecutive',
  'OperationsHead', 'WarehouseManager', 'Finance',
];

const ROLE_BADGE: Record<UserRole, string> = {
  SuperAdmin:        'bg-red-100 text-red-700',
  Admin:             'bg-emerald-100 text-emerald-700',
  StoreIncharge:     'bg-blue-100 text-blue-700',
  Cashier:           'bg-sky-100 text-sky-700',
  BDM:               'bg-purple-100 text-purple-700',
  FieldAgent:        'bg-green-100 text-green-700',
  B2BSalesExecutive: 'bg-teal-100 text-teal-700',
  OperationsHead:    'bg-orange-100 text-orange-700',
  WarehouseManager:  'bg-yellow-100 text-yellow-700',
  Finance:           'bg-pink-100 text-pink-700',
};

interface FormState {
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  employeeCode: string;
  assignedStoreIds: string[];
  assignedRetailerIds: string[];
}

const BLANK_FORM: FormState = {
  name: '',
  mobile: '',
  email: '',
  role: 'StoreIncharge',
  employeeCode: '',
  assignedStoreIds: [],
  assignedRetailerIds: [],
};

function userToForm(u: User): FormState {
  return {
    name: u.name,
    mobile: u.mobile,
    email: u.email ?? '',
    role: u.role,
    employeeCode: u.employeeCode ?? '',
    assignedStoreIds: [...u.assignedStoreIds],
    assignedRetailerIds: [...u.assignedRetailerIds],
  };
}

const inputCls = (err?: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    err ? 'border-red-300' : 'border-gray-300'
  }`;

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // ── Store lookup ────────────────────────────────────────────────────────────
  const storeNameById = useMemo(
    () => new Map(mockStores.map(s => [s.id, s.name])),
    [],
  );

  // ── Form helpers ────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setErrors({});
    setShowForm(true);
  }

  function openEdit(user: User) {
    setEditingId(user.id);
    setForm(userToForm(user));
    setErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function toggleStore(id: string) {
    setForm(prev => ({
      ...prev,
      assignedStoreIds: prev.assignedStoreIds.includes(id)
        ? prev.assignedStoreIds.filter(s => s !== id)
        : [...prev.assignedStoreIds, id],
    }));
  }

  function toggleRetailer(id: string) {
    setForm(prev => ({
      ...prev,
      assignedRetailerIds: prev.assignedRetailerIds.includes(id)
        ? prev.assignedRetailerIds.filter(r => r !== id)
        : [...prev.assignedRetailerIds, id],
    }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.mobile.trim()) errs.mobile = 'Mobile is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    if (editingId) {
      setUsers(prev => prev.map(u => {
        if (u.id !== editingId) return u;
        return {
          ...u,
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim() || undefined,
          role: form.role,
          employeeCode: form.employeeCode.trim() || undefined,
          assignedStoreIds: form.assignedStoreIds,
          assignedRetailerIds: form.assignedRetailerIds,
          updatedAt: new Date().toISOString(),
        };
      }));
      console.log('// PUT /api/users/' + editingId, form);
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || undefined,
        role: form.role,
        employeeCode: form.employeeCode.trim() || undefined,
        assignedStoreIds: form.assignedStoreIds,
        assignedRetailerIds: form.assignedRetailerIds,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers(prev => [newUser, ...prev]);
      console.log('// POST /api/users', newUser);
    }
    closeForm();
  }

  function toggleActive(userId: string) {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() } : u,
    ));
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log(`// PATCH /api/users/${userId} — isActive: ${!user.isActive}`);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{users.length} users · {users.filter(u => u.isActive).length} active</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Mobile</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Assigned Stores</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50/60 transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">{user.name}</p>
                      {user.email && <p className="text-gray-400 text-[10px]">{user.email}</p>}
                      {user.employeeCode && <p className="text-gray-400 text-[10px]">{user.employeeCode}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{user.mobile}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                    {user.assignedStoreIds.length === 0
                      ? <span className="italic text-gray-300">All stores</span>
                      : user.assignedStoreIds.map(id => (
                          <span key={id} className="inline-block text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 mr-1 mb-0.5">
                            {storeNameById.get(id)?.replace('Bharat Agri Store – ', '') ?? id}
                          </span>
                        ))
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => toggleActive(user.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.isActive
                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeForm} />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-900">
                {editingId ? 'Edit User' : 'Add User'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                  className={inputCls(!!errors.name)}
                  placeholder="e.g. Ramesh Kumar"
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.mobile}
                  onChange={e => { setForm(p => ({ ...p, mobile: e.target.value })); setErrors(p => ({ ...p, mobile: '' })); }}
                  className={inputCls(!!errors.mobile)}
                  placeholder="+91 98000 00000"
                />
                {errors.mobile && <p className="text-[11px] text-red-500 mt-1">{errors.mobile}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className={inputCls()}
                  placeholder="name@bharatagri.in"
                />
              </div>

              {/* Employee Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employee Code</label>
                <input
                  value={form.employeeCode}
                  onChange={e => setForm(p => ({ ...p, employeeCode: e.target.value }))}
                  className={inputCls()}
                  placeholder="e.g. EMP-011"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole, assignedRetailerIds: [] }))}
                  className={inputCls()}
                >
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Assigned Stores */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Assigned Stores</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {mockStores.map(store => (
                    <label key={store.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1.5 py-1">
                      <input
                        type="checkbox"
                        checked={form.assignedStoreIds.includes(store.id)}
                        onChange={() => toggleStore(store.id)}
                        className="accent-emerald-600"
                      />
                      <span className="text-xs text-gray-700">{store.name.replace('Bharat Agri Store – ', '')}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{store.code}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Leave empty for platform-wide access (Admin / SuperAdmin).</p>
              </div>

              {/* Retailer Accounts — only for B2BSalesExecutive */}
              {form.role === 'B2BSalesExecutive' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Assigned Retailer Accounts</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {mockRetailers.map(ret => (
                      <label key={ret.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={form.assignedRetailerIds.includes(ret.id)}
                          onChange={() => toggleRetailer(ret.id)}
                          className="accent-emerald-600"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{ret.firmName}</p>
                          <p className="text-[10px] text-gray-400">{ret.address.district}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-auto flex-shrink-0 ${
                          ret.tier === 'Gold' ? 'bg-amber-100 text-amber-700' :
                          ret.tier === 'Preferred' ? 'bg-blue-100 text-blue-700' :
                          ret.tier === 'Silver' ? 'bg-slate-100 text-slate-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>{ret.tier}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Check size={15} />
                {editingId ? 'Save Changes' : 'Create User'}
              </button>
              <button
                onClick={closeForm}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
