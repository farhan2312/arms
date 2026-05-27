import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { mockStores } from '../../data/mockStores';
import type { Store } from '../../types/entities';
import StoreList from './StoreList';
import StoreDetail from './StoreDetail';
import StoreForm from './StoreForm';

// ── Component ─────────────────────────────────────────────────────────────────

export default function Stores() {
  const [stores,       setStores]       = useState<Store[]>(mockStores);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editingStore, setEditingStore] = useState<Store | undefined>();
  const [toast,        setToast]        = useState<string | null>(null);

  const selectedStore = selectedId ? stores.find((s) => s.id === selectedId) : null;
  const existingCodes = stores.map((s) => s.code);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function openCreate() {
    setEditingStore(undefined);
    setShowForm(true);
  }

  function openEdit(store: Store) {
    setEditingStore(store);
    setShowForm(true);
  }

  function handleSave(saved: Store) {
    if (editingStore) {
      setStores((prev) => prev.map((s) => s.id === saved.id ? saved : s));
      // If the edited store is the one currently being viewed, keep it selected
      showToast(`Store ${saved.code} updated successfully`);
    } else {
      setStores((prev) => [...prev, saved]);
      showToast(`Store ${saved.code} added successfully`);
    }
    console.log(`// ${editingStore ? 'PATCH' : 'POST'} /api/stores`, saved);
    setShowForm(false);
    setEditingStore(undefined);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      {!selectedStore && (
        <PageHeader
          title="Stores"
          subtitle="Network of Bharat Agri retail outlets — performance, stock and staff at a glance"
        />
      )}

      {/* Detail view */}
      {selectedStore ? (
        <StoreDetail
          store={selectedStore}
          onBack={() => setSelectedId(null)}
          onEdit={(s) => {
            openEdit(s);
          }}
        />
      ) : (
        <StoreList
          stores={stores}
          onCreate={openCreate}
          onSelect={setSelectedId}
          onEdit={openEdit}
        />
      )}

      {/* Form slide-over */}
      {showForm && (
        <StoreForm
          store={editingStore}
          existingCodes={existingCodes.filter((c) => c !== editingStore?.code)}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingStore(undefined); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl z-[100] max-w-sm">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
