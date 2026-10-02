import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  Car,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Scale,
  Compass,
  ArrowRight,
  Calculator,
  Search,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Bell,
} from 'lucide-react';
import { RevenueHead, Language, Invoice } from '../types';
import { formatKoboToNaira, nairaToKobo } from '../services/prnService';
import { StorageService } from '../services/storageService';

interface CitizenQuickPayProps {
  revenueHeads: RevenueHead[];
  language: Language;
  onSelectRevenueHead: (head: RevenueHead) => void;
  onPayExistingInvoice: (invoice: Invoice) => void;
  onNavigateToReminders?: () => void;
}

export const CitizenQuickPay: React.FC<CitizenQuickPayProps> = ({
  revenueHeads,
  language,
  onSelectRevenueHead,
  onPayExistingInvoice,
  onNavigateToReminders,
}) => {
  const [activeMode, setActiveMode] = useState<'POPULAR' | 'PRN_LOOKUP' | 'CALCULATOR'>('POPULAR');
  const [prnInput, setPrnInput] = useState('');
  const [prnLookupError, setPrnLookupError] = useState('');

  // Tax Calculator State (Direct Assessment Estimate)
  const [annualIncomeNaira, setAnnualIncomeNaira] = useState('1200000'); // ₦1.2m default
  const [professionType, setProfessionType] = useState('TRADER_ARTISAN');

  const popularHeadCodes = [
    'REV-EDU-SEC-010', // Secondary School Fee (₦10,000 / Term)
    'REV-IRS-101', // Direct Assessment Tax
    'REV-TRN-401', // Vehicle Registration
    'REV-LND-201', // C of O
    'REV-EDU-001', // UNIOSUN Tuition
    'REV-HLT-301', // OSHIA Health Insurance
    'REV-COM-701', // Business Premises
    'REV-JUD-601', // Court Affidavit
    'REV-TUR-501', // Sacred Grove
  ];

  const popularHeads = popularHeadCodes
    .map((code) => revenueHeads.find((h) => h.code === code))
    .filter(Boolean) as RevenueHead[];

  const handlePrnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPrnLookupError('');
    if (!prnInput.trim()) return;

    const invoices = StorageService.getInvoices();
    const clean = prnInput.trim().toUpperCase();
    const invoice = invoices.find((inv) => inv.prn.toUpperCase() === clean);

    if (!invoice) {
      setPrnLookupError(`No invoice found for PRN "${prnInput}". Please verify the code.`);
      return;
    }

    if (invoice.status === 'PAID') {
      setPrnLookupError(`This PRN has already been paid and settled in Osun TSA.`);
      return;
    }

    onPayExistingInvoice(invoice);
  };

  // Estimate tax based on simple Osun Consolidated Relief & Tax Bands
  const calculateEstimatedTax = (): number => {
    const income = parseFloat(annualIncomeNaira) || 0;
    if (income <= 300000) return 3000; // Minimum 1% development tax
    // Consolidated relief allowance: 200,000 + 20% of gross
    const relief = 200000 + income * 0.2;
    const taxable = Math.max(0, income - relief);
    // Flat graduated presumptive rate
    let tax = 0;
    if (taxable <= 300000) tax = taxable * 0.07;
    else if (taxable <= 600000) tax = 21000 + (taxable - 300000) * 0.11;
    else tax = 54000 + (taxable - 600000) * 0.15;

    return Math.max(5000, Math.round(tax));
  };

  const estimatedTaxNaira = calculateEstimatedTax();

  const handlePayEstimatedTax = () => {
    const taxHead = revenueHeads.find((h) => h.code === 'REV-IRS-101') || revenueHeads[0];
    onSelectRevenueHead({
      ...taxHead,
      defaultAmountKobo: nairaToKobo(estimatedTaxNaira),
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Navigation Selector Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          <button
            onClick={() => setActiveMode('POPULAR')}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeMode === 'POPULAR'
                ? 'border-emerald-800 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>Pay a Government Fee / Tax</span>
          </button>

          <button
            onClick={() => setActiveMode('PRN_LOOKUP')}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeMode === 'PRN_LOOKUP'
                ? 'border-emerald-800 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-700" />
            <span>I Have a Bill / PRN Number</span>
          </button>

          <button
            onClick={() => setActiveMode('CALCULATOR')}
            className={`hidden sm:flex flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center transition-colors border-b-2 items-center justify-center gap-2 ${
              activeMode === 'CALCULATOR'
                ? 'border-emerald-800 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-700" />
            <span>Direct Tax Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToReminders && onNavigateToReminders()}
            className="flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold text-center transition-colors border-b-2 border-transparent text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/50 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4 text-emerald-700" />
            <span>Get Payment Reminder</span>
          </button>
        </div>

        {/* MODE 1: POPULAR OSUN STATE REVENUE HEADS */}
        {activeMode === 'POPULAR' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Select Fee or Tax to Pay
                </h3>
                <p className="text-xs text-slate-500">
                  Instant electronic payment with direct remittance into Osun State TSA pool.
                </p>
              </div>
              <span className="hidden sm:inline text-xs text-slate-400 font-mono">
                Click any service to proceed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {popularHeads.map((head) => (
                <button
                  key={head.id}
                  onClick={() => onSelectRevenueHead(head)}
                  className="p-4 rounded-lg border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/30 text-left transition-all group flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        {head.code}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 leading-snug">
                      {head.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {head.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {head.isAmountVariable ? 'Assessed' : 'Rate'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {head.isAmountVariable ? 'Variable' : formatKoboToNaira(head.defaultAmountKobo)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 2: PAY EXISTING PRN */}
        {activeMode === 'PRN_LOOKUP' && (
          <div className="p-6 max-w-xl mx-auto space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Pay an Existing Osun State Invoice / Assessment
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the Payment Reference Number (PRN) given to you by a government officer, school, hospital, or generated online.
              </p>
            </div>

            <form onSubmit={handlePrnSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={prnInput}
                  onChange={(e) => setPrnInput(e.target.value)}
                  placeholder="Enter PRN (e.g. OSN-2610-84A2-9K3E-D)"
                  required
                  className="w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-700 text-center"
                />
              </div>

              {prnLookupError && (
                <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200 text-center">
                  {prnLookupError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Proceed to Pay Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              Need help? Dial <strong>+234 35 234 1100</strong> or use the Citizen Dispute Desk.
            </div>
          </div>
        )}

        {/* MODE 3: DIRECT ASSESSMENT TAX CALCULATOR */}
        {activeMode === 'CALCULATOR' && (
          <div className="p-6 max-w-2xl mx-auto space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Osun State Direct Assessment Tax Estimator
              </h3>
              <p className="text-xs text-slate-500">
                For self-employed traders, artisans, commercial drivers, landlords, and professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimated Annual Gross Income (₦)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={annualIncomeNaira}
                  onChange={(e) => setAnnualIncomeNaira(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trade / Sector Category
                </label>
                <select
                  value={professionType}
                  onChange={(e) => setProfessionType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="TRADER_ARTISAN">Market Trader / Artisan</option>
                  <option value="TRANSPORT">Commercial Driver / Operator</option>
                  <option value="PROFESSIONAL">Independent Consultant / Legal / Medical</option>
                  <option value="PROPERTY">Landlord / Property Owner</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-emerald-800 font-semibold block">
                  Estimated Annual Osun State Tax Due:
                </span>
                <span className="text-2xl font-black font-mono text-emerald-950">
                  ₦{estimatedTaxNaira.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Qualifies for official 3-year Tax Clearance Certificate (TCC).
                </span>
              </div>

              <button
                type="button"
                onClick={handlePayEstimatedTax}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-md shadow-xs transition-colors self-start sm:self-auto"
              >
                Pay Estimated Tax Now
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
