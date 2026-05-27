import { useState } from 'react';
import { Search, Plus, Pencil, ToggleLeft, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { mockProducts } from '../../data/mockProducts';
import { mockProductStock } from '../../data/mockBatches';
import type { Product } from '../../types/entities';
import ProductForm from './ProductForm';

const CATEGORIES = ['All', 'Seed', 'Fertiliser', 'Micronutrient', 'Pesticide'];

export default function ProductsPage() {
  const [products, setProducts]       = useState<Product[]>(mockProducts);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [showForm, setShowForm]       = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [toast, setToast]             = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  function openAdd() {
    setEditingProduct(undefined);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleSave(saved: Product) {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === saved.id ? saved : p));
      showToast('Product updated successfully');
    } else {
      setProducts(prev => [saved, ...prev]);
      showToast('Product added successfully');
    }
    setShowForm(false);
    setEditingProduct(undefined);
  }

  function handleClose() {
    setShowForm(false);
    setEditingProduct(undefined);
  }

  function toggleActive(product: Product) {
    setProducts(prev =>
      prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p),
    );
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const categoryBadge = (cat: string): 'green' | 'blue' | 'orange' | 'purple' | 'gray' => {
    const map: Record<string, 'green' | 'blue' | 'orange' | 'purple' | 'gray'> = {
      Fertiliser: 'green', Pesticide: 'orange', Seed: 'blue', Micronutrient: 'purple',
    };
    return map[cat] ?? 'gray';
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Product Catalogue"
        subtitle="Manage agri-input SKUs, pricing and availability"
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={15} />
            Add Product
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-60">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU or brand..."
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

      {/* Summary pills */}
      <div className="flex items-center gap-3 mb-5 text-sm text-gray-500">
        <span>{filtered.length} products</span>
        <span>·</span>
        <span className="text-red-500 font-medium">
          {filtered.filter((p) => (mockProductStock[p.id] ?? 0) <= p.reorderLevel).length} low stock
        </span>
        <span>·</span>
        <span>{filtered.filter((p) => p.isSubsidised).length} subsidised</span>
        <span>·</span>
        <span>{filtered.filter((p) => p.isRegulated).length} regulated</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Product</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Category</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Brand</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">MRP</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">B2C Price</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">GST</th>
              <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Stock</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => {
              const stock = mockProductStock[p.id] ?? 0;
              const isLow = stock <= p.reorderLevel;
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800 text-xs">
                      {p.name}
                      {p.isSubsidised && (
                        <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium border border-amber-200">Subsidised</span>
                      )}
                      {p.isRegulated && (
                        <span className="ml-1.5 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium border border-red-200">CIB</span>
                      )}
                    </p>
                    <p className="text-gray-400 text-[11px] font-mono mt-0.5">{p.sku} · {p.packSize}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge label={p.category} variant={categoryBadge(p.category)} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{p.brand}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-500">₹{p.mrp.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-semibold text-gray-800">₹{p.b2cPrice.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-500">{p.taxSlabPct}%</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-xs font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                      {stock}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-0.5">{p.unit}s</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {isLow ? (
                      <Badge label="Low Stock" variant="red" />
                    ) : p.isActive ? (
                      <Badge label="Active" variant="green" />
                    ) : (
                      <Badge label="Inactive" variant="gray" />
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Edit product"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`transition-colors ${p.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-300 hover:text-emerald-600'}`}
                        title={p.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <ToggleLeft size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">
                  No products match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over form */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl z-[100]">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
