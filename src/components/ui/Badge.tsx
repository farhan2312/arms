type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange';

const VARIANTS: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${VARIANTS[variant]}`}>
      {label}
    </span>
  );
}

export function statusVariant(
  status: string,
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Delivered: 'green',
    Confirmed: 'blue',
    Dispatched: 'purple',
    Pending: 'yellow',
    Cancelled: 'red',
    Verified: 'green',
    Rejected: 'red',
    Active: 'green',
    Inactive: 'gray',
    'On Leave': 'yellow',
    Earned: 'green',
    Redeemed: 'blue',
    Expired: 'red',
  };
  return map[status] ?? 'gray';
}
