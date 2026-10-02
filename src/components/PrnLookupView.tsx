import React, { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Printer,
  History,
  User,
  Filter,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Invoice, Receipt } from '../types';
import { formatKoboToNaira } from '../services/prnService';

interface PrnLookupViewProps {
  onPayInvoice: (invoice: Invoice) => void;
  onViewReceipt: (receipt: Receipt) => void;
}

export const PrnLookupView: React.FC<PrnLookupViewProps> = ({
  onPayInvoice,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  const allInvoices = StorageService.getInvoices();
  const allReceipts = StorageService.getReceipts();

  // Filter invoices based on search & status
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && inv.status === 'PAID') ||
        (statusFilter === 'UNPAID' && inv.status !== 'PAID');

      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.trim().toLowerCase();
      return (
        inv.prn.toLowerCase().includes(q) ||
        inv.payer.name.toLowerCase().includes(q) ||
        inv.payer.phone.toLowerCase().includes(q) ||
        inv.payer.email.toLowerCase().includes(q) ||
        inv.revenueHeadName.toLowerCase().includes(q) ||
        inv.mdaName.toLowerCase().includes(q)
      );
    });
  }, [allInvoices, searchQuery, statusFilter]);

  const handleViewReceiptForInvoice = (invoice: Invoice) => {
    const receipt = allReceipts.find((r) => r.prn === invoice.prn || r.invoiceId === invoice.id);
    if (receipt) {
      onViewReceipt(receipt);
    } else {
      // Create on-the-fly receipt object from invoice if needed
      onViewReceipt({
        id: `rec-${invoice.id}`,
        receiptNumber: `REC-OSN-2026-${invoice.prn.slice(-6)}`,
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
        verificationHash: 'E3B0C44298FC1C149AFBF4C8996FB9247D1A9F4C',
        qrCodeUrl: `/verify?ref=REC-OSN-2026-${invoice.prn.slice(-6)}&prn=${invoice.prn}`,
      });
    }
  };

  const exportHistoryCsv = () => {
    const rows = [
      ['PRN', 'Payer Name', 'Phone', 'Email', 'Revenue Head', 'MDA', 'Status', 'Date', 'Amount (NGN)'],
      ...filteredInvoices.map((inv) => [
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
    link.setAttribute('download', `Osun_TSA_Payment_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Osun State Treasury Verified Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Client Payment History & Official Receipts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            View completed payments, print official Osun State Government electronic receipts, or download your transaction statement.
          </p>
        </div>

        <button
          onClick={exportHistoryCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md shadow-2xs transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download History (CSV)</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Payer Name, PRN (OSN-...), Phone Number, or Tax Type..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Records ({allInvoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'PAID'
                ? 'bg-emerald-800 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Settled & Paid ({allInvoices.filter((i) => i.status === 'PAID').length})
          </button>
          <button
            onClick={() => setStatusFilter('UNPAID')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'UNPAID'
                ? 'bg-amber-800 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending PRNs ({allInvoices.filter((i) => i.status !== 'PAID').length})
          </button>
        </div>
      </div>

      {/* Payment History Records List */}
      <div className="space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => {
            const isPaid = invoice.status === 'PAID';
            return (
              <div
                key={invoice.id}
                className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Payer & Revenue Details */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {invoice.prn}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? 'CONFIRMED SETTLEMENT (PAID)' : 'PENDING PAYMENT'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(invoice.paidAt || invoice.createdAt).toLocaleString('en-NG')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {invoice.revenueHeadName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Collecting Ministry: <strong>{invoice.mdaName}</strong>
                    </p>
                  </div>

                  {/* Complete details of the person that made payment */}
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Payer: <strong>{invoice.payer.name}</strong></span>
                      {invoice.payer.phone && <span>Phone: <strong className="font-mono">{invoice.payer.phone}</strong></span>}
                      {invoice.payer.email && <span>Email: <strong>{invoice.payer.email}</strong></span>}
                      {(invoice.payer.nin || invoice.payer.tin) && (
                        <span>ID: <strong className="font-mono">{invoice.payer.nin || invoice.payer.tin}</strong></span>
                      )}
                      {invoice.channelUsed && (
                        <span className="font-mono text-emerald-800 font-semibold">
                          Channel: {invoice.channelUsed.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">Total Settlement</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-emerald-900 tabular-nums">
                      {formatKoboToNaira(invoice.totalAmountKobo)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <button
                        onClick={() => handleViewReceiptForInvoice(invoice)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Download Official Receipt</span>
                      </button>
                    ) : (
                      <button
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
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-2">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Payment Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions match &ldquo;{searchQuery}&rdquo;. Try clearing your search or make a new payment from the portal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
