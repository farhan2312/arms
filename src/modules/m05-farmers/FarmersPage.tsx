import { useState } from 'react';
import { Search, Plus, Phone, MapPin, Sprout } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { mockFarmers } from '../../data/mockFarmers';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';

const TIER_COLORS: Record<string, 'green' | 'gray' | 'yellow' | 'orange'> = {
  Green: 'green',
  Silver: 'gray',
  Gold: 'yellow',
  Platinum: 'orange',
};

export default function FarmersPage() {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('All');

  const filtered = mockFarmers.filter((f) => {
    const village = f.address.village ?? '';
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.mobile.includes(search) ||
      f.address.district.toLowerCase().includes(search.toLowerCase()) ||
      village.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === 'All' || f.kycStatus === kycFilter;
    return matchSearch && matchKyc;
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Farmers"
        subtitle="Registered farmer profiles and KYC management"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus size={15} />
            Register Farmer
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
            placeholder="Search by name, mobile, village or district..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        {['All', 'Verified', 'Pending', 'Rejected'].map((k) => (
          <button
            key={k}
            onClick={() => setKycFilter(k)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              kycFilter === k
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 text-sm text-gray-500">
        <span>{filtered.length} farmers</span>
        <span>·</span>
        <span className="text-green-600 font-medium">{filtered.filter((f) => f.kycStatus === 'Verified').length} KYC verified</span>
        <span>·</span>
        <span className="text-amber-500 font-medium">{filtered.filter((f) => f.kycStatus === 'Pending').length} pending</span>
      </div>

      {/* Farmer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((farmer) => {
          const wallet = walletByFarmerId.get(farmer.id);
          const village = farmer.address.village;
          return (
            <div
              key={farmer.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {farmer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{farmer.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {farmer.mobile}
                    </p>
                  </div>
                </div>
                <Badge label={farmer.kycStatus} variant={statusVariant(farmer.kycStatus)} />
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <MapPin size={11} className="text-gray-400" />
                {village ? `${village}, ` : ''}{farmer.address.taluka}, {farmer.address.district}, {farmer.address.state}
              </div>

              {/* Crops */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {farmer.cropTypes.map((crop) => (
                  <span key={crop} className="flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <Sprout size={9} /> {crop}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{farmer.landAcres}</p>
                  <p className="text-[10px] text-gray-400">Acres</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-600">
                    {wallet ? wallet.currentPoints.toLocaleString('en-IN') : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400">Loyalty Pts</p>
                </div>
                <div>
                  {wallet ? (
                    <>
                      <p className="text-sm font-bold text-gray-900">
                        <Badge label={wallet.tier} variant={TIER_COLORS[wallet.tier] ?? 'gray'} />
                      </p>
                      <p className="text-[10px] text-gray-400">Tier</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(farmer.registeredAt).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
