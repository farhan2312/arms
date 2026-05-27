import { useState } from 'react';
import { Plus, Pencil, ToggleLeft } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
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
  const toast = useToast();

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
      toast.success('Product updated successfully');
    } else {
      setProducts(prev => [saved, ...prev]);
      toast.success('Product added successfully');
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
          <Button variant="primary" iconLeft={Plus} onClick={openAdd}>
            Add Product
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-60">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product name, SKU or brand..."
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

      <TableWrap>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Brand</Th>
            <Th right>MRP</Th>
            <Th right>B2C Price</Th>
            <Th right>GST</Th>
            <Th right>Stock</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const stock = mockProductStock[p.id] ?? 0;
            const isLow = stock <= p.reorderLevel;
            return (
              <Tr key={p.id}>
                <Td>
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
                </Td>
                <Td>
                  <Badge label={p.category} variant={categoryBadge(p.category)} />
                </Td>
                <Td muted>{p.brand}</Td>
                <Td right muted>₹{p.mrp.toLocaleString('en-IN')}</Td>
                <Td right bold>₹{p.b2cPrice.toLocaleString('en-IN')}</Td>
                <Td right muted>{p.taxSlabPct}%</Td>
                <Td right>
                  <span className={`text-xs font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                    {stock}
                  </span>
                  <span className="text-[11px] text-gray-400 ml-0.5">{p.unit}s</span>
                </Td>
                <Td>
                  {isLow ? (
                    <Badge label="Low Stock" variant="red" />
                  ) : p.isActive ? (
                    <Badge label="Active" variant="green" />
                  ) : (
                    <Badge label="Inactive" variant="gray" />
                  )}
                </Td>
                <Td>
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
                </Td>
              </Tr>
            );
          })}
          {filtered.length === 0 && (
            <Tr>
              <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">
                No products match the current filters.
              </td>
            </Tr>
          )}
        </tbody>
      </TableWrap>

      {/* Slide-over form */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
