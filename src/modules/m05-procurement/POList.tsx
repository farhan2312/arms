// POList — table of all purchase orders with 3-way match detail on expand

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock, Plus } from 'lucide-react';
import type { PurchaseOrder } from './types';
import Button from '../../components/ui/Button';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';

type MatchStatus = 'Matched' | 'Qty Mismatch' | 'Pending GRN' | 'Pending Invoice' | 'Pending Both';

function getMatchStatus(
  poQty: number,
  grnQty: number | undefined,
  invQty: number | undefined,
): MatchStatus {
  if (grnQty == null && invQty == null) return 'Pending Both';
  if (grnQty == null) return 'Pending GRN';
  if (invQty == null) return 'Pending Invoice';
  if (grnQty === poQty && invQty === poQty) return 'Matched';
  return 'Qty Mismatch';
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type POStatus = PurchaseOrder['status'];

const STATUS_STYLE: Record<POStatus, string> = {
  Draft:               'bg-gray-100 text-gray-600',
  Sent:                'bg-blue-100 text-blue-700',
  'Partially Received':'bg-amber-100 text-amber-700',
  Closed:              'bg-emerald-100 text-emerald-700',
};

interface Props {
  pos: PurchaseOrder[];
  onNewPO: () => void;
}

export default function POList({ pos, onNewPO }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Purchase Orders</h2>
          <p className="text-xs text-gray-500 mt-0.5">{pos.length} PO{pos.length !== 1 ? 's' : ''} on record</p>
        </div>
        <Button variant="primary" size="sm" iconLeft={Plus} onClick={onNewPO}>
          New PO
        </Button>
      </div>

      {/* Table */}
      <TableWrap>
        <thead>
          <tr>
            <Th>PO Number</Th>
            <Th>Supplier</Th>
            <Th>Date</Th>
            <Th>Deliver To</Th>
            <Th>Products</Th>
            <Th>Value</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {pos.map(po => {
            const isExpanded = expandedIds.has(po.id);
            return (
              <>
                <Tr
                  key={po.id}
                  onClick={() => toggle(po.id)}
                >
                  <Td mono>{po.poNo}</Td>
                  <Td>{po.supplierName}</Td>
                  <Td muted>{fmtDate(po.date)}</Td>
                  <Td muted>{po.storeName.replace('Bharat Agri Store – ', '')}</Td>
                  <Td muted>{po.lines.length} item{po.lines.length !== 1 ? 's' : ''}</Td>
                  <Td mono bold>₹{fmt(po.totalAmt)}</Td>
                  <Td>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[po.status]}`}>
                      {po.status}
                    </span>
                  </Td>
                  <Td muted>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Td>
                </Tr>

                {/* 3-Way Match Detail */}
                {isExpanded && (
                  <tr key={`${po.id}-detail`} className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-5">
                      <div className="mb-3 flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          3-Way Match: PO ↔ GRN ↔ Supplier Invoice
                        </h4>
                        {po.prId && (
                          <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded">
                            from {po.prId}
                          </span>
                        )}
                      </div>

                      {/* Supplier info */}
                      <div className="text-xs text-gray-500 mb-4">
                        <span className="font-medium text-gray-700">{po.supplierName}</span>
                        {po.sentAt && <> · Sent {fmtDate(po.sentAt.slice(0, 10))}</>}
                      </div>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-wide">
                            <th className="pb-2 text-left font-semibold">Product</th>
                            <th className="pb-2 text-center font-semibold">HSN</th>
                            <th className="pb-2 text-right font-semibold">PO Qty</th>
                            <th className="pb-2 text-right font-semibold">GRN Received</th>
                            <th className="pb-2 text-right font-semibold">Supplier Invoice</th>
                            <th className="pb-2 text-right font-semibold">Unit Rate</th>
                            <th className="pb-2 text-right font-semibold">Line Total</th>
                            <th className="pb-2 text-center font-semibold">Match</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {po.lines.map(line => {
                            const matchStatus = getMatchStatus(
                              line.quantity,
                              line.grnReceivedQty,
                              line.supplierInvoiceQty,
                            );
                            return (
                              <tr key={line.id} className="bg-white">
                                <td className="py-2 text-gray-700 font-medium">{line.productName}</td>
                                <td className="py-2 text-center text-gray-500 font-mono">{line.hsnCode}</td>
                                <td className="py-2 text-right font-mono text-gray-700">{line.quantity} {line.unit}</td>
                                <td className="py-2 text-right font-mono text-gray-600">
                                  {line.grnReceivedQty != null ? `${line.grnReceivedQty} ${line.unit}` : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="py-2 text-right font-mono text-gray-600">
                                  {line.supplierInvoiceQty != null ? `${line.supplierInvoiceQty} ${line.unit}` : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="py-2 text-right font-mono text-gray-600">₹{fmt(line.unitRate)}</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-800">₹{fmt(line.lineTotal)}</td>
                                <td className="py-2 text-center">
                                  <MatchBadge status={matchStatus} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td colSpan={5} className="pt-2 text-right text-xs text-gray-500">
                              Subtotal: <span className="font-mono">₹{fmt(po.subtotalAmt)}</span> ·
                              CGST: <span className="font-mono">₹{fmt(po.cgstAmt)}</span> ·
                              SGST: <span className="font-mono">₹{fmt(po.sgstAmt)}</span>
                            </td>
                            <td />
                            <td className="pt-2 text-right text-sm font-bold text-gray-900 font-mono">
                              ₹{fmt(po.totalAmt)}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>

                      {/* Match legend */}
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Matched</span>
                        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-red-400" /> Qty Mismatch</span>
                        <span className="flex items-center gap-1"><Clock size={10} className="text-amber-400" /> Pending GRN / Invoice</span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}

          {pos.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                No purchase orders yet. Create one from an approved PR or manually.
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Match badge ───────────────────────────────────────────────────────────────

function MatchBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    'Matched':         { label: '✓ Matched',      cls: 'text-emerald-600 bg-emerald-50',  icon: <CheckCircle2 size={10} /> },
    'Qty Mismatch':    { label: '⚠ Mismatch',     cls: 'text-red-600 bg-red-50',          icon: <AlertTriangle size={10} /> },
    'Pending GRN':     { label: 'Pending GRN',    cls: 'text-amber-600 bg-amber-50',      icon: <Clock size={10} /> },
    'Pending Invoice': { label: 'Pending Invoice', cls: 'text-amber-600 bg-amber-50',     icon: <Clock size={10} /> },
    'Pending Both':    { label: 'Pending',         cls: 'text-gray-500 bg-gray-100',      icon: <Clock size={10} /> },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}
