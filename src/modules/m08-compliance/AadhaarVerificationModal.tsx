// AadhaarVerificationModal — Aadhaar e-KYC gate for subsidised fertiliser sales
// Phases: aadhaar → otp → (success | fallback)
// Mock OTP: "123456" — in production, wire to government UIDAI API

import { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

type Phase = 'aadhaar' | 'otp' | 'success' | 'fallback';

const MOCK_OTP    = '123456';
const MAX_ATTEMPTS = 3;

export interface AadhaarVerificationResult {
  maskedAadhaar: string;   // XXXX-XXXX-1234
  isFallback: boolean;
}

interface Props {
  onSuccess: (result: AadhaarVerificationResult) => void;
  onClose: () => void;
}

export default function AadhaarVerificationModal({ onSuccess, onClose }: Props) {
  const [phase, setPhase]               = useState<Phase>('aadhaar');

  // Phase: aadhaar
  const [aadhaarRaw, setAadhaarRaw]     = useState('');   // stores 12 digits only
  const [aadhaarLocked, setAadhaarLocked] = useState(false);
  const [aadhaarError, setAadhaarError] = useState('');

  // Phase: otp
  const [otpInput, setOtpInput]         = useState('');
  const [attempts, setAttempts]         = useState(0);
  const [otpError, setOtpError]         = useState('');

  // Phase: fallback
  const [physicalRef, setPhysicalRef]   = useState('');
  const [justification, setJustification] = useState('');
  const [fallbackErrors, setFallbackErrors] = useState<Record<string, string>>({});

  // ── Derived ─────────────────────────────────────────────────────────────────
  const maskedAadhaar = aadhaarRaw.length === 12
    ? `XXXX-XXXX-${aadhaarRaw.slice(-4)}`
    : '';

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleAadhaarInput(val: string) {
    if (aadhaarLocked) return;
    const digits = val.replace(/\D/g, '').slice(0, 12);
    setAadhaarRaw(digits);
    setAadhaarError('');
  }

  function handleSendOTP() {
    if (aadhaarRaw.length !== 12) {
      setAadhaarError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setAadhaarLocked(true);
    setAadhaarError('');
    // Mock: OTP is always "123456"
    console.log('// POST /api/uidai/otp/send — masked Aadhaar:', maskedAadhaar);
    setPhase('otp');
  }

  function handleVerifyOTP() {
    if (otpInput === MOCK_OTP) {
      setOtpError('');
      setPhase('success');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setOtpInput('');

    if (newAttempts >= MAX_ATTEMPTS) {
      setOtpError('');
      setPhase('fallback');
    } else {
      setOtpError(`Invalid OTP — try again. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
    }
  }

  function handleFallbackSubmit() {
    const errs: Record<string, string> = {};
    if (!physicalRef.trim()) errs.physicalRef = 'Physical Aadhaar reference number is required.';
    if (!justification.trim()) errs.justification = 'Justification notes are required.';
    if (Object.keys(errs).length > 0) { setFallbackErrors(errs); return; }

    console.log('// POST /api/compliance/manual-verification', {
      maskedAadhaar,
      physicalRef: physicalRef.trim(),
      justification: justification.trim(),
    });

    onSuccess({ maskedAadhaar, isFallback: true });
  }

  function handleProceed() {
    onSuccess({ maskedAadhaar, isFallback: false });
  }

  // ── Input display value ──────────────────────────────────────────────────────
  const aadhaarDisplayValue = aadhaarLocked
    ? maskedAadhaar
    : aadhaarRaw;

  const inputCls = (err?: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
      err ? 'border-red-300' : 'border-gray-300'
    }`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-emerald-600" />
            <h2 className="font-bold text-gray-900">Aadhaar e-KYC Verification</h2>
          </div>
          {phase !== 'success' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Phase: aadhaar ─────────────────────────────────────────────── */}
          {(phase === 'aadhaar' || phase === 'otp') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">1</span>
                <label className="text-xs font-semibold text-gray-700">Farmer Aadhaar Number</label>
              </div>

              <input
                type="text"
                inputMode="numeric"
                value={aadhaarDisplayValue}
                onChange={e => handleAadhaarInput(e.target.value)}
                readOnly={aadhaarLocked}
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={aadhaarLocked ? 14 : 12}
                className={`${inputCls(aadhaarError)} ${aadhaarLocked ? 'bg-gray-50 text-gray-500 font-mono tracking-widest' : 'font-mono tracking-widest'}`}
              />

              {aadhaarError && (
                <p className="text-[11px] text-red-500 mt-1">{aadhaarError}</p>
              )}

              {!aadhaarLocked && aadhaarRaw.length > 0 && (
                <p className="text-[11px] text-gray-400 mt-1">
                  {aadhaarRaw.length}/12 digits entered
                  {aadhaarRaw.length === 12 && ' ✓'}
                </p>
              )}

              {aadhaarLocked && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Aadhaar recorded — number is masked for security
                </p>
              )}
            </div>
          )}

          {/* ── Phase: aadhaar — Send OTP button ──────────────────────────── */}
          {phase === 'aadhaar' && (
            <button
              onClick={handleSendOTP}
              disabled={aadhaarRaw.length !== 12}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Send OTP to Registered Mobile
            </button>
          )}

          {/* ── Phase: otp ─────────────────────────────────────────────────── */}
          {phase === 'otp' && (
            <div className="space-y-4">
              {/* OTP sent confirmation */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                <RefreshCw size={13} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">OTP sent to farmer's registered mobile</p>
                  <p className="text-blue-500 mt-0.5 font-mono text-[11px]">
                    [DEV] Mock OTP: 123456
                  </p>
                </div>
              </div>

              {/* Step 2 label */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">2</span>
                  <label className="text-xs font-semibold text-gray-700">Enter OTP</label>
                  {attempts > 0 && (
                    <span className="ml-auto text-[10px] text-amber-600 font-medium">
                      {attempts}/{MAX_ATTEMPTS} attempts used
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                  placeholder="6-digit OTP"
                  className={`${inputCls(otpError)} font-mono tracking-[0.4em] text-center`}
                  autoFocus
                />

                {otpError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} /> {otpError}
                  </p>
                )}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otpInput.length !== 6}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                Verify OTP
              </button>
            </div>
          )}

          {/* ── Phase: fallback ─────────────────────────────────────────────── */}
          {phase === 'fallback' && (
            <div className="space-y-4">
              {/* Amber warning */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-3 text-xs text-amber-800">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Verification failed — switching to manual fallback</p>
                  <p className="mt-0.5">This sale will be flagged for Compliance review. Ensure the farmer's physical Aadhaar card is present.</p>
                </div>
              </div>

              {/* Physical Aadhaar Ref */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Physical Aadhaar Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={physicalRef}
                  onChange={e => { setPhysicalRef(e.target.value); setFallbackErrors(prev => ({ ...prev, physicalRef: '' })); }}
                  className={inputCls(fallbackErrors.physicalRef)}
                  placeholder="e.g. 4321 5678 9012"
                />
                {fallbackErrors.physicalRef && (
                  <p className="text-[11px] text-red-500 mt-1">{fallbackErrors.physicalRef}</p>
                )}
              </div>

              {/* Justification */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Justification Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={justification}
                  onChange={e => { setJustification(e.target.value); setFallbackErrors(prev => ({ ...prev, justification: '' })); }}
                  rows={3}
                  className={`${inputCls(fallbackErrors.justification)} resize-none`}
                  placeholder="Reason for manual fallback (e.g. farmer's mobile not reachable, SIM card changed)"
                />
                {fallbackErrors.justification && (
                  <p className="text-[11px] text-red-500 mt-1">{fallbackErrors.justification}</p>
                )}
              </div>

              <button
                onClick={handleFallbackSubmit}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
              >
                Proceed with Manual Verification
              </button>
            </div>
          )}

          {/* ── Phase: success ─────────────────────────────────────────────── */}
          {phase === 'success' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-700">Farmer Verified ✓</p>
                  <p className="text-xs text-gray-500 mt-1">e-KYC completed successfully</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Masked Aadhaar</p>
                  <p className="font-mono font-bold text-gray-800 text-sm mt-0.5">{maskedAadhaar}</p>
                </div>
              </div>

              <button
                onClick={handleProceed}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
              >
                Proceed with Sale →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
