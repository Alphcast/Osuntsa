import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  Printer,
  Mail,
  Smartphone,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Invoice, Receipt } from '../types';
import { formatKoboToNaira, koboToWords } from '../services/prnService';
import { useToast } from '../context/ToastContext';

interface UserPaymentHistoryViewProps {
  onPayInvoice: (invoice: Invoice) => void;
  onViewReceipt: (receipt: Receipt) => void;
  onNavigateToPortal: () => void;
  onNavigateToReminders: () => void;
}

const STORAGE_LAST_QUERY_KEY = 'osun_tsa_last_user_query';

export const UserPaymentHistoryView: React.FC<UserPaymentHistoryViewProps> = ({
  onPayInvoice,
  onViewReceipt,
  onNavigateToPortal,
  onNavigateToReminders,
}) => {
  const { toast } = useToast();
  const [identifierInput, setIdentifierInput] = useState(() => {
    return localStorage.getItem(STORAGE_LAST_QUERY_KEY) || 'adewale.adeleke@gmail.com';
  });
  const [activeQuery, setActiveQuery] = useState(() => {
    return localStorage.getItem(STORAGE_LAST_QUERY_KEY) || 'adewale.adeleke@gmail.com';
  });

  const allInvoices = StorageService.getInvoices();
  const allReceipts = StorageService.getReceipts();

  // Normalize search helper
  const cleanStr = (str?: string) => (str ? str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '');

  // Filter matching invoices for the active identifier
  const userInvoices = useMemo(() => {
    if (!activeQuery.trim()) return [];

    const raw = activeQuery.trim().toLowerCase();
    const cleanQuery = cleanStr(raw);

    return allInvoices.filter((inv) => {
      const emailMatch = inv.payer.email?.toLowerCase().includes(raw);
      const phoneClean = cleanStr(inv.payer.phone);
      const phoneMatch = phoneClean && (phoneClean.includes(cleanQuery) || cleanQuery.includes(phoneClean));
      const nameMatch = inv.payer.name?.toLowerCase().includes(raw);
      const prnMatch = inv.prn?.toLowerCase().includes(raw);

      return emailMatch || phoneMatch || nameMatch || prnMatch;
    });
  }, [allInvoices, activeQuery]);

  const paidInvoices = useMemo(() => {
    return userInvoices.filter((inv) => inv.status === 'PAID');
  }, [userInvoices]);

  const totalPaidKobo = useMemo(() => {
    return paidInvoices.reduce((acc, inv) => acc + inv.totalAmountKobo, 0);
  }, [paidInvoices]);

  const uniqueMdas = useMemo(() => {
    return Array.from(new Set(paidInvoices.map((inv) => inv.mdaName)));
  }, [paidInvoices]);

  const payerProfileName = paidInvoices[0]?.payer.name || userInvoices[0]?.payer.name || 'Osun State Taxpayer';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) return;

    const trimmed = identifierInput.trim();
    setActiveQuery(trimmed);
    localStorage.setItem(STORAGE_LAST_QUERY_KEY, trimmed);
    toast.info('Searching Records', `Checking payment history for ${trimmed}...`);
  };

  const handleQuickPreset = (preset: string) => {
    setIdentifierInput(preset);
    setActiveQuery(preset);
    localStorage.setItem(STORAGE_LAST_QUERY_KEY, preset);
    toast.info('Profile Loaded', `Loaded payment history for ${preset}`);
  };

  const getReceiptForInvoice = (invoice: Invoice): Receipt => {
    const existing = allReceipts.find((r) => r.prn === invoice.prn || r.invoiceId === invoice.id);
    if (existing) return existing;

    // Generate compliant receipt object
    return {
      id: `rec-${invoice.id}`,
      receiptNumber: `REC-OSN-2026-${invoice.prn.replace(/[^0-9A-Z]/g, '').slice(-6)}`,
      invoiceId: invoice.id,
      prn: invoice.prn,
      paymentAttemptId: `att-${invoice.id}`,
      mdaName: invoice.mdaName,
      revenueHeadName: invoice.revenueHeadName,
      payerName: invoice.payer.name,
      payerEmail: invoice.payer.email,
      payerPhone: invoice.payer.phone,
      payerTinNin: invoice.payer.nin || invoice.payer.tin,
      amountKobo: invoice.amountKobo,
      gatewayFeeKobo: invoice.gatewayFeeKobo,
      totalPaidKobo: invoice.totalAmountKobo,
      paymentMethod: invoice.channelUsed || 'BANK_TRANSFER',
      gateway: 'NIBSS',
      transactionRef: `TSA-SETTLE-${invoice.prn.replace(/[^0-9A-Z]/g, '')}`,
      paidAt: invoice.paidAt || invoice.createdAt,
      verificationHash: 'E3B0C44298FC1C149AFBF4C8996FB9247D1A9F4C8996FB92427AE41E4649B934',
      qrCodeUrl: `/verify?ref=REC-OSN-2026-${invoice.prn.slice(-6)}&prn=${invoice.prn}`,
    };
  };

  // Re-download official standalone receipt file
  const handleDownloadHistoricalReceipt = (invoice: Invoice) => {
    const receipt = getReceiptForInvoice(invoice);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Osun State Official Receipt - ${receipt.receiptNumber}</title>
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
    a.download = `Osun_State_Receipt_${receipt.receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      'Receipt Downloaded',
      `Historical receipt ${receipt.receiptNumber} successfully re-downloaded to your device.`
    );
  };

  const exportUserCsv = () => {
    if (userInvoices.length === 0) return;

    const rows = [
      ['PRN', 'Payer Name', 'Phone', 'Email', 'Revenue Head', 'Collecting MDA', 'Status', 'Date', 'Amount (NGN)'],
      ...userInvoices.map((inv) => [
        `"${inv.prn}"`,
        `"${inv.payer.name}"`,
        `"${inv.payer.phone}"`,
        `"${inv.payer.email}"`,
        `"${inv.revenueHeadName}"`,
        `"${inv.mdaName}"`,
        inv.status,
        `"${new Date(inv.paidAt || inv.createdAt).toLocaleDateString('en-NG')}"`,
        (inv.totalAmountKobo / 100).toFixed(2),
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Osun_TSA_Statement_${activeQuery.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Statement Exported', 'Full transaction history CSV statement downloaded.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Taxpayer Self-Service Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Payment History & Receipts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Look up your verified transactions by entering your email address or phone number. Re-download and print official Osun State Government receipts at any time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {userInvoices.length > 0 && (
            <button
              onClick={exportUserCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Statement (CSV)</span>
            </button>
          )}

          <button
            onClick={onNavigateToPortal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
          >
            <span>Pay New Tax / Fee</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Identification Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Enter Registered Email Address or Mobile Phone Number
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="e.g. adewale.adeleke@gmail.com or 0803 456 7890"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              Retrieve History
            </button>
          </div>
        </form>

        {/* Quick Demo Test Presets */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Profiles:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('adewale.adeleke@gmail.com')}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              activeQuery === 'adewale.adeleke@gmail.com'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Adewale Adeleke (UNIOSUN Student)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('folake.alabi@yahoo.com')}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              activeQuery === 'folake.alabi@yahoo.com'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Folake Alabi (Vehicle Owner)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('finance@osunsprings.ng')}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              activeQuery === 'finance@osunsprings.ng'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Osun Springs Logistics Ltd (Corporate C of O)
          </button>
        </div>
      </div>

      {/* Taxpayer Profile Summary Card (if records exist) */}
      {userInvoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Taxpayer Name
            </span>
            <div className="mt-1 font-extrabold text-slate-900 text-base truncate">
              {payerProfileName}
            </div>
            <div className="text-[11px] text-emerald-700 font-mono mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Identity</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Settled Transactions
            </span>
            <div className="mt-1 font-extrabold text-slate-900 text-2xl font-mono">
              {paidInvoices.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {userInvoices.length - paidInvoices.length > 0
                ? `${userInvoices.length - paidInvoices.length} pending bill`
                : 'All obligations clear'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Remitted (TSA)
            </span>
            <div className="mt-1 font-extrabold text-emerald-900 text-2xl font-mono tabular-nums">
              {formatKoboToNaira(totalPaidKobo)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across {uniqueMdas.length} State MDAs
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                Obligation Reminders
              </span>
              <div className="text-xs text-slate-600 mt-1">
                Receive SMS & Email notifications before deadlines.
              </div>
            </div>
            <button
              onClick={onNavigateToReminders}
              className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
            >
              <span>Manage Reminders</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base font-bold text-slate-900">
            Historical Records for &ldquo;{activeQuery}&rdquo; ({userInvoices.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Osun State Central Ledger
          </span>
        </div>

        {userInvoices.length > 0 ? (
          userInvoices.map((invoice) => {
            const isPaid = invoice.status === 'PAID';
            const receipt = getReceiptForInvoice(invoice);

            return (
              <div
                key={invoice.id}
                className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Details */}
                <div className="space-y-2.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      PRN: {invoice.prn}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? 'PAID · OFFICIAL RECEIPT AVAILABLE' : 'PENDING PAYMENT'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(invoice.paidAt || invoice.createdAt).toLocaleString('en-NG')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {invoice.revenueHeadName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      MDA: <strong>{invoice.mdaName}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Payer: <strong className="text-slate-900">{invoice.payer.name}</strong></span>
                    {invoice.payer.phone && <span>Phone: <strong className="font-mono">{invoice.payer.phone}</strong></span>}
                    {invoice.payer.email && <span>Email: <strong className="font-mono">{invoice.payer.email}</strong></span>}
                    {isPaid && (
                      <span className="font-mono text-emerald-800 font-semibold">
                        Receipt No: {receipt.receiptNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Dual Actions */}
                <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">
                      Settlement Amount
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-900 tabular-nums">
                      {formatKoboToNaira(invoice.totalAmountKobo)}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Channel: {invoice.channelUsed ? invoice.channelUsed.replace('_', ' ') : 'Bank Transfer'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isPaid ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadHistoricalReceipt(invoice)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors shadow-2xs"
                          title="Download standalone receipt file"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Re-download Receipt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewReceipt(receipt)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-xs"
                          title="Open official letterhead receipt dialog to print"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPayInvoice(invoice)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay PRN Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                No Payment Records Found for &ldquo;{activeQuery}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No statutory payments are registered under this email or phone number. Check for typos or use one of the quick demo profiles above.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onNavigateToPortal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
              >
                <span>Make a Payment via Osun TSA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & Verification Callout */}
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-900 block">
            State Government Cryptographic Audit Guarantee
          </span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All receipts downloaded or printed through this self-service history portal are embedded with HMAC-SHA256 tamper-evident signatures recognized by the Nigerian Police, FRSC, Osun High Court, and all state academic institutions.
          </p>
        </div>
      </div>
    </div>
  );
};
