import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { mockCreditNotes } from '../../data/mockCreditNotes';
import { mockRetailers } from '../../data/mockRetailers';
import type { CreditNote } from './types';
import type { RetailerAccount } from '../../types/b2b';
import CreditNoteList from './CreditNoteList';
import CreditNoteForm from './CreditNoteForm';
import CreditNoteDetail from './CreditNoteDetail';
import { useAuth } from '../../context/AuthContext';

// ── ID generator ──────────────────────────────────────────────────────────────

let _idSeq = mockCreditNotes.length;

function nextId() {
  _idSeq += 1;
  return `cn-${String(_idSeq).padStart(3, '0')}`;
}

function nextCnNo(type: CreditNote['type'], date: string) {
  const datePart = date.replace(/-/g, '');
  const seq = String(_idSeq).padStart(3, '0');
  return type === 'Supplier'
    ? `CN-SUP-${datePart}-${seq}`
    : `CN-B2B-${datePart}-${seq}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreditNotes() {
  const { user } = useAuth();

  const [notes,     setNotes]     = useState<CreditNote[]>(mockCreditNotes);
  const [retailers, setRetailers] = useState<RetailerAccount[]>(mockRetailers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editingNote, setEditingNote] = useState<CreditNote | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) : null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function openCreate() {
    setEditingNote(undefined);
    setShowForm(true);
  }

  function openEdit(note: CreditNote) {
    setEditingNote(note);
    setShowForm(true);
  }

  function handleSave(
    payload: Omit<CreditNote, 'id' | 'cnNo' | 'createdByUserId' | 'createdAt' | 'updatedAt'> & { id?: string; cnNo?: string },
    submitForApproval: boolean,
  ) {
    const now = new Date().toISOString();
    const userId = user?.id ?? 'usr-010';

    if (payload.id) {
      // Edit existing draft
      setNotes((prev) =>
        prev.map((n) =>
          n.id === payload.id
            ? { ...n, ...payload, id: n.id, cnNo: n.cnNo, updatedAt: now }
            : n,
        ),
      );
      showToast(
        submitForApproval
          ? `${payload.cnNo} submitted for approval`
          : `${payload.cnNo} saved as draft`,
      );
    } else {
      // New CN
      const id   = nextId();
      const cnNo = nextCnNo(payload.type, payload.date);
      const newNote: CreditNote = {
        ...payload,
        id,
        cnNo,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
      showToast(
        submitForApproval
          ? `${cnNo} submitted for approval`
          : `${cnNo} saved as draft`,
      );
    }

    setShowForm(false);
    setEditingNote(undefined);
  }

  function handleApprove(cnId: string) {
    const now  = new Date().toISOString();
    const userId = user?.id ?? 'usr-010';
    const cn   = notes.find((n) => n.id === cnId);
    if (!cn) return;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === cnId
          ? { ...n, status: 'Posted', approvedByUserId: userId, approvedAt: now, updatedAt: now }
          : n,
      ),
    );

    // B2B: reduce retailer outstanding
    if (cn.type === 'B2BCustomer' && cn.retailerId) {
      setRetailers((prev) =>
        prev.map((r) =>
          r.id === cn.retailerId
            ? { ...r, outstandingAmt: Math.max(0, r.outstandingAmt - cn.netAmt) }
            : r,
        ),
      );
      console.log('// PATCH /api/retailers/', cn.retailerId, '{ outstandingAmt: -', cn.netAmt, '}');
    }

    // Supplier: log COGS update stub
    if (cn.type === 'Supplier' && cn.linkedBatchId) {
      console.log('// PATCH /api/batches/', cn.linkedBatchId, '{ purchasePricePerUnit: recalculated }');
    }

    showToast(`${cn.cnNo} approved and posted`);
    setSelectedId(null);  // return to list
  }

  function handleReject(cnId: string, reason: string) {
    const now = new Date().toISOString();
    const cn  = notes.find((n) => n.id === cnId);
    if (!cn) return;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === cnId
          ? { ...n, status: 'Rejected', rejectedReason: reason, updatedAt: now }
          : n,
      ),
    );

    console.log('// POST /api/credit-notes/', cnId, '/reject { reason }');
    showToast(`${cn.cnNo} rejected`);
    setSelectedId(null);  // return to list
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Credit Notes"
        subtitle="Supplier debit adjustments and B2B customer receivable reductions"
      />

      {/* Detail view */}
      {selectedNote ? (
        <CreditNoteDetail
          note={selectedNote}
          retailers={retailers}
          onBack={() => setSelectedId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <CreditNoteList
          notes={notes}
          onCreate={openCreate}
          onSelect={setSelectedId}
          onEdit={openEdit}
        />
      )}

      {/* Form slide-over */}
      {showForm && (
        <CreditNoteForm
          note={editingNote}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingNote(undefined); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl z-[100] max-w-sm">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
