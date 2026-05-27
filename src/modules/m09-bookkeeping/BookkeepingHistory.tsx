// BookkeepingHistory — table of past daily entries + missing-day highlighting
// BDM / OpsHead / Finance see all stores; StoreIncharge sees only their store

import { useMemo } from 'react';
import { Download, AlertTriangle, CheckCircle2, Flag, BookOpen } from 'lucide-react';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { mockStores } from '../../data/mockStores';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { BookkeepingEntry } from './BookkeepingPage';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';

const TODAY = '2026-05-27';

// Roles that can see all stores' history
const WIDE_ROLES = new Set(['OperationsHead', 'Admin', 'SuperAdmin', 'BDM', 'Finance']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function lastNDays(n: number, from: string): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function b2cForStoreDate(storeId: string, date: string): number {
  return mockSaleTransactions
    .filter(t => t.storeId === storeId && t.invoiceDate === date && t.status !== 'Cancelled')
    .reduce((s, t) => s + t.totalAmt, 0);
}

function b2bForStoreDate(storeId: string, date: string): number {
  return mockB2BOrders
    .filter(
      o =>
        o.fulfillmentStoreId === storeId &&
        o.dispatchByDate === date &&
        (o.status === 'Dispatched' || o.status === 'Invoiced' || o.status === 'Delivered'),
    )
    .reduce((s, o) => s + o.totalAmt, 0);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number | undefined): string {
  if (n == null) return '—';
  if (n === 0) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Short store label: strip the chain prefix
function shortStore(name: string): string {
  return name.replace('Bharat Agri Store – ', '');
}

// ── Row shape ─────────────────────────────────────────────────────────────────

type RowStatus = 'Submitted' | 'Flagged' | 'Missing';

interface HistoryRow {
  key: string;
  date: string;
  storeId: string;
  storeName: string;
  b2cSales: number;
  b2bDispatches: number;
  openingCash?: number;
  closingCash?: number;
  discrepancyAmt?: number;
  status: RowStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  entries: BookkeepingEntry[];
}

export default function BookkeepingHistory({ entries }: Props) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isWide = WIDE_ROLES.has(currentUser.role);

  const storeNameMap = useMemo(
    () => new Map(mockStores.map(s => [s.id, s.name])),
    [],
  );

  const visibleStoreIds = useMemo(() => {
    if (isWide) return mockStores.map(s => s.id);
    return currentUser.assignedStoreIds.filter(sid => storeNameMap.has(sid));
  }, [isWide, currentUser.assignedStoreIds, storeNameMap]);

  const rows = useMemo((): HistoryRow[] => {
    const last7 = new Set(lastNDays(7, TODAY));

    // Submitted / Flagged entries for visible stores
    const submittedRows: HistoryRow[] = entries
      .filter(e => visibleStoreIds.includes(e.storeId))
      .map(e => ({
        key: e.id,
        date: e.date,
        storeId: e.storeId,
        storeName: storeNameMap.get(e.storeId) ?? e.storeId,
        b2cSales: b2cForStoreDate(e.storeId, e.date),
        b2bDispatches: b2bForStoreDate(e.storeId, e.date),
        openingCash: e.openingCash,
        closingCash: e.closingCash,
        discrepancyAmt: e.discrepancyAmt > 0 ? e.discrepancyAmt : undefined,
        status: e.status,
      }));

    // Missing rows — last 7 days where no entry exists for a visible store
    const missingRows: HistoryRow[] = [];
    last7.forEach(date => {
      visibleStoreIds.forEach(sid => {
        const hasEntry = entries.some(e => e.date === date && e.storeId === sid);
        if (!hasEntry) {
          missingRows.push({
            key: `missing-${date}-${sid}`,
            date,
            storeId: sid,
            storeName: storeNameMap.get(sid) ?? sid,
            b2cSales: b2cForStoreDate(sid, date),
            b2bDispatches: b2bForStoreDate(sid, date),
            status: 'Missing',
          });
        }
      });
    });

    return [...submittedRows, ...missingRows].sort((a, b) =>
      b.date !== a.date ? b.date.localeCompare(a.date) : a.storeName.localeCompare(b.storeName),
    );
  }, [entries, visibleStoreIds, storeNameMap]);

  const missingCount   = rows.filter(r => r.status === 'Missing').length;
  const flaggedCount   = rows.filter(r => r.status === 'Flagged').length;
  const submittedCount = rows.filter(r => r.status === 'Submitted').length;

  function handleExport() {
    const dateFrom = lastNDays(7, TODAY).at(-1);
    console.log('// POST /api/bookkeeping/export', {
      storeIds: visibleStoreIds,
      dateFrom,
      dateTo: TODAY,
    });
    toast.success('Export started', 'Your PDF will download shortly.');
  }

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Submission History</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {submittedCount} submitted
            {flaggedCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">· {flaggedCount} flagged</span>
            )}
            {missingCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {missingCount} missing in last 7 days</span>
            )}
          </p>
        </div>
        <Button variant="secondary" iconLeft={Download} onClick={handleExport}>
          Export PDF
        </Button>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300 inline-block" />
          Missing — no entry filed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
          Flagged — cash discrepancy noted
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <EmptyState icon={BookOpen} title="No entries to display." />
      ) : (
        <div className="overflow-x-auto">
          <TableWrap>
            <thead>
              <tr>
                {[
                  'Date', 'Store', 'B2C Sales', 'B2B Dispatches',
                  'Opening Cash', 'Closing Cash', 'Cash Discrepancy', 'Status',
                ].map(h => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isMissing = row.status === 'Missing';
                const isFlagged = row.status === 'Flagged';
                return (
                  <Tr
                    key={row.key}
                    className={
                      isMissing
                        ? 'bg-amber-50/70 hover:bg-amber-50'
                        : isFlagged
                        ? 'bg-red-50/40 hover:bg-red-50'
                        : ''
                    }
                  >
                    <Td>{fmtDate(row.date)}</Td>
                    <Td muted>{shortStore(row.storeName)}</Td>
                    <Td mono>{fmtMoney(row.b2cSales)}</Td>
                    <Td mono>{fmtMoney(row.b2bDispatches)}</Td>
                    <Td mono>
                      {row.openingCash != null ? `₹${row.openingCash.toLocaleString('en-IN')}` : '—'}
                    </Td>
                    <Td mono>
                      {row.closingCash != null ? `₹${row.closingCash.toLocaleString('en-IN')}` : '—'}
                    </Td>
                    <Td>
                      {row.discrepancyAmt != null ? (
                        <span className="font-mono text-xs font-medium text-red-600">
                          ₹{row.discrepancyAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      ) : row.status !== 'Missing' ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </Td>
                    <Td>
                      {isMissing && (
                        <Badge variant="amber">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle size={9} /> Missing
                          </span>
                        </Badge>
                      )}
                      {isFlagged && (
                        <Badge variant="red">
                          <span className="inline-flex items-center gap-1">
                            <Flag size={9} /> Flagged
                          </span>
                        </Badge>
                      )}
                      {row.status === 'Submitted' && (
                        <Badge variant="green">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={9} /> Submitted
                          </span>
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
}
