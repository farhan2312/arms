import { ChevronRight, ChevronLeft, AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { B2BInvoice, RetailerAccount } from '../../types/b2b';
import { daysOverdue } from './ReceivablesSummary';
import { MOCK_USERS } from '../../data/mockUsers';

// Shows invoices that crossed the 0, 7, or 15-day overdue threshold
// (i.e. 1-15 days past due — freshly overdue, requiring immediate follow-up)

const ALERT_MAX_DAYS = 15;

interface AlertInvoice {
  inv: B2BInvoice;
  retailer: RetailerAccount | undefined;
  days: number;
}

function urgencyColor(days: number): string {
  if (days <= 3)  return 'border-l-amber-400 bg-amber-50/60';
  if (days <= 7)  return 'border-l-orange-400 bg-orange-50/50';
  return 'border-l-red-400 bg-red-50/50';
}

function urgencyDot(days: number): string {
  if (days <= 3) return 'bg-amber-400';
  if (days <= 7) return 'bg-orange-400';
  return 'bg-red-500';
}

interface Props {
  invoices: B2BInvoice[];
  retailers: RetailerAccount[];
  collapsed: boolean;
  onToggle: () => void;
}

export default function OverdueAlerts({ invoices, retailers, collapsed, onToggle }: Props) {
  const retailerById = new Map(retailers.map((r) => [r.id, r]));

  const alerts: AlertInvoice[] = invoices
    .map((inv) => ({ inv, retailer: retailerById.get(inv.retailerId), days: daysOverdue(inv.dueDate) }))
    .filter(({ days, inv }) => days >= 1 && days <= ALERT_MAX_DAYS && inv.outstandingAmt > 0)
    .sort((a, b) => b.days - a.days);

  function escalate(alert: AlertInvoice) {
    const exec = MOCK_USERS.find((u) => u.id === alert.retailer?.salesExecUserId);
    const mgr  = exec ? MOCK_USERS.find((u) => u.role === 'BDM' || u.role === 'OperationsHead') : undefined;
    console.log(
      '// Escalate invoice', alert.inv.invoiceNo,
      'to manager:', mgr?.name ?? 'BDM/OperationsHead',
      '— outstanding:', `₹${alert.inv.outstandingAmt.toLocaleString('en-IN')}`,
      '— days overdue:', alert.days,
    );
  }

  if (collapsed) {
    return (
      <div className="flex-shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <AlertTriangle size={13} className={alerts.length > 0 ? 'text-red-500' : 'text-gray-400'} />
          {alerts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {alerts.length}
            </span>
          )}
          Overdue Alerts
          <ChevronLeft size={13} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className={alerts.length > 0 ? 'text-red-500' : 'text-gray-400'} />
          <p className="text-xs font-semibold text-gray-700">Overdue Alerts</p>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button onClick={onToggle} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="text-[11px] text-gray-400 px-4 py-2 border-b border-gray-50 bg-gray-50/50">
        Invoices 1–15 days past due date
      </div>

      {/* Alert list */}
      <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
        {alerts.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400">No freshly overdue invoices</p>
            <p className="text-[11px] text-gray-300 mt-1">All recent invoices are on time</p>
          </div>
        )}
        {alerts.map(({ inv, retailer, days }) => {
          const exec = MOCK_USERS.find((u) => u.id === retailer?.salesExecUserId);
          return (
            <div
              key={inv.id}
              className={`px-4 py-3 border-l-[3px] ${urgencyColor(days)}`}
            >
              {/* Retailer + days badge */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-1">
                  {retailer?.firmName ?? inv.retailerId}
                </p>
                <span className="flex items-center gap-1 flex-shrink-0 text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${urgencyDot(days)}`} />
                  {days}d
                </span>
              </div>

              {/* Invoice no + amount */}
              <p className="text-[11px] font-mono text-gray-500">{inv.invoiceNo}</p>
              <p className="text-xs font-semibold text-red-600 mt-0.5">
                ₹{inv.outstandingAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })} outstanding
              </p>

              {/* Sales exec + escalate */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-400">{exec?.name ?? '—'}</p>
                <button
                  onClick={() => escalate({ inv, retailer, days })}
                  className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-800 transition-colors"
                >
                  <ArrowUpRight size={11} />
                  Escalate
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
