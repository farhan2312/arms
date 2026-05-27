import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
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
  const [toast, setToast]                   = useState<string | null>(null);

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
      showToast(`${saved.firmName} updated`);
    } else {
      setRetailers((prev) => [saved, ...prev]);
      showToast(`${saved.firmName} added successfully`);
    }
    setShowForm(false);
    setEditingRetailer(undefined);
  }

  function handleUpdate(updated: RetailerAccount) {
    setRetailers((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    // Keep the selected view reflecting the latest data
    setSelectedId(updated.id);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl z-[100]">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
