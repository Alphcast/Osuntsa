import React, { useState } from 'react';
import { Receipt } from '../types';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Download,
} from 'lucide-react';
import { formatKoboToNaira, koboToWords } from '../services/prnService';
import { verifyReceiptAuthenticity } from '../services/receiptService';
import { useToast } from '../context/ToastContext';

interface ReceiptModalProps {
  receipt: Receipt;
  onClose: () => void;
  onNavigateToVerify?: (receiptNumber: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  onClose,
  onNavigateToVerify,
}) => {
  const { toast } = useToast();
  const [copiedHash, setCopiedHash] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    valid?: boolean;
    reason?: string;
  }>({ tested: false });

  const handleCopyHash = () => {
    navigator.clipboard.writeText(receipt.verificationHash);
    setCopiedHash(true);
    toast.info('Hash Copied', 'Receipt HMAC-SHA256 digital signature copied to clipboard.');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Osun State Government Official Receipt - ${receipt.receiptNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 40px; margin: 0 auto; max-width: 800px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
    .title { font-size: 20px; font-weight: 800; letter-spacing: 1px; margin: 5px 0; }
    .subtitle { font-size: 13px; font-weight: 700; color: #065f46; letter-spacing: 1.5px; margin: 4px 0; }
    .badge { display: inline-block; background: #0f172a; color: #fff; padding: 4px 14px; font-size: 11px; font-weight: 700; border-radius: 4px; margin-top: 10px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0; font-size: 13px; }
    .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 3px; }
    .value { font-weight: 700; font-family: monospace; }
    .table-box { border: 1px solid #cbd5e1; border-radius: 6px; margin: 20px 0; overflow: hidden; font-size: 13px; }
    .table-head { background: #f8fafc; padding: 10px 15px; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    .row { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #f1f5f9; }
    .total-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 13px; }
    .total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 16px; color: #065f46; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
    .hash { font-family: monospace; font-size: 11px; word-break: break-all; color: #334155; }
    .footer { text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">GOVERNMENT OF OSUN STATE OF NIGERIA</h1>
    <div class="subtitle">OFFICE OF THE ACCOUNTANT-GENERAL · TREASURY SINGLE ACCOUNT (TSA)</div>
    <div class="badge">OFFICIAL ELECTRONIC REVENUE RECEIPT</div>
  </div>
  <div class="grid">
    <div><div class="label">Receipt Number</div><div class="value">${receipt.receiptNumber}</div></div>
    <div><div class="label">Payment Reference (PRN)</div><div class="value">${receipt.prn}</div></div>
    <div><div class="label">Settlement Date</div><div class="value">${new Date(receipt.paidAt).toLocaleString('en-NG')}</div></div>
  </div>
  ${receipt.studentDetails ? `
  <div class="table-box" style="border: 2px solid #1e3a8a;">
    <div class="table-head" style="background: #1e3a8a; color: #fff; font-weight: 800;">
      Osun State Ministry of Education · Secondary School Enrollment Particulars (${receipt.studentDetails.term} - ${receipt.studentDetails.academicSession} Session)
    </div>
    <div class="row"><span>Student Full Name:</span><strong style="color: #0f172a; font-size: 14px;">${receipt.studentDetails.studentName}</strong></div>
    <div class="row"><span>Secondary School:</span><strong style="color: #1e3a8a;">${receipt.studentDetails.schoolName}</strong></div>
    <div class="row"><span>Student Class:</span><strong style="color: #065f46; font-size: 14px;">${receipt.studentDetails.studentClass}</strong></div>
    <div class="row"><span>Class Section / Arm (1 of 10):</span><strong>${receipt.studentDetails.section}</strong></div>
    <div class="row"><span>Academic Term & Session:</span><span>${receipt.studentDetails.term} · ${receipt.studentDetails.academicSession} Session</span></div>
    ${receipt.studentDetails.admissionNumber ? `<div class="row"><span>Student Admission / Reg No:</span><span style="font-family: monospace; font-weight: 700;">${receipt.studentDetails.admissionNumber}</span></div>` : ''}
    <div class="row"><span>Parent / Guardian (Payer):</span><span>${receipt.payerName} (${receipt.payerPhone})</span></div>
    <div style="background: #eff6ff; padding: 9px 15px; font-size: 11px; font-weight: 700; color: #1e3a8a; border-top: 1px solid #bfdbfe; display: flex; justify-content: space-between;">
      <span>Official Termly Clearance Certificate · Recognized across all Osun State Secondary Schools</span>
      <span style="color: #065f46;">CLEARED & PAID (₦10,000.00 / TERM)</span>
    </div>
  </div>
  ` : ''}
  <div class="table-box">
    <div class="table-head">Payer & Assessment Particulars</div>
    <div class="row"><span>Payer Full Name:</span><strong>${receipt.payerName}</strong></div>
    ${receipt.payerEmail ? `<div class="row"><span>Email Address:</span><span>${receipt.payerEmail}</span></div>` : ''}
    ${receipt.payerPhone ? `<div class="row"><span>Phone Number:</span><span>${receipt.payerPhone}</span></div>` : ''}
    ${receipt.payerTinNin ? `<div class="row"><span>TIN / NIN:</span><span>${receipt.payerTinNin}</span></div>` : ''}
    <div class="row"><span>Collecting MDA:</span><strong>${receipt.mdaName}</strong></div>
    <div class="row"><span>Revenue Head:</span><strong>${receipt.revenueHeadName}</strong></div>
    <div class="row"><span>Channel & Gateway Ref:</span><span>${receipt.paymentMethod} (${receipt.gateway}) - Ref: ${receipt.transactionRef}</span></div>
  </div>
  <div class="total-box">
    <div class="row" style="border:none;padding:3px 0;"><span>Statutory Assessed Fee:</span><span>${formatKoboToNaira(receipt.amountKobo)}</span></div>
    <div class="row" style="border:none;padding:3px 0;"><span>Gateway E-Collection Charge:</span><span>${formatKoboToNaira(receipt.gatewayFeeKobo)}</span></div>
    <div class="total-row"><span>Total Settled into Osun TSA:</span><span>${formatKoboToNaira(receipt.totalPaidKobo)}</span></div>
    <div style="font-size:12px;font-style:italic;margin-top:6px;color:#475569;">Amount in words: <strong>${koboToWords(receipt.totalPaidKobo)}</strong></div>
  </div>
  <div style="margin-top:20px;padding:12px;background:#f1f5f9;border-radius:6px;font-size:11px;">
    <strong>HMAC-SHA256 Verification Signature:</strong>
    <div class="hash">${receipt.verificationHash}</div>
    <div style="margin-top:5px;color:#64748b;">Verify online at <strong>https://osun.gov.ng/verify</strong></div>
  </div>
  <div class="footer">
    This is an authentic electronic revenue receipt of the Osun State Government. Valid across all law enforcement, judicial, and academic institutions in Nigeria.
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Osun_State_Official_Receipt_${receipt.receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt Downloaded', `Official receipt file ${receipt.receiptNumber}.html saved to device.`);
  };

  const handleVerify = async () => {
    const result = await verifyReceiptAuthenticity(receipt);
    setVerificationResult({
      tested: true,
      valid: result.isValid,
      reason: result.reason,
    });
    if (result.isValid) {
      toast.success('Authenticity Verified', 'Receipt signature validated against Osun TSA Master Ledger.');
    } else {
      toast.error('Verification Failed', result.reason || 'Invalid receipt signature.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 receipt-modal-container">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden receipt-modal-box">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Official Treasury Receipt Issued</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors shadow-2xs"
              title="Download standalone receipt file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Receipt</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-xs"
              title="Print official receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Receipt Document */}
        <div className="p-8 sm:p-10 bg-white text-slate-900 printable-receipt space-y-6">
          {/* Official Letterhead */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="flex justify-center mb-3">
              <img
                src="/src/assets/images/osun_omoluabi_crest_1790962999488.jpg"
                alt="Osun State Government Seal"
                className="w-20 h-20 object-contain rounded-full border border-slate-200 p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-wider text-slate-950 uppercase">
              GOVERNMENT OF OSUN STATE OF NIGERIA
            </h2>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest mt-0.5">
              OFFICE OF THE ACCOUNTANT-GENERAL · TREASURY SINGLE ACCOUNT
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 bg-slate-900 text-white text-[11px] font-bold tracking-widest uppercase rounded">
              ELECTRONIC REVENUE RECEIPT
            </div>
          </div>

          {/* Key Identifiers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Receipt Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{receipt.receiptNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Payment Ref (PRN)</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">{receipt.prn}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 uppercase text-[10px] font-semibold block">Date & Time</span>
              <span className="font-mono font-medium text-slate-800">
                {new Date(receipt.paidAt).toLocaleString('en-NG')}
              </span>
            </div>
          </div>

          {/* Secondary School Student Academic Profile (when available) */}
          {receipt.studentDetails && (
            <div className="border-2 border-blue-900 rounded-lg overflow-hidden text-xs bg-white shadow-xs">
              <div className="bg-blue-950 text-white px-4 py-2 font-bold uppercase tracking-wider text-[11px] flex flex-wrap items-center justify-between gap-2">
                <span>Osun State Ministry of Education · Secondary School Enrollment Record</span>
                <span className="text-[10px] bg-blue-800 text-blue-100 px-2 py-0.5 rounded font-mono font-semibold">
                  {receipt.studentDetails.term} · {receipt.studentDetails.academicSession}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 divide-y sm:divide-y-0 divide-slate-100">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Student Full Name</span>
                    <span className="font-extrabold text-slate-900 text-sm">{receipt.studentDetails.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Osun State Secondary School</span>
                    <span className="font-bold text-blue-900 text-xs">{receipt.studentDetails.schoolName}</span>
                  </div>
                  {receipt.studentDetails.admissionNumber && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Admission / Reg Number</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{receipt.studentDetails.admissionNumber}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 sm:pt-0">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Class</span>
                      <span className="font-extrabold text-emerald-900 text-base font-mono">{receipt.studentDetails.studentClass}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Class Section / Arm</span>
                      <span className="font-bold text-slate-800 text-xs">{receipt.studentDetails.section}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Parent / Guardian Contact</span>
                    <span className="font-medium text-slate-700 text-xs">{receipt.payerName} ({receipt.payerPhone})</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 px-4 py-2 border-t border-blue-200 text-[10px] text-blue-950 font-medium flex flex-wrap items-center justify-between gap-1">
                <span>Official Term Clearance · Cleared for class admittance and examination seating.</span>
                <span className="font-extrabold text-emerald-800 font-mono">CLEARED & PAID (₦10,000 / TERM)</span>
              </div>
            </div>
          )}

          {/* Payer and Ministry Details Table */}
          <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Revenue Assessment Particulars
            </div>
            <div className="p-4 space-y-2.5 divide-y divide-slate-100">
              <div className="flex flex-col sm:flex-row justify-between pt-1">
                <span className="text-slate-500 font-medium">Payer Full Name:</span>
                <span className="font-bold text-slate-900">{receipt.payerName}</span>
              </div>
              {receipt.payerEmail && (
                <div className="flex flex-col sm:flex-row justify-between pt-2">
                  <span className="text-slate-500 font-medium">Email Address:</span>
                  <span className="font-mono text-slate-800">{receipt.payerEmail}</span>
                </div>
              )}
              {receipt.payerPhone && (
                <div className="flex flex-col sm:flex-row justify-between pt-2">
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <span className="font-mono text-slate-800">{receipt.payerPhone}</span>
                </div>
              )}
              {receipt.payerTinNin && (
                <div className="flex flex-col sm:flex-row justify-between pt-2">
                  <span className="text-slate-500 font-medium">NIN / TIN:</span>
                  <span className="font-mono text-slate-800">{receipt.payerTinNin}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-between pt-2">
                <span className="text-slate-500 font-medium">Collecting MDA:</span>
                <span className="font-semibold text-slate-900 text-right">{receipt.mdaName}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between pt-2">
                <span className="text-slate-500 font-medium">Revenue Head / Fee:</span>
                <span className="font-semibold text-slate-900 text-right">{receipt.revenueHeadName}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between pt-2">
                <span className="text-slate-500 font-medium">Payment Channel / Switch:</span>
                <span className="font-mono text-slate-800">
                  {receipt.paymentMethod} ({receipt.gateway}) · Ref: {receipt.transactionRef}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Statutory Fee:</span>
              <span className="font-mono tabular-nums">{formatKoboToNaira(receipt.amountKobo)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>E-Collection Gateway Fee:</span>
              <span className="font-mono tabular-nums">{formatKoboToNaira(receipt.gatewayFeeKobo)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-950 border-t border-slate-300 pt-2">
              <span>Total Amount Remitted to Osun TSA:</span>
              <span className="font-mono tabular-nums text-emerald-900 text-base">
                {formatKoboToNaira(receipt.totalPaidKobo)}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200">
              Amount in words: <strong>{koboToWords(receipt.totalPaidKobo)}</strong>
            </div>
          </div>

          {/* Cryptographic Verification Seal & QR Section */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* SVG QR Code Simulation */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white p-1.5 border border-slate-300 rounded shadow-xs flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-slate-900" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h4v4h-4v-4zm-4-4h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                </svg>
              </div>
              <div className="text-[10px] text-slate-500 max-w-xs">
                Scan with any smartphone or police/court scanner to verify authenticity on{' '}
                <strong className="text-slate-800">osun.gov.ng/verify</strong>
              </div>
            </div>

            {/* Cryptographic Hash */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                HMAC-SHA256 Digital Signature
              </span>
              <div className="flex items-center gap-1 justify-end font-mono text-xs text-slate-700 mt-0.5">
                <span>{receipt.verificationHash.slice(0, 16)}...</span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="no-print text-slate-400 hover:text-slate-600 p-0.5"
                  title="Copy full verification signature"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Verification check result banner (interactive) */}
          {verificationResult.tested && (
            <div
              className={`p-3 rounded-md text-xs font-semibold flex items-center gap-2 ${
                verificationResult.valid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {verificationResult.valid
                  ? 'Official Certificate Verified: Hash matches Osun State Treasury Single Account Master Ledger.'
                  : verificationResult.reason}
              </span>
            </div>
          )}

          {/* Footer Sign-off */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            This is an electronically generated official revenue receipt of the Osun State Government. Valid without manual signature.
          </div>
        </div>

        {/* Modal Footer (No-print) */}
        <div className="no-print px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleVerify}
            className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-semibold"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Test Cryptographic Authenticity</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Receipt</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
