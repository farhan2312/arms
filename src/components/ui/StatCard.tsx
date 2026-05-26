import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  iconBg: string;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ label, value, sub, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value} vs last week
          </p>
        )}
      </div>
    </div>
  );
}
