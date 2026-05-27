import { useState } from 'react';
import { Plus, Phone, MapPin, Target, Users, Pencil, UserX, IndianRupee } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/Input';
import KpiCard from '../../components/ui/KpiCard';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import type { FieldAgent } from '../../types';
import JourneyLog from '../m11-fieldforce/JourneyLog';
import MeetingLog from '../m11-fieldforce/MeetingLog';
import TADASummary from '../m11-fieldforce/TADASummary';
import AgentForm from './AgentForm';

const SEED_AGENTS: FieldAgent[] = [
  { id: 'a001', name: 'Arun Kale',       phone: '9871234560', employeeCode: 'FF-MH-001', territory: 'Akola–Washim Belt',  district: 'Akola',     state: 'Maharashtra', managerId: 'u002', managerName: 'Priya Sharma',    targetFarmers: 150, visitedFarmers: 132, salesMTD: 284500, joiningDate: '2022-06-01', status: 'Active' },
  { id: 'a002', name: 'Deepak Salve',    phone: '9760001234', employeeCode: 'FF-MH-002', territory: 'Buldhana–Khamgaon', district: 'Buldhana',   state: 'Maharashtra', managerId: 'u002', managerName: 'Priya Sharma',    targetFarmers: 120, visitedFarmers: 98,  salesMTD: 198000, joiningDate: '2023-01-15', status: 'Active' },
  { id: 'a003', name: 'Savita Aware',    phone: '9651239870', employeeCode: 'FF-MH-003', territory: 'Amravati South',    district: 'Amravati',   state: 'Maharashtra', managerId: 'u002', managerName: 'Priya Sharma',    targetFarmers: 100, visitedFarmers: 72,  salesMTD: 145000, joiningDate: '2023-08-20', status: 'On Leave' },
  { id: 'a004', name: 'Nagesh Rao',      phone: '9540987651', employeeCode: 'FF-TS-001', territory: 'Warangal Rural',    district: 'Warangal',   state: 'Telangana',   managerId: 'u004', managerName: 'Kavitha Reddy',   targetFarmers: 140, visitedFarmers: 140, salesMTD: 362000, joiningDate: '2021-11-10', status: 'Active' },
  { id: 'a005', name: 'Sundaram Pillai', phone: '9431265740', employeeCode: 'FF-TN-001', territory: 'Thanjavur Delta',   district: 'Thanjavur',  state: 'Tamil Nadu',  managerId: 'u003', managerName: 'Anand Deshmukh',  targetFarmers: 90,  visitedFarmers: 45,  salesMTD: 88000,  joiningDate: '2024-03-01', status: 'Active' },
  { id: 'a006', name: 'Rekha Biradar',   phone: '9320098761', employeeCode: 'FF-KA-001', territory: 'Bidar–Gulbarga',   district: 'Bidar',      state: 'Karnataka',   managerId: 'u003', managerName: 'Anand Deshmukh',  targetFarmers: 110, visitedFarmers: 0,   salesMTD: 0,      joiningDate: '2023-06-01', status: 'Inactive' },
];

type Tab = 'agents' | 'journeys' | 'meetings' | 'tada';

const TABS: { id: Tab; label: string }[] = [
  { id: 'agents',   label: 'Agents' },
  { id: 'journeys', label: 'Journey Log' },
  { id: 'meetings', label: 'Meeting Log' },
  { id: 'tada',     label: 'TA/DA Summary' },
];

function agentStatusVariant(status: string): BadgeVariant {
  if (status === 'Active')   return 'green';
  if (status === 'Inactive') return 'red';
  if (status === 'On Leave') return 'amber';
  return 'gray';
}

export default function FieldForcePage() {
  const [agents, setAgents]               = useState<FieldAgent[]>(SEED_AGENTS);
  const [activeTab, setActiveTab]         = useState<Tab>('agents');
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('All');
  const [showForm, setShowForm]           = useState(false);
  const [editingAgent, setEditingAgent]   = useState<FieldAgent | undefined>(undefined);
  const toast                             = useToast();

  const filtered = agents.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      a.territory.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSalesMTD = agents.reduce((s, a) => s + a.salesMTD, 0);
  const avgAchievement = Math.round(
    agents.reduce((s, a) => s + (a.visitedFarmers / Math.max(a.targetFarmers, 1)) * 100, 0) / Math.max(agents.length, 1),
  );

  function openAdd() {
    setEditingAgent(undefined);
    setShowForm(true);
  }

  function openEdit(agent: FieldAgent) {
    setEditingAgent(agent);
    setShowForm(true);
  }

  function handleSave(saved: FieldAgent) {
    if (editingAgent) {
      setAgents((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      toast.success(`Agent ${saved.name} updated successfully`);
    } else {
      setAgents((prev) => [saved, ...prev]);
      toast.success(`Agent ${saved.name} added successfully`);
    }
    setShowForm(false);
    setEditingAgent(undefined);
  }

  function handleClose() {
    setShowForm(false);
    setEditingAgent(undefined);
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Field Force"
        subtitle="Territory-wise agent performance, journeys and TA/DA"
        actions={
          activeTab === 'agents' ? (
            <Button variant="primary" iconLeft={Plus} onClick={openAdd}>
              Add Agent
            </Button>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div style={{ marginBottom: '24px' }}>
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as Tab)}
        />
      </div>

      {activeTab === 'agents' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <KpiCard
              label="Active Agents"
              value={`${agents.filter((a) => a.status === 'Active').length} / ${agents.length}`}
              icon={Users}
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <KpiCard
              label="Total Sales MTD"
              value={`₹${(totalSalesMTD / 100000).toFixed(1)}L`}
              icon={IndianRupee}
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <KpiCard
              label="Avg. Farmer Coverage"
              value={`${avgAchievement}%`}
              icon={Target}
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div style={{ flex: 1, minWidth: '240px' }}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by name, code or territory..."
              />
            </div>
            {['All', 'Active', 'On Leave', 'Inactive'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                }`}
                style={{ height: '34px' }}
              >
                {s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={UserX}
              iconColor="#94a3b8"
              title="No agents match the current filters"
              subtitle="Try adjusting your search or status filter."
              action={() => { setSearch(''); setStatusFilter('All'); }}
              actionLabel="Clear filters"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((agent) => {
                const coverage = Math.round((agent.visitedFarmers / Math.max(agent.targetFarmers, 1)) * 100);
                return (
                  <Card key={agent.id} padding="20px">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                          {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{agent.employeeCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge label={agent.status} variant={agentStatusVariant(agent.status)} />
                        <button
                          onClick={() => openEdit(agent)}
                          className="text-gray-300 hover:text-emerald-600 transition-colors"
                          title="Edit agent"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                      <p className="flex items-center gap-1.5">
                        <Phone size={11} className="text-gray-400" /> {agent.phone}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-gray-400" /> {agent.territory}, {agent.state}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Target size={11} className="text-gray-400" /> Reports to {agent.managerName}
                      </p>
                    </div>

                    {/* Coverage */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Farmer Coverage</span>
                        <span className="font-semibold text-gray-700">{agent.visitedFarmers} / {agent.targetFarmers}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${coverage >= 90 ? 'bg-emerald-500' : coverage >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(coverage, 100)}%` }}
                        />
                      </div>
                      <p className="text-right text-[11px] text-gray-400 mt-0.5">{coverage}%</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-500">Sales MTD: </span>
                      <span className="font-bold text-gray-800">₹{agent.salesMTD.toLocaleString('en-IN')}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'journeys' && <JourneyLog />}
      {activeTab === 'meetings' && <MeetingLog />}
      {activeTab === 'tada'     && <TADASummary />}

      {/* Slide-over */}
      {showForm && (
        <AgentForm
          agent={editingAgent}
          agentCount={agents.length}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
