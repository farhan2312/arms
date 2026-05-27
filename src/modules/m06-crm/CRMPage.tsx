// CRMPage — orchestrator for the Farmer CRM module
// Manages: farmers, outreachLogs, flaggedIds, farmerLanguages, selected farmer, form visibility

import { useState } from 'react';
import { Users, Megaphone, Wallet } from 'lucide-react';
import { mockFarmers } from '../../data/mockFarmers';
import { SEED_OUTREACH } from './OutreachLog';
import type { OutreachEntry } from './OutreachLog';
import FarmerList from './FarmerList';
import FarmerProfile from './FarmerProfile';
import FarmerForm from './FarmerForm';
import OutreachLog from './OutreachLog';
import LoyaltyLookupTab from './LoyaltyLookupTab';
import type { Farmer } from '../../types/entities';

type CRMTab = 'farmers' | 'outreach' | 'loyalty';

const TABS: { key: CRMTab; label: string; icon: React.ElementType }[] = [
  { key: 'farmers',  label: 'Farmers',        icon: Users    },
  { key: 'outreach', label: 'Outreach Log',   icon: Megaphone },
  { key: 'loyalty',  label: 'Loyalty Lookup', icon: Wallet   },
];

export default function CRMPage() {
  const [farmers, setFarmers] = useState<Farmer[]>(mockFarmers);
  const [farmerLanguages, setFarmerLanguages] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [outreachLogs, setOutreachLogs] = useState<OutreachEntry[]>(SEED_OUTREACH);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<CRMTab>('farmers');

  function handleSaveFarmer(farmer: Farmer, preferredLanguage: string) {
    setFarmers(prev => [farmer, ...prev]);
    setFarmerLanguages(prev => ({ ...prev, [farmer.id]: preferredLanguage }));
    setShowForm(false);
  }

  function handleAddLog(entry: OutreachEntry) {
    setOutreachLogs(prev => [entry, ...prev]);
  }

  function handleToggleFlag(id: string) {
    setFlaggedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedFarmer = selectedFarmerId ? farmers.find(f => f.id === selectedFarmerId) ?? null : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page heading */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Farmer CRM</h1>
        <p className="text-sm text-gray-500 mt-0.5">{farmers.length} registered farmers</p>
      </div>

      {/* Profile view — replaces tab content when a farmer is selected */}
      {selectedFarmer ? (
        <FarmerProfile
          farmer={selectedFarmer}
          preferredLanguage={farmerLanguages[selectedFarmer.id]}
          outreachLogs={outreachLogs}
          isFlagged={flaggedIds.has(selectedFarmer.id)}
          onToggleFlag={() => handleToggleFlag(selectedFarmer.id)}
          onBack={() => setSelectedFarmerId(null)}
        />
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 mb-5 border-b border-gray-200">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  tab === key
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'farmers' && (
            <FarmerList
              farmers={farmers}
              outreachLogs={outreachLogs}
              onSelect={setSelectedFarmerId}
              onAdd={() => setShowForm(true)}
            />
          )}
          {tab === 'outreach' && (
            <OutreachLog
              farmers={farmers}
              outreachLogs={outreachLogs}
              onAddLog={handleAddLog}
            />
          )}
          {tab === 'loyalty' && <LoyaltyLookupTab />}
        </>
      )}

      {/* Slide-over form (rendered on top of either view) */}
      {showForm && (
        <FarmerForm
          farmers={farmers}
          onSave={handleSaveFarmer}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
