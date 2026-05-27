import { useMemo } from 'react';
import { Plus, Pencil, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import type { Store } from '../../types/entities';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockBatches } from '../../data/mockBatches';
import { mockFarmers } from '../../data/mockFarmers';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = '2026-05-27';
const MTD_PREFIX = '2026-05';

const userById = new Map(MOCK_USERS.map((u) => [u.id, u]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function useStoreStats(storeId: string) {
  return useMemo(() => {
    const txns       = mockSaleTransactions.filter((t) => t.storeId === storeId);
    const todaySales = txns.filter((t) => t.invoiceDate === TODAY).reduce((s, t) => s + t.totalAmt, 0);
    const mtdSales   = txns.filter((t) => t.invoiceDate.startsWith(MTD_PREFIX)).reduce((s, t) => s + t.totalAmt, 0);
    const stockItems = mockBatches.filter((b) => b.storeId === storeId).length;
    const farmers    = mockFarmers.filter((f) => f.registeredByStoreId === storeId && f.isActive).length;
    return { todaySales, mtdSales, stockItems, farmers };
  }, [storeId]);
}

// ── Store Card ────────────────────────────────────────────────────────────────

function StoreCard({
  store,
  onSelect,
  onEdit,
}: {
  store: Store;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const stats = useStoreStats(store.id);
  const bdm   = userById.get(store.bdmUserId);

  return (
    <div
      onClick={onSelect}
      className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono text-gray-400 tracking-widest">{store.code}</span>
            {store.isActive
              ? <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600"><CheckCircle2 size={10} />Active</span>
              : <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500"><XCircle size={10} />Inactive</span>
            }
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mt-0.5 leading-tight">{store.name}</h3>
        </div>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 rounded-lg text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex-shrink-0"
          title="Edit store"
        >
          <Pencil size={12} />
        </button>
      </div>

      {/* Address + zone */}
      <div className="flex items-start gap-1.5 mb-4">
        <MapPin size={11} className="text-gray-300 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-gray-500 leading-snug">
          {store.address.district}, {store.address.state}
        </p>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
          {store.zoneCode}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-400 font-medium">Today's Sales</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{stats.todaySales > 0 ? fmt(stats.todaySales) : '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-400 font-medium">MTD Sales</p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5">{stats.mtdSales > 0 ? fmt(stats.mtdSales) : '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-400 font-medium">Stock Batches</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{stats.stockItems}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-400 font-medium">Active Farmers</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{stats.farmers}</p>
        </div>
      </div>

      {/* Footer — GSTIN + BDM */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
        <span className="font-mono text-gray-400">{store.gstIn}</span>
        <span className="text-gray-500 truncate max-w-[120px]">BDM: {bdm?.name ?? '—'}</span>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  stores: Store[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (store: Store) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoreList({ stores, onCreate, onSelect, onEdit }: Props) {
  const totalMTD    = useMemo(() => {
    return mockSaleTransactions
      .filter((t) => t.invoiceDate.startsWith(MTD_PREFIX))
      .reduce((s, t) => s + t.totalAmt, 0);
  }, []);

  const activeCount = stores.filter((s) => s.isActive).length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total Stores</p>
          <p className="text-lg font-bold text-gray-900">{stores.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Active</p>
          <p className="text-lg font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Network MTD Sales</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalMTD)}</p>
        </div>
        <button
          onClick={onCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={14} />
          Add Store
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            onSelect={() => onSelect(store.id)}
            onEdit={(e) => { e.stopPropagation(); onEdit(store); }}
          />
        ))}
      </div>
    </div>
  );
}
