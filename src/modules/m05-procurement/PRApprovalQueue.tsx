// PRApprovalQueue — role-filtered list of PRs with Approve / Reject / Request Revision actions

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { PurchaseRequisition, PRStatus } from './types';

const HIGH_VALUE_THRESHOLD = 50_000;

// Roles that see all PRs regardless of store
const WIDE_APPROVER_ROLES = new Set(['OperationsHead', 'Admin', 'SuperAdmin']);
// Finance sees only high-value PRs
const FINANCE_ROLES = new Set(['Finance']);

type ActionMode = 'idle' | 'reject' | 'revise';

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  prs: PurchaseRequisition[];
  onUpdatePR: (id: string, update: Partial<PurchaseRequisition>) => void;
  onCreatePO: (pr: PurchaseRequisition) => void;
}

export default function PRApprovalQueue({ prs, onUpdatePR, onCreatePO }: Props) {
  const { currentUser } = useAuth();
  const isWide    = WIDE_APPROVER_ROLES.has(currentUser.role);
  const isFinance = FINANCE_ROLES.has(currentUser.role);
  const isBDM     = currentUser.role === 'BDM';

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionMode, setActionMode]   = useState<Record<string, ActionMode>>({});
  const [comment, setComment]         = useState<Record<string, string>>({});

  // ── Visibility filter ────────────────────────────────────────────────────────
  const visible = prs.filter(pr => {
    if (isWide) return true;
    if (isBDM) return currentUser.assignedStoreIds.includes(pr.storeId);
    if (isFinance) return pr.totalEstimatedValue >= HIGH_VALUE_THRESHOLD;
    return false;
  });

  // Group by actionable status
  const pending   = visible.filter(pr => pr.status === 'Pending Approval');
  const revision  = visible.filter(pr => pr.status === 'Revision Requested');
  const approved  = visible.filter(pr => pr.status === 'Approved, Pending PO');
  const terminal  = visible.filter(pr => pr.status === 'Rejected' || pr.status === 'PO Created');

  // ── Actions ──────────────────────────────────────────────────────────────────

  function approvePR(pr: PurchaseRequisition) {
    onUpdatePR(pr.id, {
      status: 'Approved, Pending PO',
      approvedByUserId: currentUser.id,
      approvedAt: new Date().toISOString(),
      approverComments: undefined,
    });
    console.log('// POST /api/procurement/prs/' + pr.id + '/approve', { userId: currentUser.id });
  }

  function rejectPR(pr: PurchaseRequisition) {
    const reason = comment[pr.id]?.trim();
    if (!reason) return;
    onUpdatePR(pr.id, { status: 'Rejected', approverComments: reason });
    console.log('// POST /api/procurement/prs/' + pr.id + '/reject', { reason, userId: currentUser.id });
    console.log('// Notify StoreIncharge: PR rejected —', pr.prNo, reason);
    setActionMode(prev => ({ ...prev, [pr.id]: 'idle' }));
    setComment(prev => ({ ...prev, [pr.id]: '' }));
  }

  function requestRevision(pr: PurchaseRequisition) {
    const notes = comment[pr.id]?.trim();
    if (!notes) return;
    onUpdatePR(pr.id, { status: 'Revision Requested', approverComments: notes });
    console.log('// POST /api/procurement/prs/' + pr.id + '/revise', { notes, userId: currentUser.id });
    setActionMode(prev => ({ ...prev, [pr.id]: 'idle' }));
    setComment(prev => ({ ...prev, [pr.id]: '' }));
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── PR Card ──────────────────────────────────────────────────────────────────

  function PRCard({ pr, showActions }: { pr: PurchaseRequisition; showActions: boolean }) {
    const isExpanded = expandedIds.has(pr.id);
    const mode = actionMode[pr.id] ?? 'idle';

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => toggleExpand(pr.id)}
          className="w-full px-5 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              pr.urgency === 'Urgent' ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'
            }`}>
              <Package size={16} className={pr.urgency === 'Urgent' ? 'text-red-500' : 'text-emerald-600'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{pr.prNo}</p>
                {pr.urgency === 'Urgent' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                    <AlertTriangle size={9} /> URGENT
                  </span>
                )}
                {pr.totalEstimatedValue >= HIGH_VALUE_THRESHOLD && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    High Value
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {pr.storeName.replace('Bharat Agri Store – ', '')} · {fmtDate(pr.date)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pr.lines.length} product{pr.lines.length !== 1 ? 's' : ''} ·{' '}
                <span className="font-semibold text-gray-700">₹{fmt(pr.totalEstimatedValue)}</span> est. value
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={pr.status} />
            {isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
          </div>
        </button>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-5 py-4">
            {/* Lines */}
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wide text-[10px]">
                  <th className="pb-1.5 text-left font-semibold">Product</th>
                  <th className="pb-1.5 text-right font-semibold">Stock</th>
                  <th className="pb-1.5 text-right font-semibold">Requested</th>
                  <th className="pb-1.5 text-right font-semibold">Unit Price</th>
                  <th className="pb-1.5 text-right font-semibold">Line Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pr.lines.map(l => (
                  <tr key={l.productId}>
                    <td className="py-1.5 text-gray-700 font-medium">{l.productName}</td>
                    <td className="py-1.5 text-right text-gray-500 font-mono">{l.currentStock} {l.unit}</td>
                    <td className="py-1.5 text-right text-gray-800 font-semibold font-mono">{l.requestedQty} {l.unit}</td>
                    <td className="py-1.5 text-right text-gray-600 font-mono">₹{fmt(l.estimatedUnitPrice)}</td>
                    <td className="py-1.5 text-right text-gray-800 font-mono">₹{fmt(l.requestedQty * l.estimatedUnitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={4} className="pt-2 text-right text-xs font-semibold text-gray-600">Total Estimated:</td>
                  <td className="pt-2 text-right text-sm font-bold text-gray-900 font-mono">₹{fmt(pr.totalEstimatedValue)}</td>
                </tr>
              </tfoot>
            </table>

            {pr.notes && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 italic">"{pr.notes}"</p>
            )}

            {pr.approverComments && (pr.status === 'Rejected' || pr.status === 'Revision Requested') && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                <span className="font-semibold">Approver note:</span> {pr.approverComments}
              </div>
            )}

            {/* Action buttons */}
            {showActions && mode === 'idle' && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => approvePR(pr)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 size={12} /> Approve
                </button>
                <button
                  onClick={() => setActionMode(prev => ({ ...prev, [pr.id]: 'revise' }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <RotateCcw size={12} /> Request Revision
                </button>
                <button
                  onClick={() => setActionMode(prev => ({ ...prev, [pr.id]: 'reject' }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <XCircle size={12} /> Reject
                </button>
              </div>
            )}

            {/* Reject / Revise inline form */}
            {showActions && (mode === 'reject' || mode === 'revise') && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  {mode === 'reject' ? 'Rejection reason' : 'Revision instructions'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment[pr.id] ?? ''}
                  onChange={e => setComment(prev => ({ ...prev, [pr.id]: e.target.value }))}
                  rows={2}
                  placeholder={mode === 'reject'
                    ? 'State the reason for rejection…'
                    : 'Describe what needs to be revised…'}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 resize-none ${
                    mode === 'reject'
                      ? 'border-red-200 focus:ring-red-400'
                      : 'border-amber-200 focus:ring-amber-400'
                  }`}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mode === 'reject' ? rejectPR(pr) : requestRevision(pr)}
                    disabled={!comment[pr.id]?.trim()}
                    className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      mode === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {mode === 'reject' ? 'Confirm Rejection' : 'Send Back to SI'}
                  </button>
                  <button
                    onClick={() => setActionMode(prev => ({ ...prev, [pr.id]: 'idle' }))}
                    className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Create PO button for approved PRs */}
            {pr.status === 'Approved, Pending PO' && (
              <button
                onClick={() => onCreatePO(pr)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Purchase Order →
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400">
        No purchase requisitions in your approval scope.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Section title="Awaiting Approval" count={pending.length} accent="amber">
          {pending.map(pr => <PRCard key={pr.id} pr={pr} showActions={true} />)}
        </Section>
      )}

      {revision.length > 0 && (
        <Section title="Revision Requested — Awaiting SI Resubmission" count={revision.length} accent="gray">
          {revision.map(pr => <PRCard key={pr.id} pr={pr} showActions={false} />)}
        </Section>
      )}

      {approved.length > 0 && (
        <Section title="Approved — Pending Purchase Order" count={approved.length} accent="green">
          {approved.map(pr => <PRCard key={pr.id} pr={pr} showActions={false} />)}
        </Section>
      )}

      {terminal.length > 0 && (
        <Section title="Closed" count={terminal.length} accent="gray">
          {terminal.map(pr => <PRCard key={pr.id} pr={pr} showActions={false} />)}
        </Section>
      )}
    </div>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: 'amber' | 'green' | 'gray';
  children: React.ReactNode;
}) {
  const colors = {
    amber: 'text-amber-700 bg-amber-100',
    green: 'text-emerald-700 bg-emerald-100',
    gray: 'text-gray-600 bg-gray-100',
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors[accent]}`}>{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: PRStatus }) {
  const map: Record<PRStatus, string> = {
    'Pending Approval':    'bg-amber-100 text-amber-700',
    'Approved, Pending PO':'bg-emerald-100 text-emerald-700',
    'Rejected':            'bg-red-100 text-red-600',
    'Revision Requested':  'bg-orange-100 text-orange-700',
    'PO Created':          'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${map[status]}`}>
      {status}
    </span>
  );
}
