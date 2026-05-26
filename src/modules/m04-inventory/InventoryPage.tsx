import { useState } from 'react';
import { Search, AlertTriangle, PackagePlus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { mockProducts, productById } from '../../data/mockProducts';
import { mockBatches, mockProductStock } from '../../data/mockBatches';

const CATEGORIES = ['All', 'Seed', 'Fertiliser', 'Micronutrient', 'Pesticide'];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const lowStockProducts = mockProducts.filter((p) => (mockProductStock[p.id] ?? 0) <= p.reorderLevel);

  const filteredBatches = mockBatches.filter((b) => {
    const product = productById.get(b.productId);
    if (!product) return false;
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      b.batchNo.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || product.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Inventory"
        subtitle="Batch-level stock management with expiry tracking"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            <PackagePlus size={15} />
            Add Stock (GRN)
          </button>
        }
      />

      {/* Low stock alert strip */}
      {lowStockProducts.length > 0 && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{lowStockProducts.length} products</span> are below reorder level:{' '}
            {lowStockProducts.map((p) => p.name).join(', ')}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-60">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU or batch no..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                category === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5 text-sm text-gray-500">
        <span>{filteredBatches.length} batches</span>
        <span>·</span>
        <span className="text-orange-500 font-medium">
          {filteredBatches.filter((b) => b.expiryDate < '2026-06-25').length} near expiry (&lt;30 days)
        </span>
      </div>

      {/* Batch table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Product / SKU</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Batch No.</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Available</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Reserved</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Mfg Date</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Expiry</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Location</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Purchase Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredBatches.map((batch) => {
              const product = productById.get(batch.productId);
              const stock = mockProductStock[batch.productId] ?? 0;
              const isProductLow = product && stock <= product.reorderLevel;
              const nearExpiry = batch.expiryDate < '2026-06-25';
              const location = batch.storeId ?? batch.warehouseId ?? '—';
              return (
                <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800 text-xs flex items-center gap-2">
                      {product?.name ?? batch.productId}
                      {isProductLow && <Badge label="Low" variant="red" />}
                    </p>
                    <p className="text-gray-400 text-[11px] font-mono mt-0.5">{product?.sku ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-700">{batch.batchNo}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-semibold text-gray-800">
                    {batch.currentQty} {product?.unit ?? ''}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-500">
                    {batch.reservedQty > 0 ? (
                      <span className="text-orange-600 font-medium">{batch.reservedQty}</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">
                    {new Date(batch.mfgDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <span className={nearExpiry ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                      {new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {nearExpiry && <span className="ml-1 text-[10px] text-orange-500">Near expiry</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{location}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-medium text-gray-700">
                    ₹{batch.purchasePricePerUnit.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
