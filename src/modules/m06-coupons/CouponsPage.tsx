import { useState } from 'react';
import { Plus, Copy, ToggleLeft } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import type { Coupon } from '../../types';

const mockCoupons: Coupon[] = [
  {
    id: 'c001',
    code: 'KHARIF24',
    discountType: 'Percentage',
    discountValue: 10,
    minOrderValue: 2000,
    maxDiscount: 500,
    validFrom: '2024-04-01',
    validUntil: '2024-09-30',
    usageLimit: 500,
    usedCount: 218,
    applicableCategories: ['Fertiliser', 'Seed'],
    isActive: true,
  },
  {
    id: 'c002',
    code: 'FLAT200',
    discountType: 'Flat',
    discountValue: 200,
    minOrderValue: 3000,
    validFrom: '2024-05-01',
    validUntil: '2024-05-31',
    usageLimit: 100,
    usedCount: 67,
    applicableCategories: ['Pesticide', 'Micronutrient'],
    isActive: true,
  },
  {
    id: 'c003',
    code: 'NEWFARMER',
    discountType: 'Flat',
    discountValue: 150,
    minOrderValue: 500,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    usageLimit: 1000,
    usedCount: 341,
    applicableCategories: ['Fertiliser', 'Pesticide', 'Seed', 'Micronutrient', 'Equipment'],
    isActive: true,
  },
  {
    id: 'c004',
    code: 'RABI23OFF',
    discountType: 'Percentage',
    discountValue: 8,
    minOrderValue: 1500,
    maxDiscount: 300,
    validFrom: '2023-10-01',
    validUntil: '2024-02-28',
    usageLimit: 400,
    usedCount: 400,
    applicableCategories: ['Fertiliser'],
    isActive: false,
  },
];

export default function CouponsPage() {
  const [activeOnly, setActiveOnly] = useState(false);

  const filtered = activeOnly ? mockCoupons.filter((c) => c.isActive) : mockCoupons;

  return (
    <div className="p-6">
      <PageHeader
        title="Coupons & Promotions"
        subtitle="Discount codes for seasonal and category-level promotions"
        actions={
          <>
            <button
              onClick={() => setActiveOnly((v) => !v)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                activeOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
              }`}
            >
              Active only
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              <Plus size={15} />
              New Coupon
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((coupon) => {
          const usagePct = Math.round((coupon.usedCount / coupon.usageLimit) * 100);
          const isExpired = new Date(coupon.validUntil) < new Date();

          return (
            <div key={coupon.id} className={`bg-white rounded-xl border p-5 ${coupon.isActive && !isExpired ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
              {/* Code */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-lg text-gray-900 tracking-wide">{coupon.code}</p>
                    <button className="text-gray-400 hover:text-gray-700 transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {coupon.discountType === 'Flat'
                      ? `₹${coupon.discountValue} off`
                      : `${coupon.discountValue}% off${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {coupon.isActive && !isExpired ? (
                    <Badge label="Active" variant="green" />
                  ) : isExpired ? (
                    <Badge label="Expired" variant="red" />
                  ) : (
                    <Badge label="Inactive" variant="gray" />
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Min. order</span>
                  <span className="font-medium">₹{coupon.minOrderValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Valid period</span>
                  <span className="font-medium">
                    {new Date(coupon.validFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' – '}
                    {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {coupon.applicableCategories.map((cat) => (
                    <span key={cat} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Usage bar */}
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Usage</span>
                  <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 60 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end">
                <button className="text-gray-400 hover:text-gray-700 transition-colors">
                  <ToggleLeft size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
