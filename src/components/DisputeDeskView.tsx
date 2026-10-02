import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { PaymentMethod, DisputeTicket } from '../types';
import { formatKoboToNaira, nairaToKobo } from '../services/prnService';

export const DisputeDeskView: React.FC = () => {
  const [prn, setPrn] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [amountNaira, setAmountNaira] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [channel, setChannel] = useState<PaymentMethod>('BANK_TRANSFER');
  const [description, setDescription] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<DisputeTicket | null>(null);
  const [autoResolved, setAutoResolved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn.trim() || !bankReference.trim()) return;

    setIsProcessing(true);
    const amountKobo = nairaToKobo(amountNaira);

    // Simulate instant gateway requery
    setTimeout(async () => {
      // Check if invoice exists and can be auto-resolved
      const invoices = StorageService.getInvoices();
      const matchingInvoice = invoices.find((inv) => inv.prn.toUpperCase() === prn.trim().toUpperCase());

      if (matchingInvoice && matchingInvoice.status === 'UNPAID') {
        // Auto-reconcile and settle!
        await StorageService.recordPayment({
          invoiceId: matchingInvoice.id,
          gatewayRef: bankReference,
          gatewayProvider: 'NIBSS',
          channel,
          idempotencyKey: `dispute-auto-${Date.now()}-${prn}`,
        });

        setAutoResolved(true);
      }

      const ticket = await StorageService.submitDispute({
        prn: prn.trim().toUpperCase(),
        payerName,
        payerEmail,
        payerPhone,
        amountKobo,
        paymentDate: new Date().toISOString(),
        channel,
        bankReference: bankReference.trim(),
        description: description.trim() || 'Payment debited from payer bank account but invoice remained unpaid.',
      });

      if (autoResolved) {
        ticket.status = 'AUTO_RESOLVED';
      }

      setSubmittedTicket(ticket);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-800 border border-amber-200 mb-3">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Citizen Dispute & Grievance Desk
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Were you debited by your bank without receiving your official receipt? Enter your PRN and bank transfer session ID for automated resolution.
        </p>
      </div>

      {submittedTicket ? (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-4">
          {autoResolved ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Payment Auto-Reconciled & Credited!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Our gateway requery engine confirmed bank reference <strong>{submittedTicket.bankReference}</strong> with the switch. Your invoice is now marked <strong>PAID</strong> and official receipt has been issued.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Dispute Ticket Registered: #{submittedTicket.id}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your complaint has been queued for reconciliation with the Central Bank TSA clearing desk. SLA resolution time: <strong>4 business hours</strong>.
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">PRN:</span>
              <span className="font-bold text-slate-900">{submittedTicket.prn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Bank Reference:</span>
              <span className="text-slate-800">{submittedTicket.bankReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Status:</span>
              <span className="text-emerald-800 font-bold">{submittedTicket.status}</span>
            </div>
          </div>

          <button
            onClick={() => setSubmittedTicket(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
          >
            Submit Another Query
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Reference Number (PRN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="e.g. OSN-2610-84A2-9K3E-D"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Transaction Reference / Session ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="e.g. 09026724010112345678"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payer Name
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="0803 000 0000"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Debited (₦)
              </label>
              <input
                type="number"
                value={amountNaira}
                onChange={(e) => setAmountNaira(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Channel Used
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="BANK_TRANSFER">Bank App Transfer (Virtual Account)</option>
              <option value="CARD">Debit Card (Mastercard / Visa / Verve)</option>
              <option value="USSD">USSD Mobile Code</option>
              <option value="POS_AGENT">POS Terminal / Agent</option>
              <option value="BANK_BRANCH">Bank Branch Teller Deposit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Describe the Issue
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional details (e.g. Bank name, debit alert timestamp)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isProcessing ? 'Contacting Inter-Bank Switch & Requerying...' : 'Trigger Automated Switch Requery'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
