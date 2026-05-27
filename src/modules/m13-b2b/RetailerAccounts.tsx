import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../hooks/useToast';
import { mockRetailers } from '../../data/mockRetailers';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import type { RetailerAccount } from '../../types/b2b';
import RetailerList from './RetailerList';
import RetailerProfile from './RetailerProfile';
import RetailerForm from './RetailerForm';

export default function RetailerAccounts() {
  const [retailers, setRetailers]           = useState<RetailerAccount[]>(mockRetailers);
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [showForm, setShowForm]             = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<RetailerAccount | undefined>(undefined);
  const toast                               = useToast();

  const selected = selectedId ? (retailers.find((r) => r.id === selectedId) ?? null) : null;

  function openAdd() {
    setEditingRetailer(undefined);
    setShowForm(true);
  }

  function openEdit(r: RetailerAccount) {
    setEditingRetailer(r);
    setShowForm(true);
  }

  function handleSave(saved: RetailerAccount) {
    if (editingRetailer) {
      setRetailers((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      toast.success(`${saved.firmName} updated`);
    } else {
      setRetailers((prev) => [saved, ...prev]);
      toast.success(`${saved.firmName} added successfully`);
    }
    setShowForm(false);
    setEditingRetailer(undefined);
  }

  function handleUpdate(updated: RetailerAccount) {
    setRetailers((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    // Keep the selected view reflecting the latest data
    setSelectedId(updated.id);
  }

  return (
    <div className="p-6 flex flex-col min-h-full">
      {!selected && (
        <PageHeader
          title="Retailer Accounts"
          subtitle="B2B dealer accounts, credit limits and account statements"
        />
      )}

      {selected ? (
        <RetailerProfile
          retailer={retailers.find((r) => r.id === selectedId)!}
          orders={mockB2BOrders}
          onBack={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      ) : (
        <RetailerList
          retailers={retailers}
          onSelect={setSelectedId}
          onAdd={openAdd}
          onEdit={openEdit}
        />
      )}

      {showForm && (
        <RetailerForm
          retailer={editingRetailer}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRetailer(undefined); }}
        />
      )}
    </div>
  );
}
