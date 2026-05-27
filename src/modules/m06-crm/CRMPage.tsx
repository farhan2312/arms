// CRMPage — orchestrator for the Farmer CRM module
// Manages: farmers, outreachLogs, flaggedIds, farmerLanguages, selected farmer, form visibility

import { useState } from 'react';
import { mockFarmers } from '../../data/mockFarmers';
import { SEED_OUTREACH } from './OutreachLog';
import type { OutreachEntry } from './OutreachLog';
import FarmerList from './FarmerList';
import FarmerProfile from './FarmerProfile';
import FarmerForm from './FarmerForm';
import OutreachLog from './OutreachLog';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import type { Farmer } from '../../types/entities';

type CRMTab = 'farmers' | 'outreach';

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

  const TABS = [
    { id: 'farmers',  label: 'Farmers' },
    { id: 'outreach', label: 'Outreach Log' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Farmer CRM"
        subtitle={`${farmers.length} registered farmers`}
        actions={
          tab === 'farmers' && !selectedFarmer ? (
            <Button variant="primary" iconLeft={Plus} onClick={() => setShowForm(true)}>
              Add Farmer
            </Button>
          ) : undefined
        }
      />

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
          <div style={{ marginBottom: '20px' }}>
            <Tabs
              tabs={TABS}
              activeTab={tab}
              onTabChange={(id) => setTab(id as CRMTab)}
            />
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
