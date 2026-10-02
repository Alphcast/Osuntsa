import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Receipt } from '../types';
import { formatKoboToNaira, koboToWords } from '../services/prnService';
import { verifyReceiptAuthenticity } from '../services/receiptService';

export const ReceiptVerificationView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedReceipt, setMatchedReceipt] = useState<Receipt | null>(null);
  const [isValidSignature, setIsValidSignature] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsVerifying(true);
    setSearched(true);
    setMatchedReceipt(null);

    const query = searchQuery.trim().toUpperCase();
    const receipts = StorageService.getReceipts();

    const found = receipts.find(
      (r) =>
        r.receiptNumber.toUpperCase() === query ||
        r.prn.toUpperCase() === query ||
        r.verificationHash.toUpperCase() === query ||
        r.transactionRef.toUpperCase() === query
    );

    if (found) {
      setMatchedReceipt(found);
      const auth = await verifyReceiptAuthenticity(found);
      setIsValidSignature(auth.isValid);
    } else {
      setMatchedReceipt(null);
    }

    setIsVerifying(false);
  };

  const loadSample = (sampleRef: string) => {
    setSearchQuery(sampleRef);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Public E-Receipt Verification Portal
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Verify the authenticity of any revenue receipt issued by the Osun State Government. Cross-checked against the immutable Treasury Single Account master ledger.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleVerify} className="mt-8 max-w-xl mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Receipt Number (REC-OSN-...) or PRN"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            {isVerifying ? 'Verifying...' : 'Verify Receipt'}
          </button>
        </div>

        {/* Quick sample pills */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Try sample:</span>
          <button
            type="button"
            onClick={() => loadSample('REC-OSN-2026-894102')}
            className="text-emerald-800 font-mono hover:underline"
          >
            REC-OSN-2026-894102
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => loadSample('REC-OSN-2026-894103')}
            className="text-emerald-800 font-mono hover:underline"
          >
            REC-OSN-2026-894103
          </button>
        </div>
      </form>

      {/* Verification Result Card */}
      {searched && (
        <div className="mt-8 max-w-2xl mx-auto">
          {matchedReceipt ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
              {/* Authenticity Banner */}
              <div
                className={`p-4 flex items-center gap-3 ${
                  isValidSignature ? 'bg-emerald-800 text-white' : 'bg-red-800 text-white'
                }`}
              >
                {isValidSignature ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-red-200 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold">
                    {isValidSignature
                      ? 'OFFICIALLY VERIFIED & AUTHENTIC RECEIPT'
                      : 'TAMPER DETECTED: INVALID SIGNATURE'}
                  </h3>
                  <p className="text-xs text-emerald-100/90">
                    {isValidSignature
                      ? 'This receipt is authentic and recorded in the Osun State Treasury Single Account.'
                      : 'Cryptographic hash does not match state records. Potential forgery.'}
                  </p>
                </div>
              </div>

              {/* Receipt Snapshot Details */}
              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-semibold block">Receipt Number</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{matchedReceipt.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-semibold block">PRN Reference</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">{matchedReceipt.prn}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payer Name:</span>
                    <span className="font-semibold text-slate-900">{matchedReceipt.payerName}</span>
                  </div>
                  {matchedReceipt.payerTinNin && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">NIN / TIN:</span>
                      <span className="font-mono text-slate-800">{matchedReceipt.payerTinNin}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Collecting MDA:</span>
                    <span className="font-semibold text-slate-900 text-right">{matchedReceipt.mdaName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Revenue Head:</span>
                    <span className="font-semibold text-slate-900 text-right">{matchedReceipt.revenueHeadName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Date:</span>
                    <span className="font-mono text-slate-800">
                      {new Date(matchedReceipt.paidAt).toLocaleString('en-NG')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Switch / Gateway:</span>
                    <span className="font-mono text-slate-800">
                      {matchedReceipt.gateway} ({matchedReceipt.paymentMethod})
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-700">Total Settled Amount:</span>
                  <span className="font-mono tabular-nums text-emerald-900 text-base">
                    {formatKoboToNaira(matchedReceipt.totalPaidKobo)}
                  </span>
                </div>

                {/* Signature details */}
                <div className="pt-2 text-[11px] text-slate-500 font-mono break-all">
                  <span>HMAC Hash: </span>
                  <span className="text-slate-700 font-semibold">{matchedReceipt.verificationHash}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-red-200 p-8 text-center shadow-xs">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                Receipt Not Found in Osun TSA Ledger
              </h3>
              <p className="mt-1 text-xs text-slate-600 max-w-sm mx-auto">
                No record matches the provided reference &ldquo;{searchQuery}&rdquo;. Please verify the spelling or check for typographical errors.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
