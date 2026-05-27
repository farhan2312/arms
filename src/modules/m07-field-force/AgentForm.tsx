import { useState } from 'react';
import { X } from 'lucide-react';
import type { FieldAgent, AgentRole, TransportMode } from '../../types';
import { mockStores } from '../../data/mockStores';
import { mockRetailers } from '../../data/mockRetailers';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ────────────────────────────────────────────────────────────────

const AGENT_ROLES: { value: AgentRole; label: string }[] = [
  { value: 'FieldAgent',        label: 'Field Agent' },
  { value: 'BDM',               label: 'BDM' },
  { value: 'ABDM',              label: 'ABDM' },
  { value: 'StoreIncharge',     label: 'Store Incharge' },
  { value: 'B2BSalesExecutive', label: 'B2B Sales Executive' },
];

const TRANSPORT_MODES: TransportMode[] = ['Two-Wheeler', 'Four-Wheeler', 'Public Transport'];

const STATUSES: FieldAgent['status'][] = ['Active', 'Inactive', 'On Leave'];

const MANAGER_USERS = MOCK_USERS.filter(
  (u) => u.role === 'BDM' || u.role === 'OperationsHead' || u.role === 'Admin' || u.role === 'SuperAdmin',
);

// ── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  phone: string;
  role: AgentRole;
  employeeCode: string;
  territory: string;
  district: string;
  state: string;
  hqLocation: string;
  managerId: string;
  joiningDate: string;
  transportMode: TransportMode;
  assignedStoreIds: string[];
  assignedRetailerIds: string[];
  status: FieldAgent['status'];
}

function defaultForm(agentCount: number, agent?: FieldAgent): FormState {
  if (agent) {
    return {
      name:               agent.name,
      phone:              agent.phone,
      role:               agent.role ?? 'FieldAgent',
      employeeCode:       agent.employeeCode,
      territory:          agent.territory,
      district:           agent.district,
      state:              agent.state,
      hqLocation:         agent.hqLocation ?? '',
      managerId:          agent.managerId,
      joiningDate:        agent.joiningDate,
      transportMode:      agent.transportMode ?? 'Two-Wheeler',
      assignedStoreIds:   agent.assignedStoreIds ?? [],
      assignedRetailerIds: agent.assignedRetailerIds ?? [],
      status:             agent.status,
    };
  }
  return {
    name:               '',
    phone:              '',
    role:               'FieldAgent',
    employeeCode:       `EMP-${String(agentCount + 1).padStart(3, '0')}`,
    territory:          '',
    district:           '',
    state:              '',
    hqLocation:         '',
    managerId:          MANAGER_USERS[0]?.id ?? '',
    joiningDate:        '2026-05-27',
    transportMode:      'Two-Wheeler',
    assignedStoreIds:   [],
    assignedRetailerIds: [],
    status:             'Active',
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  agent?: FieldAgent;
  agentCount: number;
  onSave: (agent: FieldAgent) => void;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AgentForm({ agent, agentCount, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => defaultForm(agentCount, agent));

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function toggleStore(id: string) {
    setForm((prev) => ({
      ...prev,
      assignedStoreIds: prev.assignedStoreIds.includes(id)
        ? prev.assignedStoreIds.filter((s) => s !== id)
        : [...prev.assignedStoreIds, id],
    }));
  }

  function toggleRetailer(id: string) {
    setForm((prev) => ({
      ...prev,
      assignedRetailerIds: prev.assignedRetailerIds.includes(id)
        ? prev.assignedRetailerIds.filter((r) => r !== id)
        : [...prev.assignedRetailerIds, id],
    }));
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim() || !form.employeeCode.trim()) return;

    const managerUser = MOCK_USERS.find((u) => u.id === form.managerId);

    const saved: FieldAgent = {
      id:                  agent?.id ?? `a${Date.now()}`,
      name:                form.name.trim(),
      phone:               form.phone.trim(),
      role:                form.role,
      employeeCode:        form.employeeCode.trim(),
      territory:           form.territory.trim(),
      district:            form.district.trim(),
      state:               form.state.trim(),
      hqLocation:          form.hqLocation.trim() || undefined,
      managerId:           form.managerId,
      managerName:         managerUser?.name ?? '',
      joiningDate:         form.joiningDate,
      transportMode:       form.transportMode,
      assignedStoreIds:    form.assignedStoreIds,
      assignedRetailerIds: form.assignedRetailerIds,
      targetFarmers:       agent?.targetFarmers ?? 100,
      visitedFarmers:      agent?.visitedFarmers ?? 0,
      salesMTD:            agent?.salesMTD ?? 0,
      status:              form.status,
    };

    console.log('// POST /api/field-agents', saved);
    onSave(saved);
  }

  const isB2B = form.role === 'B2BSalesExecutive';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {agent ? 'Edit Agent' : 'Add New Agent'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {agent ? `Editing ${agent.name}` : 'Fill in the details to onboard a new field agent'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Personal Info ─────────────────────────────────────── */}
          <SectionHead>Personal Info</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Full Name" required>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Arun Kale"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Mobile Number" required>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="10-digit number"
                className={inputCls}
                maxLength={10}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as FieldAgent['status'])}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* ── Role & Identity ───────────────────────────────────── */}
          <SectionHead>Role &amp; Identity</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role" required>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value as AgentRole)}
                className={inputCls}
              >
                {AGENT_ROLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Employee ID" required>
              <input
                value={form.employeeCode}
                onChange={(e) => set('employeeCode', e.target.value)}
                placeholder="e.g. EMP-007"
                className={inputCls}
              />
            </Field>
            <Field label="Date of Joining">
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Reports To">
              <select
                value={form.managerId}
                onChange={(e) => set('managerId', e.target.value)}
                className={inputCls}
              >
                <option value="">— Select Manager —</option>
                {MANAGER_USERS.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </Field>
          </div>

          {/* ── Territory ────────────────────────────────────────── */}
          <SectionHead>Territory</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Territory / Region">
                <input
                  value={form.territory}
                  onChange={(e) => set('territory', e.target.value)}
                  placeholder="e.g. Akola–Washim Belt"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="District">
              <input
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
                placeholder="e.g. Akola"
                className={inputCls}
              />
            </Field>
            <Field label="State">
              <input
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                placeholder="e.g. Maharashtra"
                className={inputCls}
              />
            </Field>
            <div className="col-span-2">
              <Field label="HQ Location">
                <input
                  value={form.hqLocation}
                  onChange={(e) => set('hqLocation', e.target.value)}
                  placeholder="Base office or home town"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* ── Logistics ────────────────────────────────────────── */}
          <SectionHead>Logistics</SectionHead>
          <Field label="Transport Mode for TA">
            <div className="flex gap-2 flex-wrap">
              {TRANSPORT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set('transportMode', mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    form.transportMode === mode
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Assigned Stores ──────────────────────────────────── */}
          <SectionHead>Assigned Stores</SectionHead>
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-gray-50">
            {mockStores.map((store) => {
              const checked = form.assignedStoreIds.includes(store.id);
              return (
                <label
                  key={store.id}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    checked ? 'bg-emerald-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStore(store.id)}
                    className="accent-emerald-600 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{store.name}</p>
                    <p className="text-[11px] text-gray-400">{store.code} · {store.address.district}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* ── Assigned Retailers (B2B Sales Exec only) ─────────── */}
          {isB2B && (
            <>
              <SectionHead>Assigned Retailer Accounts</SectionHead>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-gray-50">
                {mockRetailers.map((retailer) => {
                  const checked = form.assignedRetailerIds.includes(retailer.id);
                  return (
                    <label
                      key={retailer.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRetailer(retailer.id)}
                        className="accent-emerald-600 w-3.5 h-3.5 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{retailer.firmName}</p>
                        <p className="text-[11px] text-gray-400">{retailer.address.district}, {retailer.address.state}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {/* bottom breathing room */}
          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.phone.trim() || !form.employeeCode.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {agent ? 'Save Changes' : 'Add Agent'}
          </button>
        </div>
      </div>
    </>
  );
}
